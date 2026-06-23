const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

const VALID_SEVERITIES = ["critical", "major", "minor"];
const VALID_STATUSES   = ["open", "investigating", "resolved", "closed"];

// Auto-generate complaint_no: COMP-YYYYMM-NNN
async function nextComplaintNo() {
  const prefix = `COMP-${new Date().toISOString().slice(0, 7).replace("-", "")}-`;
  const [{ max }] = await db("customer_complaints")
    .where("complaint_no", "like", `${prefix}%`)
    .max(db.raw("CAST(SUBSTRING(complaint_no FROM '\\d+$') AS INTEGER) as max"));
  return `${prefix}${String((Number(max) || 0) + 1).padStart(3, "0")}`;
}

// POST /customer-complaints — log a new complaint (Marketing logs on receipt)
router.post("/", async (req, res, next) => {
  try {
    const { client_id, project_id, received_date, description, severity, assigned_to } = req.body;

    if (!description || !severity || !received_date) {
      return res.status(400).json({ error: "description, severity, and received_date are required" });
    }
    if (!VALID_SEVERITIES.includes(severity)) {
      return res.status(400).json({ error: `severity must be one of: ${VALID_SEVERITIES.join(", ")}` });
    }

    const complaint_no = await nextComplaintNo();

    const [complaint] = await db("customer_complaints")
      .insert({
        client_id:      client_id   || null,
        project_id:     project_id  || null,
        complaint_no,
        received_date,
        description,
        severity,
        status:         "open",
        assigned_to:    assigned_to || null,
        logged_by:      req.user.sub,
      })
      .returning("*");

    res.status(201).json(complaint);
  } catch (err) {
    next(err);
  }
});

// GET /customer-complaints — list with filters
router.get("/", async (req, res, next) => {
  try {
    const { client_id, project_id, status, severity, limit = 50, page = 1 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db("customer_complaints as cc")
      .leftJoin("clients as c",   "cc.client_id",   "c.id")
      .leftJoin("projects as p",  "cc.project_id",  "p.id")
      .leftJoin("ncrs as n",      "cc.linked_ncr_id","n.id")
      .leftJoin("users as lb",    "cc.logged_by",   "lb.id")
      .leftJoin("users as at",    "cc.assigned_to", "at.id")
      .select(
        "cc.*",
        "c.name as client_name",
        "p.project_no", "p.name as project_name",
        "n.ncr_no as linked_ncr_no",
        "lb.full_name as logged_by_name",
        "at.full_name as assigned_to_name"
      )
      .orderBy("cc.received_date", "desc")
      .limit(Number(limit))
      .offset(offset);

    if (client_id)  query = query.where("cc.client_id",  client_id);
    if (project_id) query = query.where("cc.project_id", project_id);
    if (status)     query = query.where("cc.status",     status);
    if (severity)   query = query.where("cc.severity",   severity);

    const [rows, [{ count }]] = await Promise.all([
      query,
      db("customer_complaints").count("id as count"),
    ]);

    res.json({ data: rows, total: Number(count), page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

// GET /customer-complaints/:id
router.get("/:id", async (req, res, next) => {
  try {
    const complaint = await db("customer_complaints as cc")
      .leftJoin("clients as c",   "cc.client_id",    "c.id")
      .leftJoin("projects as p",  "cc.project_id",   "p.id")
      .leftJoin("ncrs as n",      "cc.linked_ncr_id","n.id")
      .leftJoin("users as lb",    "cc.logged_by",    "lb.id")
      .leftJoin("users as at",    "cc.assigned_to",  "at.id")
      .select(
        "cc.*",
        "c.name as client_name", "c.contact_name", "c.contact_email",
        "p.project_no", "p.name as project_name",
        "n.ncr_no as linked_ncr_no", "n.status as ncr_status",
        "lb.full_name as logged_by_name",
        "at.full_name as assigned_to_name"
      )
      .where("cc.id", req.params.id)
      .first();

    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    res.json(complaint);
  } catch (err) {
    next(err);
  }
});

// PATCH /customer-complaints/:id/status — advance investigation/resolution
router.patch("/:id/status", requireRole("senior"), async (req, res, next) => {
  try {
    const { status, resolution_notes, linked_ncr_id, assigned_to } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` });
    }

    const complaint = await db("customer_complaints").where("id", req.params.id).first();
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });

    const updates = { status, updated_at: db.fn.now() };
    if (resolution_notes !== undefined) updates.resolution_notes = resolution_notes;
    if (linked_ncr_id    !== undefined) updates.linked_ncr_id    = linked_ncr_id || null;
    if (assigned_to      !== undefined) updates.assigned_to      = assigned_to   || null;
    if (status === "resolved" || status === "closed") {
      updates.resolved_date = new Date().toISOString().slice(0, 10);
    }

    const [updated] = await db("customer_complaints")
      .where("id", req.params.id)
      .update(updates)
      .returning("*");

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// GET /customer-complaints/copq-summary — external failure cost for COPQ waterfall
router.get("/analytics/copq", async (req, res, next) => {
  try {
    const { from, to } = req.query;

    let query = db("customer_complaints").select(
      db.raw("COUNT(*) AS total_complaints"),
      db.raw("COUNT(*) FILTER (WHERE severity = 'critical') AS critical"),
      db.raw("COUNT(*) FILTER (WHERE severity = 'major')    AS major"),
      db.raw("COUNT(*) FILTER (WHERE severity = 'minor')    AS minor"),
      db.raw("COUNT(*) FILTER (WHERE status = 'closed')     AS closed"),
      db.raw("COUNT(*) FILTER (WHERE linked_ncr_id IS NOT NULL) AS linked_to_ncr"),
      db.raw("AVG(EXTRACT(EPOCH FROM (COALESCE(resolved_date::timestamp, NOW()) - received_date::timestamp)) / 86400) AS avg_resolution_days")
    );

    if (from) query = query.where("received_date", ">=", from);
    if (to)   query = query.where("received_date", "<=", to);

    const [summary] = await query;
    res.json({
      period: { from: from || null, to: to || null },
      total_complaints:    Number(summary.total_complaints),
      by_severity: {
        critical: Number(summary.critical),
        major:    Number(summary.major),
        minor:    Number(summary.minor),
      },
      closed:              Number(summary.closed),
      linked_to_ncr:       Number(summary.linked_to_ncr),
      avg_resolution_days: summary.avg_resolution_days
        ? +Number(summary.avg_resolution_days).toFixed(1)
        : null,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
