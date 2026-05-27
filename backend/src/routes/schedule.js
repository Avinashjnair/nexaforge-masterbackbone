const express = require("express");
const db = require("../db/knex");
const { requireRole, requireDepartment } = require("../middleware/auth");

const router = express.Router();

// GET /schedule — week-view grid: employee × day → assigned routing steps
// ?week=2026-05-04  (ISO week start, Monday)
// ?dept=production  (optional filter)
router.get("/", async (req, res, next) => {
  try {
    const { week, dept } = req.query;

    if (!week) return res.status(400).json({ error: "week query param required (ISO date of Monday)" });

    // Build the 7-day window
    const weekEnd = db.raw("?::date + INTERVAL '6 days'", [week]);

    let query = db("routing_steps as rs")
      .leftJoin("projects as p",   "rs.project_id",           "p.id")
      .leftJoin("employees as e",  "rs.assigned_employee_id", "e.id")
      .leftJoin("work_centres as wc", "rs.work_centre_id",    "wc.id")
      .select(
        "rs.id", "rs.name as step_name", "rs.step_order", "rs.status",
        "rs.planned_hours", "rs.scheduled_date",
        "rs.assigned_employee_id",
        "e.full_name as employee_name", "e.employee_no", "e.department",
        "p.id as project_id", "p.project_no", "p.name as project_name", "p.priority",
        "wc.name as work_centre_name"
      )
      .whereNotNull("rs.scheduled_date")
      .where("rs.scheduled_date", ">=", week)
      .where("rs.scheduled_date", "<=", weekEnd)
      .whereNull("p.deleted_at")
      .orderBy(["e.full_name", "rs.scheduled_date", "rs.step_order"]);

    if (dept) query = query.where("e.department", dept);

    const steps = await query;

    // Build grid: { [employee_id]: { employee, days: { [date]: [steps] } } }
    const grid = {};
    for (const row of steps) {
      const empKey = row.assigned_employee_id || "__unassigned__";
      if (!grid[empKey]) {
        grid[empKey] = {
          employee_id:   row.assigned_employee_id,
          employee_name: row.employee_name || "Unassigned",
          employee_no:   row.employee_no,
          department:    row.department,
          days: {},
        };
      }
      const dateKey = row.scheduled_date instanceof Date
        ? row.scheduled_date.toISOString().slice(0, 10)
        : String(row.scheduled_date).slice(0, 10);

      if (!grid[empKey].days[dateKey]) grid[empKey].days[dateKey] = [];
      grid[empKey].days[dateKey].push({
        id:            row.id,
        step_name:     row.step_name,
        step_order:    row.step_order,
        status:        row.status,
        planned_hours: row.planned_hours,
        project_id:    row.project_id,
        project_no:    row.project_no,
        project_name:  row.project_name,
        priority:      row.priority,
        work_centre:   row.work_centre_name,
      });
    }

    res.json({
      week,
      grid: Object.values(grid),
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /routing-steps/:id/schedule — assign employee + date to a routing step
router.patch("/routing-steps/:id", requireRole("senior"), async (req, res, next) => {
  try {
    const { assigned_employee_id, scheduled_date, planned_hours } = req.body;

    if (!assigned_employee_id && !scheduled_date && planned_hours === undefined) {
      return res.status(400).json({ error: "At least one of assigned_employee_id, scheduled_date, or planned_hours is required" });
    }

    // Conflict check: if assigning an employee to a date, warn if already booked elsewhere
    let conflict = null;
    if (assigned_employee_id && scheduled_date) {
      const existing = await db("routing_steps as rs")
        .leftJoin("projects as p", "rs.project_id", "p.id")
        .select("rs.id", "rs.name", "p.project_no")
        .where("rs.assigned_employee_id", assigned_employee_id)
        .where("rs.scheduled_date", scheduled_date)
        .where("rs.id", "!=", req.params.id)
        .whereNull("p.deleted_at")
        .first();

      if (existing) {
        conflict = { step_id: existing.id, step_name: existing.name, project_no: existing.project_no };
      }
    }

    const updates = { updated_at: db.fn.now() };
    if (assigned_employee_id !== undefined) updates.assigned_employee_id = assigned_employee_id || null;
    if (scheduled_date       !== undefined) updates.scheduled_date = scheduled_date || null;
    if (planned_hours        !== undefined) updates.planned_hours  = planned_hours  || null;

    const [step] = await db("routing_steps")
      .where("id", req.params.id)
      .update(updates)
      .returning("*");

    if (!step) return res.status(404).json({ error: "Routing step not found" });

    res.json({ step, conflict });
  } catch (err) {
    next(err);
  }
});

// GET /schedule/employee/:id — one employee's schedule for a week
router.get("/employee/:id", async (req, res, next) => {
  try {
    const { week } = req.query;
    if (!week) return res.status(400).json({ error: "week query param required" });

    const weekEnd = db.raw("?::date + INTERVAL '6 days'", [week]);

    const steps = await db("routing_steps as rs")
      .leftJoin("projects as p", "rs.project_id", "p.id")
      .select(
        "rs.id", "rs.name as step_name", "rs.status", "rs.planned_hours",
        "rs.scheduled_date", "p.project_no", "p.name as project_name", "p.priority"
      )
      .where("rs.assigned_employee_id", req.params.id)
      .where("rs.scheduled_date", ">=", week)
      .where("rs.scheduled_date", "<=", weekEnd)
      .whereNull("p.deleted_at")
      .orderBy("rs.scheduled_date");

    res.json({ employee_id: req.params.id, week, steps });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
