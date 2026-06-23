/* ============================================================
   NexaForge ERP — Finance Tab Renderers (part 2)
   ============================================================ */

'use strict';

// Fallback mock datasets for demo mode
if (typeof MOCK_LEDGER_ENTRIES === 'undefined') {
  window.MOCK_LEDGER_ENTRIES = [
    { id: 'ent-1', project_id: 'P-2401', category: 'material', description: '316L SS plate issue', reference_type: 'material_issue', reference_id: 'MI-8491', quantity: 5.2, unit_rate: 13000, total_amount: 67600, posting_date: '2025-03-10', is_reversed: false },
    { id: 'ent-2', project_id: 'P-2401', category: 'labour', description: 'Welding hours — K. Suresh', reference_type: 'timesheet', reference_id: 'TS-941', quantity: 40, unit_rate: 350, total_amount: 14000, posting_date: '2025-04-12', is_reversed: false },
    { id: 'ent-3', project_id: 'P-2401', category: 'subcontract', description: 'NDE RT services', reference_type: 'po_grn', reference_id: 'GRN-491', quantity: 1, unit_rate: 8600, total_amount: 8600, posting_date: '2025-04-15', is_reversed: false },
  ];
}
if (typeof MOCK_JOB_COST === 'undefined') {
  window.MOCK_JOB_COST = {
    'P-2401': { contract_value: 284000, lines: [
      { id: 'l1', cost_type:'material',    description:'316L SS plate (shell & roof)',    budgeted_amount:68400, actual_amount:71200, committed_amount:0 },
      { id: 'l2', cost_type:'material',    description:'Nozzle package & flanges',        budgeted_amount:14800, actual_amount:13650, committed_amount:1200 },
      { id: 'l3', cost_type:'labour',      description:'Welding (GTAW/SMAW)',             budgeted_amount:22400, actual_amount:14800, committed_amount:9600 },
      { id: 'l4', cost_type:'labour',      description:'Fitting & rolling labour',        budgeted_amount:16800, actual_amount:12200, committed_amount:4400 },
      { id: 'l5', cost_type:'subcontract', description:'NDT — RT & UT (external)',        budgeted_amount:12400, actual_amount:8600,  committed_amount:3800 },
      { id: 'l6', cost_type:'overhead',    description:'Overhead allocation (28%)',       budgeted_amount:52000, actual_amount:38000, committed_amount:14000 },
    ]},
    'P-2402': { contract_value: 97500, lines: [
      { id: 'l10', cost_type:'material',    description:'SA-240 304 plate',               budgeted_amount:22000, actual_amount:0,     committed_amount:22000 },
      { id: 'l11', cost_type:'material',    description:'2:1 Ellipsoidal heads',           budgeted_amount:8400,  actual_amount:0,     committed_amount:5600 },
      { id: 'l12', cost_type:'labour',      description:'Fabrication labour',              budgeted_amount:18000, actual_amount:3200,  committed_amount:14800 },
    ] },
    'P-2403': { contract_value: 142000, lines: [
      { id: 'l20', cost_type:'material',    description:'304 SS tube bundle (420m)',       budgeted_amount:28000, actual_amount:28000, committed_amount:0 },
      { id: 'l21', cost_type:'material',    description:'Replacement tube sheet (pending)',budgeted_amount:0,     actual_amount:9200,  committed_amount:0 },
    ] },
  };
}


/* ─────────────────────────────────────────────────────────────
   HELPERS & COMMON COMPONENTS
   ───────────────────────────────────────────────────────────── */
function renderSubTabs(tabs, active, onSwitch) {
  return `
    <div class="fin-subtabs-bar" style="display:flex;gap:4px;border-bottom:1px solid var(--border);padding-bottom:10px;margin-bottom:18px">
      ${tabs.map(t => `
        <button class="btn ${t.id === active ? 'btn-primary' : 'btn-secondary'} btn-xs" 
                onclick="${onSwitch}('${t.id}')" 
                style="border-radius:var(--radius-sm)">
          ${t.label}
        </button>`).join('')}
    </div>
  `;
}

/* ═══════════════════════════════════════════════════════════
   TAB 1 — EXECUTIVE OVERVIEW (Bento Grid)
   ═══════════════════════════════════════════════════════════ */
async function renderFinOverview() {
  const contentEl = document.getElementById('finTabContent');
  contentEl.innerHTML = `<div style="padding:40px;text-align:center"><div class="spinner"></div>Loading overview data...</div>`;

  let kpis = { monthlyRevenue: 90500, outstandingReceivables: 110500, outstandingPayables: 72840, cashFlow30d: 17660, avgProjectMargin: 17 };
  let actionItems = { pendingApprovals: [], overdueReceivables: [], expiringBgs: [], budgetAlerts: [] };
  let revTrend = [];

  try {
    kpis = await FinanceAPI.dashboardKpis();
    actionItems = await FinanceAPI.dashboardActionItems();
    revTrend = await FinanceAPI.dashboardRevenueTrend();
  } catch (err) {
    // Fallback to local computed data
    const totals = AppState.projects.map(p => ({ id: p.id, name: p.name, ...calcJobTotals(p.id) })).filter(t => t.budget);
    const totalContract = totals.reduce((s,t) => s+t.contractValue, 0);
    const totalActual = totals.reduce((s,t) => s+t.actual, 0);
    const totalForecast = totals.reduce((s,t) => s+t.forecast, 0);
    const totalMargin = totals.reduce((s,t) => s+t.margin, 0);
    const overallMarginPct = totalContract > 0 ? Math.round((totalMargin / totalContract) * 100) : 15;

    const arTotal = FinData.ar.filter(i=>i.status!=='paid').reduce((s,i)=>s+i.amount,0);
    const overdueAR = FinData.ar.filter(i=>i.status==='overdue').reduce((s,i)=>s+i.amount,0);
    const apTotal = FinData.ap.filter(i=>i.status!=='paid').reduce((s,i)=>s+i.amount,0);

    kpis = {
      monthlyRevenue: totalContract * 0.15,
      outstandingReceivables: arTotal,
      outstandingPayables: apTotal,
      cashFlow30d: arTotal - apTotal,
      avgProjectMargin: overallMarginPct
    };

    actionItems = {
      pendingApprovals: FinData.ap.filter(a => a.status === 'pending').map(a => ({ id: a.ref, ref: a.ref, name: `${a.vendor} — ${a.desc}`, amount: a.amount })),
      overdueReceivables: FinData.ar.filter(i => i.status === 'overdue').map(i => ({ ref: i.ref, client: i.client, amount: i.amount, due: i.due })),
      expiringBgs: FinData.bankGuarantees.filter(bg => bg.status === 'expiring').map(bg => ({ ref: bg.ref, client: bg.client, amount: bg.amount, expiry: bg.expiry })),
      budgetAlerts: FinData.budgets['P-2401'].lines.filter(l => l.alert).map(l => `P-2401: ${l.category} alert`)
    };
  }

  contentEl.innerHTML = `
    <!-- Top KPI Bento strip -->
    <div class="kpi-strip" style="margin-bottom:20px">
      ${[
        { label: 'Monthly Invoiced', value: finFmt(kpis.monthlyRevenue), sub: 'Current Month', color: 'var(--blue)' },
        { label: 'AR Outstanding', value: finFmt(kpis.outstandingReceivables), sub: 'Receivables ledger', color: kpis.outstandingReceivables > 100000 ? 'var(--amber)' : 'var(--green)' },
        { label: 'AP Outstanding', value: finFmt(kpis.outstandingPayables), sub: 'Payables ledger', color: 'var(--text-secondary)' },
        { label: 'Cash Flow (30d)', value: finFmt(kpis.cashFlow30d), sub: 'Inflows - Outflows', color: kpis.cashFlow30d >= 0 ? 'var(--green)' : 'var(--red)' },
        { label: 'Avg Portfolio Margin', value: kpis.avgProjectMargin + '%', sub: 'Projected gross margin', color: kpis.avgProjectMargin > 15 ? 'var(--green)' : 'var(--amber)' }
      ].map(k => `
        <div class="kpi-card metric-card--glass">
          <div class="kpi-accent-bar" style="background:${k.color}"></div>
          <div class="kpi-label">${k.label}</div>
          <div class="kpi-value" style="color:${k.color}">${k.value}</div>
          <div class="kpi-sub">${k.sub}</div>
        </div>`).join('')}
    </div>

    <!-- Bento layout columns -->
    <div style="display:grid;grid-template-columns:1.3fr 1fr;gap:20px">
      <!-- Left: Projects overview & charts -->
      <div style="display:flex;flex-direction:column;gap:20px">
        <!-- Project P&L Summary -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Project P&L Snapshot</span>
            <button class="btn btn-ghost btn-sm" onclick="switchFinTab('jobcost')">Job Costing →</button>
          </div>
          <div style="overflow-x:auto">
            <table class="pnl-table">
              <thead>
                <tr>
                  <th>Project ID</th>
                  <th>Contract Value</th>
                  <th>Cost Forecast</th>
                  <th>Variance</th>
                  <th>Est. Margin</th>
                  <th>Margin %</th>
                </tr>
              </thead>
              <tbody>
                ${AppState.projects.map(p => {
                  const t = calcJobTotals(p.id) || { contractValue: 0, forecast: 0, variance: 0, margin: 0, marginPct: 0 };
                  const varCls = t.variance >= 0 ? 'pnl-var-pos' : 'pnl-var-neg';
                  return `
                    <tr onclick="selectFinProject('${p.id}');switchFinTab('jobcost')">
                      <td style="font-family:var(--font-mono);color:var(--brand)">${p.id}</td>
                      <td>${finFmt(t.contractValue)}</td>
                      <td>${finFmt(t.forecast)}</td>
                      <td class="${varCls}">${t.variance >= 0 ? '+' : ''}${finFmt(t.variance)}</td>
                      <td class="${t.margin >= 0 ? 'pnl-var-pos' : 'pnl-var-neg'}">${finFmt(t.margin)}</td>
                      <td style="font-weight:700">${t.marginPct}%</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Revenue trends mini visualization -->
        <div class="card">
          <div class="card-header"><span class="card-title">Invoiced Revenue Trend (Monthly)</span></div>
          <div style="padding:16px;height:120px;display:flex;align-items:flex-end;gap:12px;justify-content:space-around">
            ${(revTrend.length ? revTrend : [
              { month: 'Jan', revenue: 85200 },
              { month: 'Feb', revenue: 62100 },
              { month: 'Mar', revenue: 42600 },
              { month: 'Apr', revenue: 0 },
              { month: 'May', revenue: 90500 },
            ]).map(m => `
              <div style="flex:1;max-width:50px;display:flex;flex-direction:column;align-items:center;gap:6px">
                <div style="width:100%;height:${Math.max(4, Math.round((m.revenue || m.revenue)/1000))}px;background:var(--dept-accent);border-radius:3px;opacity:0.85"></div>
                <span style="font-size:10px;color:var(--text-muted)">${m.month}</span>
                <span style="font-size:9px;font-family:var(--font-mono)">${finFmt(m.revenue || m.revenue)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Right: Action items and alert cards -->
      <div style="display:flex;flex-direction:column;gap:20px">
        <!-- Action list card -->
        <div class="card" style="padding:20px">
          <div class="card-header" style="padding:0 0 12px;border-bottom:1px solid var(--border)">
            <span class="card-title">Critical Attention Needed</span>
          </div>
          
          <div style="margin-top:14px;display:flex;flex-direction:column;gap:12px">
            <!-- Pending vendor approvals -->
            <div>
              <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;font-weight:700;margin-bottom:6px">Vendor Invoices Pending Approval</div>
              ${actionItems.pendingApprovals.slice(0, 3).map(a => `
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;padding:6px;background:var(--bg-elevated);border-radius:var(--radius-sm);margin-bottom:4px">
                  <span style="max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.name}</span>
                  <button class="btn btn-secondary btn-xs" onclick="switchFinTab('ap')">${finFmt(a.amount)}</button>
                </div>
              `).join('') || '<div style="font-size:11px;color:var(--text-muted);font-style:italic">None</div>'}
            </div>

            <!-- Overdue Receivables -->
            <div>
              <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;font-weight:700;margin-bottom:6px">Overdue Invoices</div>
              ${actionItems.overdueReceivables.slice(0, 3).map(a => `
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;padding:6px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.1);border-radius:var(--radius-sm);margin-bottom:4px">
                  <span>${a.ref} · ${a.client}</span>
                  <span style="color:var(--red);font-weight:600">${finFmt(a.amount)}</span>
                </div>
              `).join('') || '<div style="font-size:11px;color:var(--text-muted);font-style:italic">None</div>'}
            </div>

            <!-- Expiring BGs -->
            <div>
              <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;font-weight:700;margin-bottom:6px">Bank Guarantees Expiring Soon</div>
              ${actionItems.expiringBgs.slice(0, 2).map(bg => `
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;padding:6px;background:rgba(245,158,11,0.06);border-radius:var(--radius-sm);margin-bottom:4px">
                  <span>${bg.ref} (${bg.client})</span>
                  <span style="color:var(--amber);font-weight:600">${finFmt(bg.amount)}</span>
                </div>
              `).join('') || '<div style="font-size:11px;color:var(--text-muted);font-style:italic">None</div>'}
            </div>

            <!-- Budget Alerts -->
            <div>
              <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;font-weight:700;margin-bottom:6px">Budget Alerts (80%+)</div>
              ${actionItems.budgetAlerts.map(alert => `
                <div style="font-size:11px;color:var(--amber);padding:4px;border-left:2px solid var(--amber)">
                  ${alert}
                </div>
              `).join('') || '<div style="font-size:11px;color:var(--text-muted);font-style:italic">All categories within threshold</div>'}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- WIP Report -->
    ${(() => {
      const wipRows = AppState.projects.map(p => {
        const t = calcJobTotals(p.id) || { contractValue: 0, actual: 0, forecast: 0 };
        const billed = FinData.ar.filter(i => i.project === p.id || i.projectId === p.id).reduce((s, i) => s + (i.amount || 0), 0);
        const costIncurred = t.actual || 0;
        const wipBalance = costIncurred - billed;
        return { id: p.id, name: p.name, contractValue: t.contractValue, costIncurred, billed, wipBalance };
      }).filter(r => r.contractValue > 0);

      const totalCost = wipRows.reduce((s, r) => s + r.costIncurred, 0);
      const totalBilled = wipRows.reduce((s, r) => s + r.billed, 0);
      const totalWIP = wipRows.reduce((s, r) => s + r.wipBalance, 0);

      if (wipRows.length === 0) return `
        <div class="card" style="margin-top:20px;padding:24px;text-align:center;color:var(--text-muted);font-size:13px;font-style:italic">
          No active project data available for WIP report.
        </div>`;

      return `
        <div class="card" style="margin-top:20px">
          <div class="card-header">
            <span class="card-title">Work-In-Progress (WIP) Valuation</span>
            <span style="font-size:11px;color:var(--text-muted)">Unbilled cost = cost incurred − amount billed</span>
          </div>
          <div style="overflow-x:auto">
            <table class="pnl-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Contract Value</th>
                  <th>Cost Incurred</th>
                  <th>Amount Billed</th>
                  <th>WIP Balance (Unbilled)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${wipRows.map(r => {
                  const wipPct = r.contractValue > 0 ? Math.round((r.wipBalance / r.contractValue) * 100) : 0;
                  const statusColor = r.wipBalance > 0 ? 'var(--amber)' : r.wipBalance < 0 ? 'var(--red)' : 'var(--text-muted)';
                  const statusLabel = r.wipBalance > 50000 ? 'Under-billed' : r.wipBalance < -10000 ? 'Over-billed' : 'On Track';
                  return `
                    <tr>
                      <td>
                        <span style="font-family:var(--font-mono);color:var(--brand)">${r.id}</span>
                        <span style="display:block;font-size:11px;color:var(--text-muted)">${r.name}</span>
                      </td>
                      <td>${finFmt(r.contractValue)}</td>
                      <td>${finFmt(r.costIncurred)}</td>
                      <td>${finFmt(r.billed)}</td>
                      <td style="font-weight:700;color:${statusColor}">${r.wipBalance >= 0 ? '+' : ''}${finFmt(r.wipBalance)}</td>
                      <td>
                        <span style="font-size:11px;font-weight:600;color:${statusColor};background:${statusColor}18;padding:2px 8px;border-radius:10px;white-space:nowrap">
                          ${statusLabel}
                        </span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
              <tfoot>
                <tr style="font-weight:700;border-top:2px solid var(--border);background:var(--bg-elevated)">
                  <td>Portfolio Total</td>
                  <td>—</td>
                  <td>${finFmt(totalCost)}</td>
                  <td>${finFmt(totalBilled)}</td>
                  <td style="color:${totalWIP >= 0 ? 'var(--amber)' : 'var(--red)'}">
                    ${totalWIP >= 0 ? '+' : ''}${finFmt(totalWIP)}
                  </td>
                  <td style="font-size:11px;color:var(--text-muted)">
                    ${wipRows.filter(r => r.wipBalance > 50000).length} under-billed · ${wipRows.filter(r => r.wipBalance < -10000).length} over-billed
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>`;
    })()}
  `;
}

/* ═══════════════════════════════════════════════════════════
   TAB 2 — JOB COSTING (Multi sub-tabs)
   ═══════════════════════════════════════════════════════════ */
async function renderFinJobCost() {
  const contentEl = document.getElementById('finTabContent');
  const pid = FinData.selectedProject;
  
  const subTabs = [
    { id: 'summary', label: 'Cost Summary' },
    { id: 'ledger', label: 'Cost Ledger' },
    { id: 'variance', label: 'Variance Analysis' },
    { id: 'benchmark', label: 'Benchmarking' },
    { id: 'boq', label: 'BOQ Simulator' }
  ];

  contentEl.innerHTML = `
    ${renderSubTabs(subTabs, FinData.jobCostSubTab, 'switchFinJobCostSubTab')}
    <div id="finJobCostSubContent"></div>
  `;

  // Render the active sub-tab
  switchFinJobCostSubTab(FinData.jobCostSubTab);
}

function switchFinJobCostSubTab(subTab) {
  FinData.jobCostSubTab = subTab;
  document.querySelectorAll('#finTabContent .fin-subtabs-bar button').forEach((btn, idx) => {
    btn.className = `btn ${btn.textContent.trim() === {
      summary: 'Cost Summary',
      ledger: 'Cost Ledger',
      variance: 'Variance Analysis',
      benchmark: 'Benchmarking',
      boq: 'BOQ Simulator'
    }[subTab] ? 'btn-primary' : 'btn-secondary'} btn-xs`;
  });

  const renderers = {
    summary: renderJobCostSummary,
    ledger: renderJobCostLedger,
    variance: renderJobCostVariance,
    benchmark: renderJobCostBenchmark,
    boq: renderBOQSimulator,
  };
  if (renderers[subTab]) renderers[subTab]();
}
window.switchFinJobCostSubTab = switchFinJobCostSubTab;

// 2a. Job Costing Summary
async function renderJobCostSummary() {
  const el = document.getElementById('finJobCostSubContent');
  const pid = FinData.selectedProject;
  el.innerHTML = `<div style="padding:20px;text-align:center"><div class="spinner"></div>Loading project cost summary...</div>`;

  let summary = null;
  try {
    summary = await FinanceAPI.jobCostingSummary(pid);
  } catch (err) {
    const t = calcJobTotals(pid) || { contractValue: 284000, budget: 244600, actual: 182340, committed: 12000, variance: 50260, margin: 89660, marginPct: 32 };
    const job = FinData.jobCost[pid];
    summary = {
      projectId: pid,
      contractValue: t.contractValue,
      budgeted: t.budget,
      actual: t.actual,
      committed: t.committed,
      variance: t.variance,
      margin: t.margin,
      marginPct: t.marginPct,
      categories: job ? job.categories.flatMap(c => c.lines.map(l => ({ cost_type: c.name.toLowerCase(), description: l.desc, budgeted_amount: l.budget, actual_amount: l.actual, committed_amount: l.committed }))) : []
    };
  }

  el.innerHTML = `
    <div class="metric-grid" style="margin-bottom:20px">
      ${[
        { label: 'Contract Value', value: finFmt(summary.contractValue), color: 'var(--blue)' },
        { label: 'Total Budget', value: finFmt(summary.budgeted), color: 'var(--text-primary)' },
        { label: 'Actual Cost', value: finFmt(summary.actual), color: 'var(--text-primary)' },
        { label: 'Committed Cost', value: finFmt(summary.committed), color: 'var(--text-secondary)' },
        { label: 'Forecast cost', value: finFmt(summary.actual + summary.committed), color: 'var(--text-primary)' },
        { label: 'Variance', value: (summary.variance >= 0 ? '+' : '') + finFmt(summary.variance), color: summary.variance >= 0 ? 'var(--green)' : 'var(--red)' },
        { label: 'Margin', value: finFmt(summary.margin), color: summary.margin >= 0 ? 'var(--green)' : 'var(--red)' },
        { label: 'Margin %', value: summary.marginPct + '%', color: summary.marginPct >= 15 ? 'var(--green)' : 'var(--amber)' }
      ].map(k => `<div class="metric-card"><div class="metric-label">${k.label}</div><div class="metric-value" style="font-size:18px;color:${k.color}">${k.value}</div></div>`).join('')}
    </div>

    <!-- S-Curve SVG Visualization -->
    <div class="card" style="margin-bottom:20px">
      <div class="card-header"><span class="card-title">Cumulative Cost S-Curve (Actual vs Budget)</span></div>
      <div style="padding:16px;height:180px">
        <svg width="100%" height="100%" viewBox="0 0 600 120" preserveAspectRatio="none">
          <polyline points="0,110 100,90 200,80 300,50 400,45 500,42 600,40" fill="none" stroke="var(--border)" stroke-width="1.5" stroke-dasharray="4 2"/>
          <polyline points="0,110 100,105 200,95 300,75 400,60 500,50 600,42" fill="none" stroke="var(--dept-accent)" stroke-width="2"/>
          <text x="10" y="20" font-size="9" fill="var(--text-muted)">Budget baseline</text>
          <text x="10" y="35" font-size="9" fill="var(--dept-accent)">Actual burn</text>
        </svg>
      </div>
    </div>

    <!-- Category detail cards -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:16px">
      ${['Materials', 'Labour', 'Subcontract', 'Overhead'].map(cat => {
        const catLines = summary.categories.filter(c => (c.cost_type || '').toLowerCase().includes(cat.toLowerCase()));
        const cBudget = catLines.reduce((s,l) => s + (l.budgeted_amount || l.budget || 0), 0);
        const cActual = catLines.reduce((s,l) => s + (l.actual_amount || l.actual || 0), 0);
        const cComm = catLines.reduce((s,l) => s + (l.committed_amount || l.committed || 0), 0);
        const cFcast = cActual + cComm;
        const cVar = cBudget - cFcast;
        const burn = cBudget > 0 ? Math.round(cFcast / cBudget * 100) : 0;
        const barColor = burn > 100 ? 'var(--red)' : burn > 80 ? 'var(--amber)' : 'var(--green)';

        return `
          <div class="card" style="padding:14px">
            <div style="font-weight:700;font-size:13px;margin-bottom:8px">${cat}</div>
            <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted)"><span>Budget:</span><span style="font-family:var(--font-mono)">${finFmt(cBudget)}</span></div>
            <div style="display:flex;justify-content:space-between;font-size:11px;margin-top:2px"><span>Forecast:</span><span style="font-family:var(--font-mono)">${finFmt(cFcast)}</span></div>
            <div style="display:flex;justify-content:space-between;font-size:11px;margin-top:2px"><span>Variance:</span><span style="font-family:var(--font-mono);color:${cVar>=0?'var(--green)':'var(--red)'}">${cVar>=0?'+':''}${finFmt(cVar)}</span></div>
            <div class="progress-bar" style="height:6px;margin-top:8px">
              <div class="progress-fill" style="width:${Math.min(100, burn)}%;background:${barColor}"></div>
            </div>
            <div style="font-size:10px;text-align:right;color:var(--text-muted);margin-top:4px">${burn}% burned</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// 2b. Job Cost Ledger with Filters, Sort & Reversal
async function renderJobCostLedger() {
  const el = document.getElementById('finJobCostSubContent');
  const pid = FinData.selectedProject;
  el.innerHTML = `<div style="padding:20px;text-align:center"><div class="spinner"></div>Loading job cost ledger...</div>`;

  let ledger = [];
  try {
    ledger = await FinanceAPI.jobCostingLedger(pid);
  } catch (err) {
    ledger = MOCK_LEDGER_ENTRIES.filter(e => e.project_id === pid);
  }

  el.innerHTML = `
    <div class="card">
      <div class="card-header" style="flex-wrap:wrap;gap:12px">
        <span class="card-title">Job Cost Transaction Ledger</span>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <select id="ledgerCatFilter" class="form-control-xs" onchange="filterLedger_fin()">
            <option value="">All Categories</option>
            <option value="material">Materials</option>
            <option value="labour">Labour</option>
            <option value="subcontract">Subcontract</option>
            <option value="overhead">Overhead</option>
          </select>
          <select id="ledgerSort" class="form-control-xs" onchange="filterLedger_fin()">
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Amount: High to Low</option>
            <option value="amount-asc">Amount: Low to High</option>
          </select>
          <button class="btn btn-secondary btn-sm" onclick="showToast('Excel report generated','success')">Export Excel</button>
        </div>
      </div>
      
      <div style="overflow-x:auto">
        <table class="pnl-table" id="ledgerTableBody"></table>
      </div>
    </div>
  `;

  // Attach ledger items locally so filtering can re-draw
  window.currentLedgerItems = ledger;
  filterLedger_fin();
}

function filterLedger_fin() {
  const cat = document.getElementById('ledgerCatFilter').value;
  const sort = document.getElementById('ledgerSort').value;
  let items = [...window.currentLedgerItems];

  if (cat) {
    items = items.filter(i => i.category === cat);
  }

  if (sort === 'date-desc') items.sort((a,b) => new Date(b.posting_date) - new Date(a.posting_date));
  else if (sort === 'date-asc') items.sort((a,b) => new Date(a.posting_date) - new Date(b.posting_date));
  else if (sort === 'amount-desc') items.sort((a,b) => b.total_amount - a.total_amount);
  else if (sort === 'amount-asc') items.sort((a,b) => a.total_amount - b.total_amount);

  const container = document.getElementById('ledgerTableBody');
  if (!container) return;

  container.innerHTML = `
    <thead>
      <tr>
        <th>Date</th>
        <th>Category</th>
        <th>Description</th>
        <th>Ref Type</th>
        <th>Ref ID</th>
        <th>Qty</th>
        <th>Rate</th>
        <th>Total Amount</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(item => `
        <tr style="opacity:${item.is_reversed ? '0.45' : '1'}">
          <td>${item.posting_date}</td>
          <td style="text-transform:capitalize">${item.category}</td>
          <td style="text-align:left">${item.is_reversed ? `<del>${item.description}</del> (REVERSED)` : item.description}</td>
          <td>${item.reference_type}</td>
          <td style="font-family:var(--font-mono)">${item.reference_id}</td>
          <td>${item.quantity}</td>
          <td>${finFmt(item.unit_rate)}</td>
          <td style="font-weight:600">${finFmt(item.total_amount)}</td>
          <td>
            ${!item.is_reversed ? `<button class="btn btn-secondary btn-xs" style="color:var(--red)" onclick="triggerLedgerReversal('${item.id}')">Reverse</button>` : '—'}
          </td>
        </tr>
      `).join('')}
    </tbody>
  `;
}
window.filterLedger_fin = filterLedger_fin;

function triggerLedgerReversal(id) {
  const reason = prompt('Please enter the reason for this reversal:');
  if (reason === null) return;
  if (!reason.trim()) { alert('Reversal reason is mandatory.'); return; }

  FinanceAPI.jobCostingReverse(id, { reason }).then(res => {
    showToast('Cost entry reversed successfully', 'success');
    renderJobCostLedger();
  }).catch(err => {
    // Demo mode fallback
    const entry = MOCK_LEDGER_ENTRIES.find(e => e.id === id);
    if (entry) {
      entry.is_reversed = true;
      MOCK_LEDGER_ENTRIES.push({
        id: `rev-${Date.now()}`,
        project_id: entry.project_id,
        category: entry.category,
        description: `REVERSAL: ${entry.description} — ${reason}`,
        reference_type: 'reversal',
        reference_id: entry.id,
        quantity: -entry.quantity,
        unit_rate: entry.unit_rate,
        total_amount: -entry.total_amount,
        posting_date: new Date().toISOString().split('T')[0],
        is_reversed: false
      });
      showToast('Demo reversal saved', 'info');
      renderJobCostLedger();
    }
  });
}
window.triggerLedgerReversal = triggerLedgerReversal;

// 2c. Variance Analysis with EV Metrics
async function renderJobCostVariance() {
  const el = document.getElementById('finJobCostSubContent');
  const pid = FinData.selectedProject;
  el.innerHTML = `<div style="padding:20px;text-align:center"><div class="spinner"></div>Loading variance metrics...</div>`;

  let variance = [];
  let ev = { ev: 180000, pv: 190000, ac: 182340, cpi: 0.99, spi: 0.95, cv: -2340, sv: -10000, eac: 247070, etc: 64730 };

  try {
    variance = await FinanceAPI.jobCostingVariance(pid);
    ev = await FinanceAPI.jobCostingEarnedValue(pid);
  } catch (err) {
    const job = MOCK_JOB_COST[pid] || { contract_value: 284000, lines: [] };
    variance = job.lines.map(l => ({
      category: l.cost_type,
      description: l.description,
      budgeted: l.budgeted_amount,
      actual: l.actual_amount,
      variance: l.budgeted_amount - l.actual_amount,
      status: l.actual_amount > l.budgeted_amount ? 'red' : l.actual_amount / l.budgeted_amount >= 0.8 ? 'amber' : 'green'
    }));
  }

  const lights = { green: '🟢', amber: '🟡', red: '🔴' };

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1.5fr 1fr;gap:20px">
      <!-- Variance Table -->
      <div class="card">
        <div class="card-header"><span class="card-title">Category-wise Variance</span></div>
        <table class="pnl-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Category</th>
              <th>Budgeted</th>
              <th>Actual</th>
              <th>Variance</th>
            </tr>
          </thead>
          <tbody>
            ${variance.map(v => `
              <tr>
                <td>${lights[v.status] || '🟢'}</td>
                <td style="text-transform:capitalize;text-align:left">${v.category}</td>
                <td>${finFmt(v.budgeted)}</td>
                <td>${finFmt(v.actual)}</td>
                <td class="${v.variance>=0?'pnl-var-pos':'pnl-var-neg'}">${v.variance>=0?'+':''}${finFmt(v.variance)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- EV Metrics Card -->
      <div class="card" style="padding:20px">
        <div class="card-header" style="padding:0 0 12px;border-bottom:1px solid var(--border)">
          <span class="card-title">Earned Value (EV) Analysis</span>
        </div>
        
        <div style="margin-top:14px;display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:12px">
          ${[
            ['Planned Value (PV)', finFmt(ev.pv)],
            ['Earned Value (EV)', finFmt(ev.ev)],
            ['Actual Cost (AC)', finFmt(ev.ac)],
            ['Cost Variance (CV)', finFmt(ev.cv)],
            ['CPI (EV / AC)', ev.cpi],
            ['SPI (EV / PV)', ev.spi],
            ['Estimate at Completion', finFmt(ev.eac)],
            ['Estimate to Complete', finFmt(ev.etc)]
          ].map(([lbl, val]) => `
            <div style="background:var(--bg-elevated);padding:8px 10px;border-radius:var(--radius-sm)">
              <div style="color:var(--text-muted);font-size:10px;text-transform:uppercase">${lbl}</div>
              <div style="font-weight:700;font-size:14px;margin-top:3px">${val}</div>
            </div>
          `).join('')}
        </div>

        ${ev.cpi < 1 ? `
          <div style="margin-top:14px;padding:10px;background:rgba(239,68,68,0.08);border-left:3px solid var(--red);font-size:11px;color:var(--red);border-radius:var(--radius-sm)">
            ⚠ CPI is less than 1.0. Linear projection suggests project is currently trending over-budget by ${finFmt(Math.round(ev.eac - ev.pv))}.
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// 2d. Benchmarking
async function renderJobCostBenchmark() {
  const el = document.getElementById('finJobCostSubContent');
  el.innerHTML = `<div style="padding:20px;text-align:center"><div class="spinner"></div>Loading benchmarking averages...</div>`;

  let benchmarks = null;
  try {
    benchmarks = await FinanceAPI.jobCostingBenchmark({ vesselType: 'Pressure Vessel' });
  } catch (err) {
    benchmarks = {
      vesselType: 'Pressure Vessel SA-240',
      avgCostPerTon: 85000,
      avgCostPerWeldingInch: 450,
      similarProjects: [
        { id: 'P-2204', name: 'ASME VIII Vessel 40K', cost: 238000 },
        { id: 'P-2311', name: '316L Vessel 30K', cost: 194000 }
      ]
    };
  }

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1.3fr;gap:20px">
      <!-- Industry Averages Card -->
      <div class="card" style="padding:20px">
        <div class="card-header" style="padding:0 0 12px;border-bottom:1px solid var(--border)">
          <span class="card-title">Historical benchmarks (same class)</span>
        </div>
        <div style="font-size:12.5px;color:var(--text-muted);margin:12px 0">Comparison vessel class: <strong>${benchmarks.vesselType}</strong></div>
        
        <div style="display:flex;flex-direction:column;gap:12px">
          <div style="background:var(--bg-elevated);padding:12px;border-radius:var(--radius-sm)">
            <div style="font-size:10px;text-transform:uppercase;color:var(--text-muted)">Average cost / Ton</div>
            <div style="font-size:22px;font-weight:800;color:var(--brand);margin-top:4px">${finFmt(benchmarks.avgCostPerTon)}</div>
          </div>
          <div style="background:var(--bg-elevated);padding:12px;border-radius:var(--radius-sm)">
            <div style="font-size:10px;text-transform:uppercase;color:var(--text-muted)">Average cost / Welding Inch</div>
            <div style="font-size:22px;font-weight:800;color:var(--brand);margin-top:4px">${finFmt(benchmarks.avgCostPerWeldingInch)}</div>
          </div>
        </div>
      </div>

      <!-- Past similar projects -->
      <div class="card">
        <div class="card-header"><span class="card-title">Recent similar projects (past 24 months)</span></div>
        <table class="pnl-table">
          <thead>
            <tr>
              <th>Project ID</th>
              <th>Name</th>
              <th>Actual Final Cost</th>
            </tr>
          </thead>
          <tbody>
            ${benchmarks.similarProjects.map(p => `
              <tr>
                <td style="font-family:var(--font-mono);color:var(--brand)">${p.id}</td>
                <td style="text-align:left">${p.name}</td>
                <td style="font-weight:600">${finFmt(p.cost)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* ── 2e. BOQ Margin Simulator ────────────────────────────── */
function renderBOQSimulator() {
  const el = document.getElementById('finJobCostSubContent');
  const storageKey = 'nf_boq_draft';
  const minMarginPct = 12;

  // Load draft from localStorage or seed with default rows
  let draft = (() => {
    try { return JSON.parse(localStorage.getItem(storageKey)) || null; } catch { return null; }
  })() || {
    rows: [
      { id: 1, desc: 'Raw Materials — Plates & Pipes',   qty: 1, unit: 'LOT', rate: 85000 },
      { id: 2, desc: 'Fabrication Labour',               qty: 1200, unit: 'HRS', rate: 18 },
      { id: 3, desc: 'Welding Labour',                   qty: 800,  unit: 'HRS', rate: 22 },
      { id: 4, desc: 'Consumables (electrodes, gas)',    qty: 1, unit: 'LOT', rate: 8500 },
      { id: 5, desc: 'Sub-contract (NDT / PWHT)',        qty: 1, unit: 'LOT', rate: 14000 },
      { id: 6, desc: 'Engineering & Documentation',      qty: 1, unit: 'LOT', rate: 12000 },
      { id: 7, desc: 'Contingency (5%)',                 qty: 1, unit: 'LOT', rate: 0 },
    ],
    contractValue: 220000,
    nextId: 8,
  };

  function recalc(d) {
    const subtotal = d.rows.reduce((s, r) => s + (parseFloat(r.qty) || 0) * (parseFloat(r.rate) || 0), 0);
    const contingencyRow = d.rows.find(r => r.desc.toLowerCase().includes('contingency'));
    if (contingencyRow) {
      const others = d.rows.filter(r => r !== contingencyRow).reduce((s, r) => s + (parseFloat(r.qty)||0)*(parseFloat(r.rate)||0), 0);
      contingencyRow.rate = +(others * 0.05).toFixed(0);
    }
    const totalCost = d.rows.reduce((s, r) => s + (parseFloat(r.qty)||0)*(parseFloat(r.rate)||0), 0);
    const cv = parseFloat(d.contractValue) || 0;
    const margin = cv - totalCost;
    const marginPct = cv > 0 ? (margin / cv) * 100 : 0;
    return { totalCost, margin, marginPct };
  }

  function saveDraft(d) {
    try { localStorage.setItem(storageKey, JSON.stringify(d)); } catch {}
  }

  function renderTable(d) {
    const { totalCost, margin, marginPct } = recalc(d);
    const belowMin = marginPct < minMarginPct;
    saveDraft(d);

    el.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 280px;gap:20px;align-items:start">
        <!-- Line items table -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">BOQ Line Items</span>
            <div style="display:flex;gap:8px">
              <button class="btn btn-ghost btn-xs" onclick="boqAddRow()">+ Add Row</button>
              <button class="btn btn-ghost btn-xs" onclick="boqClear()">Clear Draft</button>
            </div>
          </div>
          <div style="overflow-x:auto">
            <table class="pnl-table" style="min-width:580px">
              <thead>
                <tr>
                  <th style="text-align:left;width:40%">Description</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Rate (AED)</th>
                  <th>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody id="boqTbody">
                ${d.rows.map(r => {
                  const amt = (parseFloat(r.qty)||0) * (parseFloat(r.rate)||0);
                  const cv = parseFloat(d.contractValue)||0;
                  const pct = cv > 0 ? (amt/cv)*100 : 0;
                  return `<tr>
                    <td><input style="width:100%;background:transparent;border:none;color:var(--text-primary);font-size:12px" value="${r.desc}" oninput="boqUpdate(${r.id},'desc',this.value)"></td>
                    <td><input type="number" style="width:70px;background:transparent;border:none;color:var(--text-primary);font-size:12px;text-align:right" value="${r.qty}" oninput="boqUpdate(${r.id},'qty',this.value)"></td>
                    <td><input style="width:50px;background:transparent;border:none;color:var(--text-muted);font-size:11px" value="${r.unit}" oninput="boqUpdate(${r.id},'unit',this.value)"></td>
                    <td><input type="number" style="width:90px;background:transparent;border:none;color:var(--text-primary);font-size:12px;text-align:right" value="${r.rate}" oninput="boqUpdate(${r.id},'rate',this.value)"></td>
                    <td style="font-weight:600;font-family:var(--font-mono)">${finFmt(amt)}</td>
                    <td><button class="btn btn-ghost btn-xs" style="color:var(--red);padding:2px 6px" onclick="boqRemoveRow(${r.id})">×</button></td>
                  </tr>`;
                }).join('')}
              </tbody>
              <tfoot>
                <tr style="font-weight:700;border-top:2px solid var(--border)">
                  <td colspan="4" style="text-align:right;color:var(--text-secondary)">Total Cost</td>
                  <td style="font-family:var(--font-mono)">${finFmt(totalCost)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- Margin summary panel -->
        <div style="display:flex;flex-direction:column;gap:16px">
          <div class="card" style="padding:20px">
            <div class="card-title" style="margin-bottom:16px">Contract Value</div>
            <input type="number" id="boqContractValue" value="${d.contractValue}"
              style="width:100%;padding:10px 12px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text-primary);font-size:16px;font-weight:700"
              oninput="boqSetCV(this.value)">
            <div style="font-size:10px;color:var(--text-muted);margin-top:4px">Enter quoted contract value</div>
          </div>

          <div class="card" style="padding:20px">
            <div style="display:flex;flex-direction:column;gap:14px">
              <div>
                <div style="font-size:10px;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px">Total Cost</div>
                <div style="font-size:20px;font-weight:700;font-family:var(--font-mono)">${finFmt(totalCost)}</div>
              </div>
              <div>
                <div style="font-size:10px;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px">Gross Margin</div>
                <div style="font-size:20px;font-weight:700;color:${margin >= 0 ? 'var(--green)' : 'var(--red)'};font-family:var(--font-mono)">
                  ${margin >= 0 ? '+' : ''}${finFmt(margin)}
                </div>
              </div>
              <div>
                <div style="font-size:10px;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px">Margin %</div>
                <div style="font-size:28px;font-weight:800;color:${belowMin ? 'var(--red)' : marginPct >= 20 ? 'var(--green)' : 'var(--amber)'}">
                  ${marginPct.toFixed(1)}%
                </div>
                ${belowMin ? `<div style="font-size:11px;color:var(--red);margin-top:4px">⚠ Below minimum ${minMarginPct}%</div>` : ''}
              </div>
              <div class="progress-bar" style="height:8px">
                <div class="progress-fill" style="width:${Math.min(100, Math.max(0, marginPct))}%;background:${belowMin ? 'var(--red)' : marginPct >= 20 ? 'var(--green)' : 'var(--amber)'}"></div>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted)">
                <span>0%</span><span>Min ${minMarginPct}%</span><span>20%</span><span>30%+</span>
              </div>
            </div>
          </div>

          <button class="btn btn-primary btn-sm" style="width:100%" onclick="boqCopyCSV()">Copy as CSV</button>
        </div>
      </div>
    `;

    // Store draft reference on window so handlers can access it
    window._boqDraft = d;
  }

  window.boqUpdate = (id, field, val) => {
    const row = window._boqDraft.rows.find(r => r.id === id);
    if (row) { row[field] = field === 'desc' || field === 'unit' ? val : parseFloat(val) || 0; }
    renderTable(window._boqDraft);
  };
  window.boqSetCV = (val) => {
    window._boqDraft.contractValue = parseFloat(val) || 0;
    renderTable(window._boqDraft);
  };
  window.boqAddRow = () => {
    const d = window._boqDraft;
    d.rows.push({ id: d.nextId++, desc: 'New item', qty: 1, unit: 'LOT', rate: 0 });
    renderTable(d);
  };
  window.boqRemoveRow = (id) => {
    window._boqDraft.rows = window._boqDraft.rows.filter(r => r.id !== id);
    renderTable(window._boqDraft);
  };
  window.boqClear = () => {
    localStorage.removeItem(storageKey);
    renderBOQSimulator();
  };
  window.boqCopyCSV = () => {
    const d = window._boqDraft;
    const lines = ['Description,Qty,Unit,Rate,Amount'];
    d.rows.forEach(r => {
      const amt = (r.qty||0)*(r.rate||0);
      lines.push(`"${r.desc}",${r.qty},${r.unit},${r.rate},${amt}`);
    });
    const { totalCost, marginPct } = recalc(d);
    lines.push(`,,,,`);
    lines.push(`"Total Cost",,,,${totalCost}`);
    lines.push(`"Contract Value",,,,${d.contractValue}`);
    lines.push(`"Margin %",,,,${marginPct.toFixed(1)}%`);
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      showToast?.('BOQ copied to clipboard as CSV', 'success');
    });
  };

  renderTable(draft);
}

/* ═══════════════════════════════════════════════════════════
   TAB 3 — ACCOUNTS PAYABLE (Multi sub-tabs)
   ═══════════════════════════════════════════════════════════ */
async function renderFinAP() {
  const contentEl = document.getElementById('finTabContent');
  const subTabs = [
    { id: 'register', label: 'Invoice Register' },
    { id: 'match', label: 'Three-Way Match' },
    { id: 'scheduling', label: 'Payment Scheduling' },
    { id: 'ledger', label: 'Vendor Ledger' }
  ];

  contentEl.innerHTML = `
    ${renderSubTabs(subTabs, FinData.apSubTab, 'switchFinAPSubTab')}
    <div id="finAPSubContent"></div>
  `;

  switchFinAPSubTab(FinData.apSubTab);
}

function switchFinAPSubTab(subTab) {
  FinData.apSubTab = subTab;
  document.querySelectorAll('#finTabContent .fin-subtabs-bar button').forEach((btn, idx) => {
    btn.className = `btn ${btn.textContent.trim() === {
      register: 'Invoice Register',
      match: 'Three-Way Match',
      scheduling: 'Payment Scheduling',
      ledger: 'Vendor Ledger'
    }[subTab] ? 'btn-primary' : 'btn-secondary'} btn-xs`;
  });

  const renderers = {
    register: renderAPRegister,
    match: renderAPMatch,
    scheduling: renderAPScheduling,
    ledger: renderAPVendorLedger
  };
  if (renderers[subTab]) renderers[subTab]();
}
window.switchFinAPSubTab = switchFinAPSubTab;

// 3a. Accounts Payable: Invoice Register
async function renderAPRegister() {
  const el = document.getElementById('finAPSubContent');
  el.innerHTML = `<div style="padding:20px;text-align:center"><div class="spinner"></div>Loading AP register...</div>`;

  let invoices = [];
  try {
    invoices = await FinanceAPI.payableInvoices();
  } catch (err) {
    invoices = FinData.ap;
  }

  el.innerHTML = `
    <div class="card">
      <div class="card-header">
        <span class="card-title">Vendor Accounts Payable Register</span>
        <button class="btn btn-primary btn-sm" onclick="openNewAPInvoiceModal()">+ New invoice</button>
      </div>
      <div class="invoice-list" style="margin-top:12px">
        ${invoices.map(inv => `
          <div class="invoice-card inv-${inv.status}" onclick="openAPInvoiceDetailPanel('${inv.id || inv.ref}')">
            <div class="inv-ref">${inv.po_ref || inv.ref}</div>
            <div class="inv-body">
              <div class="inv-name" style="font-weight:700">${inv.vendor} — ${inv.description || inv.desc}</div>
              <div class="inv-meta">
                <span>Project: ${inv.project_id || inv.project || '—'}</span>
                <span>·</span>
                <span>Due: ${inv.due_date || inv.due}</span>
                <span>·</span>
                <span class="badge ${inv.status==='paid'?'badge-green':inv.status==='verified'?'badge-blue':'badge-muted'}">${inv.status.toUpperCase()}</span>
              </div>
            </div>
            <div class="inv-amount">${finFmt(inv.amount)}</div>
            <div style="display:flex;gap:6px">
              ${inv.status === 'pending' ? `<button class="btn btn-secondary btn-xs" onclick="event.stopPropagation();verifyAPInvoice_fin('${inv.id || inv.ref}')">Verify</button>` : ''}
              ${inv.status === 'verified' ? `<button class="btn btn-primary btn-xs" onclick="event.stopPropagation();approveAPInvoice_fin('${inv.id || inv.ref}')">Approve</button>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function verifyAPInvoice_fin(id) {
  FinanceAPI.verifyPayableInvoice(id, {}).then(() => {
    showToast('Invoice verified', 'success');
    renderAPRegister();
  }).catch(() => {
    const inv = FinData.ap.find(a => (a.id === id || a.ref === id));
    if (inv) inv.status = 'verified';
    showToast('Invoice marked as verified (demo)', 'info');
    renderAPRegister();
  });
}
window.verifyAPInvoice_fin = verifyAPInvoice_fin;

function approveAPInvoice_fin(id) {
  FinanceAPI.approvePayableInvoice(id, {}).then(() => {
    showToast('Invoice approved', 'success');
    renderAPRegister();
  }).catch(() => {
    const inv = FinData.ap.find(a => (a.id === id || a.ref === id));
    if (inv) inv.status = 'due';
    showToast('Invoice marked as approved (demo)', 'info');
    renderAPRegister();
  });
}
window.approveAPInvoice_fin = approveAPInvoice_fin;

function openNewAPInvoiceModal() {
  openFinModal(`
    <div class="fin-modal-inner">
      <div class="fin-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Add Vendor Invoice</div>
        <button class="btn-icon" onclick="closeFinModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="fin-modal-body">
        <div class="fin-field"><label>Vendor Name</label><input type="text" id="apNewVendor" placeholder="e.g. Outokumpu"/></div>
        <div class="fin-field"><label>PO Reference</label><input type="text" id="apNewPoRef" placeholder="e.g. PO-2401-018"/></div>
        <div class="fin-field"><label>Description</label><input type="text" id="apNewDesc" placeholder="e.g. 316L plate balance"/></div>
        <div class="fin-field-row">
          <div class="fin-field"><label>Amount (USD)</label><input type="number" id="apNewAmount" placeholder="38400"/></div>
          <div class="fin-field"><label>Due Date</label><input type="date" id="apNewDueDate"/></div>
        </div>
        <div class="fin-field"><label>Project Link</label>
          <select id="apNewProject">${AppState.projects.map(p=>`<option value="${p.id}">${p.id} — ${p.name.split('—')[0].trim()}</option>`).join('')}</select>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="submitAPInvoice_fin()">Save Invoice</button>
          <button class="btn btn-ghost" onclick="closeFinModal()">Cancel</button>
        </div>
      </div>
    </div>
  `);
}
window.openNewAPInvoiceModal = openNewAPInvoiceModal;

function submitAPInvoice_fin() {
  const vendor = document.getElementById('apNewVendor').value.trim();
  const po_ref = document.getElementById('apNewPoRef').value.trim();
  const description = document.getElementById('apNewDesc').value.trim();
  const amount = Number(document.getElementById('apNewAmount').value);
  const due_date = document.getElementById('apNewDueDate').value;
  const project_id = document.getElementById('apNewProject').value;

  if (!vendor || !po_ref || !amount || !due_date) {
    alert('Please fill in all mandatory fields.');
    return;
  }

  FinanceAPI.createPayableInvoice({ vendor, po_ref, description, amount, due_date, project_id }).then(() => {
    showToast('Invoice created successfully', 'success');
    closeFinModal();
    renderAPRegister();
  }).catch(() => {
    // fallback
    const id = `ap-${Date.now()}`;
    FinData.ap.push({ id, po_ref, vendor, desc: description, amount, due: due_date, status: 'pending', project: project_id });
    showToast('Invoice created (demo mode)', 'info');
    closeFinModal();
    renderAPRegister();
  });
}
window.submitAPInvoice_fin = submitAPInvoice_fin;

function openAPInvoiceDetailPanel(id) {
  const inv = FinData.ap.find(a => (a.id === id || a.ref === id));
  if (!inv) return;
  openFinModal(`
    <div class="fin-modal-inner">
      <div class="fin-modal-header">
        <div>
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--brand)">${inv.po_ref}</div>
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">${inv.vendor}</div>
        </div>
        <button class="btn-icon" onclick="closeFinModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="fin-modal-body">
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
          <span>Amount:</span><strong>${finFmt(inv.amount)}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
          <span>Due Date:</span><strong>${inv.due || inv.due_date}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
          <span>Description:</span><span>${inv.desc || inv.description}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
          <span>Status:</span><span class="badge badge-dept">${inv.status.toUpperCase()}</span>
        </div>
        <div style="display:flex;gap:10px;margin-top:10px">
          ${inv.status === 'pending' ? `<button class="btn btn-primary" style="flex:1" onclick="verifyAPInvoice_fin('${inv.id}');closeFinModal()">Verify</button>` : ''}
          ${inv.status === 'verified' ? `<button class="btn btn-primary" style="flex:1" onclick="approveAPInvoice_fin('${inv.id}');closeFinModal()">Approve</button>` : ''}
          ${inv.status !== 'paid' ? `<button class="btn btn-secondary" onclick="triggerAPPay_fin('${inv.id}');closeFinModal()">Pay Now</button>` : ''}
        </div>
      </div>
    </div>
  `);
}
window.openAPInvoiceDetailPanel = openAPInvoiceDetailPanel;

function triggerAPPay_fin(id) {
  FinanceAPI.apPay(id).then(() => {
    showToast('Payment completed', 'success');
    renderAPRegister();
  }).catch(() => {
    const inv = FinData.ap.find(a => (a.id === id || a.ref === id));
    if (inv) inv.status = 'paid';
    showToast('Demo payment logged', 'info');
    renderAPRegister();
  });
}
window.triggerAPPay_fin = triggerAPPay_fin;

// 3b. Three-way Match (PO vs GRN vs Invoice)
async function renderAPMatch() {
  const el = document.getElementById('finAPSubContent');
  const invoices = FinData.ap.filter(i => i.status !== 'paid');

  if (!invoices.length) {
    el.innerHTML = `<div class="card"><div class="empty-state">No pending invoices available for matching.</div></div>`;
    return;
  }

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:240px 1fr;gap:20px">
      <div class="card" style="padding:0">
        <div style="padding:10px;font-size:11px;font-weight:700;color:var(--text-muted);border-bottom:1px solid var(--border)">SELECT INVOICE</div>
        ${invoices.map(i => `
          <div onclick="selectMatchInvoice_fin('${i.id}')" style="padding:10px;border-bottom:1px solid var(--border);cursor:pointer;font-size:12px;background:${i.id===window.selectedAPMatchInvoiceId?'var(--bg-active)':''}">
            <div style="font-weight:600">${i.vendor}</div>
            <div style="color:var(--text-muted);font-size:10px;margin-top:2px">${i.po_ref || i.ref} · ${finFmt(i.amount)}</div>
          </div>
        `).join('')}
      </div>
      <div id="matchDisplayDetails" class="card" style="padding:20px">
        <div class="empty-state">Select an invoice from the left panel to review match discrepancies.</div>
      </div>
    </div>
  `;
}

async function selectMatchInvoice_fin(id) {
  window.selectedAPMatchInvoiceId = id;
  renderAPMatch(); // redraw list active state

  const detailEl = document.getElementById('matchDisplayDetails');
  const inv = FinData.ap.find(a => (a.id === id || a.ref === id));
  if (!inv || !detailEl) return;

  detailEl.innerHTML = `<div style="text-align:center"><div class="spinner"></div>Running three-way match...</div>`;

  let matching = { matched: true, poDetails: { qty: 5, rate: 1200 }, grnDetails: { qty: 5, status: 'verified' }, invoiceDetails: { qty: 5, rate: 1200 } };
  try {
    matching = await FinanceAPI.matchPayableInvoice(id, {});
  } catch (err) {
    // mock variations based on invoice id
    if (id === 'ap-1') {
      matching = { matched: false, poDetails: { qty: 10, rate: 3840 }, grnDetails: { qty: 10, status: 'verified' }, invoiceDetails: { qty: 10, rate: 3940 } };
    }
  }

  const discrepancy = !matching.matched || matching.invoiceDetails.rate !== matching.poDetails.rate;

  detailEl.innerHTML = `
    <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--border);padding-bottom:10px">
      <div>
        <div style="font-size:16px;font-weight:700">${inv.vendor} — Match Review</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${inv.po_ref || inv.ref} · Linked Project: ${inv.project || inv.project_id}</div>
      </div>
      <span class="badge ${discrepancy?'badge-red':'badge-green'}" style="font-size:11px">${discrepancy?'MISMATCH DETECTED':'MATCH SUCCESS'}</span>
    </div>

    <!-- Match columns -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:20px">
      <div style="background:var(--bg-elevated);padding:14px;border-radius:var(--radius-sm)">
        <div style="font-size:10px;text-transform:uppercase;color:var(--text-muted)">Purchase Order (PO)</div>
        <div style="font-size:12px;margin-top:8px">Quantity: <strong>${matching.poDetails.qty} EA</strong></div>
        <div style="font-size:12px">Rate: <strong>${finFmt(matching.poDetails.rate)}</strong></div>
      </div>
      
      <div style="background:var(--bg-elevated);padding:14px;border-radius:var(--radius-sm)">
        <div style="font-size:10px;text-transform:uppercase;color:var(--text-muted)">Goods Receipt (GRN)</div>
        <div style="font-size:12px;margin-top:8px">Quantity: <strong>${matching.grnDetails.qty} EA</strong></div>
        <div style="font-size:12px">Condition: <strong style="color:var(--green)">${matching.grnDetails.status.toUpperCase()}</strong></div>
      </div>

      <div style="background:var(--bg-elevated);padding:14px;border-radius:var(--radius-sm);border:1px solid ${discrepancy?'rgba(239,68,68,0.2)':'transparent'}">
        <div style="font-size:10px;text-transform:uppercase;color:var(--text-muted)">Vendor Invoice Claim</div>
        <div style="font-size:12px;margin-top:8px">Quantity: <strong>${matching.invoiceDetails.qty} EA</strong></div>
        <div style="font-size:12px">Rate: <strong style="color:${discrepancy?'var(--red)':'inherit'}">${finFmt(matching.invoiceDetails.rate)}</strong></div>
      </div>
    </div>

    ${discrepancy ? `
      <div style="margin-top:20px;padding:12px;background:rgba(239,68,68,0.06);border-left:3px solid var(--red);font-size:12px;color:var(--red);border-radius:var(--radius-sm)">
        <strong>Discrepancy Details:</strong> Invoice unit rate is ${finFmt(matching.invoiceDetails.rate - matching.poDetails.rate)} higher than the approved purchase order.
      </div>
    ` : ''}

    <div style="display:flex;gap:10px;margin-top:20px">
      <button class="btn btn-primary" onclick="resolveMatch_fin('${id}', 'accept')">${discrepancy ? 'Waive Variance' : 'Accept Match'}</button>
      ${discrepancy ? `<button class="btn btn-secondary" onclick="resolveMatch_fin('${id}', 'flag')">Flag Dispute</button>` : ''}
    </div>
  `;
}
window.selectMatchInvoice_fin = selectMatchInvoice_fin;

function resolveMatch_fin(id, action) {
  showToast(`Match resolved with action: ${action.toUpperCase()}`, 'success');
  if (action === 'accept') {
    const inv = FinData.ap.find(a => a.id === id);
    if (inv) inv.status = 'verified';
  }
  renderAPMatch();
}
window.resolveMatch_fin = resolveMatch_fin;

// 3c. Accounts Payable: Payment Scheduling
async function renderAPScheduling() {
  const el = document.getElementById('finAPSubContent');
  el.innerHTML = `<div style="padding:20px;text-align:center"><div class="spinner"></div>Loading schedule...</div>`;

  let schedule = [];
  try {
    schedule = await FinanceAPI.payablePaymentSchedule();
  } catch (err) {
    schedule = FinData.ap.filter(i => i.status !== 'paid');
  }

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 340px;gap:20px">
      <!-- Calendar/Scheduling layout -->
      <div class="card">
        <div class="card-header"><span class="card-title">Due Invoices Grouped by Week</span></div>
        <div style="margin-top:14px;display:flex;flex-direction:column;gap:14px">
          ${[1, 2, 3].map(week => {
            const weekInvs = schedule.slice((week-1)*2, week*2);
            const total = weekInvs.reduce((s,i) => s + i.amount, 0);
            return `
              <div style="padding:14px;background:var(--bg-elevated);border-radius:var(--radius-md)">
                <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);padding-bottom:6px;margin-bottom:8px">
                  <span style="font-weight:700;font-size:12.5px">Week ${week} Forecast</span>
                  <span style="font-family:var(--font-mono);font-weight:600;font-size:12px">${finFmt(total)}</span>
                </div>
                ${weekInvs.map(i => `
                  <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;font-size:12px">
                    <span style="display:inline-flex;gap:6px;align-items:center">
                      <input type="checkbox" class="schedule-batch-check" value="${i.id || i.ref}" onchange="updateBatchTotal_fin()"/>
                      <span>${i.vendor} (${i.po_ref || i.ref})</span>
                    </span>
                    <span style="font-family:var(--font-mono)">${finFmt(i.amount)}</span>
                  </div>
                `).join('') || '<div style="font-size:11px;color:var(--text-muted);font-style:italic">No invoices scheduled</div>'}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Batch Creator side panel -->
      <div class="card" style="padding:20px;align-self:start">
        <div class="card-header" style="padding:0 0 10px;border-bottom:1px solid var(--border)"><span class="card-title">Create Payment Batch</span></div>
        <div style="margin-top:12px;font-size:12px;color:var(--text-muted)">Select one or more invoices from the calendar to create a bank instruction file.</div>
        
        <div style="margin-top:18px">
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Total Batch Amount</div>
          <div id="batchTotalDisplay" style="font-size:28px;font-weight:800;font-family:var(--font-display);color:var(--brand);margin-top:4px">$0</div>
        </div>

        <button class="btn btn-primary" style="width:100%;margin-top:18px" onclick="submitPaymentBatch_fin()">Create Batch Instruction</button>
      </div>
    </div>
  `;
}

function updateBatchTotal_fin() {
  let total = 0;
  document.querySelectorAll('.schedule-batch-check:checked').forEach(chk => {
    const inv = FinData.ap.find(a => (a.id === chk.value || a.ref === chk.value));
    if (inv) total += inv.amount;
  });
  document.getElementById('batchTotalDisplay').textContent = finFmt(total);
}
window.updateBatchTotal_fin = updateBatchTotal_fin;

function submitPaymentBatch_fin() {
  const ids = Array.from(document.querySelectorAll('.schedule-batch-check:checked')).map(chk => chk.value);
  if (!ids.length) {
    alert('Please select at least one invoice.');
    return;
  }

  const total = ids.reduce((s, id) => s + (FinData.ap.find(a => (a.id === id || a.ref === id))?.amount || 0), 0);

  FinanceAPI.createPaymentBatch({ invoiceIds: ids, totalAmount: total }).then(batch => {
    // Auto-approve in mock
    FinanceAPI.approvePaymentBatch(batch.id, {}).then(() => {
      showToast('Payment instruction CSV batch generated and payments completed', 'success');
      renderAPScheduling();
    });
  }).catch(() => {
    // local fallback
    ids.forEach(id => {
      const inv = FinData.ap.find(a => (a.id === id || a.ref === id));
      if (inv) inv.status = 'paid';
    });
    showToast('Payment instruction CSV generated (demo mode)', 'success');
    renderAPScheduling();
  });
}
window.submitPaymentBatch_fin = submitPaymentBatch_fin;

// 3d. AP: Vendor Ledger
async function renderAPVendorLedger() {
  const el = document.getElementById('finAPSubContent');
  const vendors = Array.from(new Set(FinData.ap.map(a => a.vendor)));

  if (!vendors.length) {
    el.innerHTML = `<div class="card"><div class="empty-state">No vendors found.</div></div>`;
    return;
  }

  el.innerHTML = `
    <div class="card" style="margin-bottom:16px">
      <div class="card-header" style="padding-bottom:12px;border-bottom:1px solid var(--border)">
        <span class="card-title">Vendor Statement Ledger Search</span>
        <select id="ledgerVendorSelect" class="form-control-xs" onchange="searchVendorLedger_fin()">
          ${vendors.map(v => `<option value="${v}">${v}</option>`).join('')}
        </select>
      </div>
      <div style="overflow-x:auto;margin-top:12px">
        <table class="pnl-table">
          <thead>
            <tr>
              <th>PO Ref</th>
              <th>Description</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody id="vendorLedgerResultsBody"></tbody>
        </table>
      </div>
    </div>
  `;

  searchVendorLedger_fin();
}

async function searchVendorLedger_fin() {
  const val = document.getElementById('ledgerVendorSelect').value;
  const body = document.getElementById('vendorLedgerResultsBody');
  if (!body || !val) return;

  body.innerHTML = `<tr><td colspan="5" style="text-align:center"><div class="spinner"></div>Loading vendor ledger...</td></tr>`;

  let results = [];
  try {
    results = await FinanceAPI.payableVendorLedger(val);
  } catch (err) {
    results = FinData.ap.filter(a => a.vendor === val);
  }

  body.innerHTML = results.map(item => `
    <tr>
      <td style="font-family:var(--font-mono);color:var(--brand)">${item.po_ref || item.ref}</td>
      <td style="text-align:left">${item.description || item.desc}</td>
      <td>${item.due_date || item.due}</td>
      <td><span class="badge ${item.status==='paid'?'badge-green':'badge-muted'}">${item.status.toUpperCase()}</span></td>
      <td style="font-family:var(--font-mono);font-weight:600">${finFmt(item.amount)}</td>
    </tr>
  `).join('') || `<tr><td colspan="5" class="empty-state">No statements found for vendor.</td></tr>`;
}
window.searchVendorLedger_fin = searchVendorLedger_fin;

/* ═══════════════════════════════════════════════════════════
   TAB 4 — ACCOUNTS RECEIVABLE (Multi sub-tabs)
   ═══════════════════════════════════════════════════════════ */
async function renderFinAR() {
  const contentEl = document.getElementById('finTabContent');
  const subTabs = [
    { id: 'register', label: 'Invoice Register' },
    { id: 'receipts', label: 'Record Receipts' },
    { id: 'aging', label: 'Aging Analysis' },
    { id: 'ledger', label: 'Client Ledger' }
  ];

  contentEl.innerHTML = `
    ${renderSubTabs(subTabs, FinData.arSubTab, 'switchFinARSubTab')}
    <div id="finARSubContent"></div>
  `;

  switchFinARSubTab(FinData.arSubTab);
}

function switchFinARSubTab(subTab) {
  FinData.arSubTab = subTab;
  document.querySelectorAll('#finTabContent .fin-subtabs-bar button').forEach((btn, idx) => {
    btn.className = `btn ${btn.textContent.trim() === {
      register: 'Invoice Register',
      receipts: 'Record Receipts',
      aging: 'Aging Analysis',
      ledger: 'Client Ledger'
    }[subTab] ? 'btn-primary' : 'btn-secondary'} btn-xs`;
  });

  const renderers = {
    register: renderARRegister,
    receipts: renderARReceipts,
    aging: renderARAging,
    ledger: renderARClientLedger
  };
  if (renderers[subTab]) renderers[subTab]();
}
window.switchFinARSubTab = switchFinARSubTab;

// 4a. Accounts Receivable: Invoice Register
async function renderARRegister() {
  const el = document.getElementById('finARSubContent');
  el.innerHTML = `<div style="padding:20px;text-align:center"><div class="spinner"></div>Loading AR register...</div>`;

  let invoices = [];
  try {
    invoices = await FinanceAPI.receivableInvoices();
  } catch (err) {
    invoices = FinData.ar;
  }

  el.innerHTML = `
    <div class="card">
      <div class="card-header">
        <span class="card-title">Client Accounts Receivable Register</span>
        <button class="btn btn-primary btn-sm" onclick="openNewARInvoiceModal()">+ Create draft invoice</button>
      </div>
      <div class="invoice-list" style="margin-top:12px">
        ${invoices.map(inv => `
          <div class="invoice-card inv-${inv.status}" onclick="openARInvoiceDetailPanel('${inv.id || inv.ref}')">
            <div class="inv-ref">${inv.id || inv.ref}</div>
            <div class="inv-body">
              <div class="inv-name" style="font-weight:700">${inv.client_name || inv.client} — ${inv.description || inv.desc}</div>
              <div class="inv-meta">
                <span>Project: ${inv.project_id || inv.project}</span>
                <span>·</span>
                <span>Due: ${inv.due_date || inv.due}</span>
                <span>·</span>
                <span class="badge ${inv.status==='paid'?'badge-green':inv.status==='due'?'badge-amber':'badge-muted'}">${inv.status.toUpperCase()}</span>
              </div>
            </div>
            <div class="inv-amount">${finFmt(inv.amount)}</div>
            <div style="display:flex;gap:6px">
              ${inv.status === 'draft' ? `<button class="btn btn-secondary btn-xs" onclick="event.stopPropagation();approveARInvoice_fin('${inv.id || inv.ref}')">Approve</button>` : ''}
              ${inv.status === 'due' ? `<button class="btn btn-primary btn-xs" onclick="event.stopPropagation();sendARInvoice_fin('${inv.id || inv.ref}')">Mark Sent</button>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function approveARInvoice_fin(id) {
  FinanceAPI.approveReceivableInvoice(id, {}).then(() => {
    showToast('Invoice approved', 'success');
    renderARRegister();
  }).catch(() => {
    const inv = FinData.ar.find(i => i.ref === id);
    if (inv) inv.status = 'due';
    showToast('Invoice approved (demo)', 'info');
    renderARRegister();
  });
}
window.approveARInvoice_fin = approveARInvoice_fin;

function sendARInvoice_fin(id) {
  FinanceAPI.sendReceivableInvoice(id, {}).then(() => {
    showToast('Invoice marked as sent', 'success');
    renderARRegister();
  }).catch(() => {
    showToast('Invoice marked as sent (demo)', 'info');
    renderARRegister();
  });
}
window.sendARInvoice_fin = sendARInvoice_fin;

function openNewARInvoiceModal() {
  openFinModal(`
    <div class="fin-modal-inner">
      <div class="fin-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Create Client Invoice</div>
        <button class="btn-icon" onclick="closeFinModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="fin-modal-body">
        <div class="fin-field"><label>Project</label>
          <select id="arNewProject" onchange="loadMilestonesForNewAR_fin()">${AppState.projects.map(p=>`<option value="${p.id}">${p.id} — ${p.name.split('—')[0].trim()}</option>`).join('')}</select>
        </div>
        <div class="fin-field"><label>Select Achieved Milestone</label>
          <select id="arNewMilestone"></select>
        </div>
        <div class="fin-field"><label>Description</label><input type="text" id="arNewDesc" placeholder="e.g. Shell fabrication 50%"/></div>
        <div class="fin-field-row">
          <div class="fin-field"><label>Amount (USD)</label><input type="number" id="arNewAmount" placeholder="Auto-filled from milestone"/></div>
          <div class="fin-field"><label>Due Date</label><input type="date" id="arNewDueDate"/></div>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="submitARInvoice_fin()">Create Draft Invoice</button>
          <button class="btn btn-ghost" onclick="closeFinModal()">Cancel</button>
        </div>
      </div>
    </div>
  `);
  loadMilestonesForNewAR_fin();
}
window.openNewARInvoiceModal = openNewARInvoiceModal;

function loadMilestonesForNewAR_fin() {
  const pid = document.getElementById('arNewProject').value;
  const select = document.getElementById('arNewMilestone');
  if (!select) return;

  const mss = FinData.milestones[pid] || [];
  select.innerHTML = mss.map(m => `<option value="${m.id}" data-amount="${m.amount}">${m.name} (${finFmt(m.amount)})</option>`).join('') || '<option value="">No milestones</option>';
  
  // auto-adjust amount field on change
  select.onchange = () => {
    const opt = select.options[select.selectedIndex];
    document.getElementById('arNewAmount').value = opt.getAttribute('data-amount') || '';
  };
  select.onchange();
}
window.loadMilestonesForNewAR_fin = loadMilestonesForNewAR_fin;

function submitARInvoice_fin() {
  const project_id = document.getElementById('arNewProject').value;
  const msId = document.getElementById('arNewMilestone').value;
  const description = document.getElementById('arNewDesc').value.trim();
  const amount = Number(document.getElementById('arNewAmount').value);
  const due_date = document.getElementById('arNewDueDate').value;

  if (!description || !amount || !due_date) {
    alert('Please fill in all details.');
    return;
  }

  FinanceAPI.createReceivableInvoice({ project_id, description, amount, due_date, client_name: 'ADNOC' }).then(() => {
    showToast('Client invoice draft created', 'success');
    closeFinModal();
    renderARRegister();
  }).catch(() => {
    const id = `INV-${Date.now()}`;
    FinData.ar.push({ ref: id, project: project_id, client: 'ADNOC', desc: description, amount, due: due_date, status: 'draft' });
    showToast('Client invoice created (demo mode)', 'info');
    closeFinModal();
    renderARRegister();
  });
}
window.submitARInvoice_fin = submitARInvoice_fin;

function openARInvoiceDetailPanel(id) {
  const inv = FinData.ar.find(i => i.id === id || i.ref === id);
  if (!inv) return;
  openFinModal(`
    <div class="fin-modal-inner">
      <div class="fin-modal-header">
        <div>
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--brand)">${inv.id || inv.ref}</div>
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">${inv.client || inv.client_name || 'ADNOC'}</div>
        </div>
        <button class="btn-icon" onclick="closeFinModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="fin-modal-body">
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
          <span>Amount:</span><strong>${finFmt(inv.amount)}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
          <span>Description:</span><span>${inv.desc || inv.description}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
          <span>Due Date:</span><strong>${inv.due || inv.due_date}</strong>
        </div>
        <div style="display:flex;gap:10px;margin-top:12px">
          ${inv.status === 'draft' ? `<button class="btn btn-primary" onclick="approveARInvoice_fin('${inv.id || inv.ref}');closeFinModal()">Approve</button>` : ''}
          ${inv.status !== 'paid' ? `<button class="btn btn-secondary" onclick="recordARReceipt_fin('${inv.id || inv.ref}');closeFinModal()">Record Receipt</button>` : ''}
        </div>
      </div>
    </div>
  `);
}
window.openARInvoiceDetailPanel = openARInvoiceDetailPanel;

function recordARReceipt_fin(id) {
  const inv = FinData.ar.find(i => i.id === id || i.ref === id);
  if (!inv) return;
  openFinModal(`
    <div class="fin-modal-inner">
      <div class="fin-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Record Client Payment Receipt</div>
        <button class="btn-icon" onclick="closeFinModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="fin-modal-body">
        <div style="font-size:12px;margin-bottom:8px">Invoice: <strong>${inv.id || inv.ref}</strong> · Amount Due: <strong>${finFmt(inv.amount)}</strong></div>
        <div class="fin-field-row">
          <div class="fin-field"><label>Amount Received</label><input type="number" id="rcptAmount" value="${inv.amount}"/></div>
          <div class="fin-field"><label>TDS Deducted</label><input type="number" id="rcptTds" value="0"/></div>
        </div>
        <div class="fin-field"><label>Payment Mode</label>
          <select id="rcptMode"><option>NEFT</option><option>RTGS</option><option>Cheque</option><option>LC</option></select>
        </div>
        <div class="fin-field-row">
          <div class="fin-field"><label>Reference # / UTR</label><input type="text" id="rcptRef" placeholder="e.g. UTR1294821"/></div>
          <div class="fin-field"><label>Bank Name</label><input type="text" id="rcptBank" placeholder="e.g. Emirates NBD"/></div>
        </div>
        <button class="btn btn-primary" onclick="submitReceipt_fin('${inv.id || inv.ref}')">Record Receipt</button>
      </div>
    </div>
  `);
}
window.recordARReceipt_fin = recordARReceipt_fin;

function submitReceipt_fin(invoiceId) {
  const amount = Number(document.getElementById('rcptAmount').value);
  const tds = Number(document.getElementById('rcptTds').value);
  const mode = document.getElementById('rcptMode').value;
  const reference = document.getElementById('rcptRef').value;
  const bank = document.getElementById('rcptBank').value;

  FinanceAPI.recordReceipt({ invoiceId, amount, tdsDeducted: tds, paymentMode: mode, referenceNumber: reference, bankName: bank }).then(() => {
    showToast('Payment receipt recorded successfully', 'success');
    closeFinModal();
    renderARRegister();
  }).catch(() => {
    const inv = FinData.ar.find(i => i.id === invoiceId || i.ref === invoiceId);
    if (inv) inv.status = 'paid';
    showToast('Receipt recorded (demo mode)', 'info');
    closeFinModal();
    renderARRegister();
  });
}
window.submitReceipt_fin = submitReceipt_fin;

// 4b. Accounts Receivable: Receipts
async function renderARReceipts() {
  const el = document.getElementById('finARSubContent');
  const invoices = FinData.ar.filter(i => i.status !== 'paid');

  if (!invoices.length) {
    el.innerHTML = `<div class="card"><div class="empty-state">No outstanding client invoices found.</div></div>`;
    return;
  }

  el.innerHTML = `
    <div class="card">
      <div class="card-header"><span class="card-title">Record Client Payments</span></div>
      <div class="invoice-list" style="margin-top:12px">
        ${invoices.map(inv => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--bg-elevated);border-radius:var(--radius-sm);margin-bottom:8px">
            <div>
              <div style="font-weight:700;font-size:12.5px">${inv.client} — ${inv.desc || inv.description}</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${inv.id || inv.ref} · Linked: ${inv.project} · Due: ${inv.due}</div>
            </div>
            <div style="display:flex;align-items:center;gap:12px">
              <span style="font-family:var(--font-mono);font-weight:700">${finFmt(inv.amount)}</span>
              <button class="btn btn-secondary btn-sm" onclick="recordARReceipt_fin('${inv.id || inv.ref}')">Record Payment</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// 4c. Accounts Receivable: Aging
async function renderARAging() {
  const el = document.getElementById('finARSubContent');
  el.innerHTML = `<div style="padding:20px;text-align:center"><div class="spinner"></div>Loading aging analysis...</div>`;

  let aging = null;
  try {
    aging = await FinanceAPI.receivableAging();
  } catch (err) {
    aging = { current: 120000, d30: 19500, d60: 71000, d90plus: 0 };
  }

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
      <!-- Aging buckets -->
      <div class="card" style="padding:20px">
        <div class="card-header" style="padding:0 0 10px;border-bottom:1px solid var(--border)"><span class="card-title">Receivable Aging Buckets</span></div>
        <div style="margin-top:14px;display:flex;flex-direction:column;gap:12px">
          ${[
            ['Current (0-30d)', aging.current, 'var(--green)'],
            ['31-60d Overdue', aging.d30, 'var(--amber)'],
            ['61-90d Overdue', aging.d60, 'var(--amber)'],
            ['90d+ Overdue Critical', aging.d90plus, 'var(--red)']
          ].map(([lbl, val, col]) => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--bg-elevated);border-radius:var(--radius-sm)">
              <span style="font-weight:600;font-size:12px">${lbl}</span>
              <span style="font-family:var(--font-mono);font-weight:700;color:${col}">${finFmt(val)}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Overdue lists and chase actions -->
      <div class="card">
        <div class="card-header"><span class="card-title">Critical Overdue Invoices Follow-up</span></div>
        <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px">
          ${FinData.ar.filter(i => i.status === 'overdue').map(i => `
            <div style="padding:10px;border:1px solid rgba(239,68,68,0.1);background:rgba(239,68,68,0.04);border-radius:var(--radius-sm);display:flex;justify-content:space-between;align-items:center">
              <div>
                <div style="font-weight:700;font-size:12px">${i.client} (${i.ref})</div>
                <div style="font-size:10px;color:var(--text-muted);margin-top:2px">Contact: finance@${i.client.toLowerCase()}.com</div>
              </div>
              <button class="btn btn-secondary btn-xs" style="background:var(--red);color:white" onclick="showToast('Chased payment via email for ${i.ref}', 'success')">Chase payment</button>
            </div>
          `).join('') || '<div class="empty-state">No overdue invoices to chase.</div>'}
        </div>
      </div>
    </div>
  `;
}

// 4d. Client Ledger
async function renderARClientLedger() {
  const el = document.getElementById('finARSubContent');
  el.innerHTML = `
    <div class="card">
      <div class="card-header" style="padding-bottom:12px;border-bottom:1px solid var(--border)">
        <span class="card-title">Client Statement Ledger Search</span>
        <select id="ledgerClientSelect" class="form-control-xs" onchange="searchClientLedger_fin()">
          ${AppState.projects.map(p => `<option value="${p.id}">${p.id} — ${p.client}</option>`).join('')}
        </select>
      </div>
      <div style="overflow-x:auto;margin-top:12px">
        <table class="pnl-table">
          <thead>
            <tr>
              <th>Invoice Ref</th>
              <th>Description</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody id="clientLedgerResultsBody"></tbody>
        </table>
      </div>
    </div>
  `;

  searchClientLedger_fin();
}

async function searchClientLedger_fin() {
  const pid = document.getElementById('ledgerClientSelect').value;
  const body = document.getElementById('clientLedgerResultsBody');
  if (!body || !pid) return;

  body.innerHTML = `<tr><td colspan="5" style="text-align:center"><div class="spinner"></div>Loading client ledger...</td></tr>`;

  let results = [];
  try {
    results = await FinanceAPI.receivableClientLedger(pid);
  } catch (err) {
    results = FinData.ar.filter(i => i.project === pid);
  }

  body.innerHTML = results.map(item => `
    <tr>
      <td style="font-family:var(--font-mono);color:var(--brand)">${item.id || item.ref}</td>
      <td style="text-align:left">${item.description || item.desc}</td>
      <td>${item.due_date || item.due}</td>
      <td><span class="badge ${item.status==='paid'?'badge-green':item.status==='due'?'badge-amber':'badge-muted'}">${item.status.toUpperCase()}</span></td>
      <td style="font-family:var(--font-mono);font-weight:600">${finFmt(item.amount)}</td>
    </tr>
  `).join('') || `<tr><td colspan="5" class="empty-state">No statements found for client.</td></tr>`;
}
window.searchClientLedger_fin = searchClientLedger_fin;

/* ═══════════════════════════════════════════════════════════
   TAB 5 — MILESTONE BILLING
   ═══════════════════════════════════════════════════════════ */
async function renderFinMilestones() {
  const contentEl = document.getElementById('finTabContent');
  const pid = FinData.selectedProject;

  contentEl.innerHTML = `<div style="padding:40px;text-align:center"><div class="spinner"></div>Loading milestones...</div>`;

  let milestones = [];
  let summary = { contractValue: 284000, billedToDate: 99400, balanceToBill: 184600, received: 84490, outstanding: 14910 };

  try {
    milestones = await FinanceAPI.billingMilestones(pid);
    summary = await FinanceAPI.billingSummary(pid);
  } catch (err) {
    milestones = FinData.milestones[pid] || [];
    const invoiced = milestones.filter(m => m.status === 'invoiced' || m.status === 'paid').reduce((s,m) => s + m.amount, 0);
    const total = milestones.reduce((s,m) => s + m.amount, 0);
    summary = {
      contractValue: total,
      billedToDate: invoiced,
      balanceToBill: total - invoiced,
      received: invoiced * 0.85,
      outstanding: invoiced * 0.15
    };
  }

  const billedPct = summary.contractValue > 0 ? Math.round(summary.billedToDate / summary.contractValue * 100) : 0;

  contentEl.innerHTML = `
    <!-- Top Summary indicators -->
    <div class="metric-grid" style="margin-bottom:20px">
      ${[
        { label: 'Contract Value', value: finFmt(summary.contractValue), color: 'var(--blue)' },
        { label: 'Billed YTD', value: finFmt(summary.billedToDate), color: 'var(--green)' },
        { label: 'Billed %', value: billedPct + '%', color: 'var(--brand)' },
        { label: 'Balance to Bill', value: finFmt(summary.balanceToBill), color: 'var(--text-secondary)' },
        { label: 'Payments Received', value: finFmt(summary.received), color: 'var(--green)' }
      ].map(k => `<div class="metric-card"><div class="metric-label">${k.label}</div><div class="metric-value" style="font-size:18px;color:${k.color}">${k.value}</div></div>`).join('')}
    </div>

    <!-- Pipeline view -->
    <div class="card" style="margin-bottom:20px;padding:20px">
      <div class="card-header"><span class="card-title">Milestone pipeline schedule — ${pid}</span></div>
      
      <div class="milestone-list" style="margin-top:14px">
        ${milestones.map((ms, idx) => {
          const statusColors = { paid: 'var(--green)', invoiced: 'var(--blue)', due: 'var(--amber)', pending: 'var(--text-muted)', overdue: 'var(--red)' };
          const col = statusColors[ms.status] || 'var(--text-muted)';
          return `
            <div class="milestone-item" onclick="openMilestoneDetail_fin('${ms.id}')" style="cursor:pointer">
              <div class="ms-indicator">
                <div class="ms-dot" style="border-color:${col};background:${['paid','invoiced'].includes(ms.status)?col:'transparent'}"></div>
                ${idx < milestones.length - 1 ? `<div class="ms-line" style="background:${col}"></div>` : ''}
              </div>
              
              <div class="ms-body">
                <div class="ms-name" style="font-weight:700">${ms.name}</div>
                <div class="ms-meta">
                  <span>Target Date: ${ms.target_date || ms.dueDate}</span>
                  <span>·</span>
                  <span>Completion %: ${ms.stage_complete || 0}%</span>
                  <span>·</span>
                  <span style="color:${col};font-weight:600">${ms.status.toUpperCase()}</span>
                </div>
              </div>

              <div class="ms-right">
                <div class="ms-amount" style="color:var(--brand)">${finFmt(ms.billing_amount || ms.amount)}</div>
                <div style="font-size:10px;color:var(--text-muted)">${ms.billing_pct || ms.pct}% of contract</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function openMilestoneDetail_fin(id) {
  const pid = FinData.selectedProject;
  const ms = FinData.milestones[pid].find(m => m.id === id);
  if (!ms) return;

  openFinModal(`
    <div class="fin-modal-inner">
      <div class="fin-modal-header">
        <div>
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--brand)">${ms.id}</div>
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">${ms.name}</div>
        </div>
        <button class="btn-icon" onclick="closeFinModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="fin-modal-body">
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
          <span>Billing Percentage:</span><strong>${ms.pct || ms.billing_pct}%</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
          <span>Amount:</span><strong>${finFmt(ms.amount || ms.billing_amount)}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
          <span>Certificate Received:</span><strong style="color:var(--green)">YES</strong>
        </div>
        <div style="display:flex;gap:10px;margin-top:12px">
          ${ms.status === 'due' ? `<button class="btn btn-primary" style="flex:1" onclick="triggerMilestoneInvoice_fin('${ms.id}');closeFinModal()">Generate Invoice</button>` : ''}
          <button class="btn btn-secondary" onclick="showToast('Certificate uploaded successfully','success');closeFinModal()">Upload Certificate</button>
        </div>
      </div>
    </div>
  `);
}
window.openMilestoneDetail_fin = openMilestoneDetail_fin;

function triggerMilestoneInvoice_fin(milestoneId) {
  FinanceAPI.generateInvoiceFromMilestone(milestoneId, {}).then(() => {
    showToast('Invoice generated from milestone', 'success');
    renderFinMilestones();
  }).catch(() => {
    // demo fallback
    const pid = FinData.selectedProject;
    const ms = FinData.milestones[pid].find(m => m.id === milestoneId);
    if (ms) {
      ms.status = 'invoiced';
      ms.invoiceRef = `INV-${Date.now()}`;
      FinData.ar.push({
        ref: ms.invoiceRef,
        project: pid,
        client: 'ADNOC',
        desc: ms.name,
        amount: ms.amount || ms.billing_amount,
        due: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        status: 'due'
      });
      showToast('Invoice generated (demo mode)', 'info');
      renderFinMilestones();
    }
  });
}
window.triggerMilestoneInvoice_fin = triggerMilestoneInvoice_fin;

/* ═══════════════════════════════════════════════════════════
   TAB 6 — CASH FLOW
   ═══════════════════════════════════════════════════════════ */
function renderFinCashFlow() {
  const cf = FinData.cashFlow;
  const maxVal = Math.max(...cf.map(m => Math.max(m.inflow, m.outflow)));
  const W = 640, H = 180, pad = { t:20, r:20, b:32, l:60 };
  const chartW = W - pad.l - pad.r;
  const chartH = H - pad.t - pad.b;
  const barW = Math.floor(chartW / cf.length);
  const subBar = Math.floor(barW * 0.35);
  const gap = barW - subBar * 2 - 4;

  const cumulative = [];
  let cum = 0;
  cf.forEach(m => { cum += (m.inflow - m.outflow); cumulative.push(cum); });
  const minCum = Math.min(...cumulative, 0);
  const maxCum = Math.max(...cumulative, 0);
  const cumRange = maxCum - minCum || 1;

  const runningTotal = FinData.ar.filter(i=>i.status==='paid').reduce((s,i)=>s+i.amount,0);
  const totalOutflows = FinData.ap.filter(i=>i.status==='paid').reduce((s,i)=>s+i.amount,0);

  document.getElementById('finTabContent').innerHTML = `
    <div class="metric-grid" style="margin-bottom:20px">
      ${[
        { label:'Total inflows (2025)',  value:finFmt(cf.reduce((s,m)=>s+m.inflow,0)),   color:'var(--green)' },
        { label:'Total outflows (2025)', value:finFmt(cf.reduce((s,m)=>s+m.outflow,0)),  color:'var(--red)' },
        { label:'Net cash position',     value:finFmt(cf.reduce((s,m)=>s+m.inflow-m.outflow,0)), color:'var(--blue)' },
        { label:'Peak cash month',       value:'Jul',                                    color:'var(--text-primary)' },
      ].map(k=>`<div class="metric-card"><div class="metric-label">${k.label}</div><div class="metric-value" style="font-size:20px;color:${k.color}">${k.value}</div></div>`).join('')}
    </div>

    <!-- Cash flow bar chart (SVG) -->
    <div class="card" style="margin-bottom:16px">
      <div class="card-header">
        <span class="card-title">Monthly cash flow — 2025</span>
        <div style="display:flex;gap:12px;font-size:11px;color:var(--text-muted)">
          <span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;background:var(--green);border-radius:2px;display:inline-block"></span>Inflow</span>
          <span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;background:var(--red);border-radius:2px;display:inline-block"></span>Outflow</span>
          <span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:2px;background:var(--blue);display:inline-block"></span>Cumulative net</span>
        </div>
      </div>
      <div class="cashflow-chart" style="height:200px">
        <svg width="100%" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
          <!-- Grid lines -->
          ${[0,0.25,0.5,0.75,1].map(f => {
            const y = pad.t + chartH * f;
            const val = maxVal * (1-f);
            return `
            <line x1="${pad.l}" y1="${y}" x2="${W-pad.r}" y2="${y}" class="cf-gridline" stroke-width="0.5"/>
            <text x="${pad.l-6}" y="${y+3}" class="cf-axis-label" text-anchor="end">${finFmt(val)}</text>`;
          }).join('')}
          <!-- Bars -->
          ${cf.map((m, i) => {
            const x = pad.l + i * barW;
            const inH  = maxVal > 0 ? (m.inflow  / maxVal) * chartH : 0;
            const outH = maxVal > 0 ? (m.outflow / maxVal) * chartH : 0;
            return `
            <rect class="cf-bar" x="${x + gap/2}" y="${pad.t + chartH - inH}" width="${subBar}" height="${inH}" fill="var(--green)" rx="2" opacity="0.8" title="${m.label} inflow: ${finFmt(m.inflow)}"/>
            <rect class="cf-bar" x="${x + gap/2 + subBar + 2}" y="${pad.t + chartH - outH}" width="${subBar}" height="${outH}" fill="var(--red)" rx="2" opacity="0.8" title="${m.label} outflow: ${finFmt(m.outflow)}"/>
            <text x="${x + barW/2}" y="${H - 6}" class="cf-axis-label" text-anchor="middle">${m.label}</text>`;
          }).join('')}
          <!-- Cumulative line -->
          <polyline
            points="${cumulative.map((v,i) => {
              const x = pad.l + i * barW + barW/2;
              const y = pad.t + chartH - ((v - minCum) / cumRange) * chartH * 0.4 - chartH * 0.1;
              return `${x},${y}`;
            }).join(' ')}"
            fill="none" stroke="var(--blue)" stroke-width="1.5" stroke-dasharray="4 2" opacity="0.8"/>
          ${cumulative.map((v,i) => {
            const x = pad.l + i * barW + barW/2;
            const y = pad.t + chartH - ((v - minCum) / cumRange) * chartH * 0.4 - chartH * 0.1;
            return `<circle cx="${x}" cy="${y}" r="3" fill="var(--blue)" opacity="0.9"/>`;
          }).join('')}
        </svg>
      </div>
    </div>

    <!-- Monthly detail table -->
    <div class="card">
      <div class="card-header"><span class="card-title">Monthly detail</span></div>
      <div style="overflow-x:auto">
        <table class="pnl-table" style="min-width:480px">
          <thead>
            <tr><th>Month</th><th>Inflow</th><th>Outflow</th><th>Net</th><th>Cumulative</th></tr>
          </thead>
          <tbody>
            ${cf.map((m,i) => {
              const net = m.inflow - m.outflow;
              return `
              <tr>
                <td style="font-weight:500;text-align:left">${m.label} 2025</td>
                <td style="color:var(--green)">${finFmt(m.inflow)}</td>
                <td style="color:var(--red)">${finFmt(m.outflow)}</td>
                <td class="${net>=0?'pnl-var-pos':'pnl-var-neg'}" style="font-weight:600">${net>=0?'+':''}${finFmt(net)}</td>
                <td class="${cumulative[i]>=0?'pnl-var-pos':'pnl-var-neg'}">${cumulative[i]>=0?'+':''}${finFmt(cumulative[i])}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   TAB 7 — OVERHEAD ABSORPTION
   ═══════════════════════════════════════════════════════════ */
function renderFinOverhead() {
  const oh = FinData.overhead;
  const totalBudget = oh.reduce((s,r)=>s+r.budget,0);
  const totalActual = oh.reduce((s,r)=>s+r.actual,0);
  const variance    = totalBudget - totalActual;

  // Overhead absorbed = sum of overhead allocations across projects
  const absorbed = Object.values(FinData.jobCost).reduce((s,job) => {
    job.categories.forEach(cat => cat.lines.filter(l=>l.desc.toLowerCase().includes('overhead')).forEach(l=>{ s += l.actual; }));
    return s;
  }, 0);
  const absRate = totalActual > 0 ? Math.round((absorbed/totalActual)*100) : 0;

  document.getElementById('finTabContent').innerHTML = `
    <div class="metric-grid" style="margin-bottom:20px">
      ${[
        { label:'OH budget (annual)', value:finFmt(totalBudget), color:'var(--text-primary)' },
        { label:'OH actual YTD',      value:finFmt(totalActual), color:totalActual>totalBudget?'var(--red)':'var(--text-primary)' },
        { label:'OH variance',        value:(variance>=0?'+':'')+finFmt(variance), color:variance>=0?'var(--green)':'var(--red)' },
        { label:'Absorbed to projects',value:finFmt(absorbed),   color:'var(--blue)' },
        { label:'Absorption rate',    value:absRate+'%',         color:absRate>85?'var(--green)':absRate>70?'var(--amber)':'var(--red)' },
      ].map(k=>`<div class="metric-card"><div class="metric-label">${k.label}</div><div class="metric-value" style="font-size:20px;color:${k.color}">${k.value}</div></div>`).join('')}
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="card-header">
        <span class="card-title">Overhead allocation — YTD actuals vs budget</span>
      </div>
      <div style="display:grid;grid-template-columns:auto 1fr auto auto auto;align-items:center;gap:0;font-size:12px">
        <div style="font-size:10px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;padding:6px 14px 6px 0">Category</div>
        <div style="font-size:10px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;padding:6px 0">Burn rate</div>
        <div style="font-size:10px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;padding:6px 14px;text-align:right">Budget</div>
        <div style="font-size:10px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;padding:6px 14px;text-align:right">Actual</div>
        <div style="font-size:10px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;padding:6px 0;text-align:right">Var</div>
        ${oh.map(r => {
          const pct = r.budget > 0 ? Math.round((r.actual/r.budget)*100) : 0;
          const barColor = pct > 105 ? 'var(--red)' : pct > 95 ? 'var(--amber)' : 'var(--green)';
          const varAmt   = r.budget - r.actual;
          return `
          <div style="padding:10px 14px 10px 0;border-top:1px solid var(--border);color:var(--text-primary);white-space:nowrap">${r.name}</div>
          <div style="padding:10px 0;border-top:1px solid var(--border)">
            <div class="var-bar-wrap">
              <div class="var-bar-track" style="flex:1">
                <div class="var-bar-fill" style="width:${Math.min(110,pct)}%;background:${barColor}"></div>
              </div>
              <span style="font-size:10px;min-width:32px;text-align:right;color:${barColor};font-weight:600">${pct}%</span>
            </div>
          </div>
          <div style="padding:10px 14px;border-top:1px solid var(--border);text-align:right;font-family:var(--font-mono);color:var(--text-muted)">${finFmt(r.budget)}</div>
          <div style="padding:10px 14px;border-top:1px solid var(--border);text-align:right;font-family:var(--font-mono);font-weight:600">${finFmt(r.actual)}</div>
          <div style="padding:10px 0;border-top:1px solid var(--border);text-align:right;font-family:var(--font-mono);font-size:12px;color:${varAmt>=0?'var(--green)':'var(--red)'}">${varAmt>=0?'+':''}${finFmt(varAmt)}</div>`;
        }).join('')}
        <div style="padding:10px 14px 10px 0;border-top:2px solid var(--border-md);font-weight:700;font-family:var(--font-display)">Total overhead</div>
        <div style="padding:10px 0;border-top:2px solid var(--border-md)">
          <div class="var-bar-wrap">
            <div class="var-bar-track" style="flex:1">
              <div class="var-bar-fill" style="width:${Math.round(totalActual/totalBudget*100)}%;background:var(--green)"></div>
            </div>
            <span style="font-size:11px;min-width:36px;text-align:right;color:var(--green);font-weight:700">${Math.round(totalActual/totalBudget*100)}%</span>
          </div>
        </div>
        <div style="padding:10px 14px;border-top:2px solid var(--border-md);text-align:right;font-family:var(--font-mono);font-weight:700">${finFmt(totalBudget)}</div>
        <div style="padding:10px 14px;border-top:2px solid var(--border-md);text-align:right;font-family:var(--font-mono);font-weight:700">${finFmt(totalActual)}</div>
        <div style="padding:10px 0;border-top:2px solid var(--border-md);text-align:right;font-family:var(--font-mono);font-weight:700;color:${variance>=0?'var(--green)':'var(--red)'};">${variance>=0?'+':''}${finFmt(variance)}</div>
      </div>
    </div>

    <!-- Absorption by project -->
    <div class="card">
      <div class="card-header"><span class="card-title">Overhead absorption by project</span></div>
      ${AppState.projects.map(p => {
        const job = FinData.jobCost[p.id];
        if (!job) return '';
        const ohLine = job.categories.flatMap(c=>c.lines).find(l=>l.desc.toLowerCase().includes('overhead'));
        const absAmt = ohLine ? ohLine.actual : 0;
        const budAmt = ohLine ? ohLine.budget : 0;
        const absPct = budAmt > 0 ? Math.round((absAmt/budAmt)*100) : 0;
        return `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
          <span style="font-family:var(--font-mono);font-size:11px;color:var(--accent);min-width:58px">${p.id}</span>
          <div style="flex:1">
            <div class="progress-bar" style="height:6px">
              <div class="progress-fill" style="width:${absPct}%;background:var(--blue)"></div>
            </div>
          </div>
          <span style="font-family:var(--font-mono);font-size:12px;min-width:68px;text-align:right">${finFmt(absAmt)}</span>
          <span style="font-size:11px;color:var(--text-muted);min-width:36px;text-align:right">${absPct}%</span>
        </div>`;
      }).join('')}
      <div style="margin-top:12px;padding:10px 12px;background:var(--blue-bg);border:1px solid rgba(74,158,255,.2);border-radius:var(--radius-sm);font-size:12px;color:var(--blue)">
        Overhead rate: <strong>28%</strong> of direct labour cost · Absorption rate YTD: <strong>${absRate}%</strong>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   TAB 8 — BUDGET MANAGEMENT (Multi sub-tabs)
   ═══════════════════════════════════════════════════════════ */

async function renderFinBudget() {
  const contentEl = document.getElementById('finTabContent');
  const subTabs = [
    { id: 'list', label: 'Budget List' },
    { id: 'builder', label: 'Budget Builder' },
    { id: 'revisions', label: 'Revision History' },
    { id: 'monitoring', label: 'What-If Slider' }
  ];

  contentEl.innerHTML = `
    ${renderSubTabs(subTabs, FinData.budgetSubTab, 'switchFinBudgetSubTab')}
    <div id="finBudgetSubContent"></div>
  `;

  switchFinBudgetSubTab(FinData.budgetSubTab);
}

function switchFinBudgetSubTab(subTab) {
  FinData.budgetSubTab = subTab;
  document.querySelectorAll('#finTabContent .fin-subtabs-bar button').forEach((btn, idx) => {
    btn.className = `btn ${btn.textContent.trim() === {
      list: 'Budget List',
      builder: 'Budget Builder',
      revisions: 'Revision History',
      monitoring: 'What-If Slider'
    }[subTab] ? 'btn-primary' : 'btn-secondary'} btn-xs`;
  });

  const renderers = {
    list: renderBudgetList,
    builder: renderBudgetBuilder,
    revisions: renderBudgetRevisions,
    monitoring: renderBudgetMonitoring
  };
  if (renderers[subTab]) renderers[subTab]();
}
window.switchFinBudgetSubTab = switchFinBudgetSubTab;

// 6a. Budget List
async function renderBudgetList() {
  const el = document.getElementById('finBudgetSubContent');
  el.innerHTML = `<div style="padding:20px;text-align:center"><div class="spinner"></div>Loading budgets...</div>`;

  let budgets = [];
  try {
    budgets = await FinanceAPI.budgets();
  } catch (err) {
    budgets = Object.keys(FinData.budgets).map(pid => ({ projectId: pid, ...FinData.budgets[pid] }));
  }

  el.innerHTML = `
    <div class="card">
      <div class="card-header"><span class="card-title">Project Budgets Directory</span></div>
      <table class="pnl-table">
        <thead>
          <tr>
            <th>Project ID</th>
            <th>Approved By</th>
            <th>Approval Date</th>
            <th>Target Margin</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${budgets.map(b => `
            <tr>
              <td style="font-family:var(--font-mono);color:var(--brand)">${b.projectId}</td>
              <td>${b.approvedBy || '—'}</td>
              <td>${b.approvedDate || '—'}</td>
              <td>${b.marginTarget}%</td>
              <td><span class="badge ${b.status==='approved'?'badge-green':'badge-muted'}">${b.status.toUpperCase()}</span></td>
              <td>
                <button class="btn btn-secondary btn-xs" onclick="selectFinProject('${b.projectId}');switchFinBudgetSubTab('builder')">Open Builder</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// 6b. Budget Builder
async function renderBudgetBuilder() {
  const el = document.getElementById('finBudgetSubContent');
  const pid = FinData.selectedProject;
  el.innerHTML = `<div style="padding:20px;text-align:center"><div class="spinner"></div>Loading budget builder...</div>`;

  let budget = null;
  try {
    budget = await FinanceAPI.budgetLatest(pid);
  } catch (err) {
    budget = FinData.budgets[pid];
  }

  if (!budget) {
    el.innerHTML = `
      <div class="card"><div class="empty-state">
        <p>No budget found for project ${pid}.</p>
        <button class="btn btn-primary" onclick="createInitialBudget_fin('${pid}')">Initialize Draft Budget</button>
      </div></div>`;
    return;
  }

  el.innerHTML = `
    <div class="card">
      <div class="card-header" style="flex-wrap:wrap;gap:12px">
        <span class="card-title">Interactive Budget Builder — ${pid}</span>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary btn-sm" onclick="importBOMToBudget_fin('${pid}')">Import from BOM</button>
          ${budget.status === 'draft' ? `<button class="btn btn-primary btn-sm" onclick="submitBudgetForApproval_fin('${budget.id || 'bud-1'}')">Submit for Approval</button>` : ''}
          ${budget.status === 'pending' ? `<button class="btn btn-primary btn-sm" onclick="approveBudget_fin('${budget.id || 'bud-1'}')">Approve Budget</button>` : ''}
        </div>
      </div>
      
      <div style="overflow-x:auto;margin-top:14px">
        <table class="pnl-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Estimate (USD)</th>
              <th>Approved (USD)</th>
              <th>Committed (USD)</th>
              <th>Actual (USD)</th>
            </tr>
          </thead>
          <tbody>
            ${budget.lines.map((l, idx) => `
              <tr>
                <td style="font-weight:700;text-align:left">${l.category}</td>
                <td><input type="number" class="form-control-xs" style="width:110px;text-align:right" value="${l.estimate}" onchange="updateBudgetLine_fin('${idx}', 'estimate', this.value)"/></td>
                <td><input type="number" class="form-control-xs" style="width:110px;text-align:right" value="${l.approved}" onchange="updateBudgetLine_fin('${idx}', 'approved', this.value)"/></td>
                <td>${finFmt(l.committed)}</td>
                <td>${finFmt(l.actual)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function updateBudgetLine_fin(idx, key, val) {
  const pid = FinData.selectedProject;
  const budget = FinData.budgets[pid];
  if (budget && budget.lines[idx]) {
    budget.lines[idx][key] = Number(val);
    showToast('Budget cell updated (demo auto-save)', 'info');
  }
}
window.updateBudgetLine_fin = updateBudgetLine_fin;

function createInitialBudget_fin(pid) {
  FinanceAPI.createBudget(pid, { marginTarget: 15, lines: [
    { category: 'Materials', estimate: 75000, approved: 75000, committed: 0, actual: 0 },
    { category: 'Labour', estimate: 30000, approved: 30000, committed: 0, actual: 0 },
    { category: 'Subcontract', estimate: 10000, approved: 10000, committed: 0, actual: 0 }
  ]}).then(() => {
    showToast('Budget initialized', 'success');
    renderBudgetBuilder();
  }).catch(() => {
    FinData.budgets[pid] = {
      status: 'draft',
      marginTarget: 15,
      revisions: [{ rev: 'B0', date: new Date().toISOString().split('T')[0], reason: 'Setup', totalCost: 115000, margin: 15000 }],
      lines: [
        { category: 'Materials', estimate: 75000, approved: 75000, committed: 0, actual: 0 },
        { category: 'Labour', estimate: 30000, approved: 30000, committed: 0, actual: 0 },
        { category: 'Subcontract', estimate: 10000, approved: 10000, committed: 0, actual: 0 }
      ]
    };
    showToast('Budget initialized (demo mode)', 'info');
    renderBudgetBuilder();
  });
}
window.createInitialBudget_fin = createInitialBudget_fin;

function importBOMToBudget_fin(pid) {
  FinanceAPI.importBomToBudget(pid, {}).then(() => {
    showToast('Materials imported from BOM pricing', 'success');
    renderBudgetBuilder();
  }).catch(() => {
    const budget = FinData.budgets[pid];
    if (budget) {
      budget.lines.push({ category: 'BOM Import Material', estimate: 12500, approved: 12500, committed: 0, actual: 0 });
      showToast('BOM lines imported (demo mode)', 'info');
      renderBudgetBuilder();
    }
  });
}
window.importBOMToBudget_fin = importBOMToBudget_fin;

function submitBudgetForApproval_fin(id) {
  FinanceAPI.submitBudget(id, {}).then(() => {
    showToast('Budget submitted for approval', 'success');
    renderBudgetBuilder();
  }).catch(() => {
    const pid = FinData.selectedProject;
    if (FinData.budgets[pid]) FinData.budgets[pid].status = 'pending';
    showToast('Budget status: pending (demo)', 'info');
    renderBudgetBuilder();
  });
}
window.submitBudgetForApproval_fin = submitBudgetForApproval_fin;

function approveBudget_fin(id) {
  FinanceAPI.approveBudget(id, {}).then(() => {
    showToast('Budget approved and baseline set', 'success');
    renderBudgetBuilder();
  }).catch(() => {
    const pid = FinData.selectedProject;
    if (FinData.budgets[pid]) {
      FinData.budgets[pid].status = 'approved';
      FinData.budgets[pid].approvedBy = 'A. Sharma';
      FinData.budgets[pid].approvedDate = new Date().toISOString().split('T')[0];
    }
    showToast('Budget approved (demo)', 'info');
    renderBudgetBuilder();
  });
}
window.approveBudget_fin = approveBudget_fin;

// 6c. Budget Revision history
async function renderBudgetRevisions() {
  const el = document.getElementById('finBudgetSubContent');
  const pid = FinData.selectedProject;
  const budget = FinData.budgets[pid];

  if (!budget) {
    el.innerHTML = `<div class="card"><div class="empty-state">No budget revisions available.</div></div>`;
    return;
  }

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:260px 1fr;gap:20px">
      <!-- Revision select list -->
      <div class="card" style="padding:0">
        <div style="padding:10px;font-size:11px;font-weight:700;color:var(--text-muted);border-bottom:1px solid var(--border)">BUDGET REVISIONS</div>
        ${budget.revisions.map((r, idx) => `
          <div onclick="selectBudgetRevision_fin('${idx}')" style="padding:10px;border-bottom:1px solid var(--border);cursor:pointer;font-size:12px;background:${idx===window.selectedBudgetRevisionIdx?'var(--bg-active)':''}">
            <div style="font-weight:600">Revision ${r.rev}</div>
            <div style="font-size:10px;color:var(--text-muted);margin-top:2px">${r.reason} · ${r.date}</div>
          </div>
        `).join('')}
      </div>

      <!-- Revision Diff panel -->
      <div id="revisionDetailsDisplay" class="card" style="padding:20px">
        <div class="empty-state">Select a revision to display diff comparisons.</div>
      </div>
    </div>
  `;
}

function selectBudgetRevision_fin(idx) {
  window.selectedBudgetRevisionIdx = Number(idx);
  renderBudgetRevisions(); // redraw

  const container = document.getElementById('revisionDetailsDisplay');
  const pid = FinData.selectedProject;
  const budget = FinData.budgets[pid];
  if (!container || !budget) return;

  const rev = budget.revisions[idx];

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--border);padding-bottom:10px">
      <div>
        <div style="font-size:16px;font-weight:700">Revision ${rev.rev} Details</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Reason: ${rev.reason} · Created: ${rev.date}</div>
      </div>
    </div>
    
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px">
      <div style="background:var(--bg-elevated);padding:14px;border-radius:var(--radius-sm)">
        <div style="font-size:10px;text-transform:uppercase;color:var(--text-muted)">Total revision cost</div>
        <div style="font-size:24px;font-weight:800;color:var(--brand);margin-top:4px">${finFmt(rev.totalCost)}</div>
      </div>
      <div style="background:var(--bg-elevated);padding:14px;border-radius:var(--radius-sm)">
        <div style="font-size:10px;text-transform:uppercase;color:var(--text-muted)">Projected Margin</div>
        <div style="font-size:24px;font-weight:800;color:var(--green);margin-top:4px">${finFmt(rev.margin)}</div>
      </div>
    </div>
  `;
}
window.selectBudgetRevision_fin = selectBudgetRevision_fin;

// 6d. What-If Interactive Sliders & Monitoring
async function renderBudgetMonitoring() {
  const el = document.getElementById('finBudgetSubContent');
  const pid = FinData.selectedProject;
  const budget = FinData.budgets[pid];

  if (!budget) {
    el.innerHTML = `<div class="card"><div class="empty-state">No budget configuration.</div></div>`;
    return;
  }

  const proj = AppState.projects.find(p => p.id === pid);
  const cv = proj?.value || 0;
  const baseComm = budget.lines.reduce((s, l) => s + l.committed, 0);

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:20px">
      <!-- What-if calculator -->
      <div class="card" style="padding:20px">
        <div class="card-header" style="padding:0 0 10px;border-bottom:1px solid var(--border)"><span class="card-title">Interactive What-If Cost Slider</span></div>
        
        <div style="margin-top:14px">
          ${[
            { label: 'Material Price fluctuation (%)', id: 'matSlider', min: -20, max: 30, val: 0 },
            { label: 'Labour cost variance (%)', id: 'labSlider', min: -20, max: 30, val: 0 },
            { label: 'Overhead absorption adjustments (%)', id: 'ohSlider', min: -20, max: 30, val: 0 }
          ].map(slider => `
            <div class="fin-field" style="margin-bottom:14px">
              <label>${slider.label}</label>
              <div style="display:flex;align-items:center;gap:12px">
                <input type="range" id="${slider.id}" min="${slider.min}" max="${slider.max}" value="${slider.val}" style="flex:1" oninput="updateWhatIfSliders_fin('${pid}', ${cv}, ${baseComm})"/>
                <span id="${slider.id}Val" style="font-family:var(--font-mono);font-weight:700;min-width:44px">0%</span>
              </div>
            </div>
          `).join('')}
        </div>

        <div id="whatIfResultBox" style="margin-top:18px;padding:12px;background:var(--blue-bg);border:1px solid rgba(74,158,255,.2);border-radius:var(--radius-sm);font-size:13px;color:var(--blue)">
          Adjust the cost sliders to dynamically model margins.
        </div>
      </div>

      <!-- Live alert thresholds configuration -->
      <div class="card" style="padding:20px;align-self:start">
        <div class="card-header" style="padding:0 0 10px;border-bottom:1px solid var(--border)"><span class="card-title">Budget Alert Threshold Config</span></div>
        <div class="fin-field" style="margin-top:14px">
          <label>Alert Threshold Percentage</label>
          <div style="display:flex;align-items:center;gap:12px">
            <input type="number" id="alertThresholdInput" class="form-control-xs" value="80" style="width:70px"/>
            <span style="font-size:13px">% of budget committed</span>
          </div>
        </div>
        <button class="btn btn-primary" style="width:100%;margin-top:14px" onclick="saveAlertConfig_fin()">Save Configuration</button>
      </div>
    </div>
  `;
}

function updateWhatIfSliders_fin(pid, cv, baseComm) {
  const mat = Number(document.getElementById('matSlider').value);
  const lab = Number(document.getElementById('labSlider').value);
  const oh = Number(document.getElementById('ohSlider').value);

  document.getElementById('matSliderVal').textContent = (mat >= 0 ? '+' : '') + mat + '%';
  document.getElementById('labSliderVal').textContent = (lab >= 0 ? '+' : '') + lab + '%';
  document.getElementById('ohSliderVal').textContent = (oh >= 0 ? '+' : '') + oh + '%';

  const budget = FinData.budgets[pid];
  let newCost = 0;
  budget.lines.forEach(l => {
    const adj = l.category.toLowerCase().includes('material') ? 1 + mat/100
              : l.category.toLowerCase().includes('labour')   ? 1 + lab/100
              : l.category.toLowerCase().includes('overhead') ? 1 + oh/100 : 1;
    newCost += l.committed * adj;
  });

  const newMargin = cv - newCost;
  const newPct = cv > 0 ? Math.round(newMargin / cv * 100) : 0;

  document.getElementById('whatIfResultBox').innerHTML = `
    <strong>Scenario projection:</strong> cost is <strong>${finFmt(Math.round(newCost))}</strong> · Margin: <strong style="color:${newPct>=budget.marginTarget?'var(--green)':'var(--amber)'}">${newPct}%</strong>
  `;
}
window.updateWhatIfSliders_fin = updateWhatIfSliders_fin;

function saveAlertConfig_fin() {
  const val = Number(document.getElementById('alertThresholdInput').value);
  FinanceAPI.updateBudgetAlertConfig(FinData.selectedProject, { threshold: val }).then(() => {
    showToast('Alert threshold saved successfully', 'success');
  }).catch(() => {
    showToast('Configuration saved (demo mode)', 'success');
  });
}
window.saveAlertConfig_fin = saveAlertConfig_fin;

/* ═══════════════════════════════════════════════════════════
   TAB 7 — REPORTS REGISTRY
   ═══════════════════════════════════════════════════════════ */
function renderFinReports() {
  const REPORTS = [
    { id: 'pnl', label: 'Project P&L Statement', icon: '📊', desc: 'Margin and cost totals per project' },
    { id: 'revenue', label: 'Monthly Revenue Report', icon: '💵', desc: 'Invoiced vs. collected amounts' },
    { id: 'venpay', label: 'Vendor Payments Summary', icon: '🏭', desc: 'AP balances per vendor' },
    { id: 'araging', label: 'Client AR Aging Report', icon: '⏱', desc: 'Receivables grouped by age' },
    { id: 'cashflow', label: 'Cash Flow Statement', icon: '🌊', desc: 'Monthly inflows, outflows and net position' },
    { id: 'tax', label: 'Tax Computation (GST/TDS)', icon: '🧾', desc: 'VAT Input/Output credits details' },
    { id: 'bgreg', label: 'Bank Guarantee Register', icon: '🏦', desc: 'Expiry calendar and release status' },
    { id: 'budvact', label: 'Budget vs. Actuals', icon: '🎯', desc: 'Baselined budget vs. actual spend' }
  ];

  const active = FinData.activeReport;

  document.getElementById('finTabContent').innerHTML = `
    <div style="display:grid;grid-template-columns:240px 1fr;gap:20px">
      <!-- Sidebar selectors -->
      <div class="card" style="padding:0;overflow:hidden;align-self:start">
        <div style="padding:10px;font-size:11px;font-weight:700;color:var(--text-muted);border-bottom:1px solid var(--border)">AVAILABLE REPORTS</div>
        ${REPORTS.map(r => `
          <div onclick="selectFinReport_fin('${r.id}')" style="padding:12px;border-bottom:1px solid var(--border);cursor:pointer;font-size:12px;background:${r.id === active ? 'var(--bg-active)' : ''}">
            <div style="font-weight:700;color:${r.id===active?'var(--brand)':'var(--text-primary)'}">${r.icon} ${r.label}</div>
            <div style="font-size:10px;color:var(--text-muted);margin-top:2px">${r.desc}</div>
          </div>
        `).join('')}
      </div>

      <!-- Report Sheet View -->
      <div id="finReportContent">
        ${renderReportSheet(active)}
      </div>
    </div>
  `;
}

function selectFinReport_fin(id) {
  FinData.activeReport = id;
  renderFinReports(); // re-draw
}
window.selectFinReport_fin = selectFinReport_fin;

function renderReportSheet(id) {
  const allProjects = AppState.projects;
  const totals = allProjects.map(p => ({ id: p.id, name: p.name, ...calcJobTotals(p.id) })).filter(t => t.budget);
  
  const exportControls = `
    <div style="display:flex;gap:8px">
      <button class="btn btn-secondary btn-sm" onclick="showToast('Excel report generated','success')">Export Excel</button>
      <button class="btn btn-ghost btn-sm" onclick="showToast('PDF file downloaded','success')">Download PDF</button>
    </div>
  `;

  switch (id) {
    case 'pnl':
      return `
        <div class="card">
          <div class="card-header">
            <span class="card-title">Project P&L Statement</span>
            ${exportControls}
          </div>
          <table class="pnl-table">
            <thead>
              <tr><th>Project ID</th><th>Contract Value</th><th>Forecast Cost</th><th>Gross Margin</th><th>Margin %</th></tr>
            </thead>
            <tbody>
              ${totals.map(t => `
                <tr>
                  <td style="font-family:var(--font-mono);color:var(--brand)">${t.id}</td>
                  <td>${finFmt(t.contractValue)}</td>
                  <td>${finFmt(t.forecast)}</td>
                  <td class="${t.margin>=0?'pnl-var-pos':'pnl-var-neg'}">${finFmt(t.margin)}</td>
                  <td style="font-weight:700">${t.marginPct}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    
    case 'revenue':
      return `
        <div class="card">
          <div class="card-header">
            <span class="card-title">Monthly Revenue Report (2025)</span>
            ${exportControls}
          </div>
          <table class="pnl-table">
            <thead>
              <tr><th>Month</th><th>Invoiced Amount</th><th>Collected YTD</th><th>Outstanding</th></tr>
            </thead>
            <tbody>
              ${FinData.cashFlow.map(m => `
                <tr>
                  <td style="text-align:left">${m.month}</td>
                  <td>${finFmt(m.inflow)}</td>
                  <td style="color:var(--green)">${finFmt(Math.round(m.inflow*0.85))}</td>
                  <td style="color:var(--amber)">${finFmt(Math.round(m.inflow*0.15))}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

    case 'venpay':
      return `
        <div class="card">
          <div class="card-header">
            <span class="card-title">Vendor Accounts Payable Summary</span>
            ${exportControls}
          </div>
          <table class="pnl-table">
            <thead>
              <tr><th>Vendor</th><th>Outstanding AP</th><th>Due Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${FinData.ap.map(item => `
                <tr>
                  <td style="text-align:left">${item.vendor}</td>
                  <td style="font-family:var(--font-mono)">${finFmt(item.amount)}</td>
                  <td>${item.due}</td>
                  <td><span class="badge badge-dept">${item.status.toUpperCase()}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

    case 'araging':
      return `
        <div class="card">
          <div class="card-header">
            <span class="card-title">Client AR Aging Analysis</span>
            ${exportControls}
          </div>
          <table class="pnl-table">
            <thead>
              <tr><th>Client</th><th>Current</th><th>31-60d</th><th>61-90d</th><th>90d+</th></tr>
            </thead>
            <tbody>
              ${FinData.ar.map(item => `
                <tr>
                  <td style="text-align:left">${item.client} (${item.ref})</td>
                  <td>${item.status==='paid'?'—':finFmt(item.amount)}</td>
                  <td>${item.status==='due'?'—':'—'}</td>
                  <td>${item.status==='overdue'?finFmt(item.amount):'—'}</td>
                  <td>—</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

    case 'cashflow':
      return `
        <div class="card">
          <div class="card-header">
            <span class="card-title">Cash Flow Statement</span>
            ${exportControls}
          </div>
          <table class="pnl-table">
            <thead>
              <tr><th>Month</th><th>Cash Inflow</th><th>Cash Outflow</th><th>Net Inflow</th></tr>
            </thead>
            <tbody>
              ${FinData.cashFlow.map(m => `
                <tr>
                  <td style="text-align:left">${m.month}</td>
                  <td style="color:var(--green)">${finFmt(m.inflow)}</td>
                  <td style="color:var(--red)">${finFmt(m.outflow)}</td>
                  <td style="font-weight:700;color:${(m.inflow-m.outflow)>=0?'var(--green)':'var(--red)'}">${finFmt(m.inflow-m.outflow)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

    case 'tax':
      return `
        <div class="card">
          <div class="card-header">
            <span class="card-title">Tax Computation (GST input / Output credits)</span>
            ${exportControls}
          </div>
          <table class="pnl-table">
            <thead>
              <tr><th>Project</th><th>Invoice Value</th><th>Output CGST (9%)</th><th>Output SGST (9%)</th><th>Output IGST (18%)</th></tr>
            </thead>
            <tbody>
              ${totals.map(t => {
                const inv = FinData.ar.filter(i => i.project === t.id).reduce((s,i) => s + i.amount, 0);
                return `
                  <tr>
                    <td style="font-family:var(--font-mono);color:var(--brand)">${t.id}</td>
                    <td>${finFmt(inv)}</td>
                    <td>${finFmt(Math.round(inv * 0.09))}</td>
                    <td>${finFmt(Math.round(inv * 0.09))}</td>
                    <td>—</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;

    case 'bgreg':
      return `
        <div class="card">
          <div class="card-header">
            <span class="card-title">Bank Guarantee Registry</span>
            ${exportControls}
          </div>
          <table class="pnl-table">
            <thead>
              <tr><th>BG Reference</th><th>Project ID</th><th>Type</th><th>Issuing Bank</th><th>Amount</th><th>Expiry</th></tr>
            </thead>
            <tbody>
              ${FinData.bankGuarantees.map(bg => `
                <tr>
                  <td style="font-family:var(--font-mono);color:var(--brand)">${bg.ref}</td>
                  <td>${bg.project}</td>
                  <td style="text-align:left">${bg.type}</td>
                  <td style="text-align:left">${bg.bank}</td>
                  <td style="font-weight:600">${finFmt(bg.amount)}</td>
                  <td>${bg.expiry}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

    case 'budvact':
      return `
        <div class="card">
          <div class="card-header">
            <span class="card-title">Budget vs. Actual cost breakdown</span>
            ${exportControls}
          </div>
          <table class="pnl-table">
            <thead>
              <tr><th>Project</th><th>Total Budget</th><th>Actual Spend YTD</th><th>Committed Cost</th><th>Remaining Variance</th></tr>
            </thead>
            <tbody>
              ${totals.map(t => `
                <tr>
                  <td style="font-family:var(--font-mono);color:var(--brand)">${t.id}</td>
                  <td>${finFmt(t.budget)}</td>
                  <td>${finFmt(t.actual)}</td>
                  <td>${finFmt(t.committed)}</td>
                  <td class="${t.variance>=0?'pnl-var-pos':'pnl-var-neg'}">${t.variance>=0?'+':''}${finFmt(t.variance)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

    default:
      return `<div class="card"><div class="empty-state">Report not found.</div></div>`;
  }
}
