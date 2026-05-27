const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

// GET /wps — list all WPS with status
router.get("/", async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = db("wps as w")
      .leftJoin("users as u", "w.approved_by", "u.id")
      .select("w.*", "u.full_name as approved_by_name")
      .orderBy("w.wps_no");

    if (status) query = query.where("w.status", status);
    res.json(await query);
  } catch (err) {
    next(err);
  }
});

// POST /wps — create new WPS
router.post("/", requireRole("manager"), async (req, res, next) => {
  try {
    const { wps_no, process, base_metal, filler_metal, position, pwht, standard, revision } = req.body;
    if (!wps_no || !process) return res.status(400).json({ error: "wps_no and process are required" });

    const [wps] = await db("wps")
      .insert({ wps_no, revision: revision || "0", status: "draft", process, base_metal, filler_metal, position, pwht, standard })
      .returning("*");

    res.status(201).json(wps);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "WPS number already exists" });
    next(err);
  }
});

// GET /wps/:id — full WPS detail with linked PQRs
router.get("/:id", async (req, res, next) => {
  try {
    const wps = await db("wps as w")
      .leftJoin("users as u", "w.approved_by", "u.id")
      .select("w.*", "u.full_name as approved_by_name")
      .where("w.id", req.params.id)
      .first();

    if (!wps) return res.status(404).json({ error: "WPS not found" });

    const pqrs = await db("pqr").where("wps_id", wps.id).orderBy("test_date", "desc");

    res.json({ ...wps, pqrs });
  } catch (err) {
    next(err);
  }
});

// PATCH /wps/:id/approve — approve WPS
router.patch("/:id/approve", requireRole("manager"), async (req, res, next) => {
  try {
    const [updated] = await db("wps")
      .where("id", req.params.id)
      .update({
        status: "active",
        approved_by: req.user.sub,
        approved_date: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning("*");

    if (!updated) return res.status(404).json({ error: "WPS not found" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// GET /pqr — list all PQR records
router.get("/pqr/all", async (req, res, next) => {
  try {
    const pqrs = await db("pqr as p")
      .leftJoin("wps as w", "p.wps_id", "w.id")
      .select("p.*", "w.wps_no")
      .orderBy("p.test_date", "desc");
    res.json(pqrs);
  } catch (err) {
    next(err);
  }
});

// POST /pqr — create PQR linked to WPS
router.post("/pqr", requireRole("manager"), async (req, res, next) => {
  try {
    const { wps_id, pqr_no, test_date, result, test_lab, notes } = req.body;
    if (!pqr_no) return res.status(400).json({ error: "pqr_no is required" });

    const [pqr] = await db("pqr")
      .insert({ wps_id: wps_id || null, pqr_no, test_date: test_date || null, result: result || "pending", test_lab, notes })
      .returning("*");

    res.status(201).json(pqr);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "PQR number already exists" });
    next(err);
  }
});

module.exports = router;
