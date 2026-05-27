/**
 * S-17A — Advanced Reporting & BI
 *
 * GET /api/reports/project-profitability          JSON
 * GET /api/reports/project-profitability/export   XLSX
 * GET /api/reports/resource-utilisation           JSON
 * GET /api/reports/resource-utilisation/export    XLSX
 * GET /api/reports/executive-summary              JSON (GM only)
 * GET /api/reports/executive-summary/export       PDF  (GM only)
 * GET /api/reports/supplier-performance           JSON
 */

const express = require("express");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const db = require("../db/knex");
const { requireRole, requireDepartment } = require("../middleware/auth");

const router = express.Router();

// ── helpers ────────────────────────────────────────────────────
function num(v) { return Number(v) || 0; }

function addXlsxHeaders(res, filename) {
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
}

function styleHeader(sheet, row) {
  row.eachCell((cell) => {
    cell.fill   = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2D2D6E" } };
    cell.font   = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.border = { bottom: { style: "thin", color: { argb: "FFAAAAAA" } } };
    cell.alignment = { vertical: "middle" };
  });
  row.height = 20;
}

// ── Project Profitability ──────────────────────────────────────
async function getProjectProfitability({ from, to, status } = {}) {
  let q = db.raw(`
    SELECT
      p.project_no,
      p.name                                                     AS project_name,
      p.status,
      p.contract_value,
      p.currency,
      p.progress_pct,
      p.start_date,
      p.due_date,
      COALESCE(cost.total_budget, 0)                            AS total_budget,
      COALESCE(cost.total_actual, 0)                            AS total_actual,
      COALESCE(inv.invoiced_amount, 0)                          AS invoiced,
      COALESCE(inv.paid_amount, 0)                              AS collected,
      -- Earned value = contract × progress
      ROUND(COALESCE(p.contract_value, 0) * p.progress_pct / 100, 2) AS earned_value,
      -- Gross margin
      ROUND(
        COALESCE(p.contract_value, 0)
        - COALESCE(cost.total_actual, 0), 2
      )                                                          AS gross_margin,
      CASE
        WHEN COALESCE(p.contract_value, 0) > 0
        THEN ROUND(
          (COALESCE(p.contract_value, 0) - COALESCE(cost.total_actual, 0))
          / p.contract_value * 100, 1
        )
        ELSE NULL
      END                                                        AS margin_pct,
      -- Cost Performance Index = earned / actual
      CASE
        WHEN COALESCE(cost.total_actual, 0) > 0
        THEN ROUND(
          (COALESCE(p.contract_value, 0) * p.progress_pct / 100)
          / cost.total_actual, 3
        )
        ELSE NULL
      END                                                        AS cpi
    FROM projects p
    LEFT JOIN (
      SELECT project_id,
             SUM(budget_amount) AS total_budget,
             SUM(actual_amount) AS total_actual
      FROM job_cost_lines
      GROUP BY project_id
    ) cost ON cost.project_id = p.id
    LEFT JOIN (
      SELECT project_id,
             SUM(amount)      AS invoiced_amount,
             SUM(paid_amount) AS paid_amount
      FROM invoices
      WHERE status NOT IN ('cancelled','draft')
      GROUP BY project_id
    ) inv ON inv.project_id = p.id
    WHERE p.deleted_at IS NULL
      ${status ? `AND p.status = '${status}'` : ""}
      ${from   ? `AND p.start_date >= '${from}'` : ""}
      ${to     ? `AND p.start_date <= '${to}'`   : ""}
    ORDER BY p.contract_value DESC NULLS LAST
  `);

  const { rows } = await q;
  return rows.map(r => ({
    project_no:     r.project_no,
    project_name:   r.project_name,
    status:         r.status,
    contract_value: num(r.contract_value),
    currency:       r.currency || "USD",
    progress_pct:   num(r.progress_pct),
    start_date:     r.start_date,
    due_date:       r.due_date,
    total_budget:   num(r.total_budget),
    total_actual:   num(r.total_actual),
    invoiced:       num(r.invoiced),
    collected:      num(r.collected),
    earned_value:   num(r.earned_value),
    gross_margin:   num(r.gross_margin),
    margin_pct:     r.margin_pct !== null ? num(r.margin_pct) : null,
    cpi:            r.cpi !== null ? num(r.cpi) : null,
  }));
}

router.get(
  "/project-profitability",
  requireRole("gm", "manager", "senior"),
  async (req, res, next) => {
    try {
      const rows = await getProjectProfitability(req.query);
      const totals = rows.reduce((acc, r) => {
        acc.contract_value += r.contract_value;
        acc.total_actual   += r.total_actual;
        acc.invoiced       += r.invoiced;
        acc.collected      += r.collected;
        acc.gross_margin   += r.gross_margin;
        return acc;
      }, { contract_value: 0, total_actual: 0, invoiced: 0, collected: 0, gross_margin: 0 });
      totals.margin_pct = totals.contract_value > 0
        ? Number(((totals.gross_margin / totals.contract_value) * 100).toFixed(1))
        : null;
      res.json({ projects: rows, totals, generated_at: new Date().toISOString() });
    } catch (err) { next(err); }
  }
);

router.get(
  "/project-profitability/export",
  requireRole("gm", "manager"),
  async (req, res, next) => {
    try {
      const rows = await getProjectProfitability(req.query);
      const wb   = new ExcelJS.Workbook();
      wb.creator = "NexaForge ERP";
      wb.created = new Date();

      const ws = wb.addWorksheet("Project Profitability");
      ws.columns = [
        { header: "Project No",     key: "project_no",     width: 14 },
        { header: "Project Name",   key: "project_name",   width: 32 },
        { header: "Status",         key: "status",         width: 14 },
        { header: "Currency",       key: "currency",       width: 10 },
        { header: "Contract Value", key: "contract_value", width: 16, style: { numFmt: "#,##0.00" } },
        { header: "Actual Cost",    key: "total_actual",   width: 16, style: { numFmt: "#,##0.00" } },
        { header: "Gross Margin",   key: "gross_margin",   width: 16, style: { numFmt: "#,##0.00" } },
        { header: "Margin %",       key: "margin_pct",     width: 12, style: { numFmt: "0.0%" }    },
        { header: "Invoiced",       key: "invoiced",       width: 16, style: { numFmt: "#,##0.00" } },
        { header: "Collected",      key: "collected",      width: 16, style: { numFmt: "#,##0.00" } },
        { header: "Progress %",     key: "progress_pct",   width: 13, style: { numFmt: "0.0%" }    },
        { header: "CPI",            key: "cpi",            width: 10, style: { numFmt: "0.000" }   },
        { header: "Due Date",       key: "due_date",       width: 14 },
      ];

      styleHeader(ws, ws.getRow(1));

      rows.forEach(r => {
        ws.addRow({
          ...r,
          margin_pct:  r.margin_pct !== null ? r.margin_pct / 100 : null,
          progress_pct: r.progress_pct / 100,
        });
      });

      // Totals row
      const totalRow = ws.addRow({
        project_no:     "TOTAL",
        project_name:   "",
        contract_value: rows.reduce((s, r) => s + r.contract_value, 0),
        total_actual:   rows.reduce((s, r) => s + r.total_actual, 0),
        gross_margin:   rows.reduce((s, r) => s + r.gross_margin, 0),
        invoiced:       rows.reduce((s, r) => s + r.invoiced, 0),
        collected:      rows.reduce((s, r) => s + r.collected, 0),
      });
      totalRow.font = { bold: true };
      totalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F0F8" } };

      addXlsxHeaders(res, `project-profitability-${new Date().toISOString().slice(0, 10)}.xlsx`);
      await wb.xlsx.write(res);
      res.end();
    } catch (err) { next(err); }
  }
);

// ── Resource Utilisation ───────────────────────────────────────
async function getResourceUtilisation({ year, month } = {}) {
  const periodStart = year && month
    ? `${year}-${String(month).padStart(2, "0")}-01`
    : db.raw("DATE_TRUNC('month', NOW())").toString();

  const { rows } = await db.raw(`
    SELECT
      e.id                                                       AS employee_id,
      e.employee_no,
      e.full_name,
      e.department,
      e.role,
      COALESCE(SUM(lh.hours), 0)                                AS hours_logged,
      COALESCE(SUM(lh.hours) FILTER (
        WHERE rs.status = 'completed'
      ), 0)                                                      AS productive_hours,
      COUNT(DISTINCT lh.routing_step_id)                         AS steps_worked,
      COALESCE(SUM(lh.hours) FILTER (
        WHERE lh.logged_at >= :start AND lh.logged_at < :start::date + INTERVAL '1 month'
      ), 0)                                                      AS hours_this_period
    FROM employees e
    LEFT JOIN labour_hours lh ON lh.employee_id = e.id
    LEFT JOIN routing_steps rs ON rs.id = lh.routing_step_id
    WHERE e.status = 'active'
    GROUP BY e.id
    ORDER BY e.department, hours_logged DESC
  `, { start: year && month ? periodStart : new Date().toISOString().slice(0, 7) + "-01" });

  // Capacity = 22 working days × 8h = 176 h/month
  const CAPACITY = 176;
  return rows.map(r => ({
    employee_id:      r.employee_id,
    employee_no:      r.employee_no,
    full_name:        r.full_name,
    department:       r.department,
    role:             r.role,
    hours_logged:     num(r.hours_logged),
    productive_hours: num(r.productive_hours),
    hours_this_period:num(r.hours_this_period),
    steps_worked:     num(r.steps_worked),
    utilisation_pct:  Number(((num(r.hours_this_period) / CAPACITY) * 100).toFixed(1)),
    capacity_hours:   CAPACITY,
  }));
}

router.get(
  "/resource-utilisation",
  requireDepartment("hr", "production"),
  async (req, res, next) => {
    try {
      const rows = await getResourceUtilisation(req.query);
      const byDept = rows.reduce((acc, r) => {
        if (!acc[r.department]) acc[r.department] = { dept: r.department, headcount: 0, total_hours: 0, avg_utilisation: 0 };
        acc[r.department].headcount++;
        acc[r.department].total_hours += r.hours_this_period;
        return acc;
      }, {});
      Object.values(byDept).forEach(d => {
        d.avg_utilisation = Number(((d.total_hours / (d.headcount * 176)) * 100).toFixed(1));
      });
      res.json({ employees: rows, by_department: Object.values(byDept), generated_at: new Date().toISOString() });
    } catch (err) { next(err); }
  }
);

router.get(
  "/resource-utilisation/export",
  requireDepartment("hr"),
  async (req, res, next) => {
    try {
      const rows = await getResourceUtilisation(req.query);
      const wb   = new ExcelJS.Workbook();
      wb.creator = "NexaForge ERP";
      const ws   = wb.addWorksheet("Resource Utilisation");

      ws.columns = [
        { header: "Emp No",          key: "employee_no",       width: 12 },
        { header: "Name",            key: "full_name",         width: 26 },
        { header: "Department",      key: "department",        width: 16 },
        { header: "Role",            key: "role",              width: 14 },
        { header: "Hours (Period)",  key: "hours_this_period", width: 16, style: { numFmt: "0.0" } },
        { header: "Capacity (h)",    key: "capacity_hours",    width: 14, style: { numFmt: "0" }   },
        { header: "Utilisation %",   key: "utilisation_pct",   width: 15, style: { numFmt: "0.0%" } },
        { header: "Productive Hrs",  key: "productive_hours",  width: 16, style: { numFmt: "0.0" } },
        { header: "Steps Worked",    key: "steps_worked",      width: 14 },
      ];
      styleHeader(ws, ws.getRow(1));
      rows.forEach(r => ws.addRow({ ...r, utilisation_pct: r.utilisation_pct / 100 }));

      // Conditional formatting: < 50% utilisation highlight orange
      ws.addConditionalFormatting({
        ref: `G2:G${rows.length + 1}`,
        rules: [{
          type: "cellIs", operator: "lessThan", formulae: [0.5],
          style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFFFF3CD" } } },
        }],
      });

      addXlsxHeaders(res, `resource-utilisation-${new Date().toISOString().slice(0, 7)}.xlsx`);
      await wb.xlsx.write(res);
      res.end();
    } catch (err) { next(err); }
  }
);

// ── Executive Summary ─────────────────────────────────────────
async function getExecutiveSummary() {
  const [
    portfolio, finance, qcHealth, supplyChain, hrHealth, pipelineSummary,
  ] = await Promise.all([
    // Portfolio snapshot
    db.raw(`
      SELECT
        COUNT(*)                                                  AS total_projects,
        COUNT(*) FILTER (WHERE status = 'active')                AS active,
        COUNT(*) FILTER (WHERE status = 'completed')             AS completed,
        COUNT(*) FILTER (WHERE due_date < NOW() AND status = 'active') AS overdue,
        COALESCE(SUM(contract_value) FILTER (WHERE status = 'active'), 0) AS backlog_value,
        COALESCE(SUM(contract_value * progress_pct / 100)
          FILTER (WHERE status = 'active'), 0)                   AS earned_to_date,
        ROUND(AVG(progress_pct) FILTER (WHERE status = 'active'), 1) AS avg_progress
      FROM projects WHERE deleted_at IS NULL
    `),

    // Financial KPIs
    db.raw(`
      SELECT
        COALESCE(SUM(amount) FILTER (WHERE status NOT IN ('paid','cancelled')), 0) AS ar_outstanding,
        COALESCE(SUM(amount) FILTER (
          WHERE status IN ('paid')
          AND paid_date >= DATE_TRUNC('month', NOW())
        ), 0)                                                     AS collected_this_month,
        COALESCE(SUM(amount) FILTER (
          WHERE status IN ('paid','sent','partially_paid')
          AND issue_date >= DATE_TRUNC('year', NOW())
        ), 0)                                                     AS revenue_ytd,
        COUNT(*) FILTER (WHERE status = 'overdue')                AS overdue_invoices,
        -- Gross margin YTD from job cost vs invoiced
        COALESCE((
          SELECT SUM(p.contract_value * p.progress_pct / 100)
          FROM projects p WHERE p.status = 'active' AND p.deleted_at IS NULL
        ), 0) -
        COALESCE((
          SELECT SUM(jcl.actual_amount) FROM job_cost_lines jcl
          JOIN projects p2 ON p2.id = jcl.project_id
          WHERE p2.status = 'active' AND p2.deleted_at IS NULL
        ), 0)                                                     AS estimated_margin
      FROM invoices
    `),

    // QC health
    db.raw(`
      SELECT
        COUNT(*) FILTER (WHERE status NOT IN ('closed','cancelled'))    AS open_ncrs,
        COUNT(*) FILTER (
          WHERE severity IN ('critical','major')
          AND status NOT IN ('closed','cancelled')
        )                                                               AS critical_ncrs,
        COUNT(*) FILTER (WHERE status = 'open')                        AS new_ncrs_open,
        COUNT(DISTINCT project_id) FILTER (
          WHERE status NOT IN ('closed','cancelled')
        )                                                               AS projects_with_ncrs
      FROM ncrs
    `),

    // Supply chain
    db.raw(`
      SELECT
        COUNT(*) FILTER (WHERE po.status NOT IN ('cancelled','received'))    AS open_pos,
        COUNT(*) FILTER (
          WHERE po.required_date < NOW()
          AND po.status NOT IN ('cancelled','received')
        )                                                                     AS overdue_pos,
        COUNT(*) FILTER (WHERE mr.status IN ('submitted','open'))             AS pending_mrs
      FROM purchase_orders po
      CROSS JOIN (
        SELECT COUNT(*) AS pending_mrs_count FROM material_requests WHERE status IN ('submitted','open')
      ) AS mr_sub
      LEFT JOIN material_requests mr ON FALSE
    `).catch(() => db.raw(`
      SELECT
        COUNT(*) FILTER (WHERE status NOT IN ('cancelled','received')) AS open_pos,
        COUNT(*) FILTER (
          WHERE required_date < NOW() AND status NOT IN ('cancelled','received')
        ) AS overdue_pos,
        0::int AS pending_mrs
      FROM purchase_orders
    `)),

    // HR health
    db.raw(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active')                           AS headcount,
        COUNT(*) FILTER (WHERE contract_end_date <= NOW() + INTERVAL '30 days'
          AND contract_end_date >= NOW() AND status = 'active')             AS contracts_expiring,
        (SELECT COUNT(*) FROM wpq WHERE expiry_date <= NOW())               AS expired_wpqs,
        (SELECT COUNT(*) FROM wpq
          WHERE expiry_date <= NOW() + INTERVAL '60 days'
          AND expiry_date > NOW())                                           AS expiring_wpqs
      FROM employees
    `),

    // Win rate + pipeline
    db.raw(`
      SELECT
        COUNT(*) FILTER (WHERE stage NOT IN ('won','lost'))                   AS open_opportunities,
        COALESCE(SUM(estimated_value) FILTER (
          WHERE stage NOT IN ('won','lost')
        ), 0)                                                                 AS pipeline_value,
        CASE
          WHEN COUNT(*) FILTER (WHERE stage IN ('won','lost')) > 0
          THEN ROUND(COUNT(*)::numeric FILTER (WHERE stage = 'won')
            / NULLIF(COUNT(*) FILTER (WHERE stage IN ('won','lost')), 0) * 100, 1)
          ELSE NULL
        END                                                                   AS win_rate_pct,
        COALESCE(SUM(estimated_value) FILTER (
          WHERE stage = 'won'
          AND updated_at >= DATE_TRUNC('year', NOW())
        ), 0)                                                                 AS bookings_ytd
      FROM opportunities
    `),
  ]);

  const p  = portfolio.rows[0];
  const f  = finance.rows[0];
  const qc = qcHealth.rows[0];
  const sc = supplyChain.rows[0];
  const h  = hrHealth.rows[0];
  const mk = pipelineSummary.rows[0];

  return {
    generated_at: new Date().toISOString(),
    portfolio: {
      total_projects:  num(p.total_projects),
      active:          num(p.active),
      completed:       num(p.completed),
      overdue:         num(p.overdue),
      backlog_value:   num(p.backlog_value),
      earned_to_date:  num(p.earned_to_date),
      avg_progress:    num(p.avg_progress),
    },
    finance: {
      ar_outstanding:      num(f.ar_outstanding),
      collected_this_month:num(f.collected_this_month),
      revenue_ytd:         num(f.revenue_ytd),
      overdue_invoices:    num(f.overdue_invoices),
      estimated_margin:    num(f.estimated_margin),
    },
    qc: {
      open_ncrs:          num(qc.open_ncrs),
      critical_ncrs:      num(qc.critical_ncrs),
      projects_with_ncrs: num(qc.projects_with_ncrs),
    },
    supply_chain: {
      open_pos:    num(sc.open_pos),
      overdue_pos: num(sc.overdue_pos),
      pending_mrs: num(sc.pending_mrs),
    },
    hr: {
      headcount:            num(h.headcount),
      contracts_expiring:   num(h.contracts_expiring),
      expired_wpqs:         num(h.expired_wpqs),
      expiring_wpqs:        num(h.expiring_wpqs),
    },
    marketing: {
      open_opportunities: num(mk.open_opportunities),
      pipeline_value:     num(mk.pipeline_value),
      win_rate_pct:       mk.win_rate_pct !== null ? num(mk.win_rate_pct) : null,
      bookings_ytd:       num(mk.bookings_ytd),
    },
  };
}

router.get("/executive-summary", requireRole("gm"), async (req, res, next) => {
  try {
    res.json(await getExecutiveSummary());
  } catch (err) { next(err); }
});

router.get("/executive-summary/export", requireRole("gm"), async (req, res, next) => {
  try {
    const data = await getExecutiveSummary();
    const doc  = new PDFDocument({ size: "A4", margin: 40, info: { Title: "NexaForge — Executive Summary" } });
    const chunks = [];
    doc.on("data", c => chunks.push(c));
    doc.on("end",  () => {
      const buf = Buffer.concat(chunks);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="executive-summary-${data.generated_at.slice(0, 10)}.pdf"`);
      res.setHeader("Content-Length", buf.length);
      res.send(buf);
    });

    // ── Title page ────────────────────────────────────────────
    doc.fontSize(22).fillColor("#2D2D6E").text("NexaForge ERP", { align: "center" });
    doc.fontSize(14).fillColor("#555555").text("Executive Summary Report", { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#888888").text(`Generated: ${new Date(data.generated_at).toLocaleString()}`, { align: "center" });
    doc.moveDown(1.5);

    function section(title) {
      doc.moveDown(0.5);
      doc.rect(40, doc.y, 515, 18).fill("#2D2D6E");
      doc.fillColor("#FFFFFF").fontSize(11).text(title, 46, doc.y - 14);
      doc.fillColor("#222222").fontSize(10);
      doc.moveDown(0.6);
    }

    function kv(label, value) {
      doc.text(`  ${label}:  `, { continued: true }).fillColor("#2D2D6E").text(String(value)).fillColor("#222222");
    }

    function money(v) { return v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }

    section("Portfolio");
    kv("Active projects",  data.portfolio.active);
    kv("Overdue",          data.portfolio.overdue);
    kv("Avg progress",     `${data.portfolio.avg_progress}%`);
    kv("Backlog value",    `USD ${money(data.portfolio.backlog_value)}`);
    kv("Earned to date",   `USD ${money(data.portfolio.earned_to_date)}`);

    section("Finance");
    kv("Revenue YTD",          `USD ${money(data.finance.revenue_ytd)}`);
    kv("Collected this month",  `USD ${money(data.finance.collected_this_month)}`);
    kv("AR outstanding",        `USD ${money(data.finance.ar_outstanding)}`);
    kv("Overdue invoices",      data.finance.overdue_invoices);
    kv("Est. project margin",   `USD ${money(data.finance.estimated_margin)}`);

    section("Quality Control");
    kv("Open NCRs",          data.qc.open_ncrs);
    kv("Critical / Major",   data.qc.critical_ncrs);
    kv("Projects affected",  data.qc.projects_with_ncrs);

    section("Supply Chain");
    kv("Open POs",      data.supply_chain.open_pos);
    kv("Overdue POs",   data.supply_chain.overdue_pos);
    kv("Pending MRs",   data.supply_chain.pending_mrs);

    section("HR & Workforce");
    kv("Active headcount",     data.hr.headcount);
    kv("Contracts expiring",   data.hr.contracts_expiring);
    kv("Expired WPQs",         data.hr.expired_wpqs);
    kv("WPQs expiring 60d",    data.hr.expiring_wpqs);

    section("Marketing & CRM");
    kv("Open opportunities", data.marketing.open_opportunities);
    kv("Pipeline value",     `USD ${money(data.marketing.pipeline_value)}`);
    kv("Win rate",           data.marketing.win_rate_pct !== null ? `${data.marketing.win_rate_pct}%` : "N/A");
    kv("Bookings YTD",       `USD ${money(data.marketing.bookings_ytd)}`);

    doc.end();
  } catch (err) { next(err); }
});

// ── Supplier Performance ─────────────────────────────────────
router.get(
  "/supplier-performance",
  requireDepartment("procurement", "finance"),
  async (req, res, next) => {
    try {
      const { rows } = await db.raw(`
        SELECT
          po.vendor_name,
          COUNT(DISTINCT po.id)                                              AS total_pos,
          COALESCE(SUM(po.total_amount), 0)                                 AS total_spend,
          COUNT(DISTINCT g.id)                                               AS total_grns,
          -- OTD
          COUNT(*) FILTER (
            WHERE g.received_date::date <= po.required_date
          )                                                                  AS on_time_deliveries,
          CASE WHEN COUNT(g.id) > 0
            THEN ROUND(COUNT(*)::numeric FILTER (
              WHERE g.received_date::date <= po.required_date
            ) / COUNT(g.id) * 100, 1)
            ELSE NULL
          END                                                                AS otd_pct,
          -- Quality: GRN acceptance rate
          COUNT(*) FILTER (WHERE g.inspection_status = 'accepted')          AS accepted_grns,
          COUNT(*) FILTER (WHERE g.inspection_status = 'rejected')          AS rejected_grns,
          CASE WHEN COUNT(g.id) > 0
            THEN ROUND(COUNT(*)::numeric FILTER (
              WHERE g.inspection_status = 'accepted'
            ) / COUNT(g.id) * 100, 1)
            ELSE NULL
          END                                                                AS acceptance_rate_pct,
          AVG(
            EXTRACT(DAY FROM g.received_date - po.required_date)
          )                                                                  AS avg_delay_days
        FROM purchase_orders po
        LEFT JOIN grn g ON g.po_id = po.id
        WHERE po.vendor_name IS NOT NULL
          ${req.query.from ? `AND po.order_date >= '${req.query.from}'` : ""}
          ${req.query.to   ? `AND po.order_date <= '${req.query.to}'`   : ""}
        GROUP BY po.vendor_name
        ORDER BY total_spend DESC
      `);

      res.json({
        suppliers: rows.map(r => ({
          vendor_name:          r.vendor_name,
          total_pos:            num(r.total_pos),
          total_spend:          num(r.total_spend),
          total_grns:           num(r.total_grns),
          on_time_deliveries:   num(r.on_time_deliveries),
          otd_pct:              r.otd_pct !== null ? num(r.otd_pct) : null,
          accepted_grns:        num(r.accepted_grns),
          rejected_grns:        num(r.rejected_grns),
          acceptance_rate_pct:  r.acceptance_rate_pct !== null ? num(r.acceptance_rate_pct) : null,
          avg_delay_days:       r.avg_delay_days !== null ? Number(Number(r.avg_delay_days).toFixed(1)) : null,
        })),
        generated_at: new Date().toISOString(),
      });
    } catch (err) { next(err); }
  }
);

module.exports = router;
