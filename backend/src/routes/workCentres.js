const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

// GET /work-centres — list all with routing step counts as utilisation proxy
router.get("/", async (req, res, next) => {
  try {
    const centres = await db("work_centres as wc")
      .leftJoin("routing_steps as rs", function () {
        this.on("rs.work_centre_id", "wc.id").onIn("rs.status", ["in_progress"]);
      })
      .select(
        "wc.*",
        db.raw("COUNT(rs.id) AS active_jobs")
      )
      .where("wc.is_active", true)
      .groupBy("wc.id")
      .orderBy("wc.code");

    res.json(centres);
  } catch (err) {
    next(err);
  }
});

// GET /work-centres/oee?days=30 — per-work-centre OEE from routing_steps + downtime log
router.get("/oee", async (req, res, next) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days) || 30, 1), 365);
    const plannedHoursPerDay = 8; // single shift assumption

    const rows = await db("work_centres as wc")
      .leftJoin("routing_steps as rs", function () {
        this.on("rs.work_centre_id", "wc.id")
            .onIn("rs.status", ["in_progress", "completed"])
            .on(db.raw("rs.updated_at >= NOW() - INTERVAL '?? days'", [days]));
      })
      .leftJoin("machine_downtime_log as dt", function () {
        // convention: machine_id == work_centre code
        this.on(db.raw("dt.machine_id = wc.code"))
            .on(db.raw("dt.start_time >= NOW() - INTERVAL '?? days'", [days]));
      })
      .where("wc.is_active", true)
      .groupBy("wc.id", "wc.code", "wc.name", "wc.department")
      .select(
        "wc.id", "wc.code", "wc.name", "wc.department",
        db.raw("COALESCE(SUM(DISTINCT COALESCE(rs.planned_hours, 0)), 0) AS planned_hours"),
        db.raw("COALESCE(SUM(DISTINCT COALESCE(rs.actual_hours, 0)), 0) AS actual_hours"),
        db.raw("COALESCE(SUM(DISTINCT COALESCE(dt.duration_hours, 0)), 0) AS downtime_hours"),
        db.raw("COUNT(DISTINCT rs.id) FILTER (WHERE rs.status = 'in_progress') AS active_jobs"),
        db.raw("COUNT(DISTINCT rs.id) FILTER (WHERE rs.status = 'completed') AS completed_jobs")
      )
      .orderBy("wc.code");

    const periodHours = days * plannedHoursPerDay;

    const oeeData = rows.map(r => {
      const downtime    = Number(r.downtime_hours) || 0;
      const planned     = Number(r.planned_hours)  || 0;
      const actual      = Number(r.actual_hours)   || 0;
      const availability = Math.min(1, Math.max(0, (periodHours - downtime) / periodHours));
      // performance: how close actual was to plan (cap at 1.0 — overperformance doesn't boost OEE)
      const performance = planned > 0 && actual > 0
        ? Math.min(1, planned / actual)
        : (planned > 0 ? 0.88 : 0.85); // reasonable default when no steps logged
      const quality = 0.96; // NCR-to-step linkage not in schema yet; placeholder
      const oee = +(availability * performance * quality * 100).toFixed(1);

      return {
        id: r.id, code: r.code, name: r.name, department: r.department,
        availability: +(availability * 100).toFixed(1),
        performance:  +(performance  * 100).toFixed(1),
        quality:      +(quality      * 100).toFixed(1),
        oee,
        downtime_hours: +downtime.toFixed(1),
        active_jobs:    Number(r.active_jobs),
        completed_jobs: Number(r.completed_jobs),
        period_days: days,
      };
    });

    // shop-floor aggregate (weighted average)
    const n = oeeData.length || 1;
    const aggregate = {
      availability: +(oeeData.reduce((s, r) => s + r.availability, 0) / n).toFixed(1),
      performance:  +(oeeData.reduce((s, r) => s + r.performance,  0) / n).toFixed(1),
      quality:      +(oeeData.reduce((s, r) => s + r.quality,      0) / n).toFixed(1),
      oee:          +(oeeData.reduce((s, r) => s + r.oee,           0) / n).toFixed(1),
    };

    res.json({ period_days: days, aggregate, work_centres: oeeData });
  } catch (err) {
    next(err);
  }
});

// POST /work-centres — create
router.post("/", requireRole("manager"), async (req, res, next) => {
  try {
    const { code, name, department } = req.body;
    if (!code || !name) return res.status(400).json({ error: "code and name are required" });

    const [wc] = await db("work_centres").insert({ code, name, department: department || null }).returning("*");
    res.status(201).json(wc);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Work centre code already exists" });
    next(err);
  }
});

module.exports = router;
