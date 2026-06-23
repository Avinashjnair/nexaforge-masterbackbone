const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

const STATUSES = ["draft", "submitted", "pending", "negotiation", "won", "lost", "revised"];

// Both Postgres (23505) and SQLite (SQLITE_CONSTRAINT_UNIQUE) report unique clashes.
function isUniqueViolation(err) {
  return err.code === "23505" || err.code === "SQLITE_CONSTRAINT_UNIQUE";
}

// Sequential ref like Q-2025-031, scoped to the current year.
async function nextRef() {
  const year = new Date().getFullYear();
  const prefix = `Q-${year}-`;
  const [{ count }] = await db("quote_log").where("ref", "like", `${prefix}%`).count("id as count");
  return `${prefix}${String(Number(count) + 1).padStart(3, "0")}`;
}

// GET /quote-log — list with optional filters; each row carries its full
// revision history (oldest→newest, so the last entry is the current revision).
router.get("/", async (req, res, next) => {
  try {
    const { status, owner, opportunity_id } = req.query;
    let query = db("quote_log").orderBy("created_at", "desc");
    if (status) query = query.where("status", status);
    if (owner) query = query.where("owner", owner);
    if (opportunity_id) query = query.where("opportunity_id", opportunity_id);
    const quotes = await query;

    const ids = quotes.map((q) => q.id);
    const revisions = ids.length
      ? await db("quote_revisions").whereIn("quote_log_id", ids).orderBy("rev_date", "asc")
      : [];
    const byQuote = {};
    revisions.forEach((r) => { (byQuote[r.quote_log_id] = byQuote[r.quote_log_id] || []).push(r); });

    res.json(quotes.map((q) => ({ ...q, revisions: byQuote[q.id] || [] })));
  } catch (err) {
    next(err);
  }
});

// GET /quote-log/:id — single quote with its revision history
router.get("/:id", async (req, res, next) => {
  try {
    const quote = await db("quote_log").where("id", req.params.id).first();
    if (!quote) return res.status(404).json({ error: "Quote not found" });
    const revisions = await db("quote_revisions")
      .where("quote_log_id", req.params.id)
      .orderBy("rev_date", "asc");
    res.json({ ...quote, revisions });
  } catch (err) {
    next(err);
  }
});

// POST /quote-log — create a quote log entry
router.post("/", requireRole("user"), async (req, res, next) => {
  try {
    const { ref, opportunity_id, rfq_no, client_name, project, owner, status, valid_until, currency } = req.body;
    if (status && !STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${STATUSES.join(", ")}` });
    }

    const [quote] = await db("quote_log")
      .insert({
        ref: ref || (await nextRef()),
        opportunity_id: opportunity_id || null,
        rfq_no: rfq_no || null,
        client_name: client_name || null,
        project: project || null,
        owner: owner || null,
        status: status || "submitted",
        valid_until: valid_until || null,
        currency: currency || "USD",
      })
      .returning("*");

    res.status(201).json(quote);
  } catch (err) {
    if (isUniqueViolation(err)) return res.status(409).json({ error: "ref already exists" });
    next(err);
  }
});

// PATCH /quote-log/:id — update fields
router.patch("/:id", requireRole("user"), async (req, res, next) => {
  try {
    const allowed = ["ref", "opportunity_id", "rfq_no", "client_name", "project", "owner", "status", "valid_until", "currency"];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    if (updates.status && !STATUSES.includes(updates.status)) {
      return res.status(400).json({ error: `status must be one of: ${STATUSES.join(", ")}` });
    }
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No valid fields to update" });

    updates.updated_at = db.fn.now();
    const [updated] = await db("quote_log").where("id", req.params.id).update(updates).returning("*");
    if (!updated) return res.status(404).json({ error: "Quote not found" });
    res.json(updated);
  } catch (err) {
    if (isUniqueViolation(err)) return res.status(409).json({ error: "ref already exists" });
    next(err);
  }
});

// DELETE /quote-log/:id — removes the quote and (via CASCADE) its revisions
router.delete("/:id", requireRole("manager"), async (req, res, next) => {
  try {
    const deleted = await db("quote_log").where("id", req.params.id).del();
    if (!deleted) return res.status(404).json({ error: "Quote not found" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// GET /quote-log/:id/revisions — revision history
router.get("/:id/revisions", async (req, res, next) => {
  try {
    const revisions = await db("quote_revisions")
      .where("quote_log_id", req.params.id)
      .orderBy("rev_date", "asc");
    res.json(revisions);
  } catch (err) {
    next(err);
  }
});

// POST /quote-log/:id/revisions — add a revision
router.post("/:id/revisions", requireRole("user"), async (req, res, next) => {
  try {
    const quote = await db("quote_log").where("id", req.params.id).first();
    if (!quote) return res.status(404).json({ error: "Quote not found" });

    const { rev, rev_date, value, margin, note } = req.body;
    if (!rev || !rev_date || value === undefined) {
      return res.status(400).json({ error: "rev, rev_date and value are required" });
    }

    const [revision] = await db("quote_revisions")
      .insert({
        quote_log_id: req.params.id,
        rev,
        rev_date,
        value: Number(value),
        margin: margin !== undefined ? Number(margin) : null,
        note: note || null,
      })
      .returning("*");

    // Keep the parent quote in step with its latest revision.
    await db("quote_log").where("id", req.params.id).update({ status: "revised", updated_at: db.fn.now() });

    res.status(201).json(revision);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
