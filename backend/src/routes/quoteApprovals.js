const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

function isUniqueViolation(err) {
  return err.code === "23505" || err.code === "SQLITE_CONSTRAINT_UNIQUE";
}

// Sequential ref like QA-001.
async function nextRef() {
  const [{ count }] = await db("quote_approvals").count("id as count");
  return `QA-${String(Number(count) + 1).padStart(3, "0")}`;
}

// Margin derived from sell/cost when not supplied.
function deriveMargin(sell, cost, margin) {
  if (margin !== undefined && margin !== null) return Number(margin);
  if (sell && cost && Number(sell) !== 0) {
    return Number((((Number(sell) - Number(cost)) / Number(sell)) * 100).toFixed(2));
  }
  return null;
}

// GET /quote-approvals — list, optional status filter (defaults to pending queue if requested)
router.get("/", async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = db("quote_approvals").orderBy("created_at", "desc");
    if (status) query = query.where("status", status);
    res.json(await query);
  } catch (err) {
    next(err);
  }
});

// GET /quote-approvals/:id
router.get("/:id", async (req, res, next) => {
  try {
    const row = await db("quote_approvals").where("id", req.params.id).first();
    if (!row) return res.status(404).json({ error: "Approval not found" });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

// POST /quote-approvals — raise an approval request
router.post("/", requireRole("user"), async (req, res, next) => {
  try {
    const { ref, opp_ref, quote, client_name, rev, sell, cost, margin, requested_by, requested_on } = req.body;

    const [row] = await db("quote_approvals")
      .insert({
        ref: ref || (await nextRef()),
        opp_ref: opp_ref || null,
        quote: quote || null,
        client_name: client_name || null,
        rev: rev || null,
        sell: sell !== undefined ? Number(sell) : null,
        cost: cost !== undefined ? Number(cost) : null,
        margin: deriveMargin(sell, cost, margin),
        status: "pending",
        requested_by: requested_by || req.user?.name || null,
        requested_on: requested_on || db.fn.now(),
      })
      .returning("*");

    res.status(201).json(row);
  } catch (err) {
    if (isUniqueViolation(err)) return res.status(409).json({ error: "ref already exists" });
    next(err);
  }
});

// PATCH /quote-approvals/:id/decision — approve or reject (manager+)
router.patch("/:id/decision", requireRole("manager"), async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "status must be 'approved' or 'rejected'" });
    }

    const existing = await db("quote_approvals").where("id", req.params.id).first();
    if (!existing) return res.status(404).json({ error: "Approval not found" });
    if (existing.status !== "pending") {
      return res.status(409).json({ error: `Already ${existing.status}` });
    }

    const [updated] = await db("quote_approvals")
      .where("id", req.params.id)
      .update({
        status,
        reason: reason || null,
        decided_by: req.user?.name || null,
        decided_on: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning("*");

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /quote-approvals/:id
router.delete("/:id", requireRole("manager"), async (req, res, next) => {
  try {
    const deleted = await db("quote_approvals").where("id", req.params.id).del();
    if (!deleted) return res.status(404).json({ error: "Approval not found" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
