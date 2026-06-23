const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

// GET /clients — full client list with project summary
router.get("/", async (req, res, next) => {
  try {
    const { search, is_active } = req.query;

    let query = db("clients as c")
      .leftJoin("projects as p", "p.client_id", "c.id")
      .select(
        "c.*",
        db.raw("COUNT(p.id) AS project_count"),
        db.raw("COALESCE(SUM(p.contract_value), 0) AS total_contract_value")
      )
      .groupBy("c.id")
      .orderBy("c.name");

    if (is_active !== undefined) query = query.where("c.is_active", is_active === "true");
    if (search) query = query.whereILike("c.name", `%${search}%`);

    res.json(await query);
  } catch (err) {
    next(err);
  }
});

// POST /clients — add client
router.post("/", requireRole("manager"), async (req, res, next) => {
  try {
    const { name, short_code, country, city, contact_name, contact_email, contact_phone, address } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const [client] = await db("clients")
      .insert({ name, short_code, country, city, contact_name, contact_email, contact_phone, address, is_active: true })
      .returning("*");

    res.status(201).json(client);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Client short_code already exists" });
    next(err);
  }
});

// GET /clients/:id — client detail with project history
router.get("/:id", async (req, res, next) => {
  try {
    const client = await db("clients").where("id", req.params.id).first();
    if (!client) return res.status(404).json({ error: "Client not found" });

    const projects = await db("projects")
      .where("client_id", req.params.id)
      .whereNull("deleted_at")
      .select("id", "project_no", "name", "status", "phase", "progress_pct", "contract_value", "due_date")
      .orderBy("created_at", "desc");

    const activities = await db("crm_activities")
      .where("client_id", req.params.id)
      .orderBy("activity_date", "desc")
      .limit(20);

    res.json({ ...client, projects, recent_activities: activities });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
