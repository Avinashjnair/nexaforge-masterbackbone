const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");
const { scoreVendorsForMonth } = require("../services/vendorScorer");

const router = express.Router();

// GET /vendors/quality — all vendor scores (latest 6 months per vendor)
router.get("/", async (req, res, next) => {
  try {
    const { vendor_name } = req.query;

    let query = db("vendor_quality_scores")
      .select("*")
      .orderBy([{ column: "vendor_name" }, { column: "period_month", order: "desc" }])
      .limit(200);

    if (vendor_name) query = query.whereILike("vendor_name", `%${vendor_name}%`);

    res.json(await query);
  } catch (err) {
    next(err);
  }
});

// GET /vendors/quality/:vendor_name — score history for one vendor (URL-encoded)
router.get("/:vendor_name", async (req, res, next) => {
  try {
    const name = decodeURIComponent(req.params.vendor_name);

    const scores = await db("vendor_quality_scores")
      .where("vendor_name", name)
      .orderBy("period_month", "desc")
      .limit(12);

    if (!scores.length) return res.status(404).json({ error: "No quality scores found for this vendor" });

    const latest     = scores[0];
    const sixMonthAvg = scores.slice(0, 6).reduce((s, r) => s + Number(r.score_pct || 0), 0) / Math.min(6, scores.length);

    res.json({
      vendor_name:   name,
      latest_score:  latest.score_pct,
      avg_6m:        +sixMonthAvg.toFixed(2),
      below_threshold: Number(latest.score_pct) < 80,
      history:       scores,
    });
  } catch (err) {
    next(err);
  }
});

// POST /vendors/quality/run — trigger manual scoring run (GM/manager only)
router.post("/run", requireRole("manager"), async (req, res, next) => {
  try {
    const { month } = req.body; // "YYYY-MM"
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: "month must be in YYYY-MM format" });
    }

    const result = await scoreVendorsForMonth(month);
    res.json({ month, ...result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
