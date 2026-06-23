const mqtt = require("mqtt");
const fs   = require("fs");

let client = null;

const TOPICS = {
  TELEMETRY: "machines/+/telemetry",   // + = wildcard for machine_id
  ALERTS:    "machines/+/alerts",
};

function getMqttClient() {
  return client;
}

/**
 * Build TLS options when MQTT_URL uses mqtts:// or MQTT_TLS=true.
 * CA cert path set via MQTT_CA_CERT env var (defaults to mosquitto/certs/ca.crt).
 * In dev with self-signed certs set MQTT_REJECT_UNAUTHORIZED=false.
 */
function buildTlsOptions(url) {
  const isTls = url.startsWith("mqtts://") || process.env.MQTT_TLS === "true";
  if (!isTls) return {};

  const rejectUnauthorized = process.env.MQTT_REJECT_UNAUTHORIZED !== "false";
  const caPath = process.env.MQTT_CA_CERT || "mosquitto/certs/ca.crt";

  const tlsOpts = { rejectUnauthorized };

  if (fs.existsSync(caPath)) {
    tlsOpts.ca = fs.readFileSync(caPath);
    console.log("[MQTT] TLS CA loaded from", caPath);
  } else if (rejectUnauthorized) {
    console.warn("[MQTT] TLS enabled but CA cert not found at", caPath, "— connection may fail");
  }

  return tlsOpts;
}

/**
 * Connect to the MQTT broker and return the client.
 * Resolves when the connection is established.
 */
function connectMqtt() {
  return new Promise((resolve, reject) => {
    const url = process.env.MQTT_URL || "mqtt://localhost:1883";
    const tlsOptions = buildTlsOptions(url);

    client = mqtt.connect(url, {
      clientId: `nexaforge-api-${process.pid}`,
      reconnectPeriod: 5000,
      connectTimeout: 10000,
      username: process.env.MQTT_USERNAME || undefined,
      password: process.env.MQTT_PASSWORD || undefined,
      ...tlsOptions,
    });

    client.once("connect", () => {
      console.log("[MQTT] connected to broker:", url);
      resolve(client);
    });

    client.once("error", (err) => {
      console.error("[MQTT] connection error:", err.message);
      reject(err);
    });

    client.on("reconnect", () => console.log("[MQTT] reconnecting..."));
    client.on("offline",   () => console.warn("[MQTT] offline"));
  });
}

/**
 * Publish a message to a topic.
 */
function mqttPublish(topic, payload) {
  if (!client?.connected) {
    console.warn("[MQTT] publish skipped — not connected:", topic);
    return;
  }
  client.publish(topic, JSON.stringify(payload), { qos: 1 });
}

module.exports = { connectMqtt, getMqttClient, mqttPublish, TOPICS };
