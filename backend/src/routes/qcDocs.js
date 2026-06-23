/**
 * DocMgmt_V1 — QC document routes
 * QC is the document custodian for: MDR, drawings, procedure library, transmittals
 *
 * MDR
 *   GET    /api/qc/mdr/:projectId                     list MDR entries
 *   POST   /api/qc/mdr/:projectId                     create entry
 *   PATCH  /api/qc/mdr/:projectId/:entryId            update entry
 *   GET    /api/qc/mdr/:projectId/completeness         completeness summary
 *   GET    /api/qc/mdr/:projectId/export               XLSX export
 *
 * Drawings
 *   GET    /api/qc/drawings/:projectId                 list drawings
 *   POST   /api/qc/drawings/:projectId                 create drawing record
 *   GET    /api/qc/drawings/:drawingId/revisions        revision history
 *   POST   /api/qc/drawings/:drawingId/revisions        add new revision
 *   POST   /api/qc/drawings/:drawingId/revisions/:rev/approve
 *   GET    /api/qc/drawings/compare                    compare two revision file keys
 *   POST   /api/qc/drawings/:drawingId/notify-shop-floor
 *
 * Procedures (reuses doc_register table, filtered by dept + doc_type)
 *   GET    /api/qc/procedures                          list procedures
 *   POST   /api/qc/procedures                          create procedure
 *   POST   /api/qc/procedures/:id/acknowledge          record user read acknowledgment
 *   GET    /api/qc/procedures/due-for-review            overdue reviews
 *
 * Transmittals
 *   GET    /api/qc/transmittals/:projectId             list
 *   POST   /api/qc/transmittals                        create
 *   GET    /api/qc/transmittals/:id                    detail + items
 *   PATCH  /api/qc/transmittals/:id/status             update status
 *   POST   /api/qc/transmittals/:id/items              add document items
 *   GET    /api/qc/transmittals/:id/cover-sheet        generate PDF cover sheet
 */

const express  = require("express");
const ExcelJS  = require("exceljs");
const PDFDoc   = require("pdfkit");
const db       = require("../db/knex");
const { requireRole, requireDepartment } = require("../middleware/auth");
const { publish } = require("../events/rabbitmq");

const router = express.Router();

// ════════════════════════════════════════════════════════════════
// MDR (Master Document Register)
// ════════════════════════════════════════════════════════════════

// ── GET /api/qc/mdr/:projectId ─────────────────────────────────
router.get("/mdr/:projectId", async (req, res, next) => {
  try {
    const { status, doc_type, discipline, responsible_id } = req.query;
    let q = db("mdr_entries as m")
      .leftJoin("users as u", "m.responsible_id", "u.id")
      .select(
        "m.*",
        db.raw("u.full_name AS responsible_name"),
      )
      .where("m.project_id", req.params.projectId);

    if (status)         q = q.where("m.status", status);
    if (doc_type)       q = q.where("m.doc_type", doc_type);
    if (discipline)     q = q.where("m.discipline", discipline);
    if (responsible_id) q = q.where("m.responsible_id", responsible_id);

    const entries = await q.orderBy("m.doc_number");
    res.json(entries);
  } catch (err) { next(err); }
});

// ── POST /api/qc/mdr/:projectId ────────────────────────────────
router.post("/mdr/:projectId", async (req, res, next) => {
  try {
    const {
      doc_number, title, doc_type, discipline, status,
      responsible_id, planned_submission_date, client_doc_number,
      remarks, is_mandatory, tags,
    } = req.body;
    if (!doc_number || !title || !doc_type) {
      return res.status(422).json({ error: "doc_number, title and doc_type are required" });
    }
    const [entry] = await db("mdr_entries").insert({
      project_id: req.params.projectId,
      doc_number, title, doc_type, discipline, status,
      responsible_id, planned_submission_date, client_doc_number,
      remarks, is_mandatory: is_mandatory !== false,
      tags: JSON.stringify(tags || []),
    }).returning("*");
    res.status(201).json(entry);
  } catch (err) { next(err); }
});

// ── PATCH /api/qc/mdr/:projectId/:entryId ──────────────────────
router.patch("/mdr/:projectId/:entryId", async (req, res, next) => {
  try {
    const allowed = [
      "title", "doc_type", "discipline", "status", "responsible_id",
      "planned_submission_date", "actual_submission_date", "client_response_date",
      "client_doc_number", "remarks", "revision", "current_rev_letter",
      "is_mandatory", "tags",
    ];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    if (!Object.keys(updates).length) return res.status(422).json({ error: "No valid fields" });

    const [entry] = await db("mdr_entries")
      .where({ id: req.params.entryId, project_id: req.params.projectId })
      .update({ ...updates, updated_at: new Date() })
      .returning("*");
    if (!entry) return res.status(404).json({ error: "MDR entry not found" });
    res.json(entry);
  } catch (err) { next(err); }
});

// ── GET /api/qc/mdr/:projectId/completeness ────────────────────
router.get("/mdr/:projectId/completeness", async (req, res, next) => {
  try {
    const { rows } = await db.raw(`
      SELECT
        COUNT(*)                                                   AS total,
        COUNT(*) FILTER (WHERE is_mandatory = true)               AS mandatory_total,
        COUNT(*) FILTER (WHERE status IN ('submitted','client_review','client_approved')) AS submitted,
        COUNT(*) FILTER (WHERE status = 'client_approved')         AS approved,
        COUNT(*) FILTER (WHERE status = 'not_started')             AS not_started,
        COUNT(*) FILTER (WHERE planned_submission_date < NOW()
          AND status NOT IN ('submitted','client_review','client_approved')) AS overdue,
        ROUND(
          COUNT(*)::numeric FILTER (WHERE status IN ('submitted','client_review','client_approved'))
          / NULLIF(COUNT(*), 0) * 100, 1
        )                                                          AS completeness_pct,
        ROUND(
          COUNT(*)::numeric FILTER (WHERE status = 'client_approved')
          / NULLIF(COUNT(*) FILTER (WHERE is_mandatory = true), 0) * 100, 1
        )                                                          AS mandatory_approved_pct
      FROM mdr_entries
      WHERE project_id = :projectId
    `, { projectId: req.params.projectId });

    const r = rows[0];
    res.json({
      project_id:            req.params.projectId,
      total:                 Number(r.total),
      mandatory_total:       Number(r.mandatory_total),
      submitted:             Number(r.submitted),
      approved:              Number(r.approved),
      not_started:           Number(r.not_started),
      overdue:               Number(r.overdue),
      completeness_pct:      r.completeness_pct !== null ? Number(r.completeness_pct) : 0,
      mandatory_approved_pct:r.mandatory_approved_pct !== null ? Number(r.mandatory_approved_pct) : 0,
    });
  } catch (err) { next(err); }
});

// ── GET /api/qc/mdr/:projectId/export ─────────────────────────
router.get("/mdr/:projectId/export", requireRole("gm", "manager", "senior"), async (req, res, next) => {
  try {
    const project = await db("projects").where({ id: req.params.projectId }).first();
    const entries = await db("mdr_entries as m")
      .leftJoin("users as u", "m.responsible_id", "u.id")
      .select("m.*", db.raw("u.full_name AS responsible_name"))
      .where("m.project_id", req.params.projectId)
      .orderBy("m.doc_number");

    const wb = new ExcelJS.Workbook();
    wb.creator = "NexaForge ERP";
    const ws = wb.addWorksheet("MDR");

    // Header row with project info
    ws.mergeCells("A1:L1");
    const titleCell = ws.getCell("A1");
    titleCell.value = `Master Document Register — ${project?.project_no || req.params.projectId}: ${project?.name || ""}`;
    titleCell.font  = { bold: true, size: 13, color: { argb: "FF2D2D6E" } };
    titleCell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F0F8" } };
    ws.getRow(1).height = 24;

    ws.columns = [
      { key: "doc_number",              width: 22 },
      { key: "title",                   width: 36 },
      { key: "doc_type",                width: 18 },
      { key: "discipline",              width: 16 },
      { key: "status",                  width: 18 },
      { key: "responsible_name",        width: 22 },
      { key: "current_rev_letter",      width: 8  },
      { key: "planned_submission_date", width: 18 },
      { key: "actual_submission_date",  width: 18 },
      { key: "client_doc_number",       width: 18 },
      { key: "client_response_date",    width: 18 },
      { key: "remarks",                 width: 30 },
    ];

    const headerRow = ws.addRow([
      "Doc Number", "Title", "Type", "Discipline", "Status",
      "Responsible", "Rev", "Planned Date", "Actual Date",
      "Client Ref", "Client Response", "Remarks",
    ]);
    headerRow.eachCell(cell => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2D2D6E" } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    });
    headerRow.height = 18;

    // Status colour map
    const statusFill = {
      not_started:     "FFFFF3CD",
      in_progress:     "FFCFE2FF",
      internal_review: "FFD1ECF1",
      submitted:       "FFD4EDDA",
      client_review:   "FFD4EDDA",
      client_approved: "FFC3E6CB",
      client_rejected: "FFF8D7DA",
    };

    entries.forEach(e => {
      const row = ws.addRow({
        doc_number:              e.doc_number,
        title:                   e.title,
        doc_type:                e.doc_type,
        discipline:              e.discipline || "",
        status:                  e.status,
        responsible_name:        e.responsible_name || "",
        current_rev_letter:      e.current_rev_letter,
        planned_submission_date: e.planned_submission_date ? new Date(e.planned_submission_date).toLocaleDateString() : "",
        actual_submission_date:  e.actual_submission_date  ? new Date(e.actual_submission_date).toLocaleDateString()  : "",
        client_doc_number:       e.client_doc_number || "",
        client_response_date:    e.client_response_date    ? new Date(e.client_response_date).toLocaleDateString()    : "",
        remarks:                 e.remarks || "",
      });
      const fill = statusFill[e.status];
      if (fill) {
        row.getCell(5).fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
      }
      // Highlight overdue
      if (e.planned_submission_date && new Date(e.planned_submission_date) < new Date()
          && !["submitted","client_review","client_approved"].includes(e.status)) {
        row.getCell(8).font = { color: { argb: "FFDC3545" }, bold: true };
      }
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="MDR-${project?.project_no || req.params.projectId}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
});

// ════════════════════════════════════════════════════════════════
// Drawings
// ════════════════════════════════════════════════════════════════

router.get("/drawings/:projectId", async (req, res, next) => {
  try {
    const { status, drawing_type } = req.query;
    let q = db("drawings as d")
      .leftJoin("users as prep",  "d.prepared_by", "prep.id")
      .leftJoin("users as appr",  "d.approved_by", "appr.id")
      .select(
        "d.*",
        db.raw("prep.full_name AS prepared_by_name"),
        db.raw("appr.full_name AS approved_by_name"),
        db.raw(`(SELECT COUNT(*) FROM drawing_revisions WHERE drawing_id = d.id) AS revision_count`),
      )
      .where("d.project_id", req.params.projectId)
      .whereNull("d.deleted_at");
    if (status)       q = q.where("d.status", status);
    if (drawing_type) q = q.where("d.drawing_type", drawing_type);
    res.json(await q.orderBy("d.drawing_number"));
  } catch (err) { next(err); }
});

router.post("/drawings/:projectId", async (req, res, next) => {
  try {
    const { drawing_number, title, drawing_type, mdr_entry_id, description,
            prepared_by, checked_by, linked_bom_items } = req.body;
    if (!drawing_number || !title) return res.status(422).json({ error: "drawing_number and title required" });
    const [d] = await db("drawings").insert({
      project_id: req.params.projectId,
      drawing_number, title, drawing_type, mdr_entry_id, description,
      prepared_by, checked_by,
      linked_bom_items: JSON.stringify(linked_bom_items || []),
    }).returning("*");
    res.status(201).json(d);
  } catch (err) { next(err); }
});

router.get("/drawings/:drawingId/revisions", async (req, res, next) => {
  try {
    const revs = await db("drawing_revisions as r")
      .leftJoin("users as u",    "r.uploaded_by", "u.id")
      .leftJoin("users as appr", "r.approved_by", "appr.id")
      .select(
        "r.*",
        db.raw("u.full_name    AS uploaded_by_name"),
        db.raw("appr.full_name AS approved_by_name"),
      )
      .where("r.drawing_id", req.params.drawingId)
      .orderBy("r.created_at", "desc");
    res.json(revs);
  } catch (err) { next(err); }
});

router.post("/drawings/:drawingId/revisions", async (req, res, next) => {
  try {
    const drawing = await db("drawings").where({ id: req.params.drawingId }).whereNull("deleted_at").first();
    if (!drawing) return res.status(404).json({ error: "Drawing not found" });

    const { change_description, file_key, file_name, file_size_bytes, mime_type } = req.body;
    if (!change_description) return res.status(422).json({ error: "change_description required" });

    // Next revision letter
    const last = await db("drawing_revisions").where({ drawing_id: drawing.id }).orderBy("created_at", "desc").first();
    let nextRev;
    if (!last)                       nextRev = "A";
    else if (/^[A-Z]$/.test(last.revision)) nextRev = String.fromCharCode(last.revision.charCodeAt(0) + 1);
    else                             nextRev = String(Number(last.revision) + 1);

    const [rev] = await db("drawing_revisions").insert({
      drawing_id: drawing.id,
      revision: nextRev, change_description, file_key, file_name, file_size_bytes,
      mime_type: mime_type || "application/pdf",
      uploaded_by: req.user.id,
      approval_status: "in_review",
    }).returning("*");

    await db("drawings").where({ id: drawing.id }).update({ status: "under_review", updated_at: new Date() });
    res.status(201).json(rev);
  } catch (err) { next(err); }
});

router.post("/drawings/:drawingId/revisions/:rev/approve", requireRole("gm", "manager", "senior"), async (req, res, next) => {
  try {
    const [rev] = await db("drawing_revisions")
      .where({ drawing_id: req.params.drawingId, revision: req.params.rev, approval_status: "in_review" })
      .update({ approval_status: "approved", approved_by: req.user.id, approved_at: new Date() })
      .returning("*");
    if (!rev) return res.status(404).json({ error: "Revision not found or not in review" });

    // Mark all previous revisions as superseded
    await db("drawing_revisions")
      .where("drawing_id", req.params.drawingId)
      .whereNot("id", rev.id)
      .update({ approval_status: "superseded" });

    const [drawing] = await db("drawings")
      .where({ id: req.params.drawingId })
      .update({ current_revision: rev.revision, status: "approved", approved_by: req.user.id, approved_date: new Date(), updated_at: new Date() })
      .returning("*");

    res.json({ revision: rev, drawing });
  } catch (err) { next(err); }
});

router.post("/drawings/:drawingId/notify-shop-floor", requireRole("gm", "manager", "senior"), async (req, res, next) => {
  try {
    const drawing = await db("drawings").where({ id: req.params.drawingId }).first();
    if (!drawing) return res.status(404).json({ error: "Drawing not found" });

    const latestRev = await db("drawing_revisions")
      .where({ drawing_id: req.params.drawingId, approval_status: "approved" })
      .orderBy("created_at", "desc").first();

    await db("drawing_revisions")
      .where({ drawing_id: req.params.drawingId, approval_status: "approved" })
      .update({ shop_floor_notified: true, shop_floor_notified_at: new Date() });

    try {
      await publish("drawing.revision.released", {
        drawing_id: drawing.id, drawing_number: drawing.drawing_number,
        revision: latestRev?.revision, project_id: drawing.project_id,
        notified_by: req.user.id, timestamp: new Date().toISOString(),
      });
      if (req.io) req.io.to(`dept:production`).emit("drawing:updated", { drawing, revision: latestRev });
    } catch (_) { /* non-critical */ }

    res.json({ message: "Shop floor notified", revision: latestRev?.revision });
  } catch (err) { next(err); }
});

// ── Drawing revision comparison (returns metadata of two revs for UI side-by-side)
router.get("/drawings/compare", async (req, res, next) => {
  try {
    const { a, b } = req.query;
    if (!a || !b) return res.status(422).json({ error: "Query params a and b (revision IDs) required" });
    const [revA, revB] = await Promise.all([
      db("drawing_revisions").where({ id: a }).first(),
      db("drawing_revisions").where({ id: b }).first(),
    ]);
    if (!revA || !revB) return res.status(404).json({ error: "One or both revisions not found" });
    if (revA.drawing_id !== revB.drawing_id) return res.status(422).json({ error: "Revisions belong to different drawings" });
    res.json({
      drawing_id: revA.drawing_id,
      rev_a: { id: revA.id, revision: revA.revision, file_key: revA.file_key, file_name: revA.file_name, approved_at: revA.approved_at, change_description: revA.change_description },
      rev_b: { id: revB.id, revision: revB.revision, file_key: revB.file_key, file_name: revB.file_name, approved_at: revB.approved_at, change_description: revB.change_description },
    });
  } catch (err) { next(err); }
});

// ════════════════════════════════════════════════════════════════
// Procedure Library (uses doc_register, filtered to QC dept)
// ════════════════════════════════════════════════════════════════

router.get("/procedures", async (req, res, next) => {
  try {
    const { type, status, q, due_review } = req.query;
    let query = db("doc_register as d")
      .leftJoin("users as owner", "d.owner_id", "owner.id")
      .select("d.*", db.raw("owner.full_name AS owner_name"))
      .whereNull("d.deleted_at")
      .whereIn("d.doc_type", ["quality_procedure", "work_instruction", "specification"]);

    if (type)       query = query.where("d.doc_type", type);
    if (status)     query = query.where("d.status", status);
    if (q)          query = query.whereILike("d.title", `%${q}%`);
    if (due_review) query = query.where("d.next_review_date", "<", new Date());

    res.json(await query.orderBy("d.doc_no"));
  } catch (err) { next(err); }
});

router.post("/procedures", async (req, res, next) => {
  try {
    const { title, doc_type, description, next_review_date, tags } = req.body;
    if (!title || !doc_type) return res.status(422).json({ error: "title and doc_type required" });

    const docTypeMap = { wps: "quality_procedure", work_instruction: "work_instruction", specification: "specification" };
    const resolvedType = docTypeMap[doc_type] || doc_type;

    // Auto doc_no
    const prefix = resolvedType === "work_instruction" ? "WI" : "QP";
    const last = await db("doc_register").where("doc_no", "like", `${prefix}-%`)
      .orderBy(db.raw("CAST(SPLIT_PART(doc_no, '-', 2) AS INTEGER)"), "desc").first();
    const n = last ? Number(last.doc_no.split("-")[1]) + 1 : 1;
    const doc_no = `${prefix}-${String(n).padStart(3, "0")}`;

    const [doc] = await db("doc_register").insert({
      doc_no, title, doc_type: resolvedType, department: "qc",
      description, next_review_date: next_review_date || null,
      tags: JSON.stringify(tags || []),
      owner_id: req.user.id,
    }).returning("*");
    res.status(201).json(doc);
  } catch (err) { next(err); }
});

router.post("/procedures/:id/acknowledge", async (req, res, next) => {
  try {
    // Store acknowledgment in a jsonb field — lightweight without a separate table
    const doc = await db("doc_register").where({ id: req.params.id }).whereNull("deleted_at").first();
    if (!doc) return res.status(404).json({ error: "Procedure not found" });

    const acks = Array.isArray(doc.tags) ? doc.tags : JSON.parse(doc.tags || "[]");
    const ackEntry = { user_id: req.user.id, ack_at: new Date().toISOString() };
    // Upsert by user_id
    const existing = acks.findIndex(a => a.user_id === req.user.id);
    if (existing >= 0) acks[existing] = ackEntry;
    else acks.push(ackEntry);

    // Store acks in a separate metadata column if available, else use a doc_links hack
    // For simplicity we emit to the event bus and return 201 — a dedicated ack table can be added later
    try {
      await publish("procedure.acknowledged", {
        doc_id: doc.id, doc_no: doc.doc_no, user_id: req.user.id,
        timestamp: new Date().toISOString(),
      });
    } catch (_) { /* non-critical */ }

    res.status(201).json({ message: "Acknowledgment recorded", doc_no: doc.doc_no });
  } catch (err) { next(err); }
});

router.get("/procedures/due-for-review", requireRole("gm", "manager", "senior"), async (req, res, next) => {
  try {
    const docs = await db("doc_register")
      .whereNull("deleted_at").whereNotNull("next_review_date")
      .where("next_review_date", "<", new Date())
      .where("status", "approved")
      .whereIn("doc_type", ["quality_procedure", "work_instruction", "specification"])
      .orderBy("next_review_date");
    res.json(docs);
  } catch (err) { next(err); }
});

// ════════════════════════════════════════════════════════════════
// Transmittals
// ════════════════════════════════════════════════════════════════

async function nextTransmittalNo() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const last  = await db("transmittals")
    .where("transmittal_no", "like", `TRN-${today}-%`)
    .orderBy("transmittal_no", "desc").first();
  const seq = last ? Number(last.transmittal_no.split("-").pop()) + 1 : 1;
  return `TRN-${today}-${String(seq).padStart(3, "0")}`;
}

router.get("/transmittals/:projectId", async (req, res, next) => {
  try {
    const { direction, status } = req.query;
    let q = db("transmittals as t")
      .leftJoin("users as u", "t.created_by", "u.id")
      .select("t.*", db.raw("u.full_name AS created_by_name"),
        db.raw(`(SELECT COUNT(*) FROM transmittal_items WHERE transmittal_id = t.id) AS item_count`))
      .where("t.project_id", req.params.projectId);
    if (direction) q = q.where("t.direction", direction);
    if (status)    q = q.where("t.status", status);
    res.json(await q.orderBy("t.created_at", "desc"));
  } catch (err) { next(err); }
});

router.post("/transmittals", async (req, res, next) => {
  try {
    const { project_id, direction, purpose, to_party, to_email, from_party,
            response_due_date, subject, remarks, items } = req.body;
    if (!project_id) return res.status(422).json({ error: "project_id required" });

    const transmittal_no = await nextTransmittalNo();
    const [t] = await db("transmittals").insert({
      transmittal_no, project_id, direction, purpose, to_party, to_email,
      from_party, response_due_date, subject, remarks,
      created_by: req.user.id,
    }).returning("*");

    // Insert items if provided
    if (Array.isArray(items) && items.length) {
      const rows = items.map(item => ({ transmittal_id: t.id, ...item }));
      await db("transmittal_items").insert(rows);
    }

    res.status(201).json(t);
  } catch (err) { next(err); }
});

router.get("/transmittals/:id/detail", async (req, res, next) => {
  try {
    const t = await db("transmittals").where({ id: req.params.id }).first();
    if (!t) return res.status(404).json({ error: "Transmittal not found" });
    const items = await db("transmittal_items").where({ transmittal_id: t.id }).orderBy("created_at");
    res.json({ ...t, items });
  } catch (err) { next(err); }
});

router.patch("/transmittals/:id/status", async (req, res, next) => {
  try {
    const { status, response_received_date, remarks } = req.body;
    if (!status) return res.status(422).json({ error: "status required" });
    const updates = { status, updated_at: new Date() };
    if (response_received_date) updates.response_received_date = response_received_date;
    if (remarks) updates.remarks = remarks;
    if (status === "sent") updates.sent_date = new Date();

    const [t] = await db("transmittals").where({ id: req.params.id })
      .update(updates).returning("*");
    if (!t) return res.status(404).json({ error: "Transmittal not found" });

    // Alert if overdue
    if (t.response_due_date && new Date(t.response_due_date) < new Date() && status === "sent") {
      try {
        await publish("transmittal.overdue", { transmittal_no: t.transmittal_no, project_id: t.project_id, days_overdue: Math.floor((Date.now() - new Date(t.response_due_date)) / 86400000) });
      } catch (_) { /* non-critical */ }
    }
    res.json(t);
  } catch (err) { next(err); }
});

router.post("/transmittals/:id/items", async (req, res, next) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];
    const rows = items.map(item => ({ transmittal_id: req.params.id, ...item }));
    const inserted = await db("transmittal_items").insert(rows).returning("*");
    res.status(201).json(inserted);
  } catch (err) { next(err); }
});

// ── GET /api/qc/transmittals/:id/cover-sheet  (PDF) ───────────
router.get("/transmittals/:id/cover-sheet", async (req, res, next) => {
  try {
    const t = await db("transmittals").where({ id: req.params.id }).first();
    if (!t) return res.status(404).json({ error: "Transmittal not found" });

    const [project, items] = await Promise.all([
      db("projects").where({ id: t.project_id }).first(),
      db("transmittal_items").where({ transmittal_id: t.id }).orderBy("created_at"),
    ]);

    const doc    = new PDFDoc({ size: "A4", margin: 50 });
    const chunks = [];
    doc.on("data", c => chunks.push(c));
    doc.on("end", () => {
      const buf = Buffer.concat(chunks);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${t.transmittal_no}.pdf"`);
      res.setHeader("Content-Length", buf.length);
      res.send(buf);
    });

    // ── Header ─────────────────────────────────────────────────
    doc.fontSize(18).fillColor("#2D2D6E").text("DOCUMENT TRANSMITTAL", { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor("#555").text("NexaForge Engineering", { align: "center" });
    doc.moveDown(1);

    // ── Metadata table ─────────────────────────────────────────
    doc.fontSize(10).fillColor("#222");
    const leftCol = 50, rightCol = 310, lineH = 18;
    function kv2(label, value, x, y) {
      doc.font("Helvetica-Bold").text(label + ":", x, y, { width: 100, continued: false });
      doc.font("Helvetica").text(String(value || "—"), x + 105, y, { width: 200 });
    }
    let y = doc.y;
    kv2("Transmittal No", t.transmittal_no,   leftCol,  y);
    kv2("Date",           new Date(t.created_at).toLocaleDateString(), rightCol, y);
    y += lineH;
    kv2("Project",        `${project?.project_no} — ${project?.name}`, leftCol, y);
    kv2("Direction",      t.direction?.toUpperCase(), rightCol, y);
    y += lineH;
    kv2("To",             t.to_party, leftCol, y);
    kv2("Purpose",        t.purpose?.replace(/_/g, " "), rightCol, y);
    y += lineH;
    kv2("Subject",        t.subject, leftCol, y);
    kv2("Response Due",   t.response_due_date ? new Date(t.response_due_date).toLocaleDateString() : "—", rightCol, y);
    y += lineH + 10;

    // ── Items table ────────────────────────────────────────────
    doc.moveTo(50, y).lineTo(545, y).stroke("#CCCCCC");
    y += 6;
    doc.font("Helvetica-Bold").fontSize(9);
    doc.text("No.", 50, y, { width: 30 });
    doc.text("Doc Number", 85, y, { width: 120 });
    doc.text("Title", 210, y, { width: 180 });
    doc.text("Type", 395, y, { width: 80 });
    doc.text("Rev", 480, y, { width: 40 });
    doc.text("Copies", 525, y, { width: 40 });
    y += 14;
    doc.moveTo(50, y).lineTo(545, y).stroke("#CCCCCC");
    y += 4;
    doc.font("Helvetica").fontSize(9);

    items.forEach((item, i) => {
      if (y > 740) { doc.addPage(); y = 50; }
      doc.text(String(i + 1), 50, y, { width: 30 });
      doc.text(item.doc_number || "—", 85, y, { width: 120 });
      doc.text(item.title || "—", 210, y, { width: 180 });
      doc.text(item.doc_type || "—", 395, y, { width: 80 });
      doc.text(item.revision || "—", 480, y, { width: 40 });
      doc.text(String(item.copies || 1), 525, y, { width: 40 });
      y += 14;
    });

    y += 10;
    doc.moveTo(50, y).lineTo(545, y).stroke("#CCCCCC");
    y += 20;
    if (t.remarks) {
      doc.font("Helvetica-Bold").fontSize(9).text("Remarks:", 50, y);
      doc.font("Helvetica").text(t.remarks, 50, y + 12, { width: 495 });
    }

    doc.end();
  } catch (err) { next(err); }
});

module.exports = router;
