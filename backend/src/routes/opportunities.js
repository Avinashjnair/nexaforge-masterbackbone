const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

const STAGES = ["lead", "rfq", "proposal", "negotiation", "won", "lost"];

// GET /opportunities — pipeline with optional stage filter
router.get("/", async (req, res, next) => {
  try {
    const { stage, client_id, owner_id } = req.query;

    let query = db("opportunities as o")
      .leftJoin("clients as c", "o.client_id", "c.id")
      .leftJoin("users as u", "o.owner_id", "u.id")
      .select(
        "o.*",
        "c.name as client_name",
        "c.short_code as client_code",
        "u.full_name as owner_name"
      )
      .whereNotIn("o.stage", ["won", "lost"]) // default: exclude closed
      .orderBy("o.expected_close_date");

    if (stage) query = db("opportunities as o")
      .leftJoin("clients as c", "o.client_id", "c.id")
      .leftJoin("users as u", "o.owner_id", "u.id")
      .select("o.*", "c.name as client_name", "u.full_name as owner_name")
      .where("o.stage", stage)
      .orderBy("o.expected_close_date");

    if (client_id) query = query.where("o.client_id", client_id);
    if (owner_id) query = query.where("o.owner_id", owner_id);

    res.json(await query);
  } catch (err) {
    next(err);
  }
});

// POST /opportunities — create opportunity
router.post("/", requireRole("user"), async (req, res, next) => {
  try {
    const { title, client_id, rfq_no, estimated_value, currency, probability_pct, expected_close_date, notes } = req.body;
    if (!title) return res.status(400).json({ error: "title is required" });

    const [opp] = await db("opportunities")
      .insert({
        client_id: client_id || null,
        title,
        rfq_no: rfq_no || null,
        stage: "lead",
        estimated_value: estimated_value || null,
        currency: currency || "USD",
        probability_pct: probability_pct || 0,
        expected_close_date: expected_close_date || null,
        owner_id: req.user.sub,
        notes: notes || null,
      })
      .returning("*");

    res.status(201).json(opp);
  } catch (err) {
    next(err);
  }
});

// GET /opportunities/:id — full detail with quotes and activities
router.get("/:id", async (req, res, next) => {
  try {
    const opp = await db("opportunities as o")
      .leftJoin("clients as c", "o.client_id", "c.id")
      .leftJoin("users as u", "o.owner_id", "u.id")
      .select("o.*", "c.name as client_name", "u.full_name as owner_name")
      .where("o.id", req.params.id)
      .first();

    if (!opp) return res.status(404).json({ error: "Opportunity not found" });

    const [quotes, activities] = await Promise.all([
      db("quotes").where("opportunity_id", req.params.id).orderBy("created_at", "desc"),
      db("crm_activities as a")
        .leftJoin("users as u", "a.user_id", "u.id")
        .select("a.*", "u.full_name as logged_by")
        .where("a.opportunity_id", req.params.id)
        .orderBy("a.activity_date", "desc"),
    ]);

    res.json({ ...opp, quotes, activities });
  } catch (err) {
    next(err);
  }
});

// PATCH /opportunities/:id/stage — advance or change stage
router.patch("/:id/stage", requireRole("user"), async (req, res, next) => {
  try {
    const { stage, notes } = req.body;
    if (!STAGES.includes(stage)) {
      return res.status(400).json({ error: `stage must be one of: ${STAGES.join(", ")}` });
    }

    const [updated] = await db("opportunities")
      .where("id", req.params.id)
      .update({ stage, notes: notes || undefined, updated_at: db.fn.now() })
      .returning("*");

    if (!updated) return res.status(404).json({ error: "Opportunity not found" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// POST /opportunities/:id/won — convert to project
router.post("/:id/won", requireRole("manager"), async (req, res, next) => {
  try {
    const { project_no, due_date, project_manager_id } = req.body;
    if (!project_no) return res.status(400).json({ error: "project_no is required" });

    const opp = await db("opportunities").where("id", req.params.id).first();
    if (!opp) return res.status(404).json({ error: "Opportunity not found" });
    if (opp.stage === "won") return res.status(409).json({ error: "Opportunity already converted" });

    // Convert in a transaction
    const project = await db.transaction(async (trx) => {
      await trx("opportunities")
        .where("id", req.params.id)
        .update({ stage: "won", updated_at: trx.fn.now() });

      const [proj] = await trx("projects")
        .insert({
          project_no,
          name: opp.title,
          client_id: opp.client_id,
          status: "planning",
          phase: 1,
          progress_pct: 0,
          contract_value: opp.estimated_value,
          currency: opp.currency,
          due_date: due_date || null,
          project_manager_id: project_manager_id || null,
        })
        .returning("*");

      return proj;
    });

    res.status(201).json({ message: "Opportunity converted to project", project });
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "project_no already exists" });
    next(err);
  }
});

// POST /activities — log CRM activity
router.post("/activities", requireRole("user"), async (req, res, next) => {
  try {
    const { opportunity_id, client_id, type, subject, notes, activity_date } = req.body;
    if (!type) return res.status(400).json({ error: "type is required" });

    const [activity] = await db("crm_activities")
      .insert({
        opportunity_id: opportunity_id || null,
        client_id: client_id || null,
        user_id: req.user.sub,
        type,
        subject: subject || null,
        notes: notes || null,
        activity_date: activity_date || db.fn.now(),
      })
      .returning("*");

    res.status(201).json(activity);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
