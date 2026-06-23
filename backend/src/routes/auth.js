const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const db = require("../db/knex");
const { client: redis } = require("../db/redis");
const rateLimit = require("express-rate-limit");
const { verifyTOTP, generateSecret } = require("../utils/totp");
const { authenticateJWT } = require("../middleware/auth");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts, try again in 15 minutes" },
});

const REFRESH_COOKIE = "nf_rt";
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: "/auth",
};

function signAccess(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.full_name, department: user.department },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m" }
  );
}

function signRefresh(userId) {
  const jti = uuidv4();
  const token = jwt.sign(
    { sub: userId, jti },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d" }
  );
  return { token, jti };
}

async function storeRefreshToken(userId, jti) {
  const ttlSeconds = 7 * 24 * 60 * 60; // 7 days
  await redis.set(`refresh:${jti}`, userId, { EX: ttlSeconds });
}

// POST /auth/login
router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await db("users").where({ email: email.toLowerCase() }).first();
    if (!user || !user.is_active) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if 2FA is enabled
    if (user.two_factor_enabled && user.two_factor_secret) {
      const ticket = jwt.sign(
        { sub: user.id, type: "2fa_pending" },
        process.env.JWT_SECRET,
        { expiresIn: "5m" }
      );
      return res.json({ two_factor_required: true, ticket });
    }

    const accessToken = signAccess(user);
    const { token: refreshToken, jti } = signRefresh(user.id);
    await storeRefreshToken(user.id, jti);

    await db("users").where({ id: user.id }).update({ last_login_at: db.fn.now() });

    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);
    res.json({
      access_token: accessToken,
      token_type: "Bearer",
      user: { id: user.id, email: user.email, role: user.role, name: user.full_name, department: user.department },
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/2fa
router.post("/2fa", async (req, res, next) => {
  try {
    const { ticket, code } = req.body;
    if (!ticket || !code) {
      return res.status(400).json({ error: "ticket and code are required" });
    }

    let payload;
    try {
      payload = jwt.verify(ticket, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: "Invalid or expired 2FA session ticket" });
    }

    if (payload.type !== "2fa_pending") {
      return res.status(401).json({ error: "Invalid 2FA ticket type" });
    }

    const user = await db("users").where({ id: payload.sub, is_active: true }).first();
    if (!user) {
      return res.status(401).json({ error: "User not found or inactive" });
    }

    const verified = verifyTOTP(user.two_factor_secret, code);
    if (!verified) {
      return res.status(401).json({ error: "Invalid 2FA code" });
    }

    const accessToken = signAccess(user);
    const { token: refreshToken, jti } = signRefresh(user.id);
    await storeRefreshToken(user.id, jti);

    await db("users").where({ id: user.id }).update({ last_login_at: db.fn.now() });

    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);
    res.json({
      access_token: accessToken,
      token_type: "Bearer",
      user: { id: user.id, email: user.email, role: user.role, name: user.full_name, department: user.department },
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/refresh
router.post("/refresh", async (req, res, next) => {
  try {
    const refresh_token = req.cookies?.[REFRESH_COOKIE];
    if (!refresh_token) {
      return res.status(401).json({ error: "No refresh token" });
    }

    let payload;
    try {
      payload = jwt.verify(refresh_token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    const stored = await redis.get(`refresh:${payload.jti}`);
    if (!stored || stored !== payload.sub) {
      return res.status(401).json({ error: "Refresh token revoked" });
    }

    const user = await db("users").where({ id: payload.sub, is_active: true }).first();
    if (!user) {
      return res.status(401).json({ error: "User not found or inactive" });
    }

    // Rotate — revoke old, issue new
    await redis.del(`refresh:${payload.jti}`);
    const accessToken = signAccess(user);
    const { token: newRefreshToken, jti: newJti } = signRefresh(user.id);
    await storeRefreshToken(user.id, newJti);

    res.cookie(REFRESH_COOKIE, newRefreshToken, COOKIE_OPTS);
    res.json({
      access_token: accessToken,
      token_type: "Bearer",
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /auth/logout
router.delete("/logout", async (req, res, next) => {
  try {
    const refresh_token = req.cookies?.[REFRESH_COOKIE];
    if (refresh_token) {
      try {
        const payload = jwt.verify(refresh_token, process.env.JWT_SECRET);
        await redis.del(`refresh:${payload.jti}`);
      } catch {
        // Token already invalid — silently ignore
      }
    }
    res.clearCookie(REFRESH_COOKIE, { path: "/auth" });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// POST /auth/forgot
router.post("/forgot", async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }

    const user = await db("users").where({ email: email.toLowerCase(), is_active: true }).first();
    // Return standard success to avoid enumeration
    const resp = { message: "If that email exists in our system, we have sent a reset token." };

    if (user) {
      const token = uuidv4();
      const ttlSeconds = 15 * 60; // 15 mins
      await redis.set(`reset_token:${user.email}`, token, { EX: ttlSeconds });

      // Dev-only helper: return token in response if not in production
      if (process.env.NODE_ENV !== "production") {
        resp.dev_token = token;
      }
      console.log(`[AUTH] Reset token for ${user.email}: ${token}`);
    }

    res.json(resp);
  } catch (err) {
    next(err);
  }
});

// POST /auth/reset
router.post("/reset", async (req, res, next) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: "email, token and newPassword are required" });
    }

    const storedToken = await redis.get(`reset_token:${email.toLowerCase()}`);
    if (!storedToken || storedToken !== token) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    const user = await db("users").where({ email: email.toLowerCase(), is_active: true }).first();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db("users").where({ id: user.id }).update({ password_hash: newHash });
    await redis.del(`reset_token:${email.toLowerCase()}`);

    res.json({ message: "Password reset successful" });
  } catch (err) {
    next(err);
  }
});

// POST /auth/2fa/setup
router.post("/2fa/setup", authenticateJWT, async (req, res, next) => {
  try {
    const secret = generateSecret();
    const qr_code_setup_uri = `otpauth://totp/NexaForge:${req.user.email}?secret=${secret}&issuer=NexaForge`;
    res.json({ secret, qr_code_setup_uri });
  } catch (err) {
    next(err);
  }
});

// POST /auth/2fa/enable
router.post("/2fa/enable", authenticateJWT, async (req, res, next) => {
  try {
    const { secret, code } = req.body;
    if (!secret || !code) {
      return res.status(400).json({ error: "secret and code are required" });
    }

    const verified = verifyTOTP(secret, code);
    if (!verified) {
      return res.status(400).json({ error: "Invalid 2FA code" });
    }

    await db("users").where({ id: req.user.sub }).update({
      two_factor_secret: secret,
      two_factor_enabled: true
    });

    res.json({ success: true, message: "Two-factor authentication enabled successfully" });
  } catch (err) {
    next(err);
  }
});

// POST /auth/2fa/disable
router.post("/2fa/disable", authenticateJWT, async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: "code is required" });
    }

    const user = await db("users").where({ id: req.user.sub }).first();
    if (!user || !user.two_factor_enabled) {
      return res.status(400).json({ error: "Two-factor is not enabled" });
    }

    const verified = verifyTOTP(user.two_factor_secret, code);
    if (!verified) {
      return res.status(400).json({ error: "Invalid 2FA code" });
    }

    await db("users").where({ id: req.user.sub }).update({
      two_factor_secret: null,
      two_factor_enabled: false
    });

    res.json({ success: true, message: "Two-factor authentication disabled successfully" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
