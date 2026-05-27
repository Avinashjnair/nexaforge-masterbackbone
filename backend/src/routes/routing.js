const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");

const router = express.Router({ mergeParams: true });

// GET /projects/:id/routing — steps in sequence order
router.get("/", async (req, res, next) => {
  try {
    const steps = await db("routing_steps as rs")
      .leftJoin("work_centres as wc", "rs.work_centre_id", "wc.id")
      .select("rs.*", "wc.name as work_centre_name", "wc.code as work_centre_code")
      .where("rs.project_id", req.params.id)
      .orderBy("rs.step_order");

    res.json(steps);
  } catch (err) {
    next(err);
  }
});

// POST /projects/:id/routing — add a routing step
router.post("/", requireRole("senior"), async (req, res, next) => {
  try {
    const { name, work_centre_id, step_order, planned_hours, start_date, end_date } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    // Auto-assign step_order if not provided
    let order = step_order;
    if (!order) {
      const [{ max }] = await db("routing_steps")
        .where("project_id", req.params.id)
        .max("step_order as max");
      order = (max || 0) + 1;
    }

    const [step] = await db("routing_steps")
      .insert({
        project_id: req.params.id,
        work_centre_id: work_centre_id || null,
        step_order: order,
        name,
        planned_hours: planned_hours || null,
        start_date: start_date || null,
        end_date: end_date || null,
      })
      .returning("*");

    res.status(201).json(step);
  } catch (err) {
    next(err);
  }
});

// PATCH /routing-steps/:stepId/status — start, complete, or hold a step
router.patch("/steps/:stepId/status", requireRole("senior"), async (req, res, next) => {
  try {
    const VALID = ["pending", "in_progress", "completed", "on_hold"];
    const { status, actual_hours } = req.body;
    if (!VALID.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID.join(", ")}` });
    }

    const updates = { status, updated_at: db.fn.now() };
    if (actual_hours !== undefined) updates.actual_hours = actual_hours;

    const [step] = await db("routing_steps")
      .where("id", req.params.stepId)
      .update(updates)
      .returning("*");

    if (!step) return res.status(404).json({ error: "Routing step not found" });
    res.json(step);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
