const db = require("../db/knex");
const { publish, TOPICS: BUS_TOPICS } = require("../events/rabbitmq");

// WPS parameter limits — keyed by process type.
// In production these come from the wps table per-joint.
// Used here as safety backstops when no WPS is assigned.
const DEFAULT_LIMITS = {
  GTAW:  { current_min: 80,  current_max: 220, voltage_min: 10, voltage_max: 18,  heat_input_max: 1.5 },
  SMAW:  { current_min: 90,  current_max: 200, voltage_min: 18, voltage_max: 26,  heat_input_max: 2.5 },
  FCAW:  { current_min: 150, current_max: 350, voltage_min: 22, voltage_max: 32,  heat_input_max: 3.0 },
  SAW:   { current_min: 300, current_max: 800, voltage_min: 28, voltage_max: 38,  heat_input_max: 5.0 },
  DEFAULT: { current_min: 0, current_max: 999, voltage_min: 0,  voltage_max: 99,  heat_input_max: 10.0 },
};

const INTERPASS_TEMP_LIMIT_C = 250; // ASME IX default max interpass for most steels

/**
 * Calculate heat input in kJ/mm from welding parameters.
 * Formula: HI = (I × V × 60) / (1000 × travel_speed_mm_per_min)
 * If travel speed unavailable, estimate from empirical default.
 */
function calcHeatInput(current, voltage, travelSpeedMmPerMin = 200) {
  if (!current || !voltage) return null;
  return Number(((current * voltage * 60) / (1000 * travelSpeedMmPerMin)).toFixed(3));
}

/**
 * Process a single telemetry message from MQTT.
 * Validates, persists, and raises alerts if out of range.
 *
 * @param {string} machineId - UUID of the machine
 * @param {object} payload   - raw MQTT message payload
 * @param {object} io        - Socket.io server instance for live push
 */
async function ingestReading(machineId, payload, io) {
  const {
    joint_id,
    current_a,
    voltage_v,
    travel_speed,
    interpass_temp_c,
    wps_process,
    timestamp,
  } = payload;

  const heatInput = calcHeatInput(current_a, voltage_v, travel_speed);
  const limits = DEFAULT_LIMITS[wps_process?.toUpperCase()] || DEFAULT_LIMITS.DEFAULT;

  // If a joint_id is provided, fetch actual WPS limits from DB
  let wpsLimits = limits;
  if (joint_id) {
    try {
      const joint = await db("weld_joints as j")
        .leftJoin("wps as w", "j.wps_id", "w.id")
        .select("w.process")
        .where("j.id", joint_id)
        .first();
      if (joint?.process) {
        wpsLimits = DEFAULT_LIMITS[joint.process.toUpperCase()] || limits;
      }
    } catch {
      // Non-fatal — continue with defaults
    }
  }

  // Persist reading to TimescaleDB
  try {
    await db("iiot_readings").insert({
      time: timestamp ? new Date(timestamp) : new Date(),
      machine_id: machineId,
      joint_id: joint_id || null,
      current_a: current_a ?? null,
      voltage_v: voltage_v ?? null,
      heat_input_kj_mm: heatInput,
      interpass_temp_c: interpass_temp_c ?? null,
      wire_feed_speed: payload.wire_feed_speed ?? null,
    });
  } catch (err) {
    console.error("[IIoT] DB write error:", err.message);
    return;
  }

  // Enrich reading for Socket.io push
  const reading = {
    machineId,
    jointId: joint_id,
    current_a,
    voltage_v,
    heat_input_kj_mm: heatInput,
    interpass_temp_c,
    timestamp: new Date().toISOString(),
    violations: [],
  };

  // ── Violation checks ─────────────────────────────────────────

  // Heat input out of range
  if (heatInput !== null && heatInput > wpsLimits.heat_input_max) {
    const alert = {
      type: "wps_violation",
      machineId,
      jointId: joint_id,
      parameter: "heat_input_kj_mm",
      value: heatInput,
      limit: wpsLimits.heat_input_max,
      message: `Heat input ${heatInput} kJ/mm exceeds WPS max ${wpsLimits.heat_input_max} kJ/mm`,
      timestamp: new Date().toISOString(),
    };
    reading.violations.push(alert);
    await publish(BUS_TOPICS.WPS_VIOLATION || "wps.violation", alert)
      .catch((e) => console.warn("[IIoT] event publish failed:", e.message));
    if (io) io.emit("iiot:violation", alert);
  }

  // Interpass temperature exceeded
  if (interpass_temp_c !== null && interpass_temp_c > INTERPASS_TEMP_LIMIT_C) {
    const alert = {
      type: "interpass_temp_exceeded",
      machineId,
      jointId: joint_id,
      parameter: "interpass_temp_c",
      value: interpass_temp_c,
      limit: INTERPASS_TEMP_LIMIT_C,
      message: `Interpass temp ${interpass_temp_c}°C exceeds max ${INTERPASS_TEMP_LIMIT_C}°C`,
      timestamp: new Date().toISOString(),
    };
    reading.violations.push(alert);
    await publish("interpass.temp.exceeded", alert)
      .catch((e) => console.warn("[IIoT] event publish failed:", e.message));
    if (io) io.emit("iiot:violation", alert);
  }

  // Current out of range
  if (current_a !== null && (current_a < wpsLimits.current_min || current_a > wpsLimits.current_max)) {
    reading.violations.push({
      type: "current_out_of_range",
      machineId,
      parameter: "current_a",
      value: current_a,
      min: wpsLimits.current_min,
      max: wpsLimits.current_max,
    });
  }

  // Push live telemetry to machine room (every reading, no throttle — clients can sample)
  if (io) {
    io.to(`machine:${machineId}`).emit("iiot:telemetry", reading);
    if (joint_id) io.to(`project:${joint_id}`).emit("iiot:telemetry", reading);
  }

  return reading;
}

module.exports = { ingestReading, calcHeatInput, DEFAULT_LIMITS, INTERPASS_TEMP_LIMIT_C };
