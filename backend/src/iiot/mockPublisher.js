/**
 * Mock MQTT Publisher — simulates two welding machines at 1 Hz.
 * Run standalone for dev testing:   node src/iiot/mockPublisher.js
 *
 * Machine A: GTAW, normally within WPS limits
 * Machine B: SMAW, occasionally triggers heat input violation
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mqtt = require("mqtt");

const BROKER_URL = process.env.MQTT_URL || "mqtt://localhost:1883";

const MACHINES = [
  {
    id: "mach-0001-gtaw",
    process: "GTAW",
    joint_id: null,
    // Normal operating range: 150A, 14V → HI ≈ 0.63 kJ/mm (well under 1.5 limit)
    base: { current: 150, voltage: 14, travel: 200, interpass: 120 },
    jitter: { current: 15, voltage: 1.5, interpass: 20 },
    violationEvery: null, // no violations for this machine
  },
  {
    id: "mach-0002-smaw",
    process: "SMAW",
    joint_id: null,
    // Normal: 160A, 22V → HI ≈ 1.06 kJ/mm; violation burst: 220A, 26V → HI ≈ 2.86 kJ/mm (over 2.5)
    base: { current: 160, voltage: 22, travel: 180, interpass: 180 },
    jitter: { current: 20, voltage: 2,  interpass: 30 },
    violationEvery: 15, // every 15 ticks, spike to trigger violation
  },
];

function jitter(base, range) {
  return base + (Math.random() - 0.5) * range * 2;
}

function buildReading(machine, tick) {
  const isViolation = machine.violationEvery && tick % machine.violationEvery === 0;

  const current     = isViolation ? machine.base.current * 1.4  : jitter(machine.base.current, machine.jitter.current);
  const voltage     = isViolation ? machine.base.voltage * 1.2  : jitter(machine.base.voltage, machine.jitter.voltage);
  const travelSpeed = machine.base.travel;
  const interpass   = isViolation ? 270 : jitter(machine.base.interpass, machine.jitter.interpass);

  return {
    machine_id:       machine.id,
    joint_id:         machine.joint_id,
    wps_process:      machine.process,
    current_a:        Number(current.toFixed(1)),
    voltage_v:        Number(voltage.toFixed(1)),
    travel_speed:     travelSpeed,
    interpass_temp_c: Number(interpass.toFixed(1)),
    wire_feed_speed:  machine.process === "GTAW" ? null : Number(jitter(5, 1).toFixed(2)),
    timestamp:        new Date().toISOString(),
    _simulated:       true,
    _violation_tick:  isViolation,
  };
}

const client = mqtt.connect(BROKER_URL, { clientId: "nexaforge-mock-publisher" });

client.on("connect", () => {
  console.log(`[MockPublisher] connected to ${BROKER_URL}`);
  console.log("[MockPublisher] publishing telemetry at 1 Hz for 2 machines...\n");

  let tick = 0;
  setInterval(() => {
    tick++;
    MACHINES.forEach((machine) => {
      const reading = buildReading(machine, tick);
      const topic = `machines/${machine.id}/telemetry`;
      client.publish(topic, JSON.stringify(reading), { qos: 1 });

      const marker = reading._violation_tick ? " ⚠ VIOLATION" : "";
      console.log(
        `[${machine.id}] A=${reading.current_a}A  V=${reading.voltage_v}V  ` +
        `HI=${((reading.current_a * reading.voltage_v * 60) / (1000 * machine.base.travel)).toFixed(3)}kJ/mm  ` +
        `IT=${reading.interpass_temp_c}°C${marker}`
      );
    });
  }, 1000);
});

client.on("error", (err) => {
  console.error("[MockPublisher] error:", err.message);
  process.exit(1);
});
