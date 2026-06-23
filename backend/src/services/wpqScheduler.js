const db = require("../db/knex");

/**
 * WPQ Expiry Scheduler.
 * Runs daily — flags WPQ records expiring within 90 days,
 * and marks expired ones.
 *
 * Call startWpqScheduler() once at startup.
 */

const EXPIRY_WARN_DAYS = 90;

async function runWpqCheck() {
  const now = new Date();
  const warnDate = new Date(now);
  warnDate.setDate(warnDate.getDate() + EXPIRY_WARN_DAYS);

  // Mark expired
  const expired = await db("wpq")
    .where("expiry_date", "<", now)
    .whereNotIn("status", ["expired", "suspended"])
    .update({ status: "expired", updated_at: db.fn.now() })
    .returning("id");

  // Mark expiring_soon
  const expiringSoon = await db("wpq")
    .where("expiry_date", "<=", warnDate)
    .where("expiry_date", ">=", now)
    .where("status", "active")
    .update({ status: "expiring_soon", updated_at: db.fn.now() })
    .returning("id");

  if (expired.length || expiringSoon.length) {
    console.log(
      `[WPQ Scheduler] ${expired.length} expired, ${expiringSoon.length} flagged expiring_soon`
    );
  }

  return { expired: expired.length, expiringSoon: expiringSoon.length };
}

function startWpqScheduler() {
  // Run immediately on startup, then every 24h
  runWpqCheck().catch((e) => console.error("[WPQ Scheduler] run error:", e.message));

  const INTERVAL_MS = 24 * 60 * 60 * 1000;
  setInterval(() => {
    runWpqCheck().catch((e) => console.error("[WPQ Scheduler] run error:", e.message));
  }, INTERVAL_MS);

  console.log("[WPQ Scheduler] started — runs every 24h");
}

module.exports = { startWpqScheduler, runWpqCheck };
