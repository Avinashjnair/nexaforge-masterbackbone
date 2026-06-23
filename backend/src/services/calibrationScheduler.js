const db = require("../db/knex");

/**
 * Daily calibration check — runs at startup and every 24h.
 * Flags items due within 14 days as 'due_soon' and overdue items as 'overdue'.
 * Returns a summary for logging.
 */
async function runCalibrationCheck(io) {
  const now = new Date();
  const in14Days = new Date(now.getTime() + 14 * 86400000).toISOString().slice(0, 10);
  const today    = now.toISOString().slice(0, 10);

  // Mark overdue
  const overdueUpdated = await db("calibration_items")
    .where("next_due", "<", today)
    .whereNot("status", "retired")
    .update({ status: "overdue", updated_at: db.fn.now() });

  // Mark due_soon (within 14 days, not already overdue or retired)
  const dueSoonUpdated = await db("calibration_items")
    .where("next_due", ">=", today)
    .where("next_due", "<=", in14Days)
    .whereIn("status", ["active", "due_soon"])
    .update({ status: "due_soon", updated_at: db.fn.now() });

  // Collect items to push as alerts
  const alertItems = await db("calibration_items")
    .whereIn("status", ["overdue", "due_soon"])
    .whereNot("status", "retired")
    .select("id", "item_ref", "description", "next_due", "status");

  if (alertItems.length > 0 && io) {
    io.to("dept:qc").emit("calibration:alerts", {
      type:    "calibration:alerts",
      overdue: alertItems.filter((i) => i.status === "overdue").length,
      due_soon:alertItems.filter((i) => i.status === "due_soon").length,
      items:   alertItems,
    });
  }

  console.log(
    `[Calibration] check complete — ${overdueUpdated} overdue, ${dueSoonUpdated} due_soon`
  );
  return { overdue: overdueUpdated, due_soon: dueSoonUpdated };
}

function startCalibrationScheduler(io) {
  // Run immediately on startup, then every 24h
  runCalibrationCheck(io).catch((e) =>
    console.error("[Calibration] scheduler error:", e.message)
  );
  setInterval(
    () => runCalibrationCheck(io).catch((e) => console.error("[Calibration] scheduler error:", e.message)),
    24 * 60 * 60 * 1000
  );
}

module.exports = { startCalibrationScheduler, runCalibrationCheck };
