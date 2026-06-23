const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");
const { publish, TOPICS } = require("../events/rabbitmq");

const router = express.Router();

// GET /projects — list with optional filters: status, phase, client_id
router.get("/", async (req, res, next) => {
  try {
    const { status, phase, client_id, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db("projects as p")
      .leftJoin("clients as c", "p.client_id", "c.id")
      .leftJoin("employees as pm", "p.project_manager_id", "pm.id")
      .select(
        "p.*",
        "c.name as client_name",
        "c.short_code as client_code",
        "pm.full_name as pm_name"
      )
      .where("p.deleted_at", null)
      .orderBy("p.created_at", "desc")
      .limit(Number(limit))
      .offset(offset);

    if (status) query = query.where("p.status", status);
    if (phase) query = query.where("p.phase", Number(phase));
    if (client_id) query = query.where("p.client_id", client_id);

    const [projects, [{ count }]] = await Promise.all([
      query,
      db("projects").count("id as count").where("deleted_at", null),
    ]);

    res.json({ data: projects, total: Number(count), page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

// POST /projects — create new project
router.post("/", requireRole("manager"), async (req, res, next) => {
  try {
    const {
      project_no, name, client_id, contract_value, currency,
      due_date, product_type, material_grade, project_manager_id, scope_notes,
    } = req.body;

    if (!project_no || !name) {
      return res.status(400).json({ error: "project_no and name are required" });
    }

    const [project] = await db("projects")
      .insert({
        project_no,
        name,
        client_id: client_id || null,
        status: "planning",
        phase: 1,
        progress_pct: 0,
        contract_value: contract_value || null,
        currency: currency || "USD",
        due_date: due_date || null,
        product_type: product_type || null,
        material_grade: material_grade || null,
        project_manager_id: project_manager_id || null,
        scope_notes: scope_notes || null,
      })
      .returning("*");

    res.status(201).json(project);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "project_no already exists" });
    }
    next(err);
  }
});

// GET /projects/:id — full project detail
router.get("/:id", async (req, res, next) => {
  try {
    const project = await db("projects as p")
      .leftJoin("clients as c", "p.client_id", "c.id")
      .leftJoin("employees as pm", "p.project_manager_id", "pm.id")
      .select("p.*", "c.name as client_name", "c.short_code as client_code", "pm.full_name as pm_name")
      .where("p.id", req.params.id)
      .whereNull("p.deleted_at")
      .first();

    if (!project) return res.status(404).json({ error: "Project not found" });

    // Attach milestone summary
    const milestones = await db("milestones")
      .where("project_id", req.params.id)
      .orderBy("target_date");

    res.json({ ...project, milestones });
  } catch (err) {
    next(err);
  }
});

// PATCH /projects/:id/phase — advance or set phase, fires event bus
router.patch("/:id/phase", requireRole("manager"), async (req, res, next) => {
  try {
    const { phase } = req.body;
    if (!phase || phase < 1 || phase > 8) {
      return res.status(400).json({ error: "phase must be 1–8" });
    }

    const existing = await db("projects").where("id", req.params.id).first();
    if (!existing) return res.status(404).json({ error: "Project not found" });

    const [updated] = await db("projects")
      .where("id", req.params.id)
      .update({ phase: Number(phase), updated_at: db.fn.now() })
      .returning("*");

    // Publish event bus message
    await publish(TOPICS.PROJECT_PHASE_CHANGED, {
      projectId: updated.id,
      projectNo: updated.project_no,
      previousPhase: existing.phase,
      newPhase: updated.phase,
      changedBy: req.user.sub,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// PATCH /projects/:id/status
router.patch("/:id/status", requireRole("manager"), async (req, res, next) => {
  try {
    const VALID_STATUSES = ["planning", "active", "qc_hold", "completed", "cancelled"];
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` });
    }

    const [updated] = await db("projects")
      .where("id", req.params.id)
      .whereNull("deleted_at")
      .update({ status, updated_at: db.fn.now() })
      .returning("*");

    if (!updated) return res.status(404).json({ error: "Project not found" });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// PATCH /projects/:id/progress
router.patch("/:id/progress", requireRole("senior"), async (req, res, next) => {
  try {
    const { progress_pct } = req.body;
    const pct = Number(progress_pct);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      return res.status(400).json({ error: "progress_pct must be 0–100" });
    }

    const [updated] = await db("projects")
      .where("id", req.params.id)
      .whereNull("deleted_at")
      .update({ progress_pct: pct, updated_at: db.fn.now() })
      .returning("*");

    if (!updated) return res.status(404).json({ error: "Project not found" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// PATCH /projects/:id/assign — GM assigns a project to production + QC simultaneously
router.patch("/:id/assign", requireRole("gm"), async (req, res, next) => {
  try {
    const { project_manager_id, notes } = req.body;

    const existing = await db("projects").where("id", req.params.id).whereNull("deleted_at").first();
    if (!existing) return res.status(404).json({ error: "Project not found" });

    const updates = { status: "active", updated_at: db.fn.now() };
    if (project_manager_id) updates.project_manager_id = project_manager_id;

    const [updated] = await db("projects").where("id", req.params.id).update(updates).returning("*");

    await publish(TOPICS.PROJECT_ASSIGNED, {
      projectId: updated.id,
      projectNo: updated.project_no,
      projectName: updated.name,
      assignedBy: req.user.name,
      projectManagerId: project_manager_id || null,
      notes: notes || null,
    }).catch((e) => console.warn("[Project] assign publish failed:", e.message));

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /projects/:id — soft delete only
router.delete("/:id", requireRole("gm"), async (req, res, next) => {
  try {
    const rows = await db("projects")
      .where("id", req.params.id)
      .whereNull("deleted_at")
      .update({ deleted_at: db.fn.now(), updated_at: db.fn.now() });

    if (!rows) return res.status(404).json({ error: "Project not found" });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
