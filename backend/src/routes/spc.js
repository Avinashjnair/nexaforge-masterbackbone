const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");
const { calculate } = require("../services/spcCalculator");

const router = express.Router();

// POST /spc/readings — submit a set of SPC measurements and auto-calculate chart
router.post("/readings", requireRole("senior"), async (req, res, next) => {
  try {
    const { project_id, characteristic, nominal, usl, lsl, readings, unit } = req.body;

    if (!project_id || !characteristic || nominal == null || usl == null || lsl == null || !readings) {
      return res.status(400).json({ error: "project_id, characteristic, nominal, usl, lsl, and readings are required" });
    }
    if (!Array.isArray(readings) || readings.length < 2) {
      return res.status(400).json({ error: "readings must be an array of at least 2 numbers" });
    }
    if (lsl >= usl) {
      return res.status(400).json({ error: "lsl must be less than usl" });
    }

    const nums = readings.map(Number);
    if (nums.some(isNaN)) {
      return res.status(400).json({ error: "all readings must be numeric" });
    }

    // Persist raw readings
    const [readingRow] = await db("spc_readings")
      .insert({
        project_id,
        characteristic,
        nominal:     Number(nominal),
        usl:         Number(usl),
        lsl:         Number(lsl),
        readings:    JSON.stringify(nums),
        unit:        unit || null,
        recorded_by: req.user.sub,
      })
      .returning("*");

    // Calculate and persist chart
    const chart = calculate(nums, Number(usl), Number(lsl));
    let chartRow = null;
    if (chart) {
      [chartRow] = await db("spc_control_charts")
        .insert({
          spc_reading_id:        readingRow.id,
          project_id,
          characteristic,
          xbar:                  chart.xbar,
          r_bar:                 chart.r_bar,
          sigma:                 chart.sigma,
          ucl:                   chart.ucl,
          lcl:                   chart.lcl,
          cpk:                   chart.cpk,
          cp:                    chart.cp,
          out_of_control_points: JSON.stringify(chart.out_of_control_points),
        })
        .returning("*");
    }

    res.status(201).json({ reading: readingRow, chart: chartRow });
  } catch (err) {
    next(err);
  }
});

// GET /spc/:project_id/charts — all SPC charts for a project
router.get("/:project_id/charts", async (req, res, next) => {
  try {
    const charts = await db("spc_control_charts as c")
      .join("spc_readings as r", "c.spc_reading_id", "r.id")
      .leftJoin("users as u", "r.recorded_by", "u.id")
      .select(
        "c.*",
        "r.nominal", "r.usl", "r.lsl", "r.readings", "r.unit",
        "r.created_at as recorded_at",
        "u.full_name as recorded_by_name"
      )
      .where("c.project_id", req.params.project_id)
      .orderBy("r.created_at", "desc");

    res.json({ project_id: req.params.project_id, charts });
  } catch (err) {
    next(err);
  }
});

// GET /spc/:project_id/charts/:characteristic — latest chart for one characteristic
router.get("/:project_id/charts/:characteristic", async (req, res, next) => {
  try {
    const chart = await db("spc_control_charts as c")
      .join("spc_readings as r", "c.spc_reading_id", "r.id")
      .leftJoin("users as u", "r.recorded_by", "u.id")
      .select(
        "c.*",
        "r.nominal", "r.usl", "r.lsl", "r.readings", "r.unit",
        "r.created_at as recorded_at",
        "u.full_name as recorded_by_name"
      )
      .where("c.project_id", req.params.project_id)
      .where("c.characteristic", req.params.characteristic)
      .orderBy("r.created_at", "desc")
      .first();

    if (!chart) return res.status(404).json({ error: "No SPC chart found for this characteristic" });
    res.json(chart);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
