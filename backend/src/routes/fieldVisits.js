const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");
const { publish, TOPICS } = require("../events/rabbitmq");

const router = express.Router();

// Auto-generate visit_no: FV-YYYYMM-NNN
async function nextVisitNo() {
  const prefix = `FV-${new Date().toISOString().slice(0, 7).replace("-", "")}-`;
  const [{ max }] = await db("field_visit_requests")
    .where("visit_no", "like", `${prefix}%`)
    .max(db.raw("CAST(SUBSTRING(visit_no FROM '\\d+$') AS INTEGER) as max"));
  return `${prefix}${String((Number(max) || 0) + 1).padStart(3, "0")}`;
}

// POST /field-visits — request a site visit
router.post("/", async (req, res, next) => {
  try {
    const { project_id, site_location, purpose, requested_date, assigned_team } = req.body;

    if (!site_location || !purpose || !requested_date) {
      return res.status(400).json({ error: "site_location, purpose, and requested_date are required" });
    }

    const visit_no    = await nextVisitNo();
    const teamMembers = Array.isArray(assigned_team) ? assigned_team : [];

    const [visit] = await db("field_visit_requests")
      .insert({
        project_id:     project_id    || null,
        requested_by:   req.user.sub,
        visit_no,
        site_location,
        purpose,
        requested_date,
        assigned_team:  JSON.stringify(teamMembers),
        status:         "pending",
      })
      .returning("*");

    await publish(TOPICS.SITE_VISIT_REQUESTED, {
      visit_id:       visit.id,
      visit_no:       visit.visit_no,
      project_id:     visit.project_id,
      site_location,
      requested_by:   req.user.name || req.user.sub,
    }).catch(() => {});

    res.status(201).json(visit);
  } catch (err) {
    next(err);
  }
});

// GET /field-visits — list with filters
router.get("/", async (req, res, next) => {
  try {
    const { project_id, status, limit = 50, page = 1 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db("field_visit_requests as fv")
      .leftJoin("projects as p",  "fv.project_id",   "p.id")
      .leftJoin("users as req",   "fv.requested_by", "req.id")
      .leftJoin("users as apr",   "fv.approved_by",  "apr.id")
      .select(
        "fv.*",
        "p.project_no", "p.name as project_name",
        "req.full_name as requested_by_name",
        "apr.full_name as approved_by_name"
      )
      .orderBy("fv.requested_date", "desc")
      .limit(Number(limit))
      .offset(offset);

    if (project_id) query = query.where("fv.project_id", project_id);
    if (status)     query = query.where("fv.status", status);

    res.json(await query);
  } catch (err) {
    next(err);
  }
});

// GET /field-visits/:id
router.get("/:id", async (req, res, next) => {
  try {
    const visit = await db("field_visit_requests as fv")
      .leftJoin("projects as p",  "fv.project_id",   "p.id")
      .leftJoin("users as req",   "fv.requested_by", "req.id")
      .leftJoin("users as apr",   "fv.approved_by",  "apr.id")
      .leftJoin("files as f",     "fv.report_file_id","f.id")
      .select(
        "fv.*",
        "p.project_no", "p.name as project_name",
        "req.full_name as requested_by_name",
        "apr.full_name as approved_by_name",
        "f.original_name as report_filename"
      )
      .where("fv.id", req.params.id)
      .first();

    if (!visit) return res.status(404).json({ error: "Field visit not found" });
    res.json(visit);
  } catch (err) {
    next(err);
  }
});

// PATCH /field-visits/:id/approve — GM/manager approves + sets scheduled date
router.patch("/:id/approve", requireRole("manager"), async (req, res, next) => {
  try {
    const { scheduled_date, assigned_team } = req.body;

    const visit = await db("field_visit_requests").where("id", req.params.id).first();
    if (!visit) return res.status(404).json({ error: "Field visit not found" });
    if (visit.status !== "pending") {
      return res.status(409).json({ error: `Cannot approve a visit in status: ${visit.status}` });
    }

    const teamMembers = Array.isArray(assigned_team) ? assigned_team : JSON.parse(visit.assigned_team || "[]");

    const [updated] = await db("field_visit_requests")
      .where("id", req.params.id)
      .update({
        status:         scheduled_date ? "scheduled" : "approved",
        scheduled_date: scheduled_date || null,
        assigned_team:  JSON.stringify(teamMembers),
        approved_by:    req.user.sub,
        updated_at:     db.fn.now(),
      })
      .returning("*");

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// PATCH /field-visits/:id/complete — mark completed, attach report
router.patch("/:id/complete", async (req, res, next) => {
  try {
    const { report_notes, report_file_id } = req.body;

    const visit = await db("field_visit_requests").where("id", req.params.id).first();
    if (!visit) return res.status(404).json({ error: "Field visit not found" });
    if (!["approved", "scheduled"].includes(visit.status)) {
      return res.status(409).json({ error: `Cannot complete a visit in status: ${visit.status}` });
    }

    const [updated] = await db("field_visit_requests")
      .where("id", req.params.id)
      .update({
        status:          "completed",
        report_notes:    report_notes    || null,
        report_file_id:  report_file_id  || null,
        updated_at:      db.fn.now(),
      })
      .returning("*");

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
