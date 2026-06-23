/**
 * S-17B — Document Control (ISO 9001)
 *
 * GET    /api/docs                       list register (filter: dept, type, status)
 * POST   /api/docs                       create document
 * GET    /api/docs/:id                   full detail + revisions
 * PATCH  /api/docs/:id                   update metadata
 * DELETE /api/docs/:id                   soft-delete (GM / manager only)
 *
 * POST   /api/docs/:id/revisions         add new revision (moves to in_review)
 * POST   /api/docs/:id/revisions/:rev/approve    approve revision → updates current_rev + status=approved
 * POST   /api/docs/:id/revisions/:rev/reject     reject revision
 *
 * GET    /api/docs/:id/links             entity links for this document
 * POST   /api/docs/:id/links             add entity link
 * DELETE /api/docs/:id/links/:linkId     remove link
 *
 * GET    /api/docs/overdue-review        docs past next_review_date (GM / QC)
 * GET    /api/docs/entity/:type/:entityId  all docs linked to a given entity
 */

const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");
const { publish, TOPICS } = require("../events/rabbitmq");

const router = express.Router();

// ── counter helper ────────────────────────────────────────────
async function nextDocNo(type) {
  const prefix = {
    quality_procedure: "QP",
    work_instruction:  "WI",
    form:              "FM",
    drawing:           "DWG",
    specification:     "SP",
    standard:          "STD",
    external_doc:      "EXT",
    record:            "REC",
  }[type] || "DOC";

  const last = await db("doc_register")
    .where("doc_no", "like", `${prefix}-%`)
    .orderBy(db.raw("CAST(SPLIT_PART(doc_no, '-', 2) AS INTEGER)"), "desc")
    .first();

  const n = last ? Number(last.doc_no.split("-")[1]) + 1 : 1;
  return `${prefix}-${String(n).padStart(3, "0")}`;
}

// ── GET /api/docs ─────────────────────────────────────────────
router.get("/", async (req, res, next) => {
  try {
    const { dept, type, status, q, overdue_review } = req.query;
    let query = db("doc_register as d")
      .leftJoin("users as owner", "d.owner_id", "owner.id")
      .leftJoin("users as approver", "d.approved_by", "approver.id")
      .select(
        "d.id", "d.doc_no", "d.title", "d.doc_type", "d.department",
        "d.current_rev", "d.status", "d.next_review_date", "d.approved_date",
        "d.tags", "d.created_at",
        db.raw("owner.full_name AS owner_name"),
        db.raw("approver.full_name AS approver_name"),
      )
      .whereNull("d.deleted_at");

    if (dept)            query = query.where("d.department", dept);
    if (type)            query = query.where("d.doc_type", type);
    if (status)          query = query.where("d.status", status);
    if (q)               query = query.whereILike("d.title", `%${q}%`);
    if (overdue_review)  query = query.where("d.next_review_date", "<", new Date());

    const docs = await query.orderBy("d.doc_no");
    res.json(docs);
  } catch (err) { next(err); }
});

// ── GET /api/docs/overdue-review ──────────────────────────────
router.get("/overdue-review", requireRole("gm", "manager", "senior"), async (req, res, next) => {
  try {
    const docs = await db("doc_register")
      .whereNull("deleted_at")
      .whereNotNull("next_review_date")
      .where("next_review_date", "<", new Date())
      .whereIn("status", ["approved"])
      .orderBy("next_review_date");
    res.json(docs);
  } catch (err) { next(err); }
});

// ── GET /api/docs/entity/:type/:entityId ──────────────────────
router.get("/entity/:type/:entityId", async (req, res, next) => {
  try {
    const docs = await db("doc_links as dl")
      .join("doc_register as d", "dl.doc_id", "d.id")
      .select("d.*", "dl.is_mandatory", "dl.id as link_id")
      .where("dl.entity_type", req.params.type)
      .where("dl.entity_id", req.params.entityId)
      .whereNull("d.deleted_at");
    res.json(docs);
  } catch (err) { next(err); }
});

// ── POST /api/docs ────────────────────────────────────────────
router.post("/", async (req, res, next) => {
  try {
    const { title, doc_type, department, description, next_review_date, tags } = req.body;
    if (!title || !doc_type || !department) {
      return res.status(422).json({ error: "title, doc_type and department are required" });
    }
    const doc_no = await nextDocNo(doc_type);
    const [doc] = await db("doc_register").insert({
      doc_no, title, doc_type, department, description,
      next_review_date: next_review_date || null,
      tags: JSON.stringify(tags || []),
      owner_id: req.user.id,
    }).returning("*");
    res.status(201).json(doc);
  } catch (err) { next(err); }
});

// ── GET /api/docs/:id ─────────────────────────────────────────
router.get("/:id", async (req, res, next) => {
  try {
    const doc = await db("doc_register as d")
      .leftJoin("users as owner",    "d.owner_id",    "owner.id")
      .leftJoin("users as approver", "d.approved_by", "approver.id")
      .select(
        "d.*",
        db.raw("owner.full_name AS owner_name"),
        db.raw("approver.full_name AS approver_name"),
      )
      .where("d.id", req.params.id)
      .whereNull("d.deleted_at")
      .first();

    if (!doc) return res.status(404).json({ error: "Document not found" });

    const revisions = await db("doc_revisions as r")
      .leftJoin("users as prep",  "r.prepared_by", "prep.id")
      .leftJoin("users as rev",   "r.reviewed_by", "rev.id")
      .leftJoin("users as appr",  "r.approved_by", "appr.id")
      .select(
        "r.*",
        db.raw("prep.full_name AS prepared_by_name"),
        db.raw("rev.full_name  AS reviewed_by_name"),
        db.raw("appr.full_name AS approved_by_name"),
      )
      .where("r.doc_id", req.params.id)
      .orderBy("r.created_at", "desc");

    res.json({ ...doc, revisions });
  } catch (err) { next(err); }
});

// ── PATCH /api/docs/:id ───────────────────────────────────────
router.patch("/:id", async (req, res, next) => {
  try {
    const allowed = ["title", "department", "description", "next_review_date", "tags", "owner_id"];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    if (!Object.keys(updates).length) return res.status(422).json({ error: "No valid fields to update" });

    const [doc] = await db("doc_register")
      .where({ id: req.params.id })
      .whereNull("deleted_at")
      .update({ ...updates, updated_at: new Date() })
      .returning("*");

    if (!doc) return res.status(404).json({ error: "Document not found" });
    res.json(doc);
  } catch (err) { next(err); }
});

// ── DELETE /api/docs/:id ──────────────────────────────────────
router.delete("/:id", requireRole("gm", "manager"), async (req, res, next) => {
  try {
    const [doc] = await db("doc_register")
      .where({ id: req.params.id })
      .whereNull("deleted_at")
      .update({ deleted_at: new Date(), status: "obsolete" })
      .returning("id");
    if (!doc) return res.status(404).json({ error: "Document not found" });
    res.json({ message: "Document archived" });
  } catch (err) { next(err); }
});

// ── POST /api/docs/:id/revisions ─────────────────────────────
router.post("/:id/revisions", async (req, res, next) => {
  try {
    const doc = await db("doc_register").where({ id: req.params.id }).whereNull("deleted_at").first();
    if (!doc) return res.status(404).json({ error: "Document not found" });
    if (doc.status === "obsolete") return res.status(422).json({ error: "Cannot revise an obsolete document" });

    const { change_description, content, file_key, file_name, file_size_bytes } = req.body;
    if (!change_description) return res.status(422).json({ error: "change_description is required" });

    // Next revision letter: A → B → C or numeric increment
    const last = await db("doc_revisions").where({ doc_id: doc.id }).orderBy("created_at", "desc").first();
    let nextRev;
    if (!last) {
      nextRev = "A";
    } else if (/^[A-Z]$/.test(last.rev)) {
      nextRev = String.fromCharCode(last.rev.charCodeAt(0) + 1);
    } else {
      nextRev = String(Number(last.rev) + 1);
    }

    const [revision] = await db("doc_revisions").insert({
      doc_id: doc.id,
      rev:    nextRev,
      change_description, content, file_key, file_name, file_size_bytes,
      prepared_by: req.user.id,
      prepared_at: new Date(),
      approval_status: "in_review",
    }).returning("*");

    // Move document to under_review
    await db("doc_register").where({ id: doc.id }).update({ status: "under_review", updated_at: new Date() });

    res.status(201).json(revision);
  } catch (err) { next(err); }
});

// ── POST /api/docs/:id/revisions/:rev/approve ────────────────
router.post("/:id/revisions/:rev/approve", requireRole("gm", "manager"), async (req, res, next) => {
  try {
    const [revision] = await db("doc_revisions")
      .where({ doc_id: req.params.id, rev: req.params.rev, approval_status: "in_review" })
      .update({
        approval_status: "approved",
        approved_by:     req.user.id,
        approved_at:     new Date(),
      })
      .returning("*");

    if (!revision) return res.status(404).json({ error: "Revision not found or not pending approval" });

    const [doc] = await db("doc_register")
      .where({ id: req.params.id })
      .update({
        current_rev:   revision.rev,
        status:        "approved",
        approved_by:   req.user.id,
        approved_date: new Date(),
        updated_at:    new Date(),
      })
      .returning("*");

    try {
      await publish(TOPICS.DOCUMENT_APPROVED || "document.approved", {
        doc_id: doc.id, doc_no: doc.doc_no, rev: revision.rev,
        approved_by: req.user.id, timestamp: new Date().toISOString(),
      });
    } catch (_) { /* non-critical */ }

    res.json({ revision, doc });
  } catch (err) { next(err); }
});

// ── POST /api/docs/:id/revisions/:rev/reject ─────────────────
router.post("/:id/revisions/:rev/reject", requireRole("gm", "manager"), async (req, res, next) => {
  try {
    const { reason } = req.body;
    const [revision] = await db("doc_revisions")
      .where({ doc_id: req.params.id, rev: req.params.rev, approval_status: "in_review" })
      .update({
        approval_status:  "rejected",
        rejection_reason: reason || null,
        updated_at:       new Date(),
      })
      .returning("*");

    if (!revision) return res.status(404).json({ error: "Revision not found or not in review" });

    // Revert doc status to draft if no other approved revisions
    const approvedRev = await db("doc_revisions")
      .where({ doc_id: req.params.id, approval_status: "approved" })
      .first();
    if (!approvedRev) {
      await db("doc_register").where({ id: req.params.id }).update({ status: "draft", updated_at: new Date() });
    }

    res.json(revision);
  } catch (err) { next(err); }
});

// ── GET /api/docs/:id/links ───────────────────────────────────
router.get("/:id/links", async (req, res, next) => {
  try {
    const links = await db("doc_links").where({ doc_id: req.params.id }).orderBy("entity_type");
    res.json(links);
  } catch (err) { next(err); }
});

// ── POST /api/docs/:id/links ──────────────────────────────────
router.post("/:id/links", async (req, res, next) => {
  try {
    const { entity_type, entity_id, is_mandatory } = req.body;
    if (!entity_type || !entity_id) return res.status(422).json({ error: "entity_type and entity_id required" });
    const [link] = await db("doc_links").insert({
      doc_id: req.params.id, entity_type, entity_id,
      is_mandatory: !!is_mandatory, linked_by: req.user.id,
    }).onConflict(["doc_id", "entity_type", "entity_id"]).ignore().returning("*");
    if (!link) return res.status(409).json({ error: "Link already exists" });
    res.status(201).json(link);
  } catch (err) { next(err); }
});

// ── DELETE /api/docs/:id/links/:linkId ────────────────────────
router.delete("/:id/links/:linkId", async (req, res, next) => {
  try {
    const deleted = await db("doc_links")
      .where({ id: req.params.linkId, doc_id: req.params.id })
      .delete();
    if (!deleted) return res.status(404).json({ error: "Link not found" });
    res.json({ message: "Link removed" });
  } catch (err) { next(err); }
});

module.exports = router;
