const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

const VALID_TYPES   = ["annual", "sick", "unpaid", "emergency"];
const VALID_STATUSES = ["pending", "approved", "rejected"];

// POST /leave-requests — employee submits leave request
router.post("/", async (req, res, next) => {
  try {
    const { employee_id, type, start_date, end_date, reason } = req.body;

    if (!employee_id || !type || !start_date || !end_date) {
      return res.status(400).json({ error: "employee_id, type, start_date, and end_date are required" });
    }
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: `type must be one of: ${VALID_TYPES.join(", ")}` });
    }

    const start = new Date(start_date);
    const end   = new Date(end_date);
    if (end < start) return res.status(400).json({ error: "end_date must be on or after start_date" });

    // Business days count (Mon–Fri only, simple)
    let days = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0 && d.getDay() !== 6) days++;
    }

    const [req_] = await db("leave_requests")
      .insert({ employee_id, type, start_date, end_date, days, reason: reason || null, status: "pending" })
      .returning("*");

    res.status(201).json(req_);
  } catch (err) {
    next(err);
  }
});

// GET /leave-requests — list with filters
router.get("/", async (req, res, next) => {
  try {
    const { employee_id, status, from, to, limit = 50, page = 1 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db("leave_requests as lr")
      .leftJoin("employees as e",  "lr.employee_id", "e.id")
      .leftJoin("users as u",      "lr.approved_by", "u.id")
      .select(
        "lr.*",
        "e.full_name as employee_name", "e.employee_no", "e.department",
        "u.full_name as decided_by_name"
      )
      .orderBy("lr.created_at", "desc")
      .limit(Number(limit))
      .offset(offset);

    if (employee_id) query = query.where("lr.employee_id", employee_id);
    if (status)      query = query.where("lr.status", status);
    if (from)        query = query.where("lr.start_date", ">=", from);
    if (to)          query = query.where("lr.end_date",   "<=", to);

    res.json(await query);
  } catch (err) {
    next(err);
  }
});

// PATCH /leave-requests/:id/approve — HR manager approves or rejects
router.patch("/:id/approve", requireRole("manager"), async (req, res, next) => {
  try {
    const { approve, decision_notes } = req.body;
    if (approve === undefined) return res.status(400).json({ error: "approve (boolean) is required" });

    const lr = await db("leave_requests").where("id", req.params.id).first();
    if (!lr) return res.status(404).json({ error: "Leave request not found" });
    if (lr.status !== "pending") {
      return res.status(409).json({ error: `Cannot decide a request in status: ${lr.status}` });
    }

    const newStatus = approve ? "approved" : "rejected";

    const [updated] = await db("leave_requests")
      .where("id", req.params.id)
      .update({
        status:         newStatus,
        approved_by:    req.user.sub,
        decided_at:     db.fn.now(),
        decision_notes: decision_notes || null,
        updated_at:     db.fn.now(),
      })
      .returning("*");

    // If approved, mark employee as on_leave if start_date is today
    if (approve) {
      const today = new Date().toISOString().slice(0, 10);
      if (lr.start_date <= today && lr.end_date >= today) {
        await db("employees")
          .where("id", lr.employee_id)
          .update({ status: "on_leave", updated_at: db.fn.now() });
      }
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// GET /leave-requests/conflicts — check if employee has approved leave on a date
// Used by scheduling grid conflict detection
router.get("/conflicts", async (req, res, next) => {
  try {
    const { employee_id, date } = req.query;
    if (!employee_id || !date) {
      return res.status(400).json({ error: "employee_id and date are required" });
    }

    const conflict = await db("leave_requests")
      .where("employee_id", employee_id)
      .where("status", "approved")
      .where("start_date", "<=", date)
      .where("end_date",   ">=", date)
      .first();

    res.json({ on_leave: !!conflict, leave_request: conflict || null });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
