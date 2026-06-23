const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");
const { publish, TOPICS } = require("../events/rabbitmq");

const router = express.Router();

// Auto-generate deviation_no: DEV-YYYYMM-NNN
async function nextDeviationNo() {
  const prefix = `DEV-${new Date().toISOString().slice(0, 7).replace("-", "")}-`;
  const [{ max }] = await db("deviation_requests")
    .where("deviation_no", "like", `${prefix}%`)
    .max(db.raw("CAST(SUBSTRING(deviation_no FROM '\\d+$') AS INTEGER) as max"));
  const seq = (Number(max) || 0) + 1;
  return `${prefix}${String(seq).padStart(3, "0")}`;
}

// POST /deviations — Production raises a deviation request
router.post("/", async (req, res, next) => {
  try {
    const { project_id, description, drawing_ref, current_spec, proposed_deviation, justification } = req.body;

    if (!project_id || !description || !proposed_deviation || !justification) {
      return res.status(400).json({
        error: "project_id, description, proposed_deviation, and justification are required",
      });
    }

    const deviation_no = await nextDeviationNo();

    const [dev] = await db("deviation_requests")
      .insert({
        project_id,
        raised_by: req.user.sub,
        deviation_no,
        description,
        drawing_ref:        drawing_ref || null,
        current_spec:       current_spec || null,
        proposed_deviation,
        justification,
        status: "pending",
      })
      .returning("*");

    // Notify QC + GM via event bus
    await publish(TOPICS.DEVIATION_REQUESTED, {
      deviation_id: dev.id,
      deviation_no: dev.deviation_no,
      project_id,
      raised_by:    req.user.name || req.user.sub,
    });

    res.status(201).json(dev);
  } catch (err) {
    next(err);
  }
});

// GET /deviations — list, filter by project or status
router.get("/", async (req, res, next) => {
  try {
    const { project_id, status, limit = 50, page = 1 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db("deviation_requests as dr")
      .leftJoin("projects as p",  "dr.project_id",   "p.id")
      .leftJoin("users as u",     "dr.raised_by",     "u.id")
      .leftJoin("users as qcu",   "dr.qc_reviewed_by","qcu.id")
      .leftJoin("users as gmu",   "dr.gm_approved_by","gmu.id")
      .select(
        "dr.*",
        "p.project_no", "p.name as project_name",
        "u.full_name as raised_by_name",
        "qcu.full_name as qc_reviewer_name",
        "gmu.full_name as gm_approver_name"
      )
      .orderBy("dr.created_at", "desc")
      .limit(Number(limit))
      .offset(offset);

    if (project_id) query = query.where("dr.project_id", project_id);
    if (status)     query = query.where("dr.status", status);

    const [rows, [{ count }]] = await Promise.all([
      query,
      db("deviation_requests").count("id as count"),
    ]);

    res.json({ data: rows, total: Number(count), page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

// GET /deviations/:id
router.get("/:id", async (req, res, next) => {
  try {
    const dev = await db("deviation_requests as dr")
      .leftJoin("projects as p",  "dr.project_id",   "p.id")
      .leftJoin("users as u",     "dr.raised_by",     "u.id")
      .leftJoin("users as qcu",   "dr.qc_reviewed_by","qcu.id")
      .leftJoin("users as gmu",   "dr.gm_approved_by","gmu.id")
      .select(
        "dr.*",
        "p.project_no", "p.name as project_name",
        "u.full_name as raised_by_name",
        "qcu.full_name as qc_reviewer_name",
        "gmu.full_name as gm_approver_name"
      )
      .where("dr.id", req.params.id)
      .first();

    if (!dev) return res.status(404).json({ error: "Deviation request not found" });
    res.json(dev);
  } catch (err) {
    next(err);
  }
});

// PATCH /deviations/:id/review — QC submits their review
router.patch("/:id/review", requireRole("senior"), async (req, res, next) => {
  try {
    const { qc_comments, approve } = req.body; // approve: true → forward to GM, false → reject

    const dev = await db("deviation_requests").where("id", req.params.id).first();
    if (!dev) return res.status(404).json({ error: "Deviation request not found" });
    if (dev.status !== "pending") {
      return res.status(409).json({ error: `Cannot review a deviation in status: ${dev.status}` });
    }

    const newStatus = approve === false ? "rejected" : "gm_approval";

    const [updated] = await db("deviation_requests")
      .where("id", req.params.id)
      .update({
        status:          newStatus,
        qc_reviewed_by:  req.user.sub,
        qc_reviewed_at:  db.fn.now(),
        qc_comments:     qc_comments || null,
        updated_at:      db.fn.now(),
      })
      .returning("*");

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// PATCH /deviations/:id/approve — GM approves or rejects
router.patch("/:id/approve", requireRole("gm"), async (req, res, next) => {
  try {
    const { approve, gm_comments } = req.body;
    if (approve === undefined) {
      return res.status(400).json({ error: "approve (boolean) is required" });
    }

    const dev = await db("deviation_requests").where("id", req.params.id).first();
    if (!dev) return res.status(404).json({ error: "Deviation request not found" });
    if (dev.status !== "gm_approval") {
      return res.status(409).json({ error: `Cannot decide a deviation in status: ${dev.status}` });
    }

    const newStatus = approve ? "approved" : "rejected";

    const [updated] = await db("deviation_requests")
      .where("id", req.params.id)
      .update({
        status:         newStatus,
        gm_approved_by: req.user.sub,
        gm_decided_at:  db.fn.now(),
        gm_comments:    gm_comments || null,
        updated_at:     db.fn.now(),
      })
      .returning("*");

    // Notify Production of the decision
    const topic = approve ? "deviation.approved" : "deviation.rejected";
    await publish(topic, {
      deviation_id: updated.id,
      deviation_no: updated.deviation_no,
      project_id:   updated.project_id,
      status:       newStatus,
      decided_by:   req.user.name || req.user.sub,
      gm_comments,
    }).catch(() => {}); // non-fatal if broker is down

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
