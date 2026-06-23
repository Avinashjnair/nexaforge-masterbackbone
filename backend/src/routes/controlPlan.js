const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");

const router = express.Router();
const VALID_CODES = ["P", "R", "W", "H"];

function validCode(c) { return !c || VALID_CODES.includes(c); }

// ═══════════════════════════════════════════════════════════════
// STANDARD TEMPLATES  /api/control-plan/templates
// ═══════════════════════════════════════════════════════════════

// GET  /api/control-plan/templates[?type=Storage+Tank]
router.get("/templates", async (req, res, next) => {
  try {
    const q = db("control_plan_templates")
      .where("is_active", true)
      .orderBy(["project_type", "stage_no"]);
    if (req.query.type) q.where("project_type", req.query.type);
    res.json(await q);
  } catch (err) { next(err); }
});

// POST /api/control-plan/templates
router.post("/templates", requireRole("manager"), async (req, res, next) => {
  try {
    const {
      project_type, stage_no, stage_name, activity,
      reference_doc, parameters, responsible,
      internal_code = "P", customer_code, tpi_code, remarks,
    } = req.body;

    if (!project_type || !stage_name || !activity)
      return res.status(400).json({ error: "project_type, stage_name and activity are required" });
    if (!VALID_CODES.includes(internal_code))
      return res.status(400).json({ error: "internal_code must be P/R/W/H" });
    if (!validCode(customer_code) || !validCode(tpi_code))
      return res.status(400).json({ error: "customer_code and tpi_code must be P/R/W/H or null" });

    const [{ max }] = await db("control_plan_templates")
      .where("project_type", project_type).max("stage_no as max");

    const [item] = await db("control_plan_templates").insert({
      project_type,
      stage_no: stage_no ?? (max || 0) + 1,
      stage_name, activity,
      reference_doc: reference_doc || null,
      parameters:    parameters   || null,
      responsible:   responsible  || null,
      internal_code,
      customer_code: customer_code || null,
      tpi_code:      tpi_code      || null,
      remarks:       remarks       || null,
    }).returning("*");

    res.status(201).json(item);
  } catch (err) { next(err); }
});

// PUT  /api/control-plan/templates/:id
router.put("/templates/:id", requireRole("manager"), async (req, res, next) => {
  try {
    const allowed = [
      "project_type", "stage_no", "stage_name", "activity",
      "reference_doc", "parameters", "responsible",
      "internal_code", "customer_code", "tpi_code", "remarks", "is_active",
    ];
    const update = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) update[k] = req.body[k]; });

    const [item] = await db("control_plan_templates")
      .where("id", req.params.id)
      .update({ ...update, updated_at: db.fn.now() })
      .returning("*");
    if (!item) return res.status(404).json({ error: "Template item not found" });
    res.json(item);
  } catch (err) { next(err); }
});

// DELETE /api/control-plan/templates/:id  (soft-delete)
router.delete("/templates/:id", requireRole("gm"), async (req, res, next) => {
  try {
    await db("control_plan_templates").where("id", req.params.id)
      .update({ is_active: false, updated_at: db.fn.now() });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════════
// PROJECT CONTROL PLANS  /api/control-plan/projects/:projectId
// ═══════════════════════════════════════════════════════════════

// GET  /api/control-plan/projects/:projectId
router.get("/projects/:projectId", async (req, res, next) => {
  try {
    const items = await db("project_control_plans")
      .where("project_id", req.params.projectId)
      .orderBy(["stage_no", "created_at"]);
    res.json({ project_id: req.params.projectId, items });
  } catch (err) { next(err); }
});

// POST /api/control-plan/projects/:projectId/apply-template
// Bulk-copies all active template rows matching the project's product_type.
router.post("/projects/:projectId/apply-template", requireRole("senior"), async (req, res, next) => {
  try {
    const project = await db("projects").where("id", req.params.projectId).first();
    if (!project) return res.status(404).json({ error: "Project not found" });

    const templates = await db("control_plan_templates")
      .where({ project_type: project.product_type, is_active: true })
      .orderBy(["stage_no"]);

    if (!templates.length)
      return res.status(404).json({
        error: `No standard template for project type: ${project.product_type}`,
      });

    // Skip template items already applied to this project
    const existing = await db("project_control_plans")
      .where("project_id", req.params.projectId).select("template_item_id");
    const appliedIds = new Set(existing.map((e) => e.template_item_id).filter(Boolean));
    const toInsert = templates.filter((t) => !appliedIds.has(t.id));

    if (!toInsert.length)
      return res.json({ inserted: 0, message: "Template already fully applied" });

    await db("project_control_plans").insert(
      toInsert.map((t) => ({
        project_id:       req.params.projectId,
        template_item_id: t.id,
        stage_no:         t.stage_no,
        stage_name:       t.stage_name,
        activity:         t.activity,
        reference_doc:    t.reference_doc,
        parameters:       t.parameters,
        responsible:      t.responsible,
        internal_code:    t.internal_code,
        customer_code:    t.customer_code,
        tpi_code:         t.tpi_code,
        remarks:          null,
        status:           "pending",
      }))
    );

    res.status(201).json({ inserted: toInsert.length });
  } catch (err) { next(err); }
});

// POST /api/control-plan/projects/:projectId  — add custom item
router.post("/projects/:projectId", requireRole("senior"), async (req, res, next) => {
  try {
    const {
      stage_no, stage_name, activity, reference_doc, parameters,
      responsible, internal_code = "P", customer_code, tpi_code, remarks,
    } = req.body;

    if (!stage_name || !activity)
      return res.status(400).json({ error: "stage_name and activity are required" });
    if (!VALID_CODES.includes(internal_code) || !validCode(customer_code) || !validCode(tpi_code))
      return res.status(400).json({ error: "inspection codes must be P/R/W/H or null" });

    const [item] = await db("project_control_plans").insert({
      project_id:    req.params.projectId,
      stage_no:      stage_no ?? 99,
      stage_name,    activity,
      reference_doc: reference_doc || null,
      parameters:    parameters   || null,
      responsible:   responsible  || null,
      internal_code,
      customer_code: customer_code || null,
      tpi_code:      tpi_code      || null,
      remarks:       remarks       || null,
      status:        "pending",
    }).returning("*");

    res.status(201).json(item);
  } catch (err) { next(err); }
});

// PATCH /api/control-plan/projects/:projectId/items/:itemId
router.patch("/projects/:projectId/items/:itemId", requireRole("senior"), async (req, res, next) => {
  try {
    const item = await db("project_control_plans")
      .where({ id: req.params.itemId, project_id: req.params.projectId }).first();
    if (!item) return res.status(404).json({ error: "Control plan item not found" });
    if (item.is_locked)
      return res.status(409).json({ error: "Item is locked after sign-off. GM can unlock." });

    const allowed = [
      "stage_no", "stage_name", "activity", "reference_doc",
      "parameters", "responsible", "internal_code", "customer_code",
      "tpi_code", "status", "remarks",
    ];
    const update = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    if (req.body.status === "passed" || req.body.status === "failed") update.is_locked = true;

    const [updated] = await db("project_control_plans")
      .where("id", req.params.itemId)
      .update({ ...update, updated_at: db.fn.now() })
      .returning("*");
    res.json(updated);
  } catch (err) { next(err); }
});

// DELETE /api/control-plan/projects/:projectId/items/:itemId
router.delete("/projects/:projectId/items/:itemId", requireRole("manager"), async (req, res, next) => {
  try {
    const count = await db("project_control_plans")
      .where({ id: req.params.itemId, project_id: req.params.projectId }).del();
    if (!count) return res.status(404).json({ error: "Item not found" });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
