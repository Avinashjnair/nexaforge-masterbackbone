/* ============================================================
   NexaForge ERP — Per-Department Dashboards (ARCH-04)
   One renderDashboard_<Dept>() function per department.
   Each renders: page header · KPI strip · action queue · main widget
   ============================================================ */

'use strict';

// ── Shared helpers ───────────────────────────────────────────

function deptAccent() {
  return AppState.accent || 'var(--brand)';
}

// kpiCard() and sparkline() are defined in app.js (loaded first)

function kpiStrip(cards) {
  return `<div class="kpi-strip">${cards.join('')}</div>`;
}

function deptKpiStrip(kpis) {
  return `
    <div class="kpi-strip">
      ${kpis.map((k, i) => {
        const v = String(k.value);
        const numMatch = v.match(/^([^0-9-]*)(-?[\d,.]+)([^0-9]*)$/);
        const prefix   = numMatch ? numMatch[1] : '';
        const rawNum   = numMatch ? numMatch[2].replace(/,/g, '') : null;
        const suffix   = numMatch ? numMatch[3] : '';
        const valueHtml = rawNum !== null && v !== '—'
          ? `<span data-countup data-target="${rawNum}" data-prefix="${prefix}" data-suffix="${suffix}" data-delay="${i * 80}">${v}</span>`
          : v;
        return `
        <div class="kpi-card metric-card--glass">
          <div class="kpi-accent-bar" style="background:${k.color || 'var(--dept-accent)'}"></div>
          <div class="kpi-label">${k.label}</div>
          <div class="kpi-value" style="color:${k.color || 'var(--dept-accent)'}">${valueHtml}</div>
          <div class="kpi-sub">${k.sub}</div>
        </div>`;
      }).join('')}
    </div>`;
}

function deptPageHeader(title, subtitle, actions = '') {
  return `
    <div class="page-header">
      <div>
        <div class="section-heading" style="margin-bottom:4px">
          <div class="section-heading-text page-title" style="color:var(--dept-accent,${deptAccent()})">${title}</div>
        </div>
        <div class="page-subtitle">${subtitle}</div>
      </div>
      <div class="page-actions">${actions}</div>
    </div>`;
}

function actionQueue(items, emptyMsg = 'All clear — no pending actions') {
  if (!items.length) {
    return `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px">${emptyMsg}</div>`;
  }
  return items.map(item => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer"
         onclick="${item.action || ''}">
      <span style="width:6px;height:6px;border-radius:50%;background:${item.urgent ? 'var(--red)' : deptAccent()};flex-shrink:0"></span>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;color:var(--text-primary);font-weight:500">${item.label}</div>
        ${item.sub ? `<div style="font-size:11px;color:var(--text-muted)">${item.sub}</div>` : ''}
      </div>
      ${item.badge ? `<span class="badge" style="background:${item.urgent ? 'rgba(245,101,101,0.12)' : 'var(--bg-elevated)'};color:${item.urgent ? 'var(--red)' : 'var(--text-muted)'}">${item.badge}</span>` : ''}
    </div>`).join('');
}

function skeletonCard(h = 200) {
  return `<div class="skeleton" style="height:${h}px;border-radius:var(--radius-lg)"></div>`;
}

// ── Marketing Dashboard ──────────────────────────────────────

async function renderDashboard_Marketing() {
  const el = document.getElementById('pageContent');
  el.innerHTML = `
    ${deptPageHeader('Marketing & CRM', 'Pipeline, tenders, and quote activity',
      `<button class="btn btn-secondary btn-sm" onclick="renderDashboard_Marketing()">
        <svg viewBox="0 0 15 15" fill="none"><path d="M13 7.5A5.5 5.5 0 112.5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M2 2v3h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Refresh
      </button>
      <button class="btn btn-primary btn-sm" onclick="navigate('marketing')">Open CRM →</button>`
    )}
    ${deptKpiStrip([
      { label: 'Pipeline value',     value: '—',   sub: 'Loading…',          color: '#2563EB' },
      { label: 'Win rate',           value: '—',   sub: 'Closed won / total', color: '#059669' },
      { label: 'Tenders due ≤ 7d',   value: '—',   sub: 'Requires attention', color: '#DC2626' },
      { label: 'Quotes outstanding', value: '—',   sub: 'Sent, awaiting reply',color: '#D97706' },
    ])}
    <div class="dash-grid">
      <div>
        <div class="card" style="margin-bottom:16px">
          <div class="card-header">
            <span class="card-title">Active pipeline</span>
            <button class="btn btn-ghost btn-sm" onclick="navigate('marketing')">View all →</button>
          </div>
          <div id="mktPipelineList">${skeletonCard(180)}</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Action queue</span>
            <span class="badge" style="background:rgba(37,99,235,0.12);color:#2563EB" id="mktActionBadge">—</span>
          </div>
          <div id="mktActionQueue">${skeletonCard(120)}</div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Event feed</span></div>
          <div class="activity-feed" id="activityFeed"></div>
        </div>
      </div>
    </div>`;

  try {
    const [opps, tenders] = await Promise.allSettled([
      api.get('/opportunities?status=active,proposal,negotiation&limit=20'),
      api.get('/opportunities?status=tender&limit=10'),
    ]);

    const oppData    = opps.status    === 'fulfilled' ? (opps.value.data    || opps.value    || []) : [];
    const tenderData = tenders.status === 'fulfilled' ? (tenders.value.data || tenders.value || []) : [];

    const pipelineValue = oppData.reduce((s, o) => s + (Number(o.value) || 0), 0);
    const wonCount  = oppData.filter(o => o.status === 'won').length;
    const winRate   = oppData.length ? Math.round((wonCount / oppData.length) * 100) : 0;
    const urgentTenders = tenderData.filter(t => {
      const days = t.deadline ? Math.ceil((new Date(t.deadline) - new Date()) / 86400000) : 999;
      return days <= 7;
    });

    document.querySelector('.kpi-strip').innerHTML = deptKpiStrip([
      { label: 'Pipeline value',     value: fmt(pipelineValue), sub: `${oppData.length} opportunities`, color: '#2563EB' },
      { label: 'Win rate',           value: `${winRate}%`,      sub: `${wonCount} won this period`,     color: '#059669' },
      { label: 'Tenders due ≤ 7d',   value: String(urgentTenders.length), sub: 'Requires attention',   color: '#DC2626' },
      { label: 'Quotes outstanding', value: String(oppData.filter(o => o.status === 'proposal').length), sub: 'Sent, awaiting reply', color: '#D97706' },
    ]);

    document.getElementById('mktPipelineList').innerHTML = oppData.slice(0, 5).map(o => `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:500;color:var(--text-primary)">${o.name || o.title || '—'}</div>
          <div style="font-size:11px;color:var(--text-muted)">${o.client_name || '—'} · ${o.status || '—'}</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:13px;font-weight:600;color:#2563EB">${fmt(o.value || 0)}</div>
        </div>
      </div>`).join('') || `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px">No active opportunities</div>`;

    const queueItems = [
      ...urgentTenders.map(t => ({ label: `Tender due: ${t.name || t.title || '—'}`, sub: `Deadline: ${fmtDate(t.deadline)}`, urgent: true, badge: 'Urgent' })),
      ...oppData.filter(o => o.status === 'proposal').slice(0, 3).map(o => ({ label: `Follow up: ${o.name || '—'}`, sub: `${o.client_name || '—'} — proposal sent`, urgent: false })),
    ];
    document.getElementById('mktActionQueue').innerHTML = actionQueue(queueItems);
    document.getElementById('mktActionBadge').textContent = String(queueItems.length);
  } catch {
    document.getElementById('mktPipelineList').innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted)">Could not load pipeline data</div>`;
  }
}

// ── Production Dashboard ─────────────────────────────────────

async function renderDashboard_Production() {
  const el = document.getElementById('pageContent');
  el.innerHTML = `
    ${deptPageHeader('Production', 'Shop floor status, scheduling, and WIP',
      `<button class="btn btn-secondary btn-sm" onclick="renderDashboard_Production()">
        <svg viewBox="0 0 15 15" fill="none"><path d="M13 7.5A5.5 5.5 0 112.5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M2 2v3h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Refresh
      </button>
      <button class="btn btn-primary btn-sm" onclick="navigate('production')">Open Production →</button>`
    )}
    ${deptKpiStrip([
      { label: 'OEE',                value: '—%',  sub: 'Target ≥ 80%',        color: '#D97706' },
      { label: 'Schedule attainment',value: '—%',  sub: 'On-time jobs today',   color: '#059669' },
      { label: 'Active work orders', value: '—',   sub: 'Across all projects',  color: '#D97706' },
      { label: 'Overdue steps',      value: '—',   sub: 'Require re-scheduling',color: '#DC2626' },
    ])}
    <div class="dash-grid">
      <div>
        <div class="card" style="margin-bottom:16px">
          <div class="card-header">
            <span class="card-title">Active projects on shop floor</span>
            <button class="btn btn-ghost btn-sm" onclick="navigate('projects')">View all →</button>
          </div>
          <div id="prodProjectList">${skeletonCard(180)}</div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Machine status</span></div>
          <div id="prodMachineStatus">${skeletonCard(100)}</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Action queue</span>
            <span class="badge" style="background:rgba(217,119,6,0.12);color:#D97706" id="prodActionBadge">—</span>
          </div>
          <div id="prodActionQueue">${skeletonCard(140)}</div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Event feed</span></div>
          <div class="activity-feed" id="activityFeed"></div>
        </div>
      </div>
    </div>`;

  try {
    const [agg, projects, machines] = await Promise.allSettled([
      api.get('/dashboard/production'),
      ProjectsAPI.list({ status: 'active', limit: 6 }),
      api.get('/machines?limit=10'),
    ]);

    const aggData     = agg.status      === 'fulfilled' ? agg.value      : {};
    const projectData = projects.status === 'fulfilled' ? (projects.value.data || projects.value || []) : [];
    const machineData = machines.status === 'fulfilled' ? (machines.value.data || machines.value || []) : [];

    const oee         = aggData.oee?.pct              ?? 73;
    const schedAtt    = aggData.schedule_attainment   ?? 81;
    const wipValue    = aggData.wip_value             ?? 0;
    const overdueList = aggData.overdue_steps         ?? [];

    document.querySelector('.kpi-strip').innerHTML = kpiStrip([
      kpiCard('OEE',                 `${oee}%`,         'Target ≥ 80%',                            '#D97706', [68,70,72,71,73,72,74,oee]),
      kpiCard('Schedule attainment', `${schedAtt}%`,    `${overdueList.length} steps overdue`,     '#059669', [75,78,80,79,83,82,80,schedAtt]),
      kpiCard('Active work orders',  String(projectData.length), 'Across all projects',            '#D97706', null),
      kpiCard('WIP value',           fmt(wipValue),     'Contract value × progress',               '#4a9eff', null),
    ]);

    document.getElementById('prodProjectList').innerHTML = projectData.slice(0, 5).map(p => {
      const pct = p.progress_pct ?? p.progress ?? 0;
      return `
      <div style="padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px">
          <div>
            <div style="font-size:13px;font-weight:500;color:var(--text-primary)">${p.project_no || p.id} — ${p.name}</div>
            <div style="font-size:11px;color:var(--text-muted)">Phase ${p.phase || 1} · Due ${fmtDate(p.due_date)}</div>
          </div>
          ${statusBadge(p.status)}
        </div>
        <div class="pipeline-progress-row">
          <div class="progress-bar" style="flex:1"><div class="progress-fill" style="width:${pct}%;background:#D97706"></div></div>
          <span class="pipeline-pct">${pct}%</span>
        </div>
      </div>`;
    }).join('') || `<div style="padding:20px;text-align:center;color:var(--text-muted)">No active projects</div>`;

    document.getElementById('prodMachineStatus').innerHTML = machineData.slice(0, 4).map(m => `
      <div style="display:flex;align-items:center;gap:8px;padding:6px 0">
        <span style="width:8px;height:8px;border-radius:50%;background:${m.status === 'running' ? 'var(--green)' : m.status === 'idle' ? 'var(--amber)' : 'var(--red)'};flex-shrink:0"></span>
        <span style="font-size:13px;color:var(--text-primary)">${m.name || m.machine_id}</span>
        <span style="font-size:11px;color:var(--text-muted);margin-left:auto">${m.status || '—'}</span>
      </div>`).join('') || `<div style="padding:12px;color:var(--text-muted);font-size:13px">No machines connected</div>`;

    const queueItems = [
      { label: 'Overdue step: P-2401 Welding Jt-07', sub: '2 days overdue — reassign welder', urgent: true, badge: 'Overdue' },
      { label: 'Material request pending approval',  sub: 'MR-0014 — 316L plate for P-2402',  urgent: false },
      { label: 'Routing step to log: P-2403 NDT',   sub: 'Radiographic exam scheduled today', urgent: false },
    ];
    document.getElementById('prodActionQueue').innerHTML = actionQueue(queueItems);
    document.getElementById('prodActionBadge').textContent = String(queueItems.length);
  } catch {
    document.getElementById('prodProjectList').innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted)">Could not load data</div>`;
  }
}

// ── QC Dashboard ─────────────────────────────────────────────

async function renderDashboard_QC() {
  const el = document.getElementById('pageContent');
  el.innerHTML = `
    ${deptPageHeader('Quality Control', 'Inspection queue, NCRs, and hold points',
      `<button class="btn btn-secondary btn-sm" onclick="renderDashboard_QC()">
        <svg viewBox="0 0 15 15" fill="none"><path d="M13 7.5A5.5 5.5 0 112.5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M2 2v3h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Refresh
      </button>
      <button class="btn btn-primary btn-sm" onclick="navigate('quality')">Open QC →</button>`
    )}
    ${deptKpiStrip([
      { label: 'First pass yield',    value: '—%', sub: 'Target ≥ 95%',          color: '#059669' },
      { label: 'Open NCRs',           value: '—',  sub: 'Require disposition',    color: '#DC2626' },
      { label: 'Pending inspections', value: '—',  sub: 'GRNs awaiting QC',       color: '#D97706' },
      { label: 'Hold points active',  value: '—',  sub: 'Blocking production',    color: '#DC2626' },
    ])}
    <div class="dash-grid">
      <div>
        <div class="card" style="margin-bottom:16px">
          <div class="card-header">
            <span class="card-title">Open NCRs</span>
            <button class="btn btn-ghost btn-sm" onclick="navigate('quality')">View all →</button>
          </div>
          <div id="qcNcrList">${skeletonCard(200)}</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Action queue</span>
            <span class="badge" style="background:rgba(5,150,105,0.12);color:#059669" id="qcActionBadge">—</span>
          </div>
          <div id="qcActionQueue">${skeletonCard(160)}</div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Event feed</span></div>
          <div class="activity-feed" id="activityFeed"></div>
        </div>
      </div>
    </div>`;

  try {
    const [agg, ncrs] = await Promise.allSettled([
      api.get('/dashboard/qc'),
      QCAPI.ncrList({ status: 'open,under_review', limit: 20 }),
    ]);

    const aggData = agg.status  === 'fulfilled' ? agg.value  : {};
    const ncrData = ncrs.status === 'fulfilled' ? (ncrs.value || []) : [];

    const fpy      = aggData.fpy_pct              ?? 91;
    const openNcrs = aggData.ncr?.total_open      ?? ncrData.length;
    const critNcrs = aggData.ncr?.critical_count  ?? ncrData.filter(n => n.severity === 'critical' || n.severity === 'major').length;
    const holds    = aggData.hold_points          ?? 0;
    const pendInsp = aggData.pending_inspections  ?? 0;
    const copq     = aggData.ncr?.copq_proxy      ?? 0;

    document.querySelector('.kpi-strip').innerHTML = kpiStrip([
      kpiCard('First pass yield',    `${fpy}%`,       'Target ≥ 95%',                '#059669', [88,89,90,91,90,91,92,fpy]),
      kpiCard('Open NCRs',           String(openNcrs),`${critNcrs} critical/major`,  '#DC2626', null),
      kpiCard('Pending inspections', String(pendInsp),'GRNs awaiting QC',            '#D97706', null),
      kpiCard('COPQ proxy',          fmt(copq),       'Rework cost on NCR projects', '#DC2626', null),
    ]);

    const criticalNcrs = ncrData.filter(n => n.severity === 'critical' || n.severity === 'major');
    document.getElementById('qcNcrList').innerHTML = ncrData.slice(0, 6).map(n => {
      const sev = n.severity === 'critical' || n.severity === 'major' ? 'var(--red)' : 'var(--amber)';
      return `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
        <span style="width:7px;height:7px;border-radius:50%;background:${sev};flex-shrink:0"></span>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:500;color:var(--text-primary)">${n.ncr_no} — ${n.title || '—'}</div>
          <div style="font-size:11px;color:var(--text-muted)">${n.project_no || '—'} · ${n.status}</div>
        </div>
        <span class="badge" style="background:${sev}22;color:${sev}">${n.severity}</span>
      </div>`;
    }).join('') || `<div style="padding:20px;text-align:center;color:var(--text-muted)">No open NCRs</div>`;

    const queueItems = [
      ...(holds > 0 ? [{ label: `${holds} active hold point${holds > 1 ? 's' : ''} blocking production`, sub: 'ITP H/W points in pending state', urgent: true, badge: String(holds) }] : []),
      ...(pendInsp > 0 ? [{ label: `${pendInsp} GRN${pendInsp > 1 ? 's' : ''} awaiting incoming inspection`, sub: 'Notify QC inspector to proceed', urgent: false }] : []),
      ...criticalNcrs.slice(0, 2).map(n => ({ label: `Disposition required: ${n.ncr_no}`, sub: `${n.severity} — ${n.title}`, urgent: true, badge: 'Critical' })),
    ];
    document.getElementById('qcActionQueue').innerHTML = actionQueue(queueItems);
    document.getElementById('qcActionBadge').textContent = String(queueItems.length);
  } catch {
    document.getElementById('qcNcrList').innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted)">Could not load QC data</div>`;
  }
}

// ── Finance Dashboard ────────────────────────────────────────

async function renderDashboard_Finance() {
  const el = document.getElementById('pageContent');
  const accent = '#f59e0b';

  // ── Compute KPIs from FinData (always available in demo mode) ──
  const allAR       = typeof FinData !== 'undefined' ? FinData.ar  : [];
  const allAP       = typeof FinData !== 'undefined' ? FinData.ap  : [];
  const allCF       = typeof FinData !== 'undefined' ? FinData.cashFlow : [];
  const allBudgets  = typeof FinData !== 'undefined' ? FinData.budgets  : {};
  const allProjects = AppState.projects || [];

  const arPaid    = allAR.filter(i => i.status === 'paid').reduce((s,i) => s+i.amount, 0);
  const arOut     = allAR.filter(i => i.status !== 'paid').reduce((s,i) => s+i.amount, 0);
  const arOverdue = allAR.filter(i => i.status === 'overdue').reduce((s,i) => s+i.amount, 0);
  const overdueCount = allAR.filter(i => i.status === 'overdue').length;
  const draftCount   = allAR.filter(i => i.status === 'draft').length;
  const apDue     = allAP.filter(i => i.status !== 'paid').reduce((s,i) => s+i.amount, 0);
  const apOverdue = allAP.filter(i => i.status === 'overdue').reduce((s,i) => s+i.amount, 0);
  const dso       = 7.6;

  // Portfolio margin
  const portfolioTotals = allProjects.map(p => typeof calcJobTotals === 'function' ? calcJobTotals(p.id) : null).filter(Boolean);
  const totalContract   = portfolioTotals.reduce((s,t) => s+t.contractValue, 0);
  const totalMargin     = portfolioTotals.reduce((s,t) => s+t.margin, 0);
  const portfolioMarginPct = totalContract > 0 ? Math.round(totalMargin/totalContract*100) : 0;

  // Budget alerts
  const budgetAlerts = Object.entries(allBudgets).flatMap(([pid, bud]) =>
    bud.lines.filter(l => l.approved > 0 && (l.committed/l.approved) >= 0.8).map(l => ({ pid, ...l }))
  );

  // Net cash
  const netCash = allCF.reduce((s,m) => s + m.inflow - m.outflow, 0);

  function finFmtLocal(n) {
    if (!n && n !== 0) return '—';
    const abs = Math.abs(n);
    const str = abs >= 1000000 ? '$'+(abs/1000000).toFixed(1)+'M'
              : abs >= 1000    ? '$'+(abs/1000).toFixed(0)+'K'
              : '$'+abs.toFixed(0);
    return n < 0 ? '−'+str : str;
  }

  el.innerHTML = `
    ${deptPageHeader('Finance Command', 'Portfolio P&L · AR/AP · Billing · Budget · Cash flow',
      `<button class="btn btn-secondary btn-sm" onclick="renderDashboard_Finance()">
        <svg viewBox="0 0 15 15" fill="none"><path d="M13 7.5A5.5 5.5 0 112.5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M2 2v3h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Refresh
      </button>
      <button class="btn btn-primary btn-sm" onclick="navigate('finance')">
        Open Finance Hub →
      </button>`
    )}

    ${deptKpiStrip([
      { label:'Portfolio revenue',   value:finFmtLocal(totalContract),       sub:'Total contracted value',      color:accent },
      { label:'Gross margin',        value:`${portfolioMarginPct}%`,          sub:`${finFmtLocal(totalMargin)} across all projects`, color:portfolioMarginPct>=15?'#10b981':portfolioMarginPct>=10?accent:'#ef4444' },
      { label:'AR outstanding',      value:finFmtLocal(arOut),               sub:`${overdueCount} overdue · DSO ${dso}d`, color:overdueCount>0?'#ef4444':accent },
      { label:'AP outstanding',      value:finFmtLocal(apDue),               sub:apOverdue>0?`${finFmtLocal(apOverdue)} overdue`:'All within terms', color:apOverdue>0?'#ef4444':'#10b981' },
      { label:'Net cash position',   value:finFmtLocal(netCash),             sub:'YTD inflow minus outflow',    color:netCash>=0?'#10b981':'#ef4444' },
      { label:'Budget alerts',       value:String(budgetAlerts.length),       sub:'Categories at 80%+ committed',color:budgetAlerts.length>0?'#ef4444':accent },
    ])}

    <!-- 3-column grid -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">

      <!-- ── LEFT col: Portfolio P&L + Milestone tracker ── -->
      <div style="display:flex;flex-direction:column;gap:16px">

        <!-- Portfolio P&L -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Portfolio P&L</span>
            <button class="btn btn-ghost btn-sm" onclick="navigate('finance')">Full detail →</button>
          </div>
          ${portfolioTotals.map(t => {
            const proj = allProjects.find(p => p.id === t.id);
            const mc   = t.marginPct>=15?'var(--green)':t.marginPct>=8?accent:'var(--red)';
            const vc   = t.variance>=0?'var(--green)':'var(--red)';
            return `
            <div style="padding:11px 0;border-bottom:1px solid var(--border);cursor:pointer"
                 onclick="navigate('finance')">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:7px">
                <span style="font-family:var(--font-mono);font-size:11px;color:${accent};min-width:52px">${t.id}</span>
                <div style="flex:1;min-width:0">
                  <div style="font-size:12px;font-weight:500;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${proj?.name?.split('—')[0]?.trim()??t.id}</div>
                  <div style="font-size:10px;color:var(--text-muted)">Contract ${finFmtLocal(t.contractValue)} · Budget ${finFmtLocal(t.budget)} · Forecast ${finFmtLocal(t.forecast)}</div>
                </div>
                <div style="text-align:right;flex-shrink:0">
                  <div style="font-size:14px;font-weight:700;color:${mc}">${t.marginPct}%</div>
                  <div style="font-size:10px;color:${vc}">${t.variance>=0?'+':''}${finFmtLocal(t.variance)} var</div>
                </div>
              </div>
              <div class="progress-bar" style="height:6px">
                <div class="progress-fill" style="width:${Math.min(100,Math.round(t.actual/t.budget*100))}%;background:${mc}"></div>
              </div>
            </div>`;
          }).join('')}
        </div>

        <!-- Milestone billing -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Milestone billing</span>
            <button class="btn btn-ghost btn-sm" onclick="navigate('finance')">All milestones →</button>
          </div>
          ${(() => {
            const allMs = typeof FinData !== 'undefined'
              ? Object.values(FinData.milestones).flat()
              : [];
            const upcoming = allMs.filter(m => !['paid','invoiced'].includes(m.status)).slice(0, 5);
            if (!upcoming.length) return `<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:13px">All milestones billed ✓</div>`;
            const stColor = { due:'var(--amber)',overdue:'var(--red)',pending:'var(--text-muted)' };
            return upcoming.map(ms => {
              const col = stColor[ms.status]||'var(--text-muted)';
              const days = ms.dueDate ? Math.ceil((new Date(ms.dueDate)-new Date())/86400000) : null;
              return `
              <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)">
                <span style="width:8px;height:8px;border-radius:50%;background:${col};flex-shrink:0"></span>
                <div style="flex:1;min-width:0">
                  <div style="font-size:12px;font-weight:500;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${ms.name}</div>
                  <div style="font-size:10px;color:var(--text-muted)">${ms.id} · ${ms.pct}% of contract</div>
                </div>
                <div style="text-align:right;flex-shrink:0">
                  <div style="font-family:var(--font-mono);font-size:12px;font-weight:600">${typeof finFmt!=='undefined'?finFmt(ms.amount):finFmtLocal(ms.amount)}</div>
                  <div style="font-size:10px;color:${col}">${ms.status==='overdue'?'OVERDUE':days!==null?`in ${days}d`:ms.status}</div>
                </div>
              </div>`;
            }).join('');
          })()}
        </div>
      </div>

      <!-- ── RIGHT col: AR aging + AP watchlist + Action queue ── -->
      <div style="display:flex;flex-direction:column;gap:16px">

        <!-- AR aging -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">AR aging</span>
            <span style="font-size:11px;color:var(--text-muted)">DSO ${dso} days</span>
          </div>
          ${['paid','due','overdue','draft'].map(st => {
            const items = allAR.filter(i => i.status===st);
            const tot   = items.reduce((s,i) => s+i.amount, 0);
            const grandTotal = allAR.reduce((s,i) => s+i.amount, 0);
            const pct   = grandTotal>0 ? Math.round(tot/grandTotal*100) : 0;
            const stColor = {paid:'var(--green)',due:accent,overdue:'var(--red)',draft:'var(--text-muted)'}[st];
            return `
            <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border)">
              <span style="font-size:11px;color:${stColor};font-weight:600;min-width:54px;text-transform:capitalize">${st}</span>
              <div class="progress-bar" style="flex:1;height:7px">
                <div class="progress-fill" style="width:${pct}%;background:${stColor}"></div>
              </div>
              <span style="font-family:var(--font-mono);font-size:11px;min-width:68px;text-align:right">${finFmtLocal(tot)}</span>
              <span style="font-size:10px;color:var(--text-muted);min-width:26px;text-align:right">${items.length} inv</span>
            </div>`;
          }).join('')}
        </div>

        <!-- AP watchlist -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">AP watchlist</span>
            <button class="btn btn-ghost btn-sm" onclick="navigate('finance')">All AP →</button>
          </div>
          ${allAP.filter(ap => ap.status !== 'paid').slice(0,4).map(ap => {
            const days = Math.ceil((new Date(ap.due) - new Date()) / 86400000);
            const col  = ap.status==='overdue'?'var(--red)':days<14?accent:'var(--text-muted)';
            return `
            <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border)">
              <span style="width:6px;height:6px;border-radius:50%;background:${col};flex-shrink:0"></span>
              <div style="flex:1;min-width:0">
                <div style="font-size:12px;font-weight:500;color:var(--text-primary)">${ap.vendor}</div>
                <div style="font-size:10px;color:var(--text-muted)">${ap.ref} · ${ap.project}</div>
              </div>
              <span style="font-family:var(--font-mono);font-size:12px">${finFmtLocal(ap.amount)}</span>
              <span style="font-size:10px;font-weight:700;color:${col};min-width:40px;text-align:right">${ap.status==='overdue'?'OVR':days+'d'}</span>
            </div>`;
          }).join('')}
        </div>

        <!-- Action queue -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Action queue</span>
            <span class="badge" style="background:rgba(245,158,11,0.12);color:${accent}" id="finActionBadge">0</span>
          </div>
          <div id="finActionQueue">
            ${actionQueue([
              ...allAR.filter(i=>i.status==='overdue').map(i=>({ label:`Chase payment — ${i.ref}`, sub:`${finFmtLocal(i.amount)} overdue · ${i.client}`, urgent:true, badge:'Chase' })),
              ...allAR.filter(i=>i.status==='draft').map(i=>({ label:`Send invoice — ${i.ref}`, sub:`${finFmtLocal(i.amount)} ready to issue`, urgent:false, badge:'Send' })),
              ...allAP.filter(a=>a.status==='overdue').map(a=>({ label:`Overdue payment — ${a.ref}`, sub:`${finFmtLocal(a.amount)} · ${a.vendor}`, urgent:true, badge:'PAY' })),
              ...budgetAlerts.slice(0,2).map(b=>({ label:`Budget alert — ${b.pid} ${b.category}`, sub:`${Math.round(b.committed/b.approved*100)}% of approved committed`, urgent:false, badge:'Alert' })),
            ])}
          </div>
        </div>
      </div>
    </div>

    <!-- Cash flow sparkline row -->
    <div class="card" style="margin-bottom:0">
      <div class="card-header">
        <span class="card-title">Monthly cash flow — 2025</span>
        <button class="btn btn-ghost btn-sm" onclick="navigate('finance')">Full cash flow →</button>
      </div>
      <div style="display:flex;align-items:flex-end;gap:6px;height:56px;padding:4px 0">
        ${allCF.map(m => {
          const maxV = Math.max(...allCF.map(x => Math.max(x.inflow, x.outflow)), 1);
          const inH  = Math.round((m.inflow  / maxV) * 48);
          const outH = Math.round((m.outflow / maxV) * 48);
          const net  = m.inflow - m.outflow;
          return `
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">
            <div style="display:flex;align-items:flex-end;gap:2px;height:48px">
              <div style="width:10px;height:${inH}px;background:#10b981;border-radius:2px 2px 0 0;opacity:0.85" title="${m.label} inflow: ${finFmtLocal(m.inflow)}"></div>
              <div style="width:10px;height:${outH}px;background:#ef4444;border-radius:2px 2px 0 0;opacity:0.7" title="${m.label} outflow: ${finFmtLocal(m.outflow)}"></div>
            </div>
            <div style="font-size:9px;color:var(--text-muted)">${m.label}</div>
            <div style="font-size:9px;font-weight:700;color:${net>=0?'var(--green)':'var(--red)'}">${net>=0?'+':''}${finFmtLocal(net)}</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;

  // Update action badge count
  const actionEl = document.getElementById('finActionBadge');
  if (actionEl) {
    const total = allAR.filter(i=>i.status==='overdue').length
                + allAR.filter(i=>i.status==='draft').length
                + allAP.filter(a=>a.status==='overdue').length
                + Math.min(budgetAlerts.length, 2);
    actionEl.textContent = String(total);
  }

  // Activity feed (fire-and-forget)
  try {
    const feed = document.getElementById('activityFeed');
    if (feed) {
      feed.innerHTML = [
        { time:'09:41', text:'INV-2401-03 sent to ADNOC — $71,000 due 10 May', type:'invoice' },
        { time:'08:22', text:'PO-2401-015 Lincoln Electric overdue — $2,840',    type:'warn' },
        { time:'Yesterday', text:'Budget B2 approved for P-2401 by Finance Mgr', type:'info' },
        { time:'Yesterday', text:'INV-2403-02 payment received — $42,600 ENOC',  type:'paid' },
      ].map(e => `
        <div style="display:flex;gap:8px;padding:7px 0;border-bottom:1px solid var(--border);font-size:12px">
          <span style="color:var(--text-muted);min-width:64px;flex-shrink:0">${e.time}</span>
          <span style="color:var(--text-primary)">${e.text}</span>
        </div>`).join('');
    }
  } catch { /* silent */ }
}

// ── Store & Inventory Dashboard ──────────────────────────────

async function renderDashboard_Store() {
  const el = document.getElementById('pageContent');
  el.innerHTML = `
    ${deptPageHeader('Store & Inventory', 'GRN queue, stock alerts, and material traceability',
      `<button class="btn btn-secondary btn-sm" onclick="renderDashboard_Store()">
        <svg viewBox="0 0 15 15" fill="none"><path d="M13 7.5A5.5 5.5 0 112.5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M2 2v3h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Refresh
      </button>
      <button class="btn btn-primary btn-sm" onclick="navigate('inventory')">Open Store →</button>`
    )}
    ${deptKpiStrip([
      { label: 'GRNs pending QC',   value: '—', sub: 'Awaiting inspection',  color: '#0891B2' },
      { label: 'Stock alerts',      value: '—', sub: 'Below reorder point',  color: '#D97706' },
      { label: 'Quarantine items',  value: '—', sub: 'Rejected / hold',      color: '#DC2626' },
      { label: 'Material requests', value: '—', sub: 'Pending issuance',     color: '#0891B2' },
    ])}
    <div class="dash-grid">
      <div>
        <div class="card" style="margin-bottom:16px">
          <div class="card-header">
            <span class="card-title">Recent GRNs</span>
            <button class="btn btn-ghost btn-sm" onclick="navigate('inventory')">View all →</button>
          </div>
          <div id="storeGrnList">${skeletonCard(180)}</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Action queue</span>
            <span class="badge" style="background:rgba(8,145,178,0.12);color:#0891B2" id="storeActionBadge">—</span>
          </div>
          <div id="storeActionQueue">${skeletonCard(140)}</div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Event feed</span></div>
          <div class="activity-feed" id="activityFeed"></div>
        </div>
      </div>
    </div>`;

  try {
    const [agg, grns, mrs] = await Promise.allSettled([
      api.get('/dashboard/store'),
      api.get('/grn?inspection_status=pending&limit=10'),
      api.get('/material-requests?status=approved&limit=10'),
    ]);

    const aggData = agg.status  === 'fulfilled' ? agg.value  : {};
    const grnData = grns.status === 'fulfilled' ? (grns.value.data || grns.value || []) : [];
    const mrData  = mrs.status  === 'fulfilled' ? (mrs.value  || []) : [];

    const pendingQc   = aggData.grn_pending_qc   ?? grnData.length;
    const quarantine  = aggData.quarantine_count  ?? 0;
    const stockAlerts = aggData.stock_alerts      ?? 0;
    const wipValue    = aggData.wip_value         ?? 0;
    const pendingGrnV = aggData.pending_grn_value ?? 0;

    document.querySelector('.kpi-strip').innerHTML = kpiStrip([
      kpiCard('GRNs pending QC',  String(pendingQc),  'Awaiting inspection',                     '#0891B2', null),
      kpiCard('Stock alerts',     String(stockAlerts),'Below reorder point',                     '#D97706', null),
      kpiCard('Quarantine items', String(quarantine), 'Rejected / on hold',                      '#DC2626', null),
      kpiCard('Pending GRN value',fmt(pendingGrnV),   'Value of uninspected receipts',           '#0891B2', null),
    ]);

    document.getElementById('storeGrnList').innerHTML = grnData.slice(0, 5).map(g => `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:500;color:var(--text-primary)">${g.grn_no} — ${g.po_no || '—'}</div>
          <div style="font-size:11px;color:var(--text-muted)">${g.project_name || '—'} · Received ${fmtDate(g.received_date)}</div>
        </div>
        <span class="badge badge-amber">Pending QC</span>
      </div>`).join('') || `<div style="padding:20px;text-align:center;color:var(--text-muted)">No GRNs pending</div>`;

    const queueItems = [
      ...(quarantine > 0 ? [{ label: `${quarantine} item${quarantine > 1 ? 's' : ''} in quarantine — disposition required`, sub: 'Rejected by QC inspection — return or scrap', urgent: true, badge: String(quarantine) }] : []),
      ...(stockAlerts > 0 ? [{ label: `${stockAlerts} stock item${stockAlerts > 1 ? 's' : ''} below reorder point`, sub: 'Raise purchase requisitions', urgent: stockAlerts > 3 }] : []),
      ...grnData.slice(0, 2).map(g => ({ label: `Process GRN: ${g.grn_no}`, sub: `${g.project_name || '—'} — call QC for incoming inspection`, urgent: false })),
      ...mrData.slice(0, 2).map(m => ({ label: `Issue materials: ${m.mr_no}`, sub: `${m.project_name || '—'} — ${m.lines?.length || 0} items`, urgent: false })),
    ];
    document.getElementById('storeActionQueue').innerHTML = actionQueue(queueItems);
    document.getElementById('storeActionBadge').textContent = String(queueItems.length);
  } catch {
    document.getElementById('storeGrnList').innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted)">Could not load store data</div>`;
  }
}

// ── HR Dashboard ─────────────────────────────────────────────

async function renderDashboard_HR() {
  const el = document.getElementById('pageContent');
  el.innerHTML = `
    ${deptPageHeader('HR & Workforce', 'Certifications, leave, and workforce utilisation',
      `<button class="btn btn-secondary btn-sm" onclick="renderDashboard_HR()">
        <svg viewBox="0 0 15 15" fill="none"><path d="M13 7.5A5.5 5.5 0 112.5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M2 2v3h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Refresh
      </button>
      <button class="btn btn-primary btn-sm" onclick="navigate('hr')">Open HR →</button>`
    )}
    ${deptKpiStrip([
      { label: 'Headcount',           value: '—',  sub: 'Active employees',      color: '#E11D48' },
      { label: 'Certs expiring ≤ 30d',value: '—',  sub: 'Requires renewal',      color: '#DC2626' },
      { label: 'Utilisation',         value: '—%', sub: 'Billable hours ratio',  color: '#E11D48' },
      { label: 'Leave requests',      value: '—',  sub: 'Pending approval',      color: '#D97706' },
    ])}
    <div class="dash-grid">
      <div>
        <div class="card" style="margin-bottom:16px">
          <div class="card-header">
            <span class="card-title">Certification expiry alerts</span>
            <button class="btn btn-ghost btn-sm" onclick="navigate('hr')">View all →</button>
          </div>
          <div id="hrCertList">${skeletonCard(180)}</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Action queue</span>
            <span class="badge" style="background:rgba(225,29,72,0.12);color:#E11D48" id="hrActionBadge">—</span>
          </div>
          <div id="hrActionQueue">${skeletonCard(140)}</div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Event feed</span></div>
          <div class="activity-feed" id="activityFeed"></div>
        </div>
      </div>
    </div>`;

  try {
    const [employees, certs] = await Promise.allSettled([
      api.get('/employees?status=active&limit=100'),
      api.get('/hr/certs?expiring_days=30&limit=20'),
    ]);

    const empData  = employees.status === 'fulfilled' ? (employees.value.data || employees.value || []) : [];
    const certData = certs.status     === 'fulfilled' ? (certs.value.data     || certs.value     || []) : [];
    const critical = certData.filter(c => {
      const days = Math.ceil((new Date(c.expiry_date) - new Date()) / 86400000);
      return days <= 7;
    });

    document.querySelector('.kpi-strip').innerHTML = deptKpiStrip([
      { label: 'Headcount',           value: String(empData.length || '—'), sub: 'Active employees',      color: '#E11D48' },
      { label: 'Certs expiring ≤ 30d',value: String(certData.length),       sub: `${critical.length} critical`, color: '#DC2626' },
      { label: 'Utilisation',         value: '78%',                         sub: 'Billable hours ratio',  color: '#E11D48' },
      { label: 'Leave requests',      value: '3',                           sub: 'Pending approval',      color: '#D97706' },
    ]);

    document.getElementById('hrCertList').innerHTML = certData.slice(0, 6).map(c => {
      const days = Math.ceil((new Date(c.expiry_date) - new Date()) / 86400000);
      const color = days <= 7 ? 'var(--red)' : days <= 14 ? 'var(--amber)' : '#E11D48';
      return `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:500;color:var(--text-primary)">${c.employee_name || '—'} — ${c.cert_type || c.cert_name || '—'}</div>
          <div style="font-size:11px;color:var(--text-muted)">Expires ${fmtDate(c.expiry_date)}</div>
        </div>
        <span style="font-size:12px;font-weight:600;color:${color}">${days}d</span>
      </div>`;
    }).join('') || `<div style="padding:20px;text-align:center;color:var(--text-muted)">No expiring certs in next 30 days</div>`;

    const queueItems = [
      ...critical.slice(0, 3).map(c => ({ label: `Renew cert: ${c.employee_name} — ${c.cert_type || c.cert_name}`, sub: `Expires ${fmtDate(c.expiry_date)}`, urgent: true, badge: 'Urgent' })),
      { label: 'Pending leave requests', sub: '3 employees awaiting approval', urgent: false, badge: '3' },
    ];
    document.getElementById('hrActionQueue').innerHTML = actionQueue(queueItems);
    document.getElementById('hrActionBadge').textContent = String(queueItems.length);
  } catch {
    document.getElementById('hrCertList').innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted)">Could not load HR data</div>`;
  }
}

// ── Procurement Dashboard ────────────────────────────────────

async function renderDashboard_Procurement() {
  const el = document.getElementById('pageContent');
  el.innerHTML = `
    ${deptPageHeader('Procurement', 'Purchase orders, supplier delivery, and spend',
      `<button class="btn btn-secondary btn-sm" onclick="renderDashboard_Procurement()">
        <svg viewBox="0 0 15 15" fill="none"><path d="M13 7.5A5.5 5.5 0 112.5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M2 2v3h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Refresh
      </button>
      <button class="btn btn-primary btn-sm" onclick="navigate('procurement')">Open Procurement →</button>`
    )}
    ${deptKpiStrip([
      { label: 'Open POs',          value: '—', sub: 'Pending delivery',      color: '#4338CA' },
      { label: 'Overdue deliveries',value: '—', sub: 'Past expected date',    color: '#DC2626' },
      { label: 'Supplier OTD',      value: '—%',sub: 'On-time delivery rate', color: '#059669' },
      { label: 'POs to approve',    value: '—', sub: 'Awaiting sign-off',     color: '#4338CA' },
    ])}
    <div class="dash-grid">
      <div>
        <div class="card" style="margin-bottom:16px">
          <div class="card-header">
            <span class="card-title">Open purchase orders</span>
            <button class="btn btn-ghost btn-sm" onclick="navigate('procurement')">View all →</button>
          </div>
          <div id="procPoList">${skeletonCard(200)}</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Action queue</span>
            <span class="badge" style="background:rgba(67,56,202,0.12);color:#4338CA" id="procActionBadge">—</span>
          </div>
          <div id="procActionQueue">${skeletonCard(140)}</div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Event feed</span></div>
          <div class="activity-feed" id="activityFeed"></div>
        </div>
      </div>
    </div>`;

  try {
    const pos = await api.get('/procurement/purchase-orders?status=sent,acknowledged,partial&limit=20');
    const poData   = pos.data || pos || [];
    const overdue  = poData.filter(p => p.expected_date && new Date(p.expected_date) < new Date() && p.status !== 'received');
    const toApprove= poData.filter(p => p.status === 'draft');

    document.querySelector('.kpi-strip').innerHTML = deptKpiStrip([
      { label: 'Open POs',          value: String(poData.length),    sub: 'Pending delivery',      color: '#4338CA' },
      { label: 'Overdue deliveries',value: String(overdue.length),   sub: 'Past expected date',    color: '#DC2626' },
      { label: 'Supplier OTD',      value: '84%',                    sub: 'On-time delivery rate', color: '#059669' },
      { label: 'POs to approve',    value: String(toApprove.length), sub: 'Awaiting sign-off',     color: '#4338CA' },
    ]);

    document.getElementById('procPoList').innerHTML = poData.slice(0, 6).map(p => {
      const isOverdue = p.expected_date && new Date(p.expected_date) < new Date();
      return `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:500;color:var(--text-primary)">${p.po_no} — ${p.supplier_name || '—'}</div>
          <div style="font-size:11px;color:var(--text-muted)">Expected ${p.expected_date ? fmtDate(p.expected_date) : '—'} · ${p.project_name || '—'}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:13px;font-weight:600;color:#4338CA">${fmt(p.total_value || p.amount || 0)}</div>
          ${isOverdue ? `<span style="font-size:10px;color:var(--red)">Overdue</span>` : `<span style="font-size:10px;color:var(--text-muted)">${p.status}</span>`}
        </div>
      </div>`;
    }).join('') || `<div style="padding:20px;text-align:center;color:var(--text-muted)">No open POs</div>`;

    const queueItems = [
      ...overdue.slice(0, 2).map(p => ({ label: `Chase supplier: ${p.po_no} — ${p.supplier_name}`, sub: `Overdue since ${fmtDate(p.expected_date)}`, urgent: true, badge: 'Overdue' })),
      ...toApprove.slice(0, 2).map(p => ({ label: `Approve PO: ${p.po_no}`, sub: `${p.supplier_name || '—'} · ${fmt(p.total_value || 0)}`, urgent: false })),
    ];
    document.getElementById('procActionQueue').innerHTML = actionQueue(queueItems);
    document.getElementById('procActionBadge').textContent = String(queueItems.length);
  } catch {
    document.getElementById('procPoList').innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted)">Could not load procurement data</div>`;
  }
}

// ── Welding Dashboard ────────────────────────────────────────

async function renderDashboard_Welding() {
  const el = document.getElementById('pageContent');
  el.innerHTML = `
    ${deptPageHeader('Welding / WPS', 'WPQ status, active weld joints, and NDE queue',
      `<button class="btn btn-secondary btn-sm" onclick="renderDashboard_Welding()">
        <svg viewBox="0 0 15 15" fill="none"><path d="M13 7.5A5.5 5.5 0 112.5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M2 2v3h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Refresh
      </button>
      <button class="btn btn-primary btn-sm" onclick="navigate('welding')">Open Welding →</button>`
    )}
    ${deptKpiStrip([
      { label: 'WPQs expiring ≤ 30d', value: '—', sub: 'Requires renewal',     color: '#EA580C' },
      { label: 'Active WPS',          value: '—', sub: 'In use this week',      color: '#EA580C' },
      { label: 'Open weld joints',    value: '—', sub: 'Pending completion',    color: '#D97706' },
      { label: 'NDE pending',         value: '—', sub: 'Radiographic / UT due', color: '#DC2626' },
    ])}
    <div class="dash-grid">
      <div>
        <div class="card" style="margin-bottom:16px">
          <div class="card-header">
            <span class="card-title">Welder qualification status</span>
            <button class="btn btn-ghost btn-sm" onclick="navigate('welding')">View all →</button>
          </div>
          <div id="weldWpqList">${skeletonCard(180)}</div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Live machine telemetry</span></div>
          <div id="weldMachines">${skeletonCard(100)}</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Action queue</span>
            <span class="badge" style="background:rgba(234,88,12,0.12);color:#EA580C" id="weldActionBadge">—</span>
          </div>
          <div id="weldActionQueue">${skeletonCard(140)}</div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Event feed</span></div>
          <div class="activity-feed" id="activityFeed"></div>
        </div>
      </div>
    </div>`;

  try {
    const [wpqs, wps, machines] = await Promise.allSettled([
      api.get('/wpq?limit=20'),
      api.get('/wps?limit=10'),
      api.get('/machines?limit=6'),
    ]);

    const wpqData     = wpqs.status     === 'fulfilled' ? (wpqs.value.data     || wpqs.value     || []) : [];
    const wpsData     = wps.status      === 'fulfilled' ? (wps.value.data      || wps.value      || []) : [];
    const machineData = machines.status === 'fulfilled' ? (machines.value.data || machines.value || []) : [];

    const expiring = wpqData.filter(w => {
      const days = Math.ceil((new Date(w.expiry_date) - new Date()) / 86400000);
      return days <= 30 && days > 0;
    });

    document.querySelector('.kpi-strip').innerHTML = deptKpiStrip([
      { label: 'WPQs expiring ≤ 30d', value: String(expiring.length), sub: 'Requires renewal',     color: '#EA580C' },
      { label: 'Active WPS',          value: String(wpsData.length),  sub: 'In use this week',     color: '#EA580C' },
      { label: 'Open weld joints',    value: '12',                    sub: 'Pending completion',   color: '#D97706' },
      { label: 'NDE pending',         value: '4',                     sub: 'Radiographic / UT due',color: '#DC2626' },
    ]);

    document.getElementById('weldWpqList').innerHTML = wpqData.slice(0, 6).map(w => {
      const days = Math.ceil((new Date(w.expiry_date) - new Date()) / 86400000);
      const color = days <= 7 ? 'var(--red)' : days <= 30 ? 'var(--amber)' : 'var(--green)';
      return `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:500;color:var(--text-primary)">${w.welder_name || '—'} — ${w.process || '—'}</div>
          <div style="font-size:11px;color:var(--text-muted)">WPS: ${w.wps_no || '—'} · Expires ${fmtDate(w.expiry_date)}</div>
        </div>
        <span style="font-size:12px;font-weight:600;color:${color}">${days}d</span>
      </div>`;
    }).join('') || `<div style="padding:20px;text-align:center;color:var(--text-muted)">No WPQ records found</div>`;

    document.getElementById('weldMachines').innerHTML = machineData.slice(0, 4).map(m => `
      <div style="display:flex;align-items:center;gap:8px;padding:6px 0">
        <span style="width:8px;height:8px;border-radius:50%;background:${m.status === 'running' ? 'var(--green)' : 'var(--amber)'};flex-shrink:0"></span>
        <span style="font-size:13px;color:var(--text-primary)">${m.name || m.machine_id}</span>
        <span style="font-size:11px;color:var(--text-muted);margin-left:auto">${m.current_amps ? `${m.current_amps}A` : m.status || '—'}</span>
      </div>`).join('') || `<div style="padding:12px;color:var(--text-muted);font-size:13px">No machines connected</div>`;

    const queueItems = [
      ...expiring.slice(0, 3).map(w => { const d = Math.ceil((new Date(w.expiry_date)-new Date())/86400000); return { label: `Renew WPQ: ${w.welder_name} — ${w.process}`, sub: `Expires ${fmtDate(w.expiry_date)}`, urgent: d <= 7, badge: `${d}d` }; }),
      { label: 'NDE call: Joints Jt-09, Jt-11', sub: 'P-2401 — RT scheduled today', urgent: false },
    ];
    document.getElementById('weldActionQueue').innerHTML = actionQueue(queueItems);
    document.getElementById('weldActionBadge').textContent = String(queueItems.length);
  } catch {
    document.getElementById('weldWpqList').innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted)">Could not load welding data</div>`;
  }
}

// ── Analytics Dashboard ──────────────────────────────────────

async function renderDashboard_Analytics() {
  const el = document.getElementById('pageContent');
  el.innerHTML = `
    ${deptPageHeader('Analytics & KPIs', 'Cross-module performance, variance, and forecasts',
      `<button class="btn btn-secondary btn-sm" onclick="renderDashboard_Analytics()">
        <svg viewBox="0 0 15 15" fill="none"><path d="M13 7.5A5.5 5.5 0 112.5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M2 2v3h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Refresh
      </button>
      <button class="btn btn-primary btn-sm" onclick="navigate('analytics')">Open Analytics →</button>`
    )}
    ${deptKpiStrip([
      { label: 'First-pass yield',   value: '—',  sub: 'Quality index',         color: '#6366F1' },
      { label: 'Schedule variance',  value: '—',  sub: 'SPI across projects',   color: '#2563EB' },
      { label: 'Cost variance',      value: '—',  sub: 'CPI across projects',   color: '#059669' },
      { label: 'Throughput (tons)',  value: '—',  sub: 'Month to date',         color: '#D97706' },
    ])}
    <div class="dash-grid">
      <div>
        <div class="card" style="margin-bottom:16px">
          <div class="card-header">
            <span class="card-title">Project health — actual vs estimated</span>
            <button class="btn btn-ghost btn-sm" onclick="navigate('analytics')">View all →</button>
          </div>
          <div id="anProjectHealth">${skeletonCard(180)}</div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Quality trend — Pareto of defect causes</span></div>
          <div id="anPareto">${skeletonCard(160)}</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Action queue</span>
            <span class="badge" style="background:rgba(99,102,241,0.12);color:#6366F1" id="anActionBadge">—</span>
          </div>
          <div id="anActionQueue">${skeletonCard(140)}</div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Scheduled reports</span></div>
          <div id="anScheduledReports">${skeletonCard(100)}</div>
        </div>
      </div>
    </div>`;

  try {
    const [projects, ncrs] = await Promise.allSettled([
      api.get('/projects?limit=20'),
      api.get('/ncrs?limit=20'),
    ]);

    const projectData = projects.status === 'fulfilled' ? (projects.value.data || projects.value || []) : [];
    const ncrData     = ncrs.status     === 'fulfilled' ? (ncrs.value.data     || ncrs.value     || []) : [];

    const openNcrs    = ncrData.filter(n => (n.status || '').toLowerCase() !== 'closed').length;
    const totalNcrs   = ncrData.length || 1;
    const fpy         = Math.max(0, 100 - Math.round((openNcrs / totalNcrs) * 100));
    const atRisk      = projectData.filter(p => (p.health || '').toLowerCase() === 'at-risk' || (p.health || '').toLowerCase() === 'red').length;
    const onTrack     = projectData.filter(p => (p.health || '').toLowerCase() === 'on-track' || (p.health || '').toLowerCase() === 'green').length;

    document.querySelector('.kpi-strip').innerHTML = deptKpiStrip([
      { label: 'First-pass yield',  value: fpy + '%',                              sub: 'Last 30 days',         color: '#6366F1' },
      { label: 'Schedule variance', value: atRisk ? '−' + atRisk + 'd' : '0d',     sub: `${atRisk} at risk`,    color: atRisk > 2 ? '#DC2626' : '#2563EB' },
      { label: 'Cost variance',     value: '+2.4%',                                sub: 'CPI 0.97 avg',         color: '#059669' },
      { label: 'Throughput (tons)', value: '184',                                  sub: 'Month to date',        color: '#D97706' },
    ]);

    document.getElementById('anProjectHealth').innerHTML = projectData.slice(0, 6).map(p => {
      const h     = (p.health || 'on-track').toLowerCase();
      const color = h.includes('risk') || h === 'red' ? 'var(--red)' : h === 'amber' ? 'var(--amber)' : 'var(--green)';
      const cpi   = p.cpi || (0.92 + Math.random() * 0.12).toFixed(2);
      const spi   = p.spi || (0.90 + Math.random() * 0.15).toFixed(2);
      return `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
        <span style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0"></span>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;color:var(--text-primary)">${p.code || p.project_code || '—'} — ${p.name || p.title || ''}</div>
          <div style="font-size:11px;color:var(--text-muted)">${p.client || ''} · ${p.vessel_type || ''}</div>
        </div>
        <div style="text-align:right;font-size:11px;color:var(--text-muted)">
          <div>CPI <span style="color:var(--text-primary);font-weight:600">${cpi}</span></div>
          <div>SPI <span style="color:var(--text-primary);font-weight:600">${spi}</span></div>
        </div>
      </div>`;
    }).join('') || `<div style="padding:20px;text-align:center;color:var(--text-muted)">No project data available</div>`;

    const defectCauses = [
      { label: 'Welding porosity',       count: 14, pct: 32 },
      { label: 'Dimensional out of tol', count: 9,  pct: 21 },
      { label: 'Material non-conformance', count: 7,  pct: 16 },
      { label: 'Surface prep — DFT low', count: 6,  pct: 14 },
      { label: 'Documentation gap',      count: 5,  pct: 11 },
    ];
    document.getElementById('anPareto').innerHTML = defectCauses.map(c => `
      <div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
          <span style="color:var(--text-primary)">${c.label}</span>
          <span style="color:var(--text-muted)">${c.count} · ${c.pct}%</span>
        </div>
        <div style="height:6px;background:var(--bg-input);border-radius:var(--radius-pill);overflow:hidden;box-shadow:var(--shadow-inset)">
          <div style="width:${c.pct * 2.5}%;height:100%;background:#6366F1;border-radius:var(--radius-pill)"></div>
        </div>
      </div>`).join('');

    const queueItems = [
      { label: 'Estimation bias detected: welding hours +18%', sub: 'Last 5 projects · feed back to estimator', urgent: false, badge: 'Review' },
      { label: 'Monthly KPI pack due', sub: 'Management review on the 5th', urgent: false, badge: '3d' },
      ...(atRisk ? [{ label: `${atRisk} project(s) flagged at-risk`, sub: 'Drill into variance', urgent: true, badge: String(atRisk) }] : []),
    ];
    document.getElementById('anActionQueue').innerHTML = actionQueue(queueItems);
    document.getElementById('anActionBadge').textContent = String(queueItems.length);

    document.getElementById('anScheduledReports').innerHTML = [
      { name: 'Daily morning summary',  next: 'Tomorrow 07:00', recipients: 8 },
      { name: 'Weekly review pack',     next: 'Mon 08:00',      recipients: 14 },
      { name: 'Monthly management',     next: '1st of month',   recipients: 6 },
    ].map(r => `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
        <div style="flex:1;min-width:0">
          <div style="font-size:12.5px;font-weight:500;color:var(--text-primary)">${r.name}</div>
          <div style="font-size:10.5px;color:var(--text-muted)">Next: ${r.next}</div>
        </div>
        <span class="badge" style="background:var(--bg-elevated);color:var(--text-muted)">${r.recipients}</span>
      </div>`).join('');
  } catch {
    document.getElementById('anProjectHealth').innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted)">Could not load analytics data</div>`;
  }
}
