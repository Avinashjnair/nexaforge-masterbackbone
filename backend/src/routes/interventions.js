const express = require("express");
const db = require("../db/knex");
const { requireRole, requireDepartment } = require("../middleware/auth");
const { publish, TOPICS } = require("../events/rabbitmq");

const router = express.Router();

const VALID_ACTIONS = ["priority_override", "resource_reallocation", "hold_release", "rush_order"];

// POST /interventions — GM logs a formal intervention
router.post("/", requireRole("gm"), async (req, res, next) => {
  try {
    const { project_id, action_type, reason, target_dept } = req.body;

    if (!action_type || !reason) {
      return res.status(400).json({ error: "action_type and reason are required" });
    }
    if (!VALID_ACTIONS.includes(action_type)) {
      return res.status(400).json({ error: `action_type must be one of: ${VALID_ACTIONS.join(", ")}` });
    }

    const [intervention] = await db("gm_interventions")
      .insert({
        project_id: project_id || null,
        action_type,
        reason,
        target_dept: target_dept || null,
        created_by: req.user.sub,
      })
      .returning("*");

    // If this is a rush order, also update the project priority field
    if (action_type === "rush_order" && project_id) {
      await db("projects").where({ id: project_id }).update({ priority: "rush" });
    }

    // Fire event bus — all department subscribers receive GM interventions
    await publish(TOPICS.GM_INTERVENTION, {
      intervention_id: intervention.id,
      project_id,
      action_type,
      reason,
      target_dept,
      gm_name: req.user.name,
    });

    // If rush order, also fire the dedicated rush topic so production + procurement react
    if (action_type === "rush_order" && project_id) {
      await publish(TOPICS.RUSH_ORDER_TRIGGERED, {
        project_id,
        triggered_by: req.user.name,
        reason,
      });
    }

    res.status(201).json(intervention);
  } catch (err) {
    next(err);
  }
});

// GET /interventions — GM only: full list with project + creator join
router.get("/", requireRole("gm"), async (req, res, next) => {
  try {
    const { project_id, action_type, limit = 50, page = 1 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db("gm_interventions as i")
      .leftJoin("projects as p", "i.project_id", "p.id")
      .leftJoin("users as u", "i.created_by", "u.id")
      .select(
        "i.*",
        "p.project_no",
        "p.name as project_name",
        "u.full_name as gm_name"
      )
      .orderBy("i.created_at", "desc")
      .limit(Number(limit))
      .offset(offset);

    if (project_id) query = query.where("i.project_id", project_id);
    if (action_type) query = query.where("i.action_type", action_type);

    const [rows, [{ count }]] = await Promise.all([
      query,
      db("gm_interventions").count("id as count"),
    ]);

    res.json({ data: rows, total: Number(count), page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

// GET /projects/:id/interventions — interventions for a specific project (any authenticated user)
router.get("/projects/:id/interventions", async (req, res, next) => {
  try {
    const rows = await db("gm_interventions as i")
      .leftJoin("users as u", "i.created_by", "u.id")
      .select("i.*", "u.full_name as gm_name")
      .where("i.project_id", req.params.id)
      .orderBy("i.created_at", "desc");

    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
