const { getMqttClient } = require("./mqttClient");
const { ingestReading } = require("./telemetryIngester");

/**
 * Register all MQTT topic subscriptions.
 * Called once after MQTT client is connected.
 *
 * @param {object} io - Socket.io server instance
 */
function registerSubscriptions(io) {
  const client = getMqttClient();
  if (!client) {
    console.warn("[MQTT] subscriber setup skipped — no client");
    return;
  }

  // Subscribe to all machine telemetry
  client.subscribe("machines/+/telemetry", { qos: 1 }, (err) => {
    if (err) console.error("[MQTT] subscribe error (telemetry):", err.message);
    else console.log("[MQTT] subscribed: machines/+/telemetry");
  });

  // Subscribe to machine alert topics
  client.subscribe("machines/+/alerts", { qos: 1 }, (err) => {
    if (err) console.error("[MQTT] subscribe error (alerts):", err.message);
    else console.log("[MQTT] subscribed: machines/+/alerts");
  });

  client.on("message", async (topic, messageBuffer) => {
    let payload;
    try {
      payload = JSON.parse(messageBuffer.toString());
    } catch {
      console.warn("[MQTT] invalid JSON on topic:", topic);
      return;
    }

    // Extract machine_id from topic: machines/{machine_id}/telemetry
    const parts = topic.split("/");
    const machineId = parts[1];
    const messageType = parts[2];

    if (messageType === "telemetry") {
      await ingestReading(machineId, payload, io).catch((err) =>
        console.error("[MQTT] ingestion error:", err.message)
      );
    } else if (messageType === "alerts") {
      // Machine-generated alerts (e.g. wire fault, arc loss)
      console.log(`[MQTT] machine alert from ${machineId}:`, payload);
      if (io) io.emit("iiot:machine_alert", { machineId, ...payload });
    }
  });

  console.log("[MQTT] all subscriptions registered");
}

module.exports = { registerSubscriptions };
