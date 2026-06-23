/**
 * S-17C — Supplier Portal
 *
 * Supplier contacts (internal procurement use)
 * GET    /api/suppliers                          list
 * POST   /api/suppliers                          create
 * GET    /api/suppliers/:id                      detail + scorecards
 * PATCH  /api/suppliers/:id                      update
 *
 * RFQ management
 * GET    /api/suppliers/rfq                      list RFQs
 * POST   /api/suppliers/rfq                      create RFQ
 * GET    /api/suppliers/rfq/:id                  full detail + responses
 * POST   /api/suppliers/rfq/:id/send             send to selected suppliers
 * POST   /api/suppliers/rfq/:id/award/:supplierId award to supplier
 *
 * RFQ responses (submitted by supplier — portal token auth)
 * POST   /api/suppliers/rfq/:id/respond          submit response (portal token)
 *
 * PO Acknowledgement
 * GET    /api/suppliers/po-acks                  list
 * POST   /api/suppliers/po-acks                  create ACK for a PO
 * PATCH  /api/suppliers/po-acks/:id              supplier updates ACK
 *
 * Delivery tracking
 * GET    /api/suppliers/deliveries               list
 * POST   /api/suppliers/deliveries               add delivery update
 * PATCH  /api/suppliers/deliveries/:id           update status
 *
 * Scorecards
 * GET    /api/suppliers/:id/scorecards           all scorecards for supplier
 * POST   /api/suppliers/:id/scorecards           add/update quarterly scorecard
 */

const express = require("express");
const crypto  = require("crypto");
const db      = require("../db/knex");
const { requireRole, requireDepartment } = require("../middleware/auth");
const { publish } = require("../events/rabbitmq");

const router = express.Router();

// ── Supplier contacts ─────────────────────────────────────────
router.get("/", async (req, res, next) => {
  try {
    const { status, category, q } = req.query;
    let query = db("supplier_contacts as s")
      .select(
        "s.id", "s.company_name", "s.contact_name", "s.email",
        "s.phone", "s.country", "s.status", "s.category", "s.rating",
        "s.last_portal_access", "s.created_at",
        db.raw(`(
          SELECT AVG(sc.overall_score)
          FROM supplier_scorecards sc WHERE sc.supplier_id = s.id
        ) AS avg_scorecard`)
      )
      .where("s.status", "!=", "blacklisted");

    if (status)   query = query.where("s.status", status);
    if (category) query = query.where("s.category", category);
    if (q)        query = query.whereILike("s.company_name", `%${q}%`);

    res.json(await query.orderBy("s.company_name"));
  } catch (err) { next(err); }
});

router.post("/", requireDepartment("procurement"), async (req, res, next) => {
  try {
    const { company_name, contact_name, email, phone, country, category, notes } = req.body;
    if (!company_name || !email) return res.status(422).json({ error: "company_name and email are required" });
    const [s] = await db("supplier_contacts").insert({
      company_name, contact_name, email, phone, country, category, notes,
    }).returning("*");
    res.status(201).json(s);
  } catch (err) { next(err); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const supplier = await db("supplier_contacts").where({ id: req.params.id }).first();
    if (!supplier) return res.status(404).json({ error: "Supplier not found" });

    const [scorecards, poHistory] = await Promise.all([
      db("supplier_scorecards").where({ supplier_id: req.params.id }).orderBy("year", "desc").orderBy("quarter", "desc"),
      db("purchase_orders").where("vendor_name", supplier.company_name).orderBy("created_at", "desc").limit(10),
    ]);

    const { portal_token_hash, ...safeSupplier } = supplier;
    res.json({ ...safeSupplier, scorecards, po_history: poHistory });
  } catch (err) { next(err); }
});

router.patch("/:id", requireDepartment("procurement"), async (req, res, next) => {
  try {
    const allowed = ["company_name", "contact_name", "phone", "country", "status", "category", "rating", "notes"];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    if (!Object.keys(updates).length) return res.status(422).json({ error: "No valid fields" });
    const [s] = await db("supplier_contacts").where({ id: req.params.id })
      .update({ ...updates, updated_at: new Date() }).returning("*");
    if (!s) return res.status(404).json({ error: "Supplier not found" });
    res.json(s);
  } catch (err) { next(err); }
});

// ── Portal token (generates a short-lived token for supplier self-service) ───
router.post("/:id/portal-token", requireDepartment("procurement"), async (req, res, next) => {
  try {
    const token   = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const hash    = crypto.createHash("sha256").update(token).digest("hex");
    await db("supplier_contacts").where({ id: req.params.id }).update({
      portal_token_hash: hash,
      portal_token_expires_at: expires,
    });
    res.json({ token, expires_at: expires });
  } catch (err) { next(err); }
});

// ── RFQ ──────────────────────────────────────────────────────
async function nextRfqNo() {
  const last = await db("supplier_rfq").orderBy(db.raw("CAST(SPLIT_PART(rfq_no, '-', 2) AS INTEGER)"), "desc").first();
  const n = last ? Number(last.rfq_no.split("-")[1]) + 1 : 1;
  return `RFQ-${String(n).padStart(4, "0")}`;
}

router.get("/rfq", async (req, res, next) => {
  try {
    const { status, project_id } = req.query;
    let q = db("supplier_rfq as r")
      .leftJoin("projects as p", "r.project_id", "p.id")
      .leftJoin("users as u",   "r.created_by",  "u.id")
      .select(
        "r.*",
        db.raw("p.project_no"),
        db.raw("p.name AS project_name"),
        db.raw("u.full_name AS created_by_name"),
        db.raw(`(SELECT COUNT(*) FROM supplier_rfq_responses WHERE rfq_id = r.id) AS response_count`)
      );
    if (status)     q = q.where("r.status", status);
    if (project_id) q = q.where("r.project_id", project_id);
    res.json(await q.orderBy("r.created_at", "desc"));
  } catch (err) { next(err); }
});

router.post("/rfq", requireDepartment("procurement"), async (req, res, next) => {
  try {
    const { project_id, material_request_id, title, description, line_items, response_due_date } = req.body;
    if (!title || !response_due_date) return res.status(422).json({ error: "title and response_due_date required" });
    const rfq_no = await nextRfqNo();
    const [rfq] = await db("supplier_rfq").insert({
      rfq_no, project_id, material_request_id, title, description,
      line_items: JSON.stringify(line_items || []),
      response_due_date, created_by: req.user.id,
    }).returning("*");
    res.status(201).json(rfq);
  } catch (err) { next(err); }
});

router.get("/rfq/:id", async (req, res, next) => {
  try {
    const rfq = await db("supplier_rfq").where({ id: req.params.id }).first();
    if (!rfq) return res.status(404).json({ error: "RFQ not found" });

    const [invitations, responses] = await Promise.all([
      db("supplier_rfq_invitations as i")
        .join("supplier_contacts as s", "i.supplier_id", "s.id")
        .select("i.*", "s.company_name", "s.email")
        .where("i.rfq_id", req.params.id),
      db("supplier_rfq_responses as r")
        .join("supplier_contacts as s", "r.supplier_id", "s.id")
        .select("r.*", "s.company_name")
        .where("r.rfq_id", req.params.id)
        .orderBy("r.total_amount"),
    ]);

    res.json({ ...rfq, invitations, responses });
  } catch (err) { next(err); }
});

router.post("/rfq/:id/send", requireDepartment("procurement"), async (req, res, next) => {
  try {
    const { supplier_ids } = req.body;
    if (!Array.isArray(supplier_ids) || !supplier_ids.length) {
      return res.status(422).json({ error: "supplier_ids array required" });
    }

    const rfq = await db("supplier_rfq").where({ id: req.params.id }).first();
    if (!rfq) return res.status(404).json({ error: "RFQ not found" });

    const now = new Date();
    const rows = supplier_ids.map(sid => ({ rfq_id: req.params.id, supplier_id: sid, sent_at: now }));
    await db("supplier_rfq_invitations").insert(rows).onConflict(["rfq_id", "supplier_id"]).merge({ sent_at: now });

    await db("supplier_rfq").where({ id: req.params.id }).update({ status: "sent", updated_at: now });

    try {
      await publish("rfq.sent", { rfq_no: rfq.rfq_no, rfq_id: rfq.id, supplier_count: supplier_ids.length });
    } catch (_) { /* non-critical */ }

    res.json({ message: "RFQ sent", supplier_count: supplier_ids.length });
  } catch (err) { next(err); }
});

router.post("/rfq/:id/respond", async (req, res, next) => {
  // Portal token auth — supplier submits their response
  try {
    const { portal_token, supplier_id, total_amount, currency, lead_time_days,
            valid_until, line_items, notes, file_key } = req.body;

    if (!portal_token || !supplier_id) {
      return res.status(401).json({ error: "portal_token and supplier_id required" });
    }

    const supplier = await db("supplier_contacts").where({ id: supplier_id }).first();
    if (!supplier) return res.status(404).json({ error: "Supplier not found" });

    const hash = crypto.createHash("sha256").update(portal_token).digest("hex");
    if (supplier.portal_token_hash !== hash || new Date(supplier.portal_token_expires_at) < new Date()) {
      return res.status(401).json({ error: "Invalid or expired portal token" });
    }

    // Must be invited
    const invitation = await db("supplier_rfq_invitations")
      .where({ rfq_id: req.params.id, supplier_id }).first();
    if (!invitation) return res.status(403).json({ error: "Supplier not invited to this RFQ" });

    const [response] = await db("supplier_rfq_responses").insert({
      rfq_id: req.params.id, supplier_id, total_amount, currency, lead_time_days,
      valid_until, line_items: JSON.stringify(line_items || []), notes, file_key,
    }).onConflict(["rfq_id", "supplier_id"]).merge({
      total_amount, currency, lead_time_days, valid_until,
      line_items: JSON.stringify(line_items || []), notes, file_key,
      status: "submitted", updated_at: new Date(),
    }).returning("*");

    await db("supplier_rfq_invitations").where({ rfq_id: req.params.id, supplier_id }).update({ viewed_at: new Date() });

    // Update RFQ status
    await db("supplier_rfq").where({ id: req.params.id }).update({ status: "responses_received", updated_at: new Date() });
    await db("supplier_contacts").where({ id: supplier_id }).update({ last_portal_access: new Date() });

    res.status(201).json({ message: "Response submitted", response_id: response.id });
  } catch (err) { next(err); }
});

router.post("/rfq/:id/award/:supplierId", requireDepartment("procurement"), async (req, res, next) => {
  try {
    await db("supplier_rfq_responses")
      .where({ rfq_id: req.params.id })
      .update({ status: "rejected", updated_at: new Date() });

    const [awarded] = await db("supplier_rfq_responses")
      .where({ rfq_id: req.params.id, supplier_id: req.params.supplierId })
      .update({ status: "awarded", updated_at: new Date() })
      .returning("*");

    if (!awarded) return res.status(404).json({ error: "Response not found" });

    await db("supplier_rfq").where({ id: req.params.id }).update({ status: "awarded", updated_at: new Date() });
    res.json(awarded);
  } catch (err) { next(err); }
});

// ── PO Acknowledgement ────────────────────────────────────────
router.get("/po-acks", requireDepartment("procurement"), async (req, res, next) => {
  try {
    const acks = await db("supplier_po_acks as a")
      .join("purchase_orders as po", "a.purchase_order_id", "po.id")
      .leftJoin("supplier_contacts as s", "a.supplier_id", "s.id")
      .select(
        "a.*",
        "po.po_no", "po.total_amount", "po.required_date", "po.status as po_status",
        "s.company_name"
      )
      .orderBy("a.created_at", "desc");
    res.json(acks);
  } catch (err) { next(err); }
});

router.post("/po-acks", requireDepartment("procurement"), async (req, res, next) => {
  try {
    const { purchase_order_id, supplier_id } = req.body;
    if (!purchase_order_id) return res.status(422).json({ error: "purchase_order_id required" });
    const [ack] = await db("supplier_po_acks").insert({ purchase_order_id, supplier_id })
      .onConflict(["purchase_order_id"]).ignore().returning("*");
    if (!ack) return res.status(409).json({ error: "ACK already exists for this PO" });
    res.status(201).json(ack);
  } catch (err) { next(err); }
});

router.patch("/po-acks/:id", async (req, res, next) => {
  // Can be called by portal (token) or internal user
  try {
    const allowed = ["status", "committed_delivery_date", "supplier_notes", "acknowledged_at"];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    if (req.body.status === "acknowledged") updates.acknowledged_at = new Date();

    const [ack] = await db("supplier_po_acks").where({ id: req.params.id })
      .update({ ...updates, updated_at: new Date() }).returning("*");
    if (!ack) return res.status(404).json({ error: "ACK not found" });
    res.json(ack);
  } catch (err) { next(err); }
});

// ── Delivery tracking ─────────────────────────────────────────
router.get("/deliveries", requireDepartment("procurement", "store"), async (req, res, next) => {
  try {
    const { status } = req.query;
    let q = db("supplier_deliveries as d")
      .join("purchase_orders as po", "d.purchase_order_id", "po.id")
      .leftJoin("supplier_contacts as s", "d.supplier_id", "s.id")
      .select("d.*", "po.po_no", "po.vendor_name", "s.company_name")
      .orderBy("d.expected_date");
    if (status) q = q.where("d.status", status);
    res.json(await q);
  } catch (err) { next(err); }
});

router.post("/deliveries", requireDepartment("procurement"), async (req, res, next) => {
  try {
    const { purchase_order_id, supplier_id, expected_date, tracking_ref, carrier, notes } = req.body;
    if (!purchase_order_id || !expected_date) return res.status(422).json({ error: "purchase_order_id and expected_date required" });
    const [d] = await db("supplier_deliveries").insert({
      purchase_order_id, supplier_id, expected_date, tracking_ref, carrier, notes,
    }).returning("*");
    res.status(201).json(d);
  } catch (err) { next(err); }
});

router.patch("/deliveries/:id", async (req, res, next) => {
  try {
    const allowed = ["expected_date", "tracking_ref", "carrier", "notes", "status"];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const [d] = await db("supplier_deliveries").where({ id: req.params.id })
      .update({ ...updates, updated_at: new Date() }).returning("*");
    if (!d) return res.status(404).json({ error: "Delivery not found" });
    res.json(d);
  } catch (err) { next(err); }
});

// ── Scorecards ────────────────────────────────────────────────
router.get("/:id/scorecards", async (req, res, next) => {
  try {
    res.json(await db("supplier_scorecards")
      .where({ supplier_id: req.params.id })
      .orderBy("year", "desc").orderBy("quarter", "desc"));
  } catch (err) { next(err); }
});

router.post("/:id/scorecards", requireDepartment("procurement"), async (req, res, next) => {
  try {
    const { year, quarter, otd_score, quality_score, price_score, response_score, comments } = req.body;
    if (!year || !quarter) return res.status(422).json({ error: "year and quarter required" });

    const overall = Number(
      ((Number(otd_score || 0) * 0.35) +
       (Number(quality_score || 0) * 0.35) +
       (Number(price_score || 0) * 0.20) +
       (Number(response_score || 0) * 0.10)).toFixed(2)
    );

    const [sc] = await db("supplier_scorecards")
      .insert({
        supplier_id: req.params.id,
        year, quarter, otd_score, quality_score, price_score, response_score,
        overall_score: overall, comments, evaluated_by: req.user.id,
      })
      .onConflict(["supplier_id", "year", "quarter"])
      .merge({ otd_score, quality_score, price_score, response_score, overall_score: overall, comments, updated_at: new Date() })
      .returning("*");

    // Update supplier rating (average of last 4 scorecards, mapped 0–100 → 1–5)
    const recent = await db("supplier_scorecards")
      .where({ supplier_id: req.params.id })
      .orderBy("year", "desc").orderBy("quarter", "desc")
      .limit(4).select("overall_score");
    const avgScore = recent.reduce((s, r) => s + Number(r.overall_score), 0) / recent.length;
    const rating   = Math.round((avgScore / 100) * 4) + 1; // 1–5
    await db("supplier_contacts").where({ id: req.params.id }).update({ rating, updated_at: new Date() });

    res.status(201).json(sc);
  } catch (err) { next(err); }
});

module.exports = router;
