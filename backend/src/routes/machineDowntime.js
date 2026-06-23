const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");

const router = express.Router({ mergeParams: true });

// POST /machines/:id/downtime — log a downtime event
router.post("/", async (req, res, next) => {
  try {
    const machine_id = req.params.id;
    const { start_time, end_time, type, reason } = req.body;

    if (!start_time || !type || !reason) {
      return res.status(400).json({ error: "start_time, type, and reason are required" });
    }
    if (!["planned", "unplanned"].includes(type)) {
      return res.status(400).json({ error: "type must be 'planned' or 'unplanned'" });
    }

    // Calculate duration if end_time provided
    let duration_hours = null;
    if (end_time) {
      const ms = new Date(end_time) - new Date(start_time);
      if (ms < 0) return res.status(400).json({ error: "end_time must be after start_time" });
      duration_hours = +(ms / 3600000).toFixed(2);
    }

    const [entry] = await db("machine_downtime_log")
      .insert({
        machine_id,
        start_time,
        end_time:       end_time || null,
        type,
        reason,
        duration_hours,
        raised_by: req.user.sub,
      })
      .returning("*");

    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
});

// PATCH /machines/:machineId/downtime/:id/close — set end_time (close open event)
router.patch("/:downtimeId/close", async (req, res, next) => {
  try {
    const { end_time } = req.body;
    if (!end_time) return res.status(400).json({ error: "end_time is required" });

    const existing = await db("machine_downtime_log").where("id", req.params.downtimeId).first();
    if (!existing) return res.status(404).json({ error: "Downtime record not found" });
    if (existing.end_time) return res.status(409).json({ error: "Downtime event already closed" });

    const ms = new Date(end_time) - new Date(existing.start_time);
    if (ms < 0) return res.status(400).json({ error: "end_time must be after start_time" });
    const duration_hours = +(ms / 3600000).toFixed(2);

    const [updated] = await db("machine_downtime_log")
      .where("id", req.params.downtimeId)
      .update({ end_time, duration_hours, updated_at: db.fn.now() })
      .returning("*");

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// GET /machines/:id/downtime — history for a machine with optional period filter
router.get("/", async (req, res, next) => {
  try {
    const { period = "7d", type, limit = 50 } = req.query;

    // Parse period: e.g. "7d", "30d", "24h"
    const periodMap = { "24h": "24 hours", "7d": "7 days", "30d": "30 days", "90d": "90 days" };
    const interval  = periodMap[period] || "7 days";

    let query = db("machine_downtime_log")
      .where("machine_id", req.params.id)
      .where("start_time", ">=", db.raw(`NOW() - INTERVAL '${interval}'`))
      .orderBy("start_time", "desc")
      .limit(Number(limit));

    if (type) query = query.where("type", type);

    const [rows, summary] = await Promise.all([
      query,
      db("machine_downtime_log")
        .where("machine_id", req.params.id)
        .where("start_time", ">=", db.raw(`NOW() - INTERVAL '${interval}'`))
        .select(
          db.raw("COUNT(*) AS event_count"),
          db.raw("COALESCE(SUM(duration_hours), 0) AS total_hours"),
          db.raw("COALESCE(SUM(duration_hours) FILTER (WHERE type = 'unplanned'), 0) AS unplanned_hours"),
          db.raw("COALESCE(SUM(duration_hours) FILTER (WHERE type = 'planned'),   0) AS planned_hours")
        )
        .first(),
    ]);

    res.json({
      machine_id: req.params.id,
      period,
      summary: {
        event_count:     Number(summary.event_count),
        total_hours:     Number(summary.total_hours),
        unplanned_hours: Number(summary.unplanned_hours),
        planned_hours:   Number(summary.planned_hours),
      },
      events: rows,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
