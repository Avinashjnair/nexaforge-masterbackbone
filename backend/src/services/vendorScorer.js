const db = require("../db/knex");

/**
 * ENH-05 — Vendor quality scoring.
 * Runs monthly (or on demand). Joins purchase_orders → grn to compute
 * acceptance rates per vendor for the target month.
 */
async function scoreVendorsForMonth(targetMonth) {
  // targetMonth: "YYYY-MM" string
  const periodStart = `${targetMonth}-01`;
  const periodEnd   = new Date(
    new Date(periodStart).getFullYear(),
    new Date(periodStart).getMonth() + 1,
    1
  ).toISOString().slice(0, 10);

  // Aggregate GRN data by vendor for the target month
  const rows = await db.raw(`
    SELECT
      po.vendor_name,
      COUNT(DISTINCT po.id)                                     AS po_count,
      COUNT(g.id)                                               AS grn_count,
      COUNT(g.id) FILTER (WHERE g.inspection_status = 'accepted'
        OR g.inspection_status = 'partially_accepted')         AS accepted,
      COUNT(g.id) FILTER (WHERE g.inspection_status = 'rejected') AS rejected,
      CASE
        WHEN COUNT(g.id) > 0
        THEN ROUND(
          COUNT(g.id)::numeric FILTER (
            WHERE g.inspection_status IN ('accepted','partially_accepted')
          ) / COUNT(g.id) * 100, 2
        )
        ELSE NULL
      END                                                       AS score_pct
    FROM purchase_orders po
    LEFT JOIN grn g
      ON g.po_id = po.id
     AND g.received_date >= :periodStart
     AND g.received_date <  :periodEnd
    WHERE po.required_date >= :periodStart
      AND po.required_date <  :periodEnd
    GROUP BY po.vendor_name
    HAVING COUNT(g.id) > 0 OR COUNT(po.id) > 0
  `, { periodStart, periodEnd });

  const scores = rows.rows;
  let upserted = 0;

  for (const row of scores) {
    await db("vendor_quality_scores")
      .insert({
        vendor_name:  row.vendor_name,
        period_month: periodStart,
        po_count:     Number(row.po_count   || 0),
        grn_count:    Number(row.grn_count  || 0),
        accepted:     Number(row.accepted   || 0),
        rejected:     Number(row.rejected   || 0),
        score_pct:    row.score_pct !== null ? Number(row.score_pct) : null,
      })
      .onConflict(["vendor_name", "period_month"])
      .merge(["po_count", "grn_count", "accepted", "rejected", "score_pct", "updated_at"]);
    upserted++;
  }

  // Flag vendors below 80% to Procurement via return value — caller emits WS
  const alerts = scores.filter(
    (r) => r.score_pct !== null && Number(r.score_pct) < 80
  );

  console.log(`[VendorScorer] ${targetMonth} — scored ${upserted} vendors, ${alerts.length} below 80%`);
  return { scored: upserted, alerts };
}

function startVendorScoringScheduler(io) {
  // Run on the 1st of every month at 02:00 server time
  function scheduleNext() {
    const now      = new Date();
    const nextRun  = new Date(now.getFullYear(), now.getMonth() + 1, 1, 2, 0, 0);
    const delayMs  = nextRun - now;

    setTimeout(async () => {
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString().slice(0, 7);
      try {
        const result = await scoreVendorsForMonth(prevMonth);
        if (io && result.alerts.length > 0) {
          io.to("dept:procurement").emit("vendor:quality_alerts", {
            type:       "vendor:quality_alerts",
            period:     prevMonth,
            alert_count:result.alerts.length,
            alerts:     result.alerts,
          });
        }
      } catch (err) {
        console.error("[VendorScorer] monthly run failed:", err.message);
      }
      scheduleNext();
    }, delayMs);
  }

  scheduleNext();
  console.log("[VendorScorer] monthly scheduler armed");
}

module.exports = { scoreVendorsForMonth, startVendorScoringScheduler };
