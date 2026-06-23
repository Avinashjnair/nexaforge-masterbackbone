const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

const RESULTS = ["won", "lost", "quoted"];

// json columns (strengths/weaknesses) are native json on Postgres but TEXT on
// SQLite. Stringify on write — a JSON string is valid for both dialects.
function toJsonColumn(val) {
  if (val === undefined) return undefined;
  if (val === null) return null;
  return JSON.stringify(val);
}

// On read, Postgres returns parsed json while SQLite returns the raw string —
// normalise both to a JS array.
function parseJsonColumn(val) {
  if (val == null) return val;
  if (typeof val !== "string") return val;
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
}

function hydrate(row) {
  if (!row) return row;
  return { ...row, strengths: parseJsonColumn(row.strengths), weaknesses: parseJsonColumn(row.weaknesses) };
}

// ── competitors ───────────────────────────────────────────────

// GET /competitors — optional region filter
router.get("/", async (req, res, next) => {
  try {
    const { region } = req.query;
    let query = db("competitors").orderBy("name", "asc");
    if (region) query = query.where("region", region);
    const rows = await query;
    res.json(rows.map(hydrate));
  } catch (err) {
    next(err);
  }
});

// GET /competitors/:id
router.get("/:id", async (req, res, next) => {
  try {
    const row = await db("competitors").where("id", req.params.id).first();
    if (!row) return res.status(404).json({ error: "Competitor not found" });
    res.json(hydrate(row));
  } catch (err) {
    next(err);
  }
});

// POST /competitors
router.post("/", requireRole("user"), async (req, res, next) => {
  try {
    const { ref, name, region, size, strengths, weaknesses, win_rate, avg_gap } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const [row] = await db("competitors")
      .insert({
        ref: ref || null,
        name,
        region: region || null,
        size: size || null,
        strengths: toJsonColumn(strengths) ?? null,
        weaknesses: toJsonColumn(weaknesses) ?? null,
        win_rate: win_rate !== undefined ? Number(win_rate) : null,
        avg_gap: avg_gap !== undefined ? Number(avg_gap) : null,
      })
      .returning("*");

    res.status(201).json(hydrate(row));
  } catch (err) {
    next(err);
  }
});

// PATCH /competitors/:id
router.patch("/:id", requireRole("user"), async (req, res, next) => {
  try {
    const scalar = ["ref", "name", "region", "size", "win_rate", "avg_gap"];
    const updates = {};
    scalar.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    if (req.body.strengths !== undefined) updates.strengths = toJsonColumn(req.body.strengths);
    if (req.body.weaknesses !== undefined) updates.weaknesses = toJsonColumn(req.body.weaknesses);
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No valid fields to update" });

    updates.updated_at = db.fn.now();
    const [updated] = await db("competitors").where("id", req.params.id).update(updates).returning("*");
    if (!updated) return res.status(404).json({ error: "Competitor not found" });
    res.json(hydrate(updated));
  } catch (err) {
    next(err);
  }
});

// DELETE /competitors/:id
router.delete("/:id", requireRole("manager"), async (req, res, next) => {
  try {
    const deleted = await db("competitors").where("id", req.params.id).del();
    if (!deleted) return res.status(404).json({ error: "Competitor not found" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ── bid_outcomes (win/loss record vs competitors) ─────────────

// GET /competitors/bids/all — bid outcome history
router.get("/bids/all", async (req, res, next) => {
  try {
    const { result, competitor } = req.query;
    let query = db("bid_outcomes").orderBy("created_at", "desc");
    if (result) query = query.where("result", result);
    if (competitor) query = query.where("competitor", competitor);
    res.json(await query);
  } catch (err) {
    next(err);
  }
});

// POST /competitors/bids — record a bid outcome
router.post("/bids", requireRole("user"), async (req, res, next) => {
  try {
    const { tender, result, our_price, competitor, their_price, gap, notes } = req.body;
    if (!tender) return res.status(400).json({ error: "tender is required" });
    if (result && !RESULTS.includes(result)) {
      return res.status(400).json({ error: `result must be one of: ${RESULTS.join(", ")}` });
    }

    const [row] = await db("bid_outcomes")
      .insert({
        tender,
        result: result || "quoted",
        our_price: our_price !== undefined ? Number(our_price) : null,
        competitor: competitor || null,
        their_price: their_price !== undefined ? Number(their_price) : null,
        gap: gap !== undefined ? Number(gap) : null,
        notes: notes || null,
      })
      .returning("*");

    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

// PATCH /competitors/bids/:id
router.patch("/bids/:id", requireRole("user"), async (req, res, next) => {
  try {
    const allowed = ["tender", "result", "our_price", "competitor", "their_price", "gap", "notes"];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    if (updates.result && !RESULTS.includes(updates.result)) {
      return res.status(400).json({ error: `result must be one of: ${RESULTS.join(", ")}` });
    }
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No valid fields to update" });

    updates.updated_at = db.fn.now();
    const [updated] = await db("bid_outcomes").where("id", req.params.id).update(updates).returning("*");
    if (!updated) return res.status(404).json({ error: "Bid outcome not found" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /competitors/bids/:id
router.delete("/bids/:id", requireRole("manager"), async (req, res, next) => {
  try {
    const deleted = await db("bid_outcomes").where("id", req.params.id).del();
    if (!deleted) return res.status(404).json({ error: "Bid outcome not found" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
