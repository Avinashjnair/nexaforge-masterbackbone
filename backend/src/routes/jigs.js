const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

const VALID_CONDITIONS = ["serviceable", "maintenance", "condemned"];

// GET /jigs — list all jigs and fixtures
router.get("/", async (req, res, next) => {
  try {
    const { condition, project_id } = req.query;

    let query = db("jig_fixtures as jf")
      .leftJoin("projects as p", "jf.project_id", "p.id")
      .select("jf.*", "p.project_no", "p.name as project_name")
      .orderBy("jf.ref");

    if (condition)  query = query.where("jf.condition", condition);
    if (project_id) query = query.where("jf.project_id", project_id);

    res.json(await query);
  } catch (err) {
    next(err);
  }
});

// GET /jigs/:id
router.get("/:id", async (req, res, next) => {
  try {
    const jig = await db("jig_fixtures as jf")
      .leftJoin("projects as p", "jf.project_id", "p.id")
      .select("jf.*", "p.project_no", "p.name as project_name")
      .where("jf.id", req.params.id)
      .first();

    if (!jig) return res.status(404).json({ error: "Jig/fixture not found" });
    res.json(jig);
  } catch (err) {
    next(err);
  }
});

// POST /jigs — register a jig or fixture
router.post("/", requireRole("senior"), async (req, res, next) => {
  try {
    const { ref, description, location, condition, project_id, last_inspection_date, notes } = req.body;

    if (!ref || !description) {
      return res.status(400).json({ error: "ref and description are required" });
    }
    if (condition && !VALID_CONDITIONS.includes(condition)) {
      return res.status(400).json({ error: `condition must be one of: ${VALID_CONDITIONS.join(", ")}` });
    }

    const [jig] = await db("jig_fixtures")
      .insert({
        ref,
        description,
        location:             location             || null,
        condition:            condition             || "serviceable",
        project_id:           project_id           || null,
        last_inspection_date: last_inspection_date || null,
        notes:                notes                || null,
      })
      .returning("*");

    res.status(201).json(jig);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Jig ref already exists" });
    next(err);
  }
});

// PATCH /jigs/:id — update condition, location, or project assignment
router.patch("/:id", requireRole("senior"), async (req, res, next) => {
  try {
    const { description, location, condition, project_id, last_inspection_date, notes } = req.body;

    if (condition && !VALID_CONDITIONS.includes(condition)) {
      return res.status(400).json({ error: `condition must be one of: ${VALID_CONDITIONS.join(", ")}` });
    }

    const updates = { updated_at: db.fn.now() };
    if (description          !== undefined) updates.description          = description;
    if (location             !== undefined) updates.location             = location;
    if (condition            !== undefined) updates.condition            = condition;
    if (project_id           !== undefined) updates.project_id           = project_id || null;
    if (last_inspection_date !== undefined) updates.last_inspection_date = last_inspection_date || null;
    if (notes                !== undefined) updates.notes                = notes;

    const [jig] = await db("jig_fixtures").where("id", req.params.id).update(updates).returning("*");
    if (!jig) return res.status(404).json({ error: "Jig/fixture not found" });
    res.json(jig);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
