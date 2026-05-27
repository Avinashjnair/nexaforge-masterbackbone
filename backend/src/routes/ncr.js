const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");
const { assertTransition } = require("../services/ncrStateMachine");
const { publish, TOPICS } = require("../events/rabbitmq");

const router = express.Router();

// POST /ncr — raise NCR
router.post("/", requireRole("user"), async (req, res, next) => {
  try {
    const { project_id, title, description, severity, assigned_to, due_date } = req.body;
    if (!project_id || !title) {
      return res.status(400).json({ error: "project_id and title are required" });
    }

    const [{ count }] = await db("ncrs").count("id as count");
    const ncrNo = `NCR-${String(Number(count) + 1).padStart(4, "0")}`;

    const [ncr] = await db("ncrs")
      .insert({
        project_id,
        ncr_no: ncrNo,
        title,
        description: description || null,
        severity: severity || "minor",
        status: "open",
        raised_by: req.user.sub,
        assigned_to: assigned_to || null,
        due_date: due_date || null,
      })
      .returning("*");

    await publish(TOPICS.NCR_RAISED, {
      ncrId: ncr.id,
      ncrNo: ncr.ncr_no,
      projectId: ncr.project_id,
      severity: ncr.severity,
      raisedBy: req.user.sub,
    }).catch((e) => console.warn("[NCR] publish failed:", e.message));

    res.status(201).json(ncr);
  } catch (err) {
    next(err);
  }
});

// GET /ncr — list with filters
router.get("/", async (req, res, next) => {
  try {
    const { project_id, status, severity, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db("ncrs as n")
      .leftJoin("users as r", "n.raised_by", "r.id")
      .leftJoin("users as a", "n.assigned_to", "a.id")
      .leftJoin("projects as p", "n.project_id", "p.id")
      .select(
        "n.*",
        "r.full_name as raised_by_name",
        "a.full_name as assigned_to_name",
        "p.project_no",
        "p.name as project_name"
      )
      .orderBy("n.created_at", "desc")
      .limit(Number(limit))
      .offset(offset);

    if (project_id) query = query.where("n.project_id", project_id);
    if (status) query = query.where("n.status", status);
    if (severity) query = query.where("n.severity", severity);

    const ncrs = await query;
    res.json(ncrs);
  } catch (err) {
    next(err);
  }
});

// GET /ncr/:id — full NCR with activity log
router.get("/:id", async (req, res, next) => {
  try {
    const ncr = await db("ncrs as n")
      .leftJoin("users as r", "n.raised_by", "r.id")
      .leftJoin("users as a", "n.assigned_to", "a.id")
      .leftJoin("projects as p", "n.project_id", "p.id")
      .select("n.*", "r.full_name as raised_by_name", "a.full_name as assigned_to_name", "p.project_no")
      .where("n.id", req.params.id)
      .first();

    if (!ncr) return res.status(404).json({ error: "NCR not found" });

    const comments = await db("ncr_comments as c")
      .leftJoin("users as u", "c.user_id", "u.id")
      .where("c.ncr_id", req.params.id)
      .select("c.*", "u.full_name as author")
      .orderBy("c.created_at");

    res.json({ ...ncr, activity_log: comments });
  } catch (err) {
    next(err);
  }
});

// PATCH /ncr/:id/status — advance status (state machine enforced)
router.patch("/:id/status", requireRole("senior"), async (req, res, next) => {
  try {
    const { status, comments } = req.body;
    const ncr = await db("ncrs").where("id", req.params.id).first();
    if (!ncr) return res.status(404).json({ error: "NCR not found" });

    assertTransition(ncr.status, status);

    const [updated] = await db("ncrs")
      .where("id", req.params.id)
      .update({ status, updated_at: db.fn.now() })
      .returning("*");

    // Log the status change as a comment
    await db("ncr_comments").insert({
      ncr_id: req.params.id,
      user_id: req.user.sub,
      comment: comments || `Status changed to ${status}`,
      action_type: "status_change",
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// PATCH /ncr/:id/disposition — record disposition decision (requires RCA first — ENH-02)
router.patch("/:id/disposition", requireRole("manager"), async (req, res, next) => {
  try {
    const VALID = ["rework", "repair", "use_as_is", "reject", "scrap"];
    const { disposition, root_cause, corrective_action } = req.body;
    if (!VALID.includes(disposition)) {
      return res.status(400).json({ error: `disposition must be one of: ${VALID.join(", ")}` });
    }

    // ENH-02: RCA must be submitted before disposition can be set
    const rca = await db("ncr_rca").where("ncr_id", req.params.id).first();
    if (!rca) {
      return res.status(422).json({
        error: "Root cause analysis (RCA) must be submitted before setting disposition",
        code: "RCA_REQUIRED",
      });
    }

    const [updated] = await db("ncrs")
      .where("id", req.params.id)
      .update({ disposition, root_cause: root_cause || null, corrective_action: corrective_action || null, updated_at: db.fn.now() })
      .returning("*");

    if (!updated) return res.status(404).json({ error: "NCR not found" });

    await db("ncr_comments").insert({
      ncr_id: req.params.id,
      user_id: req.user.sub,
      comment: `Disposition set: ${disposition}`,
      action_type: "status_change",
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// POST /ncr/:id/comments — add activity log entry
router.post("/:id/comments", requireRole("user"), async (req, res, next) => {
  try {
    const { comment, action_type } = req.body;
    if (!comment) return res.status(400).json({ error: "comment is required" });

    const exists = await db("ncrs").where("id", req.params.id).first();
    if (!exists) return res.status(404).json({ error: "NCR not found" });

    const [entry] = await db("ncr_comments")
      .insert({
        ncr_id: req.params.id,
        user_id: req.user.sub,
        comment,
        action_type: action_type || "comment",
      })
      .returning("*");

    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
});

// POST /ncr/:id/rca — submit structured RCA (ENH-02)
router.post("/:id/rca", requireRole("senior"), async (req, res, next) => {
  try {
    const { method, why_1, why_2, why_3, why_4, why_5, root_cause, corrective_action, preventive_action } = req.body;

    if (!root_cause || !corrective_action) {
      return res.status(400).json({ error: "root_cause and corrective_action are required" });
    }

    const ncr = await db("ncrs").where("id", req.params.id).first();
    if (!ncr) return res.status(404).json({ error: "NCR not found" });

    // Upsert — only one RCA per NCR (unique constraint on ncr_id)
    const existing = await db("ncr_rca").where("ncr_id", req.params.id).first();
    let rca;
    if (existing) {
      [rca] = await db("ncr_rca")
        .where("ncr_id", req.params.id)
        .update({ method: method || "5why", why_1, why_2, why_3, why_4, why_5, root_cause, corrective_action, preventive_action: preventive_action || null, submitted_by: req.user.sub, updated_at: db.fn.now() })
        .returning("*");
    } else {
      [rca] = await db("ncr_rca")
        .insert({ ncr_id: req.params.id, method: method || "5why", why_1, why_2, why_3, why_4, why_5, root_cause, corrective_action, preventive_action: preventive_action || null, submitted_by: req.user.sub })
        .returning("*");
    }

    // Advance NCR to under_review if still open
    if (ncr.status === "open") {
      await db("ncrs").where("id", req.params.id).update({ status: "under_review", updated_at: db.fn.now() });
      await db("ncr_comments").insert({ ncr_id: req.params.id, user_id: req.user.sub, comment: "RCA submitted — NCR advanced to under_review", action_type: "status_change" });
    }

    res.status(existing ? 200 : 201).json(rca);
  } catch (err) {
    next(err);
  }
});

// GET /ncr/:id/rca — retrieve RCA for an NCR (ENH-02)
router.get("/:id/rca", async (req, res, next) => {
  try {
    const rca = await db("ncr_rca as r")
      .leftJoin("users as u", "r.submitted_by", "u.id")
      .select("r.*", "u.full_name as submitted_by_name")
      .where("r.ncr_id", req.params.id)
      .first();

    if (!rca) return res.status(404).json({ error: "No RCA found for this NCR" });
    res.json(rca);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
