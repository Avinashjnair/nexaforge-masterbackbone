const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

const TYPES = ["meeting", "call", "sitevisit", "followup"];

// GET /crm/appointments — optional date-window and owner filters
router.get("/", async (req, res, next) => {
  try {
    const { from, to, owner, type } = req.query;
    let query = db("crm_appointments").orderBy("start_at", "asc");
    if (from) query = query.where("start_at", ">=", from);
    if (to) query = query.where("start_at", "<=", to);
    if (owner) query = query.where("owner", owner);
    if (type) query = query.where("type", type);
    res.json(await query);
  } catch (err) {
    next(err);
  }
});

// GET /crm/appointments/:id
router.get("/:id", async (req, res, next) => {
  try {
    const row = await db("crm_appointments").where("id", req.params.id).first();
    if (!row) return res.status(404).json({ error: "Appointment not found" });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

// POST /crm/appointments
router.post("/", requireRole("user"), async (req, res, next) => {
  try {
    const { ref, type, title, client_name, start_at, duration_min, location, owner, notes } = req.body;
    if (!title || !start_at) return res.status(400).json({ error: "title and start_at are required" });
    if (type && !TYPES.includes(type)) {
      return res.status(400).json({ error: `type must be one of: ${TYPES.join(", ")}` });
    }

    const [row] = await db("crm_appointments")
      .insert({
        ref: ref || null,
        type: type || "meeting",
        title,
        client_name: client_name || null,
        start_at,
        duration_min: duration_min !== undefined ? Number(duration_min) : 60,
        location: location || null,
        owner: owner || req.user?.name || null,
        notes: notes || null,
      })
      .returning("*");

    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

// PATCH /crm/appointments/:id
router.patch("/:id", requireRole("user"), async (req, res, next) => {
  try {
    const allowed = ["ref", "type", "title", "client_name", "start_at", "duration_min", "location", "owner", "notes"];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    if (updates.type && !TYPES.includes(updates.type)) {
      return res.status(400).json({ error: `type must be one of: ${TYPES.join(", ")}` });
    }
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No valid fields to update" });

    updates.updated_at = db.fn.now();
    const [updated] = await db("crm_appointments").where("id", req.params.id).update(updates).returning("*");
    if (!updated) return res.status(404).json({ error: "Appointment not found" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /crm/appointments/:id
router.delete("/:id", requireRole("user"), async (req, res, next) => {
  try {
    const deleted = await db("crm_appointments").where("id", req.params.id).del();
    if (!deleted) return res.status(404).json({ error: "Appointment not found" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
