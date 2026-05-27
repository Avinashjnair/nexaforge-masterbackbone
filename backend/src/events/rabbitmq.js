const amqp = require("amqplib");

let connection = null;
let channel = null;

const EXCHANGE = "nexaforge.events";

async function connectRabbitMQ() {
  connection = await amqp.connect(process.env.RABBITMQ_URL || "amqp://localhost");
  channel = await connection.createConfirmChannel();
  await channel.assertExchange(EXCHANGE, "topic", { durable: true });
  console.log("[RabbitMQ] connected, exchange:", EXCHANGE);

  connection.on("error", (err) => console.error("[RabbitMQ] connection error:", err.message));
  connection.on("close", () => console.warn("[RabbitMQ] connection closed — will not auto-reconnect in dev"));
}

async function publish(routingKey, payload) {
  if (!channel) {
    console.warn("[RabbitMQ] publish skipped — not connected:", routingKey);
    return;
  }
  const content = Buffer.from(JSON.stringify({ ...payload, _ts: Date.now() }));
  await channel.publish(EXCHANGE, routingKey, content, {
    persistent: true,
    contentType: "application/json",
  });
}

async function subscribe(routingKey, queueName, handler) {
  if (!channel) throw new Error("RabbitMQ not connected");
  const q = await channel.assertQueue(queueName, { durable: true });
  await channel.bindQueue(q.queue, EXCHANGE, routingKey);
  channel.consume(q.queue, async (msg) => {
    if (!msg) return;
    try {
      const payload = JSON.parse(msg.content.toString());
      await handler(payload);
      channel.ack(msg);
    } catch (err) {
      console.error(`[RabbitMQ] handler error on ${routingKey}:`, err.message);
      channel.nack(msg, false, false); // dead-letter, don't requeue infinitely
    }
  });
}

const TOPICS = {
  // S-02
  PROJECT_PHASE_CHANGED:  "project.phase.changed",
  NCR_RAISED:             "ncr.raised",
  HOLD_POINT_TRIGGERED:   "hold.point.triggered",
  MATERIAL_REQUEST_RAISED:"material.request.raised",
  MILESTONE_TRIGGERED:    "milestone.triggered",

  // S-10 (ARCH-02, ARCH-03, NEW-04)
  GM_INTERVENTION:        "gm.intervention",
  RUSH_ORDER_TRIGGERED:   "rush.order.triggered",
  PROJECT_ASSIGNED:       "project.assigned",
  BOQ_GENERATED:          "boq.generated",
  GRN_RECEIVED:           "grn.received",
  INSPECTION_PASSED:      "inspection.passed",
  DEVIATION_REQUESTED:    "deviation.requested",
  KAIZEN_SUBMITTED:       "kaizen.submitted",
  SITE_VISIT_REQUESTED:   "site.visit.requested",

  // S-12
  DEVIATION_APPROVED:        "deviation.approved",
  DEVIATION_REJECTED:        "deviation.rejected",
  MRP_REPLENISHMENT_TRIGGERED: "mrp.replenishment.triggered",
  QUALITY_GATE_FAILED:       "quality.gate.failed",
};

module.exports = { connectRabbitMQ, publish, subscribe, TOPICS };
