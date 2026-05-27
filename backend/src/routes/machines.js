const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");
const { mqttPublish } = require("../iiot/mqttClient");

const router = express.Router();

// In-memory machine registry — updated by telemetry ingester.
// In production this would be a Redis hash.
const machineRegistry = new Map();

function updateMachineState(machineId, reading) {
  machineRegistry.set(machineId, {
    machine_id: machineId,
    last_seen: reading.timestamp || new Date().toISOString(),
    last_reading: reading,
    status: reading.violations?.length ? "alert" : "running",
  });
}

// GET /machines — all machines with current status
router.get("/", async (req, res, next) => {
  try {
    // Merge registry (live) with DB-known machines if we had a machines table.
    // For now return the live registry augmented with latest DB row per machine.
    const liveList = Array.from(machineRegistry.values());

    if (liveList.length === 0) {
      // Fall back to distinct machine_ids seen in iiot_readings in last 24h
      const rows = await db("iiot_readings")
        .select("machine_id")
        .where("time", ">=", db.raw("NOW() - INTERVAL '24 hours'"))
        .groupBy("machine_id");
      return res.json(
        rows.map((r) => ({
          machine_id: r.machine_id,
          status: "idle",
          last_seen: null,
          last_reading: null,
        }))
      );
    }

    res.json(liveList);
  } catch (err) {
    next(err);
  }
});

// GET /machines/:id/telemetry — last N readings
router.get("/:id/telemetry", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 1000);
    const since = req.query.since; // ISO timestamp

    let query = db("iiot_readings")
      .where("machine_id", req.params.id)
      .orderBy("time", "desc")
      .limit(limit)
      .select("time", "machine_id", "joint_id", "current_a", "voltage_v", "heat_input_kj_mm", "interpass_temp_c", "wire_feed_speed");

    if (since) query = query.where("time", ">=", new Date(since));

    const readings = await query;
    res.json({ machine_id: req.params.id, count: readings.length, readings });
  } catch (err) {
    next(err);
  }
});

// GET /machines/:id/heat-log/:jointId — heat input time-series for a specific weld joint
router.get("/:id/heat-log/:jointId", async (req, res, next) => {
  try {
    const readings = await db("iiot_readings")
      .where({ machine_id: req.params.id, joint_id: req.params.jointId })
      .orderBy("time")
      .select("time", "current_a", "voltage_v", "heat_input_kj_mm", "interpass_temp_c");

    // Fetch WPS limits for context
    const joint = await db("weld_joints as j")
      .leftJoin("wps as w", "j.wps_id", "w.id")
      .select("j.joint_no", "w.wps_no", "w.process")
      .where("j.id", req.params.jointId)
      .first();

    res.json({
      machine_id: req.params.id,
      joint_id: req.params.jointId,
      joint_no: joint?.joint_no,
      wps_no: joint?.wps_no,
      wps_process: joint?.process,
      reading_count: readings.length,
      readings,
    });
  } catch (err) {
    next(err);
  }
});

// GET /iot/alerts — active alerts (violations from last 1 hour)
router.get("/alerts", async (req, res, next) => {
  try {
    // Query recent readings with heat_input above threshold as a proxy for alerts
    // Full alert store would use Redis in production
    const violations = await db.raw(`
      SELECT
        r.time,
        r.machine_id,
        r.joint_id,
        r.current_a,
        r.voltage_v,
        r.heat_input_kj_mm,
        r.interpass_temp_c,
        j.joint_no,
        p.project_no
      FROM iiot_readings r
      LEFT JOIN weld_joints j ON r.joint_id = j.id
      LEFT JOIN projects p ON j.project_id = p.id
      WHERE r.time >= NOW() - INTERVAL '1 hour'
        AND (
          r.heat_input_kj_mm > 3.0           -- broad threshold; per-WPS check done at ingest
          OR r.interpass_temp_c > 250
        )
      ORDER BY r.time DESC
      LIMIT 200
    `);

    res.json({ alert_count: violations.rows.length, alerts: violations.rows });
  } catch (err) {
    next(err);
  }
});

module.exports = { router, updateMachineState };
