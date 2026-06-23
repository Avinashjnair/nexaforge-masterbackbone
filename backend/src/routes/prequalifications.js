const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

const STATUSES = ["active", "expiring", "expired", "pending"];

function isUniqueViolation(err) {
  return err.code === "23505" || err.code === "SQLITE_CONSTRAINT_UNIQUE";
}

// Sequential ref like PQ-001.
async function nextRef() {
  const [{ count }] = await db("prequalifications").count("id as count");
  return `PQ-${String(Number(count) + 1).padStart(3, "0")}`;
}

// GET /prequalifications — optional status / authority filters
router.get("/", async (req, res, next) => {
  try {
    const { status, authority } = req.query;
    let query = db("prequalifications").orderBy("expiry", "asc");
    if (status) query = query.where("status", status);
    if (authority) query = query.where("authority", authority);
    res.json(await query);
  } catch (err) {
    next(err);
  }
});

// GET /prequalifications/:id
router.get("/:id", async (req, res, next) => {
  try {
    const row = await db("prequalifications").where("id", req.params.id).first();
    if (!row) return res.status(404).json({ error: "Pre-qualification not found" });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

// POST /prequalifications
router.post("/", requireRole("user"), async (req, res, next) => {
  try {
    const { ref, authority, category, status, submitted, expiry, contact } = req.body;
    if (!authority) return res.status(400).json({ error: "authority is required" });
    if (status && !STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${STATUSES.join(", ")}` });
    }

    const [row] = await db("prequalifications")
      .insert({
        ref: ref || (await nextRef()),
        authority,
        category: category || null,
        status: status || "pending",
        submitted: submitted || null,
        expiry: expiry || null,
        contact: contact || null,
      })
      .returning("*");

    res.status(201).json(row);
  } catch (err) {
    if (isUniqueViolation(err)) return res.status(409).json({ error: "ref already exists" });
    next(err);
  }
});

// PATCH /prequalifications/:id
router.patch("/:id", requireRole("user"), async (req, res, next) => {
  try {
    const allowed = ["ref", "authority", "category", "status", "submitted", "expiry", "contact"];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    if (updates.status && !STATUSES.includes(updates.status)) {
      return res.status(400).json({ error: `status must be one of: ${STATUSES.join(", ")}` });
    }
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No valid fields to update" });

    updates.updated_at = db.fn.now();
    const [updated] = await db("prequalifications").where("id", req.params.id).update(updates).returning("*");
    if (!updated) return res.status(404).json({ error: "Pre-qualification not found" });
    res.json(updated);
  } catch (err) {
    if (isUniqueViolation(err)) return res.status(409).json({ error: "ref already exists" });
    next(err);
  }
});

// DELETE /prequalifications/:id
router.delete("/:id", requireRole("manager"), async (req, res, next) => {
  try {
    const deleted = await db("prequalifications").where("id", req.params.id).del();
    if (!deleted) return res.status(404).json({ error: "Pre-qualification not found" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
