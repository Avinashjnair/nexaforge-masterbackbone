const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

// POST /attendance/clock-in — record clock-in
router.post("/clock-in", async (req, res, next) => {
  try {
    const { employee_id, clock_in, source, notes } = req.body;
    if (!employee_id) return res.status(400).json({ error: "employee_id is required" });

    const today    = new Date().toISOString().slice(0, 10);
    const clockIn  = clock_in || new Date().toISOString();

    // Upsert: one record per employee per day
    const existing = await db("attendance")
      .where({ employee_id, work_date: today })
      .first();

    if (existing) {
      if (existing.clock_in) {
        return res.status(409).json({ error: "Already clocked in today" });
      }
      const [updated] = await db("attendance")
        .where("id", existing.id)
        .update({ clock_in: clockIn, source: source || "manual", notes: notes || null, updated_at: db.fn.now() })
        .returning("*");
      return res.json(updated);
    }

    const [record] = await db("attendance")
      .insert({
        employee_id,
        work_date:   today,
        clock_in:    clockIn,
        source:      source || "manual",
        notes:       notes  || null,
        recorded_by: req.user.sub,
      })
      .returning("*");

    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
});

// POST /attendance/clock-out — record clock-out and compute total hours
router.post("/clock-out", async (req, res, next) => {
  try {
    const { employee_id, clock_out } = req.body;
    if (!employee_id) return res.status(400).json({ error: "employee_id is required" });

    const today    = new Date().toISOString().slice(0, 10);
    const clockOut = clock_out || new Date().toISOString();

    const record = await db("attendance").where({ employee_id, work_date: today }).first();
    if (!record)         return res.status(404).json({ error: "No clock-in record found for today" });
    if (!record.clock_in)return res.status(409).json({ error: "Employee has not clocked in today" });
    if (record.clock_out)return res.status(409).json({ error: "Already clocked out today" });

    const ms          = new Date(clockOut) - new Date(record.clock_in);
    const totalHours  = +(ms / 3600000).toFixed(2);

    const [updated] = await db("attendance")
      .where("id", record.id)
      .update({ clock_out: clockOut, total_hours: totalHours, updated_at: db.fn.now() })
      .returning("*");

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// GET /attendance — list records
router.get("/", async (req, res, next) => {
  try {
    const { employee_id, week, from, to, limit = 100, page = 1 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db("attendance as a")
      .leftJoin("employees as e", "a.employee_id", "e.id")
      .select(
        "a.*",
        "e.full_name as employee_name", "e.employee_no", "e.department"
      )
      .orderBy("a.work_date", "desc")
      .limit(Number(limit))
      .offset(offset);

    if (employee_id) query = query.where("a.employee_id", employee_id);
    if (week) {
      query = query
        .where("a.work_date", ">=", week)
        .where("a.work_date", "<",  db.raw("?::date + INTERVAL '7 days'", [week]));
    } else {
      if (from) query = query.where("a.work_date", ">=", from);
      if (to)   query = query.where("a.work_date", "<=", to);
    }

    res.json(await query);
  } catch (err) {
    next(err);
  }
});

// POST /attendance — manual entry (HR manager)
router.post("/", requireRole("manager"), async (req, res, next) => {
  try {
    const { employee_id, work_date, clock_in, clock_out, notes } = req.body;
    if (!employee_id || !work_date) {
      return res.status(400).json({ error: "employee_id and work_date are required" });
    }

    let total_hours = null;
    if (clock_in && clock_out) {
      const ms = new Date(clock_out) - new Date(clock_in);
      if (ms < 0) return res.status(400).json({ error: "clock_out must be after clock_in" });
      total_hours = +(ms / 3600000).toFixed(2);
    }

    const [record] = await db("attendance")
      .insert({
        employee_id, work_date,
        clock_in:    clock_in    || null,
        clock_out:   clock_out   || null,
        total_hours,
        source:      "manual",
        notes:       notes       || null,
        recorded_by: req.user.sub,
      })
      .returning("*");

    res.status(201).json(record);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Attendance record already exists for this employee and date" });
    next(err);
  }
});

module.exports = router;
