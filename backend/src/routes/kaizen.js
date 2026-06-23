const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");
const { publish, TOPICS } = require("../events/rabbitmq");

const router = express.Router();

const VALID_CATEGORIES = ["safety", "quality", "efficiency", "cost", "delivery"];
const VALID_STATUSES   = ["submitted", "review", "approved", "implementing", "complete", "rejected"];

// POST /kaizen — submit a new idea (any authenticated user)
router.post("/", async (req, res, next) => {
  try {
    const { title, description, category, impact_est } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ error: "title, description, and category are required" });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `category must be one of: ${VALID_CATEGORIES.join(", ")}` });
    }

    const dept = req.user.department || "unknown";

    const [idea] = await db("kaizen_ideas")
      .insert({
        submitted_by: req.user.sub,
        dept,
        title,
        description,
        category,
        impact_est:   impact_est || null,
        status:       "submitted",
      })
      .returning("*");

    await publish(TOPICS.KAIZEN_SUBMITTED, {
      kaizen_id:    idea.id,
      title:        idea.title,
      dept:         idea.dept,
      category:     idea.category,
      submitted_by: req.user.name || req.user.sub,
    }).catch(() => {});

    res.status(201).json(idea);
  } catch (err) {
    next(err);
  }
});

// GET /kaizen — list ideas (filterable by status, dept, category)
router.get("/", async (req, res, next) => {
  try {
    const { status, dept, category, limit = 50, page = 1 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db("kaizen_ideas as k")
      .leftJoin("users as s", "k.submitted_by", "s.id")
      .leftJoin("users as r", "k.reviewed_by",  "r.id")
      .select(
        "k.*",
        "s.full_name as submitter_name",
        "r.full_name as reviewer_name"
      )
      .orderBy("k.created_at", "desc")
      .limit(Number(limit))
      .offset(offset);

    if (status)   query = query.where("k.status",   status);
    if (dept)     query = query.where("k.dept",     dept);
    if (category) query = query.where("k.category", category);

    const [rows, [{ count }]] = await Promise.all([
      query,
      db("kaizen_ideas").count("id as count"),
    ]);

    res.json({ data: rows, total: Number(count), page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

// GET /kaizen/board — Kanban board: ideas grouped by status
router.get("/board", async (req, res, next) => {
  try {
    const { dept } = req.query;
    let query = db("kaizen_ideas as k")
      .leftJoin("users as s", "k.submitted_by", "s.id")
      .select("k.*", "s.full_name as submitter_name")
      .orderBy("k.created_at", "asc");

    if (dept) query = query.where("k.dept", dept);

    const ideas = await query;

    const board = {};
    for (const s of VALID_STATUSES) board[s] = [];
    for (const idea of ideas) board[idea.status]?.push(idea);

    res.json({ board, columns: VALID_STATUSES });
  } catch (err) {
    next(err);
  }
});

// GET /kaizen/:id
router.get("/:id", async (req, res, next) => {
  try {
    const idea = await db("kaizen_ideas as k")
      .leftJoin("users as s", "k.submitted_by", "s.id")
      .leftJoin("users as r", "k.reviewed_by",  "r.id")
      .select("k.*", "s.full_name as submitter_name", "r.full_name as reviewer_name")
      .where("k.id", req.params.id)
      .first();

    if (!idea) return res.status(404).json({ error: "Kaizen idea not found" });
    res.json(idea);
  } catch (err) {
    next(err);
  }
});

// PATCH /kaizen/:id/status — advance status (manager)
router.patch("/:id/status", requireRole("manager"), async (req, res, next) => {
  try {
    const { status, review_notes } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` });
    }

    const idea = await db("kaizen_ideas").where("id", req.params.id).first();
    if (!idea) return res.status(404).json({ error: "Kaizen idea not found" });

    const updates = {
      status,
      updated_at:   db.fn.now(),
      review_notes: review_notes || null,
    };

    if (["approved", "rejected", "review"].includes(status)) {
      updates.reviewed_by  = req.user.sub;
      updates.reviewed_at  = db.fn.now();
    }

    const [updated] = await db("kaizen_ideas")
      .where("id", req.params.id)
      .update(updates)
      .returning("*");

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
