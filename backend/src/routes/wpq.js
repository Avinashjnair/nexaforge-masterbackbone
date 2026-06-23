const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

// GET /wpq — list all WPQ records, optionally filter by employee
router.get("/", async (req, res, next) => {
  try {
    const { employee_id, status } = req.query;

    let query = db("wpq as q")
      .leftJoin("employees as e", "q.employee_id", "e.id")
      .leftJoin("wps as w", "q.wps_id", "w.id")
      .select(
        "q.*",
        "e.full_name as welder_name",
        "e.employee_no",
        "w.wps_no"
      )
      .orderBy("q.expiry_date");

    if (employee_id) query = query.where("q.employee_id", employee_id);
    if (status) query = query.where("q.status", status);

    res.json(await query);
  } catch (err) {
    next(err);
  }
});

// GET /wpq/welder/:employeeId — all qualifications for a specific welder
router.get("/welder/:employeeId", async (req, res, next) => {
  try {
    const welder = await db("employees").where("id", req.params.employeeId).first();
    if (!welder) return res.status(404).json({ error: "Employee not found" });

    const qualifications = await db("wpq as q")
      .leftJoin("wps as w", "q.wps_id", "w.id")
      .select("q.*", "w.wps_no", "w.process as wps_process", "w.standard")
      .where("q.employee_id", req.params.employeeId)
      .orderBy("q.expiry_date");

    res.json({ welder, qualifications });
  } catch (err) {
    next(err);
  }
});

// POST /wpq — add WPQ qualification
router.post("/", requireRole("manager"), async (req, res, next) => {
  try {
    const { employee_id, wps_id, stamp_no, process, position, material_group, qualified_date, expiry_date } = req.body;
    if (!employee_id || !stamp_no || !qualified_date || !expiry_date) {
      return res.status(400).json({ error: "employee_id, stamp_no, qualified_date and expiry_date are required" });
    }

    const [wpq] = await db("wpq")
      .insert({
        employee_id,
        wps_id: wps_id || null,
        stamp_no,
        process: process || null,
        position: position || null,
        material_group: material_group || null,
        qualified_date,
        expiry_date,
        status: "active",
      })
      .returning("*");

    res.status(201).json(wpq);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Stamp number already exists" });
    next(err);
  }
});

module.exports = router;
