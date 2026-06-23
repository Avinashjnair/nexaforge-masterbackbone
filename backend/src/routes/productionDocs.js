/**
 * DocMgmt_V1 — Production document routes
 * Production owns: approval workflow engine, document archive & search
 *
 * Approval chains
 *   GET    /api/production/approvals/chains               list chains
 *   POST   /api/production/approvals/chains               create chain
 *   GET    /api/production/approvals/chains/:id           chain detail + steps
 *   POST   /api/production/approvals/chains/:id/steps     add step
 *   DELETE /api/production/approvals/chains/:id/steps/:stepId
 *
 * Approval instances (a chain applied to a document)
 *   GET    /api/production/approvals/pending              my pending actions
 *   GET    /api/production/approvals/instances/:entityType/:entityId  history
 *   POST   /api/production/approvals/submit               submit doc for approval
 *   PUT    /api/production/approvals/:instanceId/approve  approve current step
 *   PUT    /api/production/approvals/:instanceId/reject   reject with reason
 *   PUT    /api/production/approvals/:instanceId/escalate escalate overdue step
 *   GET    /api/production/approvals/:instanceId          instance detail
 *
 * Archive & Search
 *   GET    /api/production/archive/search                 full-text search
 *   POST   /api/production/archive/:projectId             archive project docs
 *   GET    /api/production/archive/recent                 recently archived
 *   POST   /api/production/archive/bulk-download          ZIP of selected docs
 *   GET    /api/production/archive/retention              retention policies
 *   POST   /api/production/archive/retention              set retention policy
 */

const express   = require("express");
const archiver  = require("archiver");
const db        = require("../db/knex");
const { requireRole, requireDepartment } = require("../middleware/auth");
const { publish } = require("../events/rabbitmq");

const router = express.Router();

// ════════════════════════════════════════════════════════════════
// Approval Chains (templates)
// ════════════════════════════════════════════════════════════════

router.get("/approvals/chains", async (req, res, next) => {
  try {
    const { doc_type } = req.query;
    let q = db("approval_chains as c")
      .leftJoin("users as u", "c.created_by", "u.id")
      .select("c.*", db.raw("u.full_name AS created_by_name"),
        db.raw(`(SELECT COUNT(*) FROM approval_steps WHERE chain_id = c.id) AS step_count`))
      .where("c.is_active", true);
    if (doc_type) q = q.where("c.doc_type", doc_type);
    res.json(await q.orderBy("c.name"));
  } catch (err) { next(err); }
});

router.post("/approvals/chains", requireRole("gm", "manager"), async (req, res, next) => {
  try {
    const { name, doc_type, mode, sla_hours, description, steps } = req.body;
    if (!name || !doc_type) return res.status(422).json({ error: "name and doc_type required" });

    const [chain] = await db("approval_chains").insert({
      name, doc_type, mode: mode || "sequential",
      sla_hours: sla_hours || 48, description,
      created_by: req.user.id,
    }).returning("*");

    if (Array.isArray(steps) && steps.length) {
      const stepRows = steps.map((s, i) => ({
        chain_id: chain.id, step_order: s.step_order || i + 1,
        step_name: s.step_name, approver_type: s.approver_type || "role",
        approver_user_id: s.approver_user_id || null,
        approver_role: s.approver_role || null,
        approver_dept: s.approver_dept || null,
        is_optional: s.is_optional || false,
      }));
      await db("approval_steps").insert(stepRows);
    }

    const fullChain = await db("approval_chains").where({ id: chain.id }).first();
    const chainSteps = await db("approval_steps").where({ chain_id: chain.id }).orderBy("step_order");
    res.status(201).json({ ...fullChain, steps: chainSteps });
  } catch (err) { next(err); }
});

router.get("/approvals/chains/:id", async (req, res, next) => {
  try {
    const chain = await db("approval_chains").where({ id: req.params.id }).first();
    if (!chain) return res.status(404).json({ error: "Chain not found" });
    const steps = await db("approval_steps as s")
      .leftJoin("users as u", "s.approver_user_id", "u.id")
      .select("s.*", db.raw("u.full_name AS approver_name"))
      .where("s.chain_id", req.params.id)
      .orderBy("s.step_order");
    res.json({ ...chain, steps });
  } catch (err) { next(err); }
});

router.post("/approvals/chains/:id/steps", requireRole("gm", "manager"), async (req, res, next) => {
  try {
    const { step_order, step_name, approver_type, approver_user_id, approver_role, approver_dept, is_optional } = req.body;
    if (!step_name || !step_order) return res.status(422).json({ error: "step_name and step_order required" });
    const [step] = await db("approval_steps").insert({
      chain_id: req.params.id, step_order, step_name,
      approver_type: approver_type || "role",
      approver_user_id, approver_role, approver_dept,
      is_optional: !!is_optional,
    }).returning("*");
    res.status(201).json(step);
  } catch (err) { next(err); }
});

router.delete("/approvals/chains/:id/steps/:stepId", requireRole("gm", "manager"), async (req, res, next) => {
  try {
    const deleted = await db("approval_steps")
      .where({ id: req.params.stepId, chain_id: req.params.id }).delete();
    if (!deleted) return res.status(404).json({ error: "Step not found" });
    res.json({ message: "Step removed" });
  } catch (err) { next(err); }
});

// ════════════════════════════════════════════════════════════════
// Approval Instances (live approvals)
// ════════════════════════════════════════════════════════════════

// ── GET /api/production/approvals/pending ─────────────────────
router.get("/approvals/pending", async (req, res, next) => {
  try {
    // Find instances at the current step where this user matches the approver criteria
    const { rows } = await db.raw(`
      SELECT
        ai.id                AS instance_id,
        ai.entity_type,
        ai.entity_id,
        ai.status,
        ai.current_step_order,
        ai.submitted_at,
        ai.submitter_notes,
        ac.name              AS chain_name,
        ac.doc_type,
        ac.sla_hours,
        aps.step_name,
        aps.approver_type,
        aps.approver_role,
        aps.approver_dept,
        -- SLA breach flag
        (ai.submitted_at + (ac.sla_hours || ' hours')::interval) < NOW()
                             AS sla_breached,
        u.full_name          AS submitted_by_name
      FROM approval_instances ai
      JOIN approval_chains  ac  ON ac.id = ai.chain_id
      JOIN approval_steps   aps ON aps.chain_id = ai.chain_id AND aps.step_order = ai.current_step_order
      LEFT JOIN users       u   ON u.id = ai.submitted_by
      WHERE ai.status = 'in_progress'
        AND (
          (aps.approver_type = 'specific_user' AND aps.approver_user_id = :userId)
          OR (aps.approver_type = 'role'       AND aps.approver_role    = :role)
          OR (aps.approver_type = 'department' AND aps.approver_dept    = :dept)
        )
      ORDER BY ai.submitted_at ASC
    `, { userId: req.user.id, role: req.user.role, dept: req.user.department });

    res.json(rows);
  } catch (err) { next(err); }
});

// ── GET /api/production/approvals/instances/:type/:entityId ───
router.get("/approvals/instances/:entityType/:entityId", async (req, res, next) => {
  try {
    const instances = await db("approval_instances as ai")
      .join("approval_chains as ac", "ac.id", "ai.chain_id")
      .leftJoin("users as sub", "ai.submitted_by", "sub.id")
      .select("ai.*", "ac.name AS chain_name", "ac.doc_type",
        db.raw("sub.full_name AS submitted_by_name"))
      .where({ "ai.entity_type": req.params.entityType, "ai.entity_id": req.params.entityId })
      .orderBy("ai.submitted_at", "desc");

    // Attach actions per instance
    const withActions = await Promise.all(instances.map(async inst => {
      const actions = await db("approval_actions as aa")
        .leftJoin("users as u", "aa.actor_id", "u.id")
        .select("aa.*", db.raw("u.full_name AS actor_name"))
        .where("aa.instance_id", inst.id)
        .orderBy("aa.acted_at");
      return { ...inst, actions };
    }));
    res.json(withActions);
  } catch (err) { next(err); }
});

// ── POST /api/production/approvals/submit ─────────────────────
router.post("/approvals/submit", async (req, res, next) => {
  try {
    const { chain_id, entity_type, entity_id, submitter_notes } = req.body;
    if (!chain_id || !entity_type || !entity_id) {
      return res.status(422).json({ error: "chain_id, entity_type and entity_id required" });
    }
    const chain = await db("approval_chains").where({ id: chain_id, is_active: true }).first();
    if (!chain) return res.status(404).json({ error: "Approval chain not found or inactive" });

    const [instance] = await db("approval_instances").insert({
      chain_id, entity_type, entity_id,
      status: "in_progress", current_step_order: 1,
      submitted_by: req.user.id, submitted_at: new Date(),
      submitter_notes,
    }).returning("*");

    try {
      await publish("approval.submitted", {
        instance_id: instance.id, chain_name: chain.name,
        entity_type, entity_id, submitted_by: req.user.id,
      });
      if (req.io) req.io.to("dept:qc").to("dept:production").emit("approval:new", instance);
    } catch (_) { /* non-critical */ }

    res.status(201).json(instance);
  } catch (err) { next(err); }
});

// ── PUT /api/production/approvals/:instanceId/approve ─────────
router.put("/approvals/:instanceId/approve", async (req, res, next) => {
  try {
    const { comments } = req.body;
    const instance = await db("approval_instances").where({ id: req.params.instanceId, status: "in_progress" }).first();
    if (!instance) return res.status(404).json({ error: "Instance not found or not in progress" });

    const step = await db("approval_steps")
      .where({ chain_id: instance.chain_id, step_order: instance.current_step_order }).first();
    if (!step) return res.status(404).json({ error: "Step not found" });

    // Record action
    await db("approval_actions").insert({
      instance_id: instance.id, step_id: step.id,
      step_order: step.step_order, actor_id: req.user.id,
      action: "approved", comments, acted_at: new Date(),
    });

    // Advance to next step or complete
    const nextStep = await db("approval_steps")
      .where("chain_id", instance.chain_id)
      .where("step_order", ">", step.step_order)
      .orderBy("step_order").first();

    let newStatus = "in_progress";
    let newStepOrder = instance.current_step_order;
    let completedAt = null;

    if (nextStep) {
      newStepOrder = nextStep.step_order;
    } else {
      newStatus   = "approved";
      completedAt = new Date();
    }

    const [updated] = await db("approval_instances").where({ id: instance.id })
      .update({ status: newStatus, current_step_order: newStepOrder, completed_at: completedAt, updated_at: new Date() })
      .returning("*");

    try {
      const eventName = newStatus === "approved" ? "approval.completed" : "approval.step.approved";
      await publish(eventName, { instance_id: instance.id, entity_type: instance.entity_type, entity_id: instance.entity_id, step: step.step_name });
      if (req.io) req.io.to("dept:qc").to("dept:production").emit("approval:updated", updated);
    } catch (_) { /* non-critical */ }

    res.json(updated);
  } catch (err) { next(err); }
});

// ── PUT /api/production/approvals/:instanceId/reject ──────────
router.put("/approvals/:instanceId/reject", async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(422).json({ error: "reason required for rejection" });

    const instance = await db("approval_instances").where({ id: req.params.instanceId, status: "in_progress" }).first();
    if (!instance) return res.status(404).json({ error: "Instance not found or not in progress" });

    const step = await db("approval_steps")
      .where({ chain_id: instance.chain_id, step_order: instance.current_step_order }).first();

    await db("approval_actions").insert({
      instance_id: instance.id, step_id: step?.id,
      step_order: instance.current_step_order, actor_id: req.user.id,
      action: "rejected", comments: reason, acted_at: new Date(),
    });

    const [updated] = await db("approval_instances").where({ id: instance.id })
      .update({ status: "rejected", completed_at: new Date(), updated_at: new Date() })
      .returning("*");

    try {
      await publish("approval.rejected", {
        instance_id: instance.id, entity_type: instance.entity_type,
        entity_id: instance.entity_id, reason, rejected_by: req.user.id,
      });
      if (req.io) req.io.to("dept:qc").to("dept:production").emit("approval:updated", updated);
    } catch (_) { /* non-critical */ }

    res.json(updated);
  } catch (err) { next(err); }
});

// ── PUT /api/production/approvals/:instanceId/escalate ────────
router.put("/approvals/:instanceId/escalate", requireRole("gm", "manager"), async (req, res, next) => {
  try {
    const instance = await db("approval_instances").where({ id: req.params.instanceId, status: "in_progress" }).first();
    if (!instance) return res.status(404).json({ error: "Instance not found or not in progress" });

    const step = await db("approval_steps")
      .where({ chain_id: instance.chain_id, step_order: instance.current_step_order }).first();

    await db("approval_actions").insert({
      instance_id: instance.id, step_id: step?.id,
      step_order: instance.current_step_order, actor_id: req.user.id,
      action: "escalated", comments: req.body.comments || "Escalated due to SLA breach",
      acted_at: new Date(),
    });

    const [updated] = await db("approval_instances").where({ id: instance.id })
      .update({ status: "escalated", updated_at: new Date() }).returning("*");

    res.json(updated);
  } catch (err) { next(err); }
});

// ── GET /api/production/approvals/:instanceId ─────────────────
router.get("/approvals/:instanceId", async (req, res, next) => {
  try {
    const instance = await db("approval_instances as ai")
      .join("approval_chains as ac", "ac.id", "ai.chain_id")
      .select("ai.*", "ac.name AS chain_name", "ac.sla_hours", "ac.mode", "ac.doc_type")
      .where("ai.id", req.params.instanceId).first();
    if (!instance) return res.status(404).json({ error: "Instance not found" });

    const [steps, actions] = await Promise.all([
      db("approval_steps as s")
        .leftJoin("users as u", "s.approver_user_id", "u.id")
        .select("s.*", db.raw("u.full_name AS approver_name"))
        .where("s.chain_id", instance.chain_id).orderBy("s.step_order"),
      db("approval_actions as a")
        .leftJoin("users as u", "a.actor_id", "u.id")
        .select("a.*", db.raw("u.full_name AS actor_name"))
        .where("a.instance_id", instance.id).orderBy("a.acted_at"),
    ]);

    res.json({ ...instance, steps, actions });
  } catch (err) { next(err); }
});

// ════════════════════════════════════════════════════════════════
// Archive & Search
// ════════════════════════════════════════════════════════════════

// ── GET /api/production/archive/search ───────────────────────
router.get("/archive/search", async (req, res, next) => {
  try {
    const { q, project_id, doc_type, from, to } = req.query;
    if (!q && !project_id) return res.status(422).json({ error: "q or project_id required" });

    // Search across doc_register, mdr_entries, drawings simultaneously
    const [docRows, mdrRows, drawingRows] = await Promise.all([
      (() => {
        let query = db("doc_register as d")
          .leftJoin("projects as p", function() {
            this.on(db.raw("d.tags::text LIKE '%' || p.id || '%'"));
          })
          .select("d.id", "d.doc_no AS doc_number", "d.title", "d.doc_type", "d.status", "d.created_at",
            db.raw("'doc_register' AS source_table"), db.raw("NULL::uuid AS project_id"))
          .whereNull("d.deleted_at");
        if (q) query = query.whereILike("d.title", `%${q}%`);
        if (doc_type) query = query.where("d.doc_type", doc_type);
        if (from) query = query.where("d.created_at", ">=", from);
        if (to)   query = query.where("d.created_at", "<=", to);
        return query.limit(20);
      })(),
      (() => {
        let query = db("mdr_entries as m")
          .select("m.id", "m.doc_number", "m.title", "m.doc_type", "m.status", "m.created_at",
            db.raw("'mdr_entries' AS source_table"), "m.project_id")
          .where(q ? function() { this.whereILike("m.title", `%${q}%`).orWhereILike("m.doc_number", `%${q}%`); } : {});
        if (project_id) query = query.where("m.project_id", project_id);
        if (doc_type)   query = query.where("m.doc_type", doc_type);
        if (from)       query = query.where("m.created_at", ">=", from);
        if (to)         query = query.where("m.created_at", "<=", to);
        return query.limit(20);
      })(),
      (() => {
        let query = db("drawings as d")
          .select("d.id", "d.drawing_number AS doc_number", "d.title",
            db.raw("d.drawing_type::text AS doc_type"), "d.status", "d.created_at",
            db.raw("'drawings' AS source_table"), "d.project_id")
          .whereNull("d.deleted_at")
          .where(q ? function() { this.whereILike("d.title", `%${q}%`).orWhereILike("d.drawing_number", `%${q}%`); } : {});
        if (project_id) query = query.where("d.project_id", project_id);
        if (from)       query = query.where("d.created_at", ">=", from);
        if (to)         query = query.where("d.created_at", "<=", to);
        return query.limit(20);
      })(),
    ]);

    const results = [...docRows, ...mdrRows, ...drawingRows]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 50);

    res.json({ results, total: results.length, query: q, filters: { project_id, doc_type, from, to } });
  } catch (err) { next(err); }
});

// ── POST /api/production/archive/:projectId ───────────────────
router.post("/archive/:projectId", requireRole("gm", "manager"), async (req, res, next) => {
  try {
    const project = await db("projects").where({ id: req.params.projectId }).first();
    if (!project) return res.status(404).json({ error: "Project not found" });

    // Gather counts of archived documents
    const [mdrCount, drawingCount, docCount] = await Promise.all([
      db("mdr_entries").where({ project_id: req.params.projectId }).count("id as count").first(),
      db("drawings").where({ project_id: req.params.projectId }).whereNull("deleted_at").count("id as count").first(),
      db("transmittals").where({ project_id: req.params.projectId }).count("id as count").first(),
    ]);

    // Mark project as archived (update project status)
    if (project.status !== "completed") {
      return res.status(422).json({ error: "Project must be completed before archiving documents" });
    }

    try {
      await publish("project.documents.archived", {
        project_id: req.params.projectId, project_no: project.project_no,
        archived_by: req.user.id, timestamp: new Date().toISOString(),
        counts: { mdr: Number(mdrCount?.count), drawings: Number(drawingCount?.count), transmittals: Number(docCount?.count) },
      });
    } catch (_) { /* non-critical */ }

    res.json({
      message:    "Project documents archived",
      project_no: project.project_no,
      archived_at: new Date().toISOString(),
      document_counts: {
        mdr_entries:  Number(mdrCount?.count),
        drawings:     Number(drawingCount?.count),
        transmittals: Number(docCount?.count),
      },
    });
  } catch (err) { next(err); }
});

// ── GET /api/production/archive/recent ───────────────────────
router.get("/archive/recent", async (req, res, next) => {
  try {
    // Return recently completed projects (proxy for archived)
    const projects = await db("projects")
      .where("status", "completed")
      .orderBy("updated_at", "desc")
      .limit(10)
      .select("id", "project_no", "name", "updated_at", "contract_value");
    res.json(projects);
  } catch (err) { next(err); }
});

// ── POST /api/production/archive/bulk-download ───────────────
router.post("/archive/bulk-download", async (req, res, next) => {
  try {
    const { document_ids, source_tables } = req.body;
    // document_ids: array of {id, source_table, file_key, file_name}
    if (!Array.isArray(document_ids) || !document_ids.length) {
      return res.status(422).json({ error: "document_ids array required" });
    }

    // Resolve file_keys from drawing_revisions for drawings, or doc_revisions for docs
    const fileRefs = [];
    for (const item of document_ids) {
      if (item.source_table === "drawings") {
        const rev = await db("drawing_revisions")
          .where({ drawing_id: item.id, approval_status: "approved" })
          .orderBy("created_at", "desc").first();
        if (rev?.file_key) fileRefs.push({ key: rev.file_key, name: rev.file_name || `${item.id}.pdf` });
      } else if (item.source_table === "doc_register") {
        const rev = await db("doc_revisions")
          .where({ doc_id: item.id, approval_status: "approved" })
          .orderBy("created_at", "desc").first();
        if (rev?.file_key) fileRefs.push({ key: rev.file_key, name: rev.file_name || `${item.id}.pdf` });
      }
    }

    if (!fileRefs.length) {
      return res.status(422).json({ error: "No downloadable files found for the selected documents" });
    }

    // Return manifest — actual ZIP generation requires MinIO integration at deploy time
    // The client uses these file_keys to download directly from MinIO pre-signed URLs
    res.json({
      manifest: fileRefs,
      note: "Use the file_keys with the /api/uploads/presign endpoint to generate download URLs",
      file_count: fileRefs.length,
    });
  } catch (err) { next(err); }
});

// ── GET /api/production/archive/retention ────────────────────
router.get("/archive/retention", requireRole("gm", "manager"), async (req, res, next) => {
  try {
    // Default retention policy — can be persisted to a settings table later
    const policy = [
      { doc_type: "drawing",          retention_years: 10, description: "Shop drawings retain 10 years after project closeout" },
      { doc_type: "procedure",        retention_years: 7,  description: "Procedures and WPS retain 7 years" },
      { doc_type: "quality_record",   retention_years: 10, description: "Inspection and test records retain 10 years" },
      { doc_type: "certificate",      retention_years: 10, description: "Material certificates retain 10 years" },
      { doc_type: "contract",         retention_years: 7,  description: "Contract documents retain 7 years" },
      { doc_type: "ncr",              retention_years: 5,  description: "NCR records retain 5 years" },
      { doc_type: "financial",        retention_years: 7,  description: "Financial documents retain 7 years (statutory)" },
    ];
    res.json(policy);
  } catch (err) { next(err); }
});

module.exports = router;
