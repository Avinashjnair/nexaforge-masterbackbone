const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

// GET /quotes/:id — quote with line items and calculated totals
router.get("/:id", async (req, res, next) => {
  try {
    const quote = await db("quotes as q")
      .leftJoin("opportunities as o", "q.opportunity_id", "o.id")
      .leftJoin("clients as c", "o.client_id", "c.id")
      .select("q.*", "o.title as opportunity_title", "c.name as client_name")
      .where("q.id", req.params.id)
      .first();

    if (!quote) return res.status(404).json({ error: "Quote not found" });

    const lines = await db("quote_lines").where("quote_id", req.params.id).orderBy("line_no");

    const subtotal = lines.reduce((sum, l) => sum + Number(l.total_price), 0);
    const discountAmt = subtotal * (Number(quote.discount_pct) / 100);
    const total = subtotal - discountAmt;

    res.json({ ...quote, lines, calculated: { subtotal, discount_amount: discountAmt, total } });
  } catch (err) {
    next(err);
  }
});

// POST /quotes — create quote linked to opportunity
router.post("/", requireRole("user"), async (req, res, next) => {
  try {
    const { opportunity_id, revision, discount_pct, valid_until, terms } = req.body;
    if (!opportunity_id) return res.status(400).json({ error: "opportunity_id is required" });

    // Auto-generate quote number
    const [{ count }] = await db("quotes").count("id as count");
    const quoteNo = `QT-${String(Number(count) + 1).padStart(4, "0")}`;

    const [quote] = await db("quotes")
      .insert({
        opportunity_id,
        quote_no: quoteNo,
        revision: revision || "0",
        status: "draft",
        discount_pct: discount_pct || 0,
        valid_until: valid_until || null,
        terms: terms || null,
      })
      .returning("*");

    res.status(201).json(quote);
  } catch (err) {
    next(err);
  }
});

// GET /quotes/:id/lines — line items
router.get("/:id/lines", async (req, res, next) => {
  try {
    const lines = await db("quote_lines").where("quote_id", req.params.id).orderBy("line_no");
    res.json(lines);
  } catch (err) {
    next(err);
  }
});

// POST /quotes/:id/lines — add line item
router.post("/:id/lines", requireRole("user"), async (req, res, next) => {
  try {
    const { description, quantity, unit, unit_price } = req.body;
    if (!description || !quantity || !unit_price) {
      return res.status(400).json({ error: "description, quantity and unit_price are required" });
    }

    const [{ max }] = await db("quote_lines").where("quote_id", req.params.id).max("line_no as max");
    const lineNo = (max || 0) + 1;
    const totalPrice = Number(quantity) * Number(unit_price);

    const [line] = await db("quote_lines")
      .insert({
        quote_id: req.params.id,
        line_no: lineNo,
        description,
        quantity: Number(quantity),
        unit: unit || null,
        unit_price: Number(unit_price),
        total_price: totalPrice,
      })
      .returning("*");

    // Update quote total_amount
    const lines = await db("quote_lines").where("quote_id", req.params.id);
    const total = lines.reduce((s, l) => s + Number(l.total_price), 0);
    await db("quotes").where("id", req.params.id).update({ total_amount: total, updated_at: db.fn.now() });

    res.status(201).json(line);
  } catch (err) {
    next(err);
  }
});

// PATCH /quote-lines/:lineId — update qty, unit cost
router.patch("/lines/:lineId", requireRole("user"), async (req, res, next) => {
  try {
    const allowed = ["description", "quantity", "unit", "unit_price"];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    if (updates.quantity || updates.unit_price) {
      const existing = await db("quote_lines").where("id", req.params.lineId).first();
      if (!existing) return res.status(404).json({ error: "Quote line not found" });
      const qty = updates.quantity ?? existing.quantity;
      const price = updates.unit_price ?? existing.unit_price;
      updates.total_price = Number(qty) * Number(price);
    }

    updates.updated_at = db.fn.now();
    const [updated] = await db("quote_lines").where("id", req.params.lineId).update(updates).returning("*");
    if (!updated) return res.status(404).json({ error: "Quote line not found" });

    // Recalculate quote total
    const lines = await db("quote_lines").where("quote_id", updated.quote_id);
    const total = lines.reduce((s, l) => s + Number(l.total_price), 0);
    await db("quotes").where("id", updated.quote_id).update({ total_amount: total, updated_at: db.fn.now() });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// GET /tenders — tender/ITT list
router.get("/tenders/all", async (req, res, next) => {
  try {
    const tenders = await db("opportunities")
      .whereIn("stage", ["rfq", "proposal"])
      .whereNotNull("rfq_no")
      .leftJoin("clients as c", "opportunities.client_id", "c.id")
      .select("opportunities.*", "c.name as client_name")
      .orderBy("opportunities.expected_close_date");
    res.json(tenders);
  } catch (err) {
    next(err);
  }
});

// POST /tenders — log new ITT/RFQ (creates opportunity at rfq stage)
router.post("/tenders", requireRole("user"), async (req, res, next) => {
  try {
    const { title, client_id, rfq_no, estimated_value, expected_close_date, notes } = req.body;
    if (!title || !rfq_no) return res.status(400).json({ error: "title and rfq_no are required" });

    const [tender] = await db("opportunities")
      .insert({
        client_id: client_id || null,
        title,
        rfq_no,
        stage: "rfq",
        estimated_value: estimated_value || null,
        currency: "USD",
        probability_pct: 30,
        expected_close_date: expected_close_date || null,
        owner_id: req.user.sub,
        notes: notes || null,
      })
      .returning("*");

    res.status(201).json(tender);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
