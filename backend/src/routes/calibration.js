const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

// GET /calibration — list all calibration items with alert flags
router.get("/", async (req, res, next) => {
  try {
    const { status, limit = 100, page = 1 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db("calibration_items")
      .select("*")
      .orderBy([
        { column: "next_due", order: "asc" },
        { column: "status",   order: "asc" },
      ])
      .limit(Number(limit))
      .offset(offset);

    if (status) query = query.where("status", status);

    const items = await query;
    res.json({ data: items, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

// GET /calibration/alerts — items due within 14 days or overdue
router.get("/alerts", async (req, res, next) => {
  try {
    const alerts = await db("calibration_items")
      .select("*")
      .where("next_due", "<=", db.raw("NOW() + INTERVAL '14 days'"))
      .whereNot("status", "retired")
      .orderBy("next_due");

    res.json({ count: alerts.length, items: alerts });
  } catch (err) {
    next(err);
  }
});

// GET /calibration/:id — item detail with calibration history
router.get("/:id", async (req, res, next) => {
  try {
    const item = await db("calibration_items").where("id", req.params.id).first();
    if (!item) return res.status(404).json({ error: "Calibration item not found" });

    const records = await db("calibration_records as cr")
      .leftJoin("users as u", "cr.recorded_by", "u.id")
      .select("cr.*", "u.full_name as recorded_by_name")
      .where("cr.item_id", req.params.id)
      .orderBy("cr.calibrated_date", "desc");

    res.json({ ...item, records });
  } catch (err) {
    next(err);
  }
});

// POST /calibration — register a new calibration item
router.post("/", requireRole("senior"), async (req, res, next) => {
  try {
    const { item_ref, description, location, calibration_body, frequency_days, last_calibrated } = req.body;

    if (!item_ref || !description) {
      return res.status(400).json({ error: "item_ref and description are required" });
    }

    const freqDays = Number(frequency_days) || 365;
    const nextDue = last_calibrated
      ? new Date(new Date(last_calibrated).getTime() + freqDays * 86400000).toISOString().slice(0, 10)
      : null;

    const [item] = await db("calibration_items")
      .insert({
        item_ref,
        description,
        location:          location || null,
        calibration_body:  calibration_body || null,
        frequency_days:    freqDays,
        last_calibrated:   last_calibrated || null,
        next_due:          nextDue,
        status:            "active",
      })
      .returning("*");

    res.status(201).json(item);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "item_ref already exists" });
    next(err);
  }
});

// PATCH /calibration/:id — update item details
router.patch("/:id", requireRole("senior"), async (req, res, next) => {
  try {
    const { description, location, calibration_body, frequency_days, status } = req.body;
    const updates = { updated_at: db.fn.now() };

    if (description)       updates.description      = description;
    if (location)          updates.location         = location;
    if (calibration_body)  updates.calibration_body = calibration_body;
    if (frequency_days)    updates.frequency_days   = Number(frequency_days);
    if (status)            updates.status           = status;

    const [item] = await db("calibration_items").where("id", req.params.id).update(updates).returning("*");
    if (!item) return res.status(404).json({ error: "Calibration item not found" });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /calibration/:id/records — log a new calibration record
router.post("/:id/records", requireRole("senior"), async (req, res, next) => {
  try {
    const { calibrated_date, calibrated_by, result, cert_ref, file_id, notes } = req.body;

    if (!calibrated_date || !result) {
      return res.status(400).json({ error: "calibrated_date and result are required" });
    }
    if (!["pass", "fail", "conditional"].includes(result)) {
      return res.status(400).json({ error: "result must be pass, fail, or conditional" });
    }

    const item = await db("calibration_items").where("id", req.params.id).first();
    if (!item) return res.status(404).json({ error: "Calibration item not found" });

    const [record] = await db("calibration_records")
      .insert({
        item_id:        req.params.id,
        calibrated_date,
        calibrated_by:  calibrated_by || null,
        result,
        cert_ref:       cert_ref || null,
        file_id:        file_id  || null,
        notes:          notes    || null,
        recorded_by:    req.user.sub,
      })
      .returning("*");

    // Update the calibration item's last_calibrated + next_due + status
    const nextDue = new Date(
      new Date(calibrated_date).getTime() + item.frequency_days * 86400000
    ).toISOString().slice(0, 10);

    const [updated] = await db("calibration_items")
      .where("id", req.params.id)
      .update({
        last_calibrated: calibrated_date,
        next_due:        nextDue,
        status:          "active",
        updated_at:      db.fn.now(),
      })
      .returning("*");

    res.status(201).json({ record, item: updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
