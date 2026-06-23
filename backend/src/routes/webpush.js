/**
 * S-17D — Web Push (VAPID)
 *
 * GET  /api/push/vapid-public-key   return public key for SW subscription
 * POST /api/push/subscribe           store subscription for logged-in user
 * DELETE /api/push/subscribe         remove subscription
 *
 * Internal: pushToUser(userId, payload) — used by event subscribers
 */

const express    = require("express");
const webPush    = require("web-push");
const db         = require("../db/knex");

const router = express.Router();

// ── VAPID setup ───────────────────────────────────────────────
// Keys are generated once: node -e "const wp=require('web-push'); console.log(wp.generateVAPIDKeys())"
// Store in .env as VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  || "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT     || "mailto:ops@nexaforge.com";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

// ── GET /api/push/vapid-public-key ───────────────────────────
router.get("/vapid-public-key", (_req, res) => {
  if (!VAPID_PUBLIC) return res.status(503).json({ error: "Push notifications not configured" });
  res.json({ public_key: VAPID_PUBLIC });
});

// ── POST /api/push/subscribe ─────────────────────────────────
router.post("/subscribe", async (req, res, next) => {
  try {
    const { subscription } = req.body;
    if (!subscription?.endpoint) return res.status(422).json({ error: "subscription object required" });

    await db("push_subscriptions")
      .insert({
        user_id:      req.user.id,
        endpoint:     subscription.endpoint,
        p256dh:       subscription.keys?.p256dh,
        auth:         subscription.keys?.auth,
        user_agent:   req.headers["user-agent"]?.slice(0, 300),
      })
      .onConflict(["user_id", "endpoint"])
      .merge({ p256dh: subscription.keys?.p256dh, auth: subscription.keys?.auth, updated_at: new Date() });

    res.status(201).json({ message: "Subscribed" });
  } catch (err) { next(err); }
});

// ── DELETE /api/push/subscribe ───────────────────────────────
router.delete("/subscribe", async (req, res, next) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(422).json({ error: "endpoint required" });
    await db("push_subscriptions").where({ user_id: req.user.id, endpoint }).delete();
    res.json({ message: "Unsubscribed" });
  } catch (err) { next(err); }
});

// ── pushToUser — internal helper used by event subscribers ───
async function pushToUser(userId, payload) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return;
  const subs = await db("push_subscriptions").where({ user_id: userId });
  const staleIds = [];

  await Promise.allSettled(subs.map(async (sub) => {
    try {
      await webPush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
        { TTL: 86400 }
      );
    } catch (err) {
      // 410 Gone or 404 = subscription expired → clean up
      if (err.statusCode === 410 || err.statusCode === 404) {
        staleIds.push(sub.id);
      }
    }
  }));

  if (staleIds.length) {
    await db("push_subscriptions").whereIn("id", staleIds).delete();
  }
}

// ── pushToDept — broadcast to all users in a department ──────
async function pushToDept(department, payload) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return;
  const users = await db("users").where({ department }).select("id");
  await Promise.allSettled(users.map(u => pushToUser(u.id, payload)));
}

module.exports = router;
module.exports.pushToUser = pushToUser;
module.exports.pushToDept = pushToDept;
