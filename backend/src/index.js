require("dotenv").config();
const http = require("http");
const app = require("./app");
const db = require("./db/knex");
const { connectRedis } = require("./db/redis");
const { connectRabbitMQ } = require("./events/rabbitmq");
const { registerSubscribers } = require("./events/subscribers");
const { createWebSocketServer } = require("./websocket");
const { startWpqScheduler } = require("./services/wpqScheduler");
const { startCalibrationScheduler } = require("./services/calibrationScheduler");
const { startVendorScoringScheduler } = require("./services/vendorScorer");
const { ensureBucket } = require("./services/storage");
const { connectMqtt } = require("./iiot/mqttClient");
const { registerSubscriptions } = require("./iiot/mqttSubscriber");

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await db.raw("SELECT 1");
    console.log("[DB] PostgreSQL connected");

    await connectRedis();

    const httpServer = http.createServer(app);
    const io = createWebSocketServer(httpServer);
    app.setIo(io); // inject io into req for comment mention pushes (NEW-08)

    // RabbitMQ is optional in dev — don't crash if not available
    try {
      await connectRabbitMQ();
      await registerSubscribers(io);
    } catch (err) {
      console.warn("[RabbitMQ] unavailable, event bus disabled:", err.message);
    }

    startWpqScheduler();
    startCalibrationScheduler(io);
    startVendorScoringScheduler(io);

    // MinIO bucket setup (non-fatal — dev may not have MinIO running)
    await ensureBucket().catch((e) =>
      console.warn("[MinIO] bucket setup skipped:", e.message)
    );

    // MQTT broker (non-fatal — dev may not have Mosquitto running)
    try {
      await connectMqtt();
      registerSubscriptions(io);
    } catch (err) {
      console.warn("[MQTT] unavailable, IIoT telemetry disabled:", err.message);
    }

    httpServer.listen(PORT, () => {
      console.log(`[API] NexaForge ERP running on port ${PORT}`);
      console.log(`[WS]  WebSocket server ready`);
      // Signal PM2 that the process is ready (ecosystem.config.js wait_ready: true)
      if (process.send) process.send("ready");
    });
  } catch (err) {
    console.error("[Startup] Fatal error:", err.message);
    process.exit(1);
  }
}

start();
