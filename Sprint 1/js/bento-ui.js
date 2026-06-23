/* ============================================================
   NexaForge ERP — Bento Dashboard (Soft-Luxe theme)
   Overrides renderDashboard_GM() from dashboard.js
   ============================================================ */

function bentoFmt(n) {
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return '$' + (n / 1000).toFixed(0) + 'K';
  return n;
}

function bentoSparkSVG(values, color, w = 80, h = 32) {
  if (!values || values.length < 2) return '';
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const area = pts + ` ${w},${h} 0,${h}`;
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block;overflow:visible">
    <polyline points="${area}" fill="${color}" opacity="0.12"/>
    <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${(values.map((_, i) => ((i / (values.length - 1)) * w))).at(-1).toFixed(1)}"
            cy="${(h - ((values.at(-1) - min) / range) * (h - 6) - 3).toFixed(1)}"
            r="3" fill="${color}"/>
  </svg>`;
}

function bentoTimeline(project) {
  const phases = ['Procurement', 'Fabrication', 'QC', 'Assembly', 'Dispatch'];
  const phaseProgress = { planning: 0, procurement: 20, production: 45, qc: 65, assembly: 80, dispatch: 95, complete: 100 };
  const pct = phaseProgress[project.status] ?? (project.progress_pct ?? project.progress ?? 0);
  const activePhaseIdx = Math.floor(pct / 22);

  return `
  <div class="bento-timeline-wrap">
    <div class="timeline-label">
      <span style="font-weight:600;color:var(--text-primary)">${project.project_no || project.id}</span>
      <span style="color:var(--brand);font-weight:700">${pct}%</span>
    </div>
    <div class="timeline-track">
      <div class="timeline-fill" style="width:${pct}%">
        <div class="timeline-blob"></div>
      </div>
    </div>
    <div class="timeline-phases">
      ${phases.map((p, i) => `
        <div class="timeline-phase ${i < activePhaseIdx ? 'done' : i === activePhaseIdx ? 'active' : ''}">
          <div class="timeline-phase-dot"></div>
          <span>${p}</span>
        </div>`).join('')}
    </div>
  </div>`;
}

async function renderDashboard_GM() {
  const el = document.getElementById('pageContent');
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  // Render shell immediately, then populate data
  el.innerHTML = `
    <div class="page-header" style="margin-bottom:20px">
      <div>
        <div style="font-size:13px;color:var(--text-muted);font-weight:400;margin-bottom:2px">${greeting}, GM · ${dateStr}</div>
        <div class="page-title">Command Centre</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" onclick="renderDashboard_GM()">
          <svg viewBox="0 0 15 15" fill="none" width="14" height="14"><path d="M13 7.5A5.5 5.5 0 112.5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M2 2v3h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Refresh
        </button>
        <button class="btn btn-primary btn-sm" onclick="navigate('projects')">
          <svg viewBox="0 0 15 15" fill="none" width="14" height="14"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          New project
        </button>
      </div>
    </div>

    <div class="bento-grid" id="bentoDashGrid">

      <!-- ① Revenue YTD — hero green card -->
      <div class="bento-kpi bento-hero bento-col-4 bento-row-2">
        <div>
          <div class="bento-kpi-label">Revenue YTD</div>
          <div class="bento-kpi-value lg" id="bentoRevenue">$523K</div>
          <div class="bento-kpi-sub" style="margin-top:6px">3 active projects · USD</div>
        </div>
        <div style="margin-top:auto">
          ${bentoSparkSVG([42, 38, 55, 71, 85, 71, 170], 'rgba(255,255,255,0.5)', 200, 44)}
        </div>
        <div class="bento-kpi-tag up" style="background:rgba(255,255,255,0.15);color:#fff;border:1px solid rgba(255,255,255,0.2)">
          ↑ 38% vs last quarter
        </div>
      </div>

      <!-- ② OEE -->
      <div class="bento-kpi bento-col-3" onclick="navigate('analytics')">
        <div class="bento-kpi-label">OEE</div>
        <div style="display:flex;align-items:flex-end;gap:10px">
          <div class="bento-kpi-value" style="color:var(--amber)">73%</div>
          <div style="margin-bottom:4px">${bentoSparkSVG([68, 71, 69, 72, 74, 76, 73, 73], '#B45309', 60, 28)}</div>
        </div>
        <div class="bento-kpi-tag warn">↓ 3pp — Target 80%</div>
      </div>

      <!-- ③ First Pass Yield -->
      <div class="bento-kpi bento-col-3" onclick="navigate('quality')">
        <div class="bento-kpi-label">First pass yield</div>
        <div style="display:flex;align-items:flex-end;gap:10px">
          <div class="bento-kpi-value" style="color:var(--green)">91.4%</div>
          <div style="margin-bottom:4px">${bentoSparkSVG([88.4, 89.1, 87.6, 90.2, 91, 92.4, 91.2, 91.4], '#0D7754', 60, 28)}</div>
        </div>
        <div class="bento-kpi-tag up">↑ 0.2pp this month</div>
      </div>

      <!-- ④ Avg margin -->
      <div class="bento-kpi bento-col-2">
        <div class="bento-kpi-label">Avg margin</div>
        <div class="bento-kpi-value sm" style="color:var(--brand)">17.5%</div>
        <div class="bento-kpi-tag neutral">Target ≥ 18%</div>
      </div>

      <!-- ⑤ Open NCRs -->
      <div class="bento-kpi bento-col-2" onclick="navigate('quality')">
        <div class="bento-kpi-label">Open NCRs</div>
        <div class="bento-kpi-value sm" id="bentoNcrs" style="color:var(--red)">—</div>
        <div class="bento-kpi-tag down" id="bentoNcrSub">Loading…</div>
      </div>

      <!-- ⑥ LTIFR — dark card -->
      <div class="bento-kpi bento-dark bento-col-2">
        <div class="bento-kpi-label">LTIFR</div>
        <div class="bento-kpi-value sm">0.0</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:4px">Zero harm YTD ✓</div>
      </div>

      <!-- ⑦ AR overdue -->
      <div class="bento-kpi bento-col-2" onclick="navigate('finance')">
        <div class="bento-kpi-label">AR overdue</div>
        <div class="bento-kpi-value sm" id="bentoAR" style="color:var(--red)">—</div>
        <div class="bento-kpi-tag down" id="bentoARSub">Loading…</div>
      </div>

      <!-- ⑧ Project timelines -->
      <div class="bento-kpi bento-col-5 bento-row-2" style="cursor:default">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <span class="bento-kpi-label">Project timelines</span>
          <button class="btn btn-ghost btn-sm" style="padding:3px 8px;font-size:10px" onclick="navigate('projects')">View all →</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:18px" id="bentoTimelines">
          <div class="skeleton" style="height:60px;border-radius:var(--radius-md)"></div>
          <div class="skeleton" style="height:60px;border-radius:var(--radius-md)"></div>
        </div>
        <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border);display:flex;gap:8px;font-size:11px;color:var(--text-muted)">
          <span style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;background:var(--brand);border-radius:50%;display:inline-block"></span>On track</span>
          <span style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;background:var(--amber);border-radius:50%;display:inline-block"></span>Monitor</span>
          <span style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;background:var(--red);border-radius:50%;display:inline-block"></span>At risk</span>
        </div>
      </div>

      <!-- ⑨ Action queue -->
      <div class="bento-kpi bento-col-7 bento-row-2" style="cursor:default">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <span class="bento-kpi-label">Action queue</span>
          <span style="font-size:11px;color:var(--text-muted)">8 items · ${dateStr}</span>
        </div>
        <div class="bento-task-list">
          ${[
            { title: 'ADNOC invoice INV-2401-03 — $71,000 due in 5 days',   dept: 'Finance',     badge: 'urgent',    badgeTxt: 'Urgent',    color: '#C0392B', nav: 'finance' },
            { title: 'WPQ expiry: K. Al-Rashid — GTAW 316L expired',        dept: 'HR / Welding', badge: 'blocking',  badgeTxt: 'Blocking',  color: '#103B2E', nav: 'hr' },
            { title: 'NCR-2403-001 tube sheet — disposition pending',        dept: 'Quality',     badge: 'essential', badgeTxt: 'Essential', color: '#B45309', nav: 'quality' },
            { title: 'P-2401 shell course 3 — NDE report outstanding',       dept: 'QC / Weld',   badge: 'essential', badgeTxt: 'Essential', color: '#B45309', nav: 'welding' },
            { title: 'ITT-2025-018 Dubai Petroleum — bid due 30 May',        dept: 'Marketing',   badge: 'review',    badgeTxt: 'Review',    color: '#1D6FA4', nav: 'marketing' },
            { title: 'Petrofac AP invoice PO-2401-015 — 4 days overdue',    dept: 'Finance',     badge: 'urgent',    badgeTxt: 'Urgent',    color: '#C0392B', nav: 'finance' },
            { title: 'Safety inspection walk — Bay 2 CNC plasma offline',    dept: 'Production',  badge: 'essential', badgeTxt: 'Essential', color: '#B45309', nav: 'production' },
            { title: 'A. Hassan WPQ SMAW-CS — renewal training to schedule', dept: 'HR',          badge: 'review',    badgeTxt: 'Review',    color: '#1D6FA4', nav: 'hr' },
          ].map(item => `
            <div class="bento-task" onclick="navigate('${item.nav}');showToast('Opening ${item.dept}…','info')">
              <div class="bento-task-line" style="background:${item.color}"></div>
              <div class="bento-task-body">
                <div class="bento-task-title">${item.title}</div>
                <div class="bento-task-sub">${item.dept}</div>
              </div>
              <span class="bento-task-badge tbadge-${item.badge}">${item.badgeTxt}</span>
            </div>`).join('')}
        </div>
      </div>

      <!-- ⑩ Certification compliance -->
      <div class="bento-kpi bento-col-4" onclick="navigate('hr')">
        <div class="bento-kpi-label">Certification compliance</div>
        <div style="display:flex;gap:12px;align-items:center;margin:10px 0">
          <div style="position:relative;width:64px;height:64px;flex-shrink:0">
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(16,59,46,0.08)" stroke-width="8"/>
              <circle cx="32" cy="32" r="26" fill="none" stroke="var(--green)" stroke-width="8"
                stroke-dasharray="${(10 / 18) * 163.4} 163.4" stroke-dashoffset="40.85" stroke-linecap="round" transform="rotate(-90 32 32)"/>
            </svg>
            <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:var(--font-display);font-size:14px;font-weight:800;color:var(--text-primary)">10</span>
          </div>
          <div>
            <div style="font-size:24px;font-weight:800;font-family:var(--font-display);color:var(--text-primary)">18 certs</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px">10 valid · 5 expiring · 3 expired</div>
          </div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <span class="bento-task-badge tbadge-done" style="font-size:10px">10 valid</span>
          <span class="bento-task-badge tbadge-essential" style="font-size:10px">5 expiring soon</span>
          <span class="bento-task-badge tbadge-urgent" style="font-size:10px">3 expired</span>
        </div>
      </div>

      <!-- ⑪ Live machine status -->
      <div class="bento-kpi bento-col-8" onclick="navigate('welding')">
        <div class="bento-kpi-label" style="margin-bottom:12px">Live machine status</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">
          ${[
            { name: 'Miller Dynasty 400', status: 'active', op: 'K. Suresh',     color: 'var(--green)',       val: '118A · 1.12kJ' },
            { name: 'Lincoln Invertec',   status: 'active', op: 'K. Al-Rashid',  color: 'var(--amber)',       val: '92A · ⚠ temp' },
            { name: 'ESAB Aristo MIG',    status: 'idle',   op: '—',             color: 'var(--text-muted)',  val: 'Available' },
            { name: 'Kemppi Master M323', status: 'fault',  op: 'Maintenance',   color: 'var(--red)',         val: 'Gas valve fault' },
          ].map(m => `
            <div style="background:rgba(16,59,46,0.03);border:1px solid ${m.status === 'active' ? 'rgba(13,119,84,0.20)' : m.status === 'fault' ? 'rgba(192,57,43,0.20)' : 'var(--border)'};border-radius:var(--radius-md);padding:10px;border-top:2px solid ${m.color}">
              <div style="font-size:10px;font-weight:600;color:var(--text-primary);margin-bottom:3px">${m.name.split(' ').slice(0, 2).join(' ')}</div>
              <div style="font-size:9px;color:var(--text-muted);margin-bottom:5px">${m.op}</div>
              <div style="font-size:10px;font-weight:600;color:${m.color}">${m.val}</div>
            </div>`).join('')}
        </div>
      </div>

      <!-- ⑫ Event feed -->
      <div class="bento-kpi bento-col-12" style="cursor:default">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <span class="bento-kpi-label">Event feed — live</span>
          <span style="font-size:11px;color:var(--green);display:flex;align-items:center;gap:4px">
            <span style="width:6px;height:6px;background:var(--green);border-radius:50%;display:inline-block;animation:pulse-dot 2s infinite"></span>
            Event bus live
          </span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px" id="bentoEventFeed">
          ${[
            { icon: '💰', text: 'INV-2401-03 raised — $71K', dept: 'Finance',  color: '#1D6FA4', time: '2m ago' },
            { icon: '⚠',  text: 'NCR-2403 — tube sheet hold', dept: 'QC',      color: '#C0392B', time: '18m ago' },
            { icon: '🔥', text: 'WJ-04 RT rejected — P-2401', dept: 'Welding', color: '#C4622D', time: '1h ago' },
            { icon: '📦', text: 'GRN received — Outokumpu',   dept: 'Store',   color: '#0D7754', time: '2h ago' },
            { icon: '📋', text: 'ITP hold H-3 — P-2401 shell',dept: 'QC',      color: '#B45309', time: '3h ago' },
          ].map(ev => `
            <div style="display:flex;align-items:flex-start;gap:9px;padding:9px 11px;background:rgba(16,59,46,0.03);border:1px solid var(--border);border-radius:var(--radius-md)">
              <span style="font-size:15px;flex-shrink:0">${ev.icon}</span>
              <div style="min-width:0">
                <div style="font-size:11px;font-weight:500;color:var(--text-primary);line-height:1.4">${ev.text}</div>
                <div style="display:flex;gap:6px;margin-top:3px;align-items:center">
                  <span style="font-size:10px;font-weight:600;color:${ev.color}">${ev.dept}</span>
                  <span style="font-size:10px;color:var(--text-muted)">${ev.time}</span>
                </div>
              </div>
            </div>`).join('')}
        </div>
      </div>

    </div>

    <!-- AI Suggestion pill -->
    <div class="ai-pill" id="aiPill" onclick="showToast('AI insight: P-2403 margin is 4.2% below target. Root cause: NCR-2403 tube sheet replacement cost not budgeted.','warn')">
      <div class="ai-pill-icon">✦</div>
      <div>
        <div class="ai-pill-text">P-2403 margin risk detected</div>
        <div class="ai-pill-sub">NCR-2403 cost impact not in forecast · Tap for detail</div>
      </div>
      <span class="ai-pill-close" onclick="event.stopPropagation();document.getElementById('aiPill').style.display='none'">×</span>
    </div>

    <!-- Manage dashboard button -->
    <button class="dash-manage-btn" onclick="showToast('Dashboard customisation panel coming in Phase 3 (ARCH-04)','info')">
      <svg viewBox="0 0 15 15" fill="none" width="13" height="13"><path d="M1 4h13M1 7.5h9M1 11h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
      Manage dashboard
    </button>
  `;

  // Load live data in parallel
  const [projectsRes, aggRes, ncrRes] = await Promise.allSettled([
    ProjectsAPI.list({ status: 'active,planning,qc_hold', limit: 5 }),
    api.get('/dashboard/gm'),
    QCAPI.ncrList({ status: 'open,under_review', limit: 20 }),
  ]);

  // Projects → timelines
  const rawProjects = projectsRes.status === 'fulfilled' ? projectsRes.value : null;
  const projects    = Array.isArray(rawProjects)           ? rawProjects
                    : Array.isArray(rawProjects?.projects) ? rawProjects.projects
                    : Array.isArray(rawProjects?.data)     ? rawProjects.data
                    : [];
  AppState.projects = projects;

  const timelinesEl = document.getElementById('bentoTimelines');
  if (timelinesEl) {
    timelinesEl.innerHTML = projects.length
      ? projects.map(p => bentoTimeline(p)).join('')
      : `<div style="color:var(--text-muted);font-size:13px;padding:8px 0">No active projects</div>`;
  }

  // NCRs
  const ncrs     = ncrRes.status === 'fulfilled' ? (ncrRes.value || []) : [];
  const critical  = ncrs.filter(n => n.severity === 'major' || n.severity === 'critical').length;
  const ncrEl     = document.getElementById('bentoNcrs');
  const ncrSubEl  = document.getElementById('bentoNcrSub');
  if (ncrEl)    ncrEl.textContent    = String(ncrs.length);
  if (ncrSubEl) ncrSubEl.textContent = `${critical} critical`;
  if (ncrSubEl) ncrSubEl.className   = `bento-kpi-tag ${critical ? 'down' : 'up'}`;

  // Finance aggregate
  const agg = aggRes.status === 'fulfilled' ? aggRes.value : null;
  const arOut = agg?.finance?.ar_outstanding ?? null;
  const arEl  = document.getElementById('bentoAR');
  const arSub = document.getElementById('bentoARSub');
  if (arEl && arOut !== null) {
    arEl.textContent = bentoFmt(arOut);
    if (arSub) arSub.textContent = arOut > 0 ? 'Overdue balance' : 'No overdue';
    if (arSub) arSub.className   = `bento-kpi-tag ${arOut > 0 ? 'down' : 'up'}`;
  }

  // Revenue YTD from aggregate
  const revenue   = agg?.finance?.revenue_this_quarter ?? null;
  const revenueEl = document.getElementById('bentoRevenue');
  if (revenueEl && revenue !== null) revenueEl.textContent = bentoFmt(revenue);

  // GM Interventions widget (if element exists from a previous render — not in bento layout)
  if (AppState.department === 'gm' && typeof loadInterventions === 'function') {
    loadInterventions();
  }
}
