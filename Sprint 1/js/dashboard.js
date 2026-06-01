/* ============================================================
   NexaForge ERP — Dashboard Renderer
   ============================================================ */

// ── Department router ─────────────────────────────────────────
async function renderDashboard() {
  const dept = AppState.department;
  const routeMap = {
    marketing:   renderDashboard_Marketing,
    production:  renderDashboard_Production,
    qc:          renderDashboard_QC,
    finance:     renderDashboard_Finance,
    store:       renderDashboard_Store,
    hr:          renderDashboard_HR,
    procurement: renderDashboard_Procurement,
    welding:     renderDashboard_Welding,
    analytics:   renderDashboard_Analytics,
  };

  // P0.6.3 — apply dept colour identity to landing dashboard
  const deptBodyMap = {
    marketing: 'marketing', production: 'production', qc: 'qc',
    finance: 'finance', store: 'store', hr: 'hr',
    procurement: 'procurement', welding: 'welding', analytics: 'analytics',
  };
  document.body.dataset.dept = deptBodyMap[dept] || 'gm';

  if (dept && routeMap[dept]) {
    return routeMap[dept]();
  }
  // GM and unknown roles fall through to the Command Centre
  return renderDashboard_GM();
}

async function renderDashboard_GM() {
  const el = document.getElementById('pageContent');

  const _hr = new Date().getHours();
  const _greet = _hr < 12 ? 'Good morning' : _hr < 18 ? 'Good afternoon' : 'Good evening';
  const _name = (AppState && AppState.currentUser && (AppState.currentUser.name || '').split(' ')[0]) || 'there';

  el.innerHTML = `
    <div class="greeting-hero">
      <div class="greeting-orb"></div>
      <div class="greeting-text">
        <div class="greeting-line">${_greet}, <strong>${_name}</strong></div>
        <div class="greeting-sub">What's on your agenda today?</div>
      </div>
    </div>

    <div class="page-header">
      <div>
        <div class="page-title">Command Centre</div>
        <div class="page-subtitle">Live facility overview — ${new Date().toLocaleDateString('en-GB', {weekday:'long', day:'2-digit', month:'long', year:'numeric'})}</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" onclick="renderDashboard_GM()">
          <svg viewBox="0 0 15 15" fill="none"><path d="M13 7.5A5.5 5.5 0 112.5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M2 2v3h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Refresh
        </button>
        <button class="btn btn-primary btn-sm" onclick="navigate('projects')">
          <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          New project
        </button>
      </div>
    </div>

    <div id="kpiStrip"><div class="kpi-strip">${['','','','','',''].map(() => `<div class="kpi-card"><div class="skeleton" style="height:60px;border-radius:var(--radius-sm)"></div></div>`).join('')}</div></div>

    <div class="widget-grid" id="gmWidgetGrid">

      <div class="widget-card" data-widget-id="pipeline" style="grid-column:span 2">
        <div class="widget-drag-handle">
          <span class="widget-title">Active project pipeline</span>
          <div style="display:flex;align-items:center;gap:8px">
            <button class="btn btn-ghost btn-sm" onclick="navigate('projects')">View all →</button>
            <div class="widget-drag-dots"><span></span><span></span><span></span><span></span><span></span><span></span></div>
          </div>
        </div>
        <div class="widget-body">
          <div class="pipeline-list" id="pipelineList"><div class="skeleton" style="height:120px;margin:8px 0;border-radius:var(--radius)"></div><div class="skeleton" style="height:120px;margin:8px 0;border-radius:var(--radius)"></div></div>
        </div>
      </div>

      <div class="widget-card" data-widget-id="oee">
        <div class="widget-drag-handle">
          <span class="widget-title">OEE</span>
          <div class="widget-drag-dots"><span></span><span></span><span></span><span></span><span></span><span></span></div>
        </div>
        <div class="widget-body">
          <div class="oee-display" id="oeeDisplay"></div>
          <div style="font-size:11px;color:var(--text-muted);text-align:center;margin-top:6px">Overall Equipment Effectiveness</div>
        </div>
      </div>

      <div class="widget-card" data-widget-id="throughput">
        <div class="widget-drag-handle">
          <span class="widget-title">Throughput</span>
          <div class="widget-drag-dots"><span></span><span></span><span></span><span></span><span></span><span></span></div>
        </div>
        <div class="widget-body">
          <div class="sparkline" id="throughputSpark"></div>
          <div style="margin-top:8px">
            <div style="font-family:var(--font-display);font-size:20px;font-weight:700;color:var(--green)" data-countup data-target="14.2" data-suffix=" u/wk" data-decimals="1">14.2 u/wk</div>
            <div style="font-size:11px;color:var(--text-muted)">↑ vs 12.8 last week</div>
          </div>
        </div>
      </div>

      <div class="widget-card" data-widget-id="fpy">
        <div class="widget-drag-handle">
          <span class="widget-title">First pass yield</span>
          <div class="widget-drag-dots"><span></span><span></span><span></span><span></span><span></span><span></span></div>
        </div>
        <div class="widget-body">
          <div class="sparkline" id="fpySpark"></div>
          <div style="margin-top:8px">
            <div style="font-family:var(--font-display);font-size:20px;font-weight:700;color:var(--brand)" data-countup data-target="91.4" data-suffix="%" data-decimals="1">91.4%</div>
            <div style="font-size:11px;color:var(--text-muted)">target ≥ 95%</div>
          </div>
        </div>
      </div>

      <div class="widget-card" data-widget-id="alerts">
        <div class="widget-drag-handle">
          <span class="widget-title">Alerts</span>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="badge badge-red" style="font-size:10px" id="alertBadge">—</span>
            <div class="widget-drag-dots"><span></span><span></span><span></span><span></span><span></span><span></span></div>
          </div>
        </div>
        <div class="widget-body">
          <div id="alertsList"><div class="skeleton" style="height:60px;margin:4px 0;border-radius:var(--radius)"></div></div>
        </div>
      </div>

      <div class="widget-card" data-widget-id="feed">
        <div class="widget-drag-handle">
          <span class="widget-title">Event feed</span>
          <div class="widget-drag-dots"><span></span><span></span><span></span><span></span><span></span><span></span></div>
        </div>
        <div class="widget-body">
          <div class="activity-feed" id="activityFeed"></div>
        </div>
      </div>

      <div class="widget-card" data-widget-id="quick-actions">
        <div class="widget-drag-handle">
          <span class="widget-title">Quick actions</span>
          <div class="widget-drag-dots"><span></span><span></span><span></span><span></span><span></span><span></span></div>
        </div>
        <div class="widget-body">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            ${[
              ['New NCR', 'quality', 'red'],
              ['Log GRN', 'inventory', 'blue'],
              ['Raise PR', 'procurement', 'amber'],
              ['ITP review', 'quality', 'green'],
            ].map(([label, page, color]) => `
              <button class="btn btn-secondary btn-sm" style="justify-content:flex-start;gap:6px" onclick="navigate('${page}')">
                <span style="width:6px;height:6px;border-radius:50%;background:var(--${color});flex-shrink:0"></span>
                ${label}
              </button>`).join('')}
          </div>
        </div>
      </div>

      <div class="widget-card" data-widget-id="approvals">
        <div class="widget-drag-handle">
          <span class="widget-title">Pending approvals</span>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="badge badge-amber" id="approvalBadge">—</span>
            <div class="widget-drag-dots"><span></span><span></span><span></span><span></span><span></span><span></span></div>
          </div>
        </div>
        <div class="widget-body">
          <div id="pendingApprovals"><div class="skeleton" style="height:60px;border-radius:var(--radius-sm)"></div></div>
        </div>
      </div>

      ${AppState.department === 'gm' ? `
      <div class="widget-card" data-widget-id="interventions">
        <div class="widget-drag-handle">
          <span class="widget-title">GM Interventions</span>
          <div style="display:flex;align-items:center;gap:8px">
            <button class="btn btn-ghost btn-sm" onclick="openInterventionModal()">+ New</button>
            <div class="widget-drag-dots"><span></span><span></span><span></span><span></span><span></span><span></span></div>
          </div>
        </div>
        <div class="widget-body">
          <div id="interventionList" style="font-size:13px;color:var(--text-muted);padding:8px 0">Loading…</div>
        </div>
      </div>` : ''}

      <div class="widget-card" data-widget-id="blocked">
        <div class="widget-drag-handle">
          <span class="widget-title">Blocked projects</span>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="badge badge-red" id="blockedBadge">—</span>
            <div class="widget-drag-dots"><span></span><span></span><span></span><span></span><span></span><span></span></div>
          </div>
        </div>
        <div class="widget-body">
          <div id="blockedProjects"><div class="skeleton" style="height:80px;border-radius:var(--radius-sm)"></div></div>
        </div>
      </div>

    </div>
  `;

  renderOEE();
  renderSparks();

  // S-16: drag-reorder widget grid
  if (window.S16) S16.initWidgetGrid('#gmWidgetGrid', 'gm-dashboard');

  // Load aggregate + pipeline in parallel
  const [aggregate, projects, ncrs] = await Promise.allSettled([
    api.get('/dashboard/gm'),
    ProjectsAPI.list({ status: 'active,planning,qc_hold', limit: 5 }),
    QCAPI.ncrList({ status: 'open,under_review', limit: 20 }),
  ]);

  const agg = aggregate.status === 'fulfilled' ? aggregate.value : null;

  // Normalise projects response — API returns array, demo mode returns { projects: [] }
  const rawProjects  = projects.status === 'fulfilled' ? projects.value : null;
  const projectData  = Array.isArray(rawProjects)            ? rawProjects
                     : Array.isArray(rawProjects?.projects)  ? rawProjects.projects
                     : Array.isArray(rawProjects?.data)      ? rawProjects.data
                     : [];

  const ncrData = ncrs.status === 'fulfilled' ? (ncrs.value || []) : [];

  AppState.projects = projectData;

  try { renderKPIs_GM(agg, projectData, ncrData); }       catch(e) { console.error('[Dashboard] renderKPIs_GM:', e); }
  try { renderPipeline(projectData); }                     catch(e) { console.error('[Dashboard] renderPipeline:', e); }
  try { renderAlerts(ncrData); }                           catch(e) { console.error('[Dashboard] renderAlerts:', e); }
  try { renderBlockedProjects(agg?.blocked_projects || []); } catch(e) { console.error('[Dashboard] renderBlocked:', e); }
  try { renderPendingApprovals(agg?.pending_approvals || {}); } catch(e) { console.error('[Dashboard] renderApprovals:', e); }

  if (AppState.department === 'gm') {
    loadInterventions();
  }
}

function renderKPIs_GM(agg, projects = [], ncrs = []) {
  const p  = agg?.portfolio || {};
  const f  = agg?.finance   || {};
  const n  = agg?.ncr       || {};

  const activeCount  = p.active_projects ?? projects.filter(p => p.status === 'active').length;
  const backlog      = p.total_backlog   ?? projects.reduce((s, p) => s + (p.contract_value || 0), 0);
  const arOut        = f.ar_outstanding  ?? 0;
  const openNcrs     = n.total_open      ?? ncrs.length;
  const critical     = n.critical_count  ?? ncrs.filter(n => n.severity === 'major' || n.severity === 'critical').length;
  const schedAtt     = p.schedule_attainment ?? 81;
  const revenue      = f.revenue_this_quarter ?? 0;

  // Simulated 8-week trend data for sparklines
  const backlogTrend   = [480,495,510,523,518,530,540, Math.round(backlog / 1000)].map(v => v * 1000);
  const scheduleTrend  = [75,78,80,79,83,82,80, schedAtt];
  const ncrTrend       = [8,6,7,5,4,6,5, openNcrs];
  const revenueTrend   = [80,95,110,100,120,115,130, Math.round(revenue / 1000)].map(v => v * 1000);

  document.getElementById('kpiStrip').innerHTML = `<div class="kpi-strip">
    ${kpiCard('Active projects',      String(activeCount),   `${p.total_projects ?? '—'} total · ${p.on_hold ?? 0} on hold`, '#7C3AED', null)}
    ${kpiCard('Total backlog value',  fmt(backlog),          `Avg progress ${p.avg_progress ?? '—'}%`,                       '#4a9eff', backlogTrend)}
    ${kpiCard('Revenue (quarter)',    fmt(revenue),          `AR outstanding ${fmt(arOut)}`,                                 '#2dd4a0', revenueTrend)}
    ${kpiCard('Schedule attainment', `${schedAtt}%`,        `${p.overdue_count ?? 0} projects overdue`,                     '#D97706', scheduleTrend)}
    ${kpiCard('Open NCRs',           String(openNcrs),      `${critical} critical`,                                         '#f56565', ncrTrend)}
    ${kpiCard('OEE',                 '73%',                 'Target ≥ 80%',                                                '#e8622a', [68,71,70,73,72,74,73,73])}
  </div>`;
}

function renderBlockedProjects(blocked = []) {
  const el = document.getElementById('blockedProjects');
  const badge = document.getElementById('blockedBadge');
  if (badge) badge.textContent = String(blocked.length);
  if (!el) return;
  if (!blocked.length) {
    el.innerHTML = `<div style="padding:12px 0;font-size:13px;color:var(--text-muted)">No blocked projects</div>`;
    return;
  }
  el.innerHTML = blocked.map(p => `
    <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="navigate('projects')">
      <span style="width:7px;height:7px;border-radius:50%;background:${p.status === 'qc_hold' ? 'var(--amber)' : 'var(--red)'};flex-shrink:0"></span>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:500;color:var(--text-primary)">${p.project_no} — ${p.name}</div>
        <div style="font-size:11px;color:var(--text-muted)">${p.status === 'qc_hold' ? 'QC Hold' : `${p.open_critical_ncrs} critical NCR(s)`}</div>
      </div>
      ${p.due_date ? `<span style="font-size:11px;color:var(--red);flex-shrink:0">${daysUntil(p.due_date)}d left</span>` : ''}
    </div>`).join('');
}

function renderPendingApprovals(pa = {}) {
  const el    = document.getElementById('pendingApprovals');
  const badge = document.getElementById('approvalBadge');
  const total = (pa.draft_invoices || 0) + (pa.pending_mrs || 0);
  if (badge) badge.textContent = String(total);
  if (!el) return;
  if (!total) {
    el.innerHTML = `<div style="padding:12px 0;font-size:13px;color:var(--text-muted)">No pending approvals</div>`;
    return;
  }
  const items = [
    pa.draft_invoices  ? { label: `${pa.draft_invoices} draft invoice(s) to send`,    action: "navigate('finance')",    color: '#DC2626' } : null,
    pa.pending_mrs     ? { label: `${pa.pending_mrs} material request(s) to approve`, action: "navigate('inventory')",  color: '#D97706' } : null,
  ].filter(Boolean);
  el.innerHTML = items.map(i => `
    <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="${i.action}">
      <span style="width:7px;height:7px;border-radius:50%;background:${i.color};flex-shrink:0"></span>
      <span style="font-size:13px;color:var(--text-primary)">${i.label}</span>
      <svg style="margin-left:auto;opacity:0.4" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
    </div>`).join('');
}

function renderPipeline(projects = []) {
  const listEl = document.getElementById('pipelineList');
  if (!projects.length) {
    listEl.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text-muted);font-size:13px">No active projects found</div>`;
    return;
  }
  listEl.innerHTML = projects.map(p => {
    const days = daysUntil(p.due_date || p.dueDate);
    const daysColor = days < 30 ? 'var(--red)' : days < 60 ? 'var(--amber)' : 'var(--text-muted)';
    const pct  = p.progress_pct ?? p.progress ?? 0;
    const phase = p.current_phase || p.phase || 1;
    const phases = Array.from({length: 7}, (_, i) => i + 1 < phase ? 'done' : i + 1 === phase ? 'active' : 'pending');
    return `
    <div class="pipeline-item" onclick="navigate('projects')">
      <div class="pipeline-top">
        <div>
          <div class="pipeline-name">${p.name || p.project_name}</div>
          <div class="pipeline-client">${p.project_no || p.id} · ${p.client_name || p.client || '—'}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
          ${statusBadge(p.status)}
          <span style="font-size:11px;color:${daysColor}">${days}d left</span>
        </div>
      </div>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">Phase ${phase}: ${phaseLabel(phase)}</div>
      <div class="pipeline-progress-row">
        <div class="progress-bar" style="flex:1">
          <div class="progress-fill" style="width:${pct}%;background:${p.status==='qc-hold'?'var(--amber)':pct>80?'var(--green)':'var(--brand)'}"></div>
        </div>
        <span class="pipeline-pct">${pct}%</span>
        <span style="font-size:11px;color:var(--text-muted)">${fmt(p.contract_value || p.value || 0)}</span>
      </div>
      <div class="phase-strip">
        ${phases.map(ph => `<div class="phase-dot ${ph}"></div>`).join('')}
      </div>
    </div>`;
  }).join('');
}

function renderOEE() {
  const oee = 73;
  const circ = 2 * Math.PI * 48;
  const dash = (oee / 100) * circ;
  document.getElementById('oeeDisplay').innerHTML = `
    <div class="oee-circle">
      <svg viewBox="0 0 112 112">
        <circle cx="56" cy="56" r="48" fill="none" stroke="var(--bg-elevated)" stroke-width="7"/>
        <circle cx="56" cy="56" r="48" fill="none" stroke="var(--brand)" stroke-width="7"
          stroke-dasharray="${dash.toFixed(1)} ${circ.toFixed(1)}"
          stroke-linecap="round"/>
      </svg>
      <span class="oee-num">${oee}%</span>
    </div>
    <div style="font-size:11px;color:var(--text-muted)">Target ≥ 80%</div>`;
}

function renderSparks() {
  const throughputData = [8,10,9,13,11,14,14];
  const fpyData = [88,90,89,92,91,93,91];
  document.getElementById('throughputSpark').innerHTML = throughputData.map((v,i) => {
    const h = Math.round((v / Math.max(...throughputData)) * 40);
    return `<div class="spark-bar" style="height:${h}px;background:var(--green)${i===throughputData.length-1?'':';opacity:0.35'}"></div>`;
  }).join('');
  document.getElementById('fpySpark').innerHTML = fpyData.map((v,i) => {
    const h = Math.round(((v - 85) / 10) * 40);
    return `<div class="spark-bar" style="height:${Math.max(4,h)}px;background:var(--brand)${i===fpyData.length-1?'':';opacity:0.35'}"></div>`;
  }).join('');
}

// ── GM Intervention panel (ARCH-02) ──────────────────────────

async function loadInterventions() {
  const el = document.getElementById('interventionList');
  if (!el) return;
  try {
    const data = await api.get('/interventions?limit=5');
    const rows = data.data || [];
    if (!rows.length) {
      el.innerHTML = `<div style="padding:8px 0;color:var(--text-muted)">No interventions logged yet.</div>`;
      return;
    }
    el.innerHTML = rows.map(r => {
      const actionLabel = {
        priority_override:    'Priority override',
        resource_reallocation:'Resource re-allocation',
        hold_release:         'Hold release',
        rush_order:           'Rush order',
      }[r.action_type] || r.action_type;
      const colourMap = {
        priority_override: 'var(--amber)', resource_reallocation: 'var(--blue)',
        hold_release: 'var(--green)', rush_order: 'var(--red)',
      };
      return `
      <div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
        <span style="width:8px;height:8px;border-radius:50%;background:${colourMap[r.action_type]||'var(--brand)'};flex-shrink:0;margin-top:4px"></span>
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:500;color:var(--text-primary)">${actionLabel}${r.project_no ? ` — ${r.project_no}` : ''}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.reason}</div>
        </div>
        <div style="font-size:10px;color:var(--text-muted);flex-shrink:0">${fmtDate(r.created_at)}</div>
      </div>`;
    }).join('');
  } catch {
    el.innerHTML = `<div style="color:var(--text-muted);font-size:12px">Could not load interventions.</div>`;
  }
}

function openInterventionModal() {
  if (document.getElementById('interventionModal')) return;
  const modal = document.createElement('div');
  modal.id = 'interventionModal';
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal" style="max-width:480px">
      <div class="modal-header">
        <span class="modal-title">Log GM Intervention</span>
        <button class="modal-close" onclick="document.getElementById('interventionModal').remove()">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div class="modal-body" style="display:flex;flex-direction:column;gap:14px">
        <div class="form-group">
          <label class="form-label">Action type</label>
          <select class="form-input" id="intActionType">
            <option value="priority_override">Priority override</option>
            <option value="resource_reallocation">Resource re-allocation</option>
            <option value="hold_release">Hold release</option>
            <option value="rush_order">Rush order</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Project (optional)</label>
          <select class="form-input" id="intProject">
            <option value="">— No specific project —</option>
            ${(AppState.projects || []).map(p => `<option value="${p.id}">${p.project_no} — ${p.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Target department (optional)</label>
          <select class="form-input" id="intTargetDept">
            <option value="">— All departments —</option>
            ${['production','qc','procurement','store','finance','hr','welding','marketing'].map(d =>
              `<option value="${d}">${d.charAt(0).toUpperCase()+d.slice(1)}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Reason <span style="color:var(--red)">*</span></label>
          <textarea class="form-input" id="intReason" rows="3" placeholder="Explain the reason for this intervention…" style="resize:vertical"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('interventionModal').remove()">Cancel</button>
        <button class="btn btn-primary" onclick="submitIntervention()">Log intervention</button>
      </div>
    </div>`;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

async function submitIntervention() {
  const action_type = document.getElementById('intActionType').value;
  const project_id  = document.getElementById('intProject').value || null;
  const target_dept = document.getElementById('intTargetDept').value || null;
  const reason      = document.getElementById('intReason').value.trim();

  if (!reason) { showToast('Reason is required', 'warn'); return; }

  try {
    await api.post('/interventions', { action_type, project_id, target_dept, reason });
    document.getElementById('interventionModal').remove();
    showToast('Intervention logged and departments notified', 'success');
    loadInterventions();
  } catch (err) {
    showToast(err.message || 'Failed to log intervention', 'error');
  }
}

function renderAlerts(ncrs = []) {
  const alertBadge = document.getElementById('alertBadge');
  const listEl = document.getElementById('alertsList');
  if (!ncrs.length) {
    if (alertBadge) alertBadge.textContent = '0 critical';
    listEl.innerHTML = `<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:13px">No open NCRs</div>`;
    return;
  }
  const critCount = ncrs.filter(n => n.severity === 'major' || n.severity === 'critical').length;
  if (alertBadge) alertBadge.textContent = `${critCount} critical`;

  listEl.innerHTML = ncrs.slice(0, 5).map(n => {
    const type = (n.severity === 'major' || n.severity === 'critical') ? 'error' : 'warn';
    return `
    <div class="alert-item alert-${type}">
      <svg class="alert-icon" viewBox="0 0 14 14" fill="none">
        ${type === 'error'
          ? '<circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/><path d="M7 4.5V7M7 9.5v.2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>'
          : '<path d="M7 2L13 12H1L7 2z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M7 6v2.5M7 10v.2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>'}
      </svg>
      <div class="alert-body">
        <div class="alert-title">${n.ncr_no || 'NCR'} — ${n.severity || 'minor'}</div>
        <div class="alert-desc">${n.description || n.title || '—'}</div>
      </div>
    </div>`;
  }).join('');
}
