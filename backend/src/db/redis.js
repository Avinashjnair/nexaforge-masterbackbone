const { createClient } = require("redis");

const client = createClient({
  socket: {
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

client.on("error", (err) => console.error("[Redis]", err));

async function connectRedis() {
  await client.connect();
  console.log("[Redis] connected");
}

module.exports = { client, connectRedis };
