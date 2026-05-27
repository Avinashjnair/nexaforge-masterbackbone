const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

// GET /work-centres — list all with routing step counts as utilisation proxy
router.get("/", async (req, res, next) => {
  try {
    const centres = await db("work_centres as wc")
      .leftJoin("routing_steps as rs", function () {
        this.on("rs.work_centre_id", "wc.id").onIn("rs.status", ["in_progress"]);
      })
      .select(
        "wc.*",
        db.raw("COUNT(rs.id) AS active_jobs")
      )
      .where("wc.is_active", true)
      .groupBy("wc.id")
      .orderBy("wc.code");

    res.json(centres);
  } catch (err) {
    next(err);
  }
});

// POST /work-centres — create
router.post("/", requireRole("manager"), async (req, res, next) => {
  try {
    const { code, name, department } = req.body;
    if (!code || !name) return res.status(400).json({ error: "code and name are required" });

    const [wc] = await db("work_centres").insert({ code, name, department: department || null }).returning("*");
    res.status(201).json(wc);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Work centre code already exists" });
    next(err);
  }
});

module.exports = router;
