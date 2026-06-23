const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");
const { publish, TOPICS } = require("../events/rabbitmq");

const router = express.Router();

// GET /grn — list GRNs with optional filters
router.get("/", async (req, res, next) => {
  try {
    const { po_id, project_id, inspection_status, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db("grn as g")
      .leftJoin("purchase_orders as po", "g.po_id", "po.id")
      .leftJoin("projects as p", "po.project_id", "p.id")
      .select(
        "g.*",
        "po.po_no",
        "p.project_no", "p.name as project_name"
      )
      .orderBy("g.received_date", "desc")
      .limit(Number(limit))
      .offset(offset);

    if (po_id) query = query.where("g.po_id", po_id);
    if (project_id) query = query.where("po.project_id", project_id);
    if (inspection_status) query = query.where("g.inspection_status", inspection_status);

    const grns = await query;

    // Attach lines
    const grnIds = grns.map((g) => g.id);
    const lines = grnIds.length ? await db("grn_lines").whereIn("grn_id", grnIds) : [];
    const linesByGrn = {};
    lines.forEach((l) => { (linesByGrn[l.grn_id] = linesByGrn[l.grn_id] || []).push(l); });

    res.json(grns.map((g) => ({ ...g, lines: linesByGrn[g.id] || [] })));
  } catch (err) {
    next(err);
  }
});

// GET /grn/:id
router.get("/:id", async (req, res, next) => {
  try {
    const grn = await db("grn as g")
      .leftJoin("purchase_orders as po", "g.po_id", "po.id")
      .leftJoin("projects as p", "po.project_id", "p.id")
      .select("g.*", "po.po_no", "p.project_no", "p.name as project_name")
      .where("g.id", req.params.id)
      .first();

    if (!grn) return res.status(404).json({ error: "GRN not found" });

    const lines = await db("grn_lines").where("grn_id", req.params.id);
    res.json({ ...grn, lines });
  } catch (err) {
    next(err);
  }
});

// POST /grn — log goods received against a PO
router.post("/", requireRole("user"), async (req, res, next) => {
  try {
    const { po_id, delivery_note_no, received_date, remarks, lines } = req.body;
    if (!po_id || !lines?.length) {
      return res.status(400).json({ error: "po_id and at least one line are required" });
    }

    const po = await db("purchase_orders").where("id", po_id).first();
    if (!po) return res.status(404).json({ error: "Purchase order not found" });

    const [{ count }] = await db("grn").count("id as count");
    const grnNo = `GRN-${String(Number(count) + 1).padStart(4, "0")}`;

    const [grn] = await db("grn")
      .insert({
        po_id,
        grn_no: grnNo,
        received_date: received_date || db.fn.now(),
        delivery_note_no: delivery_note_no || null,
        inspection_status: "pending",
        remarks: remarks || null,
        received_by: req.user.sub,
      })
      .returning("*");

    const lineRows = lines.map((l) => ({
      grn_id: grn.id,
      bom_item_id: l.bom_item_id || null,
      description: l.description,
      qty_ordered: Number(l.qty_ordered),
      qty_received: Number(l.qty_received),
      unit: l.unit || null,
      condition: "pending_inspection",
    }));

    const insertedLines = await db("grn_lines").insert(lineRows).returning("*");

    // Fire grn.received → QC auto-raise inspection call
    await publish(TOPICS.GRN_RECEIVED, {
      grnId: grn.id,
      grnNo: grn.grn_no,
      poId: po_id,
      projectId: po.project_id || null,
      lineCount: insertedLines.length,
      receivedBy: req.user.sub,
    }).catch((e) => console.warn("[GRN] publish failed:", e.message));

    res.status(201).json({ ...grn, lines: insertedLines });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
