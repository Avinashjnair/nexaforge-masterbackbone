/**
 * NEW-08 — Cross-department project comments (ADR-005 isolation exception)
 * Any authenticated user with access to the project may read/write comments.
 * Mentions trigger a WebSocket push to the mentioned user's session.
 */
const express = require("express");
const db = require("../db/knex");

const router = express.Router({ mergeParams: true });

// GET /projects/:id/comments — threaded comment list
router.get("/", async (req, res, next) => {
  try {
    const rows = await db("project_comments as c")
      .leftJoin("users as u", "c.author_id", "u.id")
      .select(
        "c.*",
        "u.full_name as author_name",
        "u.department as author_dept_system"
      )
      .where("c.project_id", req.params.id)
      .orderBy("c.created_at", "asc");

    // Build tree: top-level comments with replies nested
    const byId = {};
    const roots = [];

    for (const row of rows) {
      row.replies = [];
      byId[row.id] = row;
    }
    for (const row of rows) {
      if (row.parent_id && byId[row.parent_id]) {
        byId[row.parent_id].replies.push(row);
      } else {
        roots.push(row);
      }
    }

    res.json({ project_id: req.params.id, comments: roots, total: rows.length });
  } catch (err) {
    next(err);
  }
});

// POST /projects/:id/comments — post a new top-level comment
router.post("/", async (req, res, next) => {
  try {
    const { body, mentions } = req.body;
    if (!body?.trim()) return res.status(400).json({ error: "body is required" });

    const dept = req.user.department || "unknown";
    const mentionList = Array.isArray(mentions) ? mentions : [];

    const [comment] = await db("project_comments")
      .insert({
        project_id: req.params.id,
        author_id:  req.user.sub,
        dept,
        body:       body.trim(),
        mentions:   JSON.stringify(mentionList),
      })
      .returning("*");

    // WebSocket push to mentioned users
    if (req.io && mentionList.length > 0) {
      const author = await db("users").where("id", req.user.sub).select("full_name").first();
      for (const mentionedUserId of mentionList) {
        req.io.to(`user:${mentionedUserId}`).emit("comment:mention", {
          type:        "comment:mention",
          comment_id:  comment.id,
          project_id:  req.params.id,
          author_name: author?.full_name || "Someone",
          body:        body.trim().slice(0, 100),
        });
      }
    }

    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
});

// POST /projects/:id/comments/:commentId/reply — reply to a comment
router.post("/:commentId/reply", async (req, res, next) => {
  try {
    const { body, mentions } = req.body;
    if (!body?.trim()) return res.status(400).json({ error: "body is required" });

    const parent = await db("project_comments")
      .where({ id: req.params.commentId, project_id: req.params.id })
      .first();
    if (!parent) return res.status(404).json({ error: "Parent comment not found" });
    // Flatten replies — replies-to-replies attach at the same level
    const parentId = parent.parent_id || parent.id;

    const dept = req.user.department || "unknown";
    const mentionList = Array.isArray(mentions) ? mentions : [];

    const [reply] = await db("project_comments")
      .insert({
        project_id: req.params.id,
        author_id:  req.user.sub,
        dept,
        body:       body.trim(),
        parent_id:  parentId,
        mentions:   JSON.stringify(mentionList),
      })
      .returning("*");

    if (req.io && mentionList.length > 0) {
      const author = await db("users").where("id", req.user.sub).select("full_name").first();
      for (const mentionedUserId of mentionList) {
        req.io.to(`user:${mentionedUserId}`).emit("comment:mention", {
          type:        "comment:mention",
          comment_id:  reply.id,
          project_id:  req.params.id,
          author_name: author?.full_name || "Someone",
          body:        body.trim().slice(0, 100),
        });
      }
    }

    res.status(201).json(reply);
  } catch (err) {
    next(err);
  }
});

// PATCH /projects/:id/comments/:commentId — edit own comment body
router.patch("/:commentId", async (req, res, next) => {
  try {
    const { body } = req.body;
    if (!body?.trim()) return res.status(400).json({ error: "body is required" });

    const comment = await db("project_comments")
      .where({ id: req.params.commentId, project_id: req.params.id })
      .first();
    if (!comment) return res.status(404).json({ error: "Comment not found" });
    if (comment.author_id !== req.user.sub) {
      return res.status(403).json({ error: "You can only edit your own comments" });
    }

    const [updated] = await db("project_comments")
      .where("id", req.params.commentId)
      .update({ body: body.trim(), is_edited: true, updated_at: db.fn.now() })
      .returning("*");

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
