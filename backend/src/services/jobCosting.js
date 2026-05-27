const db = require("../db/knex");

/**
 * Job costing engine — budget vs actual vs committed vs forecast variance
 * per cost category for a given project.
 *
 * Forecast = actual + committed remaining
 * Variance = budget - forecast (positive = under budget)
 */
async function getJobCostSummary(projectId) {
  const rows = await db.raw(`
    SELECT
      cost_type,
      COALESCE(SUM(budgeted_amount), 0)               AS budget,
      COALESCE(SUM(actual_amount), 0)                 AS actual,
      -- committed = AP invoices approved but not yet paid, linked to this project
      COALESCE((
        SELECT SUM(ap.amount)
        FROM ap_invoices ap
        WHERE ap.project_id = jcl.project_id
          AND ap.status IN ('received', 'approved')
      ), 0)                                            AS committed,
      COALESCE(SUM(actual_amount), 0)
        + COALESCE((
            SELECT SUM(ap.amount)
            FROM ap_invoices ap
            WHERE ap.project_id = jcl.project_id
              AND ap.status IN ('received', 'approved')
          ), 0)                                        AS forecast,
      COALESCE(SUM(budgeted_amount), 0)
        - (COALESCE(SUM(actual_amount), 0)
          + COALESCE((
              SELECT SUM(ap.amount)
              FROM ap_invoices ap
              WHERE ap.project_id = jcl.project_id
                AND ap.status IN ('received', 'approved')
            ), 0))                                     AS variance
    FROM job_cost_lines jcl
    WHERE project_id = ?
    GROUP BY cost_type, project_id
    ORDER BY cost_type
  `, [projectId]);

  const lines = rows.rows;

  const totals = lines.reduce((acc, r) => ({
    budget:    acc.budget    + Number(r.budget),
    actual:    acc.actual    + Number(r.actual),
    committed: acc.committed + Number(r.committed),
    forecast:  acc.forecast  + Number(r.forecast),
    variance:  acc.variance  + Number(r.variance),
  }), { budget: 0, actual: 0, committed: 0, forecast: 0, variance: 0 });

  // Contract value for margin calc
  const project = await db("projects").where("id", projectId).select("contract_value").first();
  const contractValue = Number(project?.contract_value || 0);
  const grossMargin = contractValue - totals.forecast;
  const marginPct = contractValue > 0 ? (grossMargin / contractValue) * 100 : null;

  return {
    project_id: projectId,
    contract_value: contractValue,
    by_category: lines,
    totals,
    gross_margin: grossMargin,
    margin_pct: marginPct !== null ? Number(marginPct.toFixed(2)) : null,
  };
}

module.exports = { getJobCostSummary };
