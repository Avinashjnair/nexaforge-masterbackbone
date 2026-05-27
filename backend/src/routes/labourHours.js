const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

const VALID_ACTIVITY = ["fabrication", "welding", "assembly", "inspection", "rework", "other"];

// POST /labour-hours — log timesheet entry
router.post("/", async (req, res, next) => {
  try {
    const {
      employee_id, project_id, routing_step_id,
      work_date, hours_direct, hours_indirect,
      activity_type, notes,
    } = req.body;

    if (!employee_id || !project_id || !work_date) {
      return res.status(400).json({ error: "employee_id, project_id, and work_date are required" });
    }
    if (activity_type && !VALID_ACTIVITY.includes(activity_type)) {
      return res.status(400).json({ error: `activity_type must be one of: ${VALID_ACTIVITY.join(", ")}` });
    }

    const direct   = Number(hours_direct)   || 0;
    const indirect = Number(hours_indirect) || 0;
    if (direct < 0 || indirect < 0) {
      return res.status(400).json({ error: "hours cannot be negative" });
    }
    if (direct + indirect > 24) {
      return res.status(400).json({ error: "total hours per entry cannot exceed 24" });
    }

    const [entry] = await db("labour_hours")
      .insert({
        employee_id,
        project_id,
        routing_step_id: routing_step_id || null,
        work_date,
        hours_direct:   direct,
        hours_indirect: indirect,
        activity_type:  activity_type || "other",
        notes:          notes || null,
        logged_by:      req.user.sub,
      })
      .returning("*");

    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
});

// GET /labour-hours — query by project, employee, or week
router.get("/", async (req, res, next) => {
  try {
    const { project_id, employee_id, week, from, to, limit = 100, page = 1 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db("labour_hours as lh")
      .leftJoin("employees as e", "lh.employee_id", "e.id")
      .leftJoin("projects as p",  "lh.project_id",  "p.id")
      .leftJoin("routing_steps as rs", "lh.routing_step_id", "rs.id")
      .select(
        "lh.*",
        "e.full_name as employee_name", "e.employee_no",
        "p.project_no", "p.name as project_name",
        "rs.name as step_name"
      )
      .orderBy("lh.work_date", "desc")
      .limit(Number(limit))
      .offset(offset);

    if (project_id)  query = query.where("lh.project_id", project_id);
    if (employee_id) query = query.where("lh.employee_id", employee_id);

    // `week` param: ISO week start date (Monday) — returns Mon–Sun range
    if (week) {
      query = query
        .where("lh.work_date", ">=", week)
        .where("lh.work_date", "<",  db.raw("?::date + INTERVAL '7 days'", [week]));
    } else {
      if (from) query = query.where("lh.work_date", ">=", from);
      if (to)   query = query.where("lh.work_date", "<=", to);
    }

    const rows = await query;
    res.json({ data: rows, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

// GET /labour-hours/summary — project COGS rollup (used by Finance)
router.get("/summary", async (req, res, next) => {
  try {
    const { project_id } = req.query;
    if (!project_id) return res.status(400).json({ error: "project_id is required" });

    const [summary] = await db("labour_hours as lh")
      .join("employees as e", "lh.employee_id", "e.id")
      .where("lh.project_id", project_id)
      .select(
        db.raw("SUM(lh.hours_direct + lh.hours_indirect) AS total_hours"),
        db.raw("SUM(lh.hours_direct)   AS direct_hours"),
        db.raw("SUM(lh.hours_indirect) AS indirect_hours"),
        db.raw("COUNT(DISTINCT lh.employee_id) AS headcount"),
        db.raw("COUNT(DISTINCT lh.work_date) AS working_days")
      );

    // Activity breakdown
    const byActivity = await db("labour_hours")
      .where("project_id", project_id)
      .select("activity_type")
      .sum("hours_direct as direct")
      .sum("hours_indirect as indirect")
      .groupBy("activity_type");

    res.json({
      project_id,
      total_hours:   Number(summary.total_hours   || 0),
      direct_hours:  Number(summary.direct_hours  || 0),
      indirect_hours:Number(summary.indirect_hours|| 0),
      headcount:     Number(summary.headcount     || 0),
      working_days:  Number(summary.working_days  || 0),
      by_activity:   byActivity.map(r => ({
        activity_type: r.activity_type,
        direct:   Number(r.direct   || 0),
        indirect: Number(r.indirect || 0),
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
