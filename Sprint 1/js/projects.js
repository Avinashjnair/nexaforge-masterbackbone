/* ============================================================
   NexaForge ERP — Projects Page
   ============================================================ */

let _allProjects = [];

async function renderProjects() {
  const el = document.getElementById('pageContent');

  el.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Projects</div>
        <div class="page-subtitle">All active manufacturing orders and ETO project lifecycle</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" onclick="renderProjects()">
          <svg viewBox="0 0 15 15" fill="none"><path d="M13 7.5A5.5 5.5 0 112.5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M2 2v3h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Refresh
        </button>
        <button class="btn btn-primary btn-sm" onclick="showNewProjectModal()">
          <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          New project
        </button>
      </div>
    </div>

    <div class="metric-grid" style="margin-bottom:20px" id="projMetrics">
      <div class="skeleton" style="height:72px;border-radius:var(--radius)"></div>
      <div class="skeleton" style="height:72px;border-radius:var(--radius)"></div>
      <div class="skeleton" style="height:72px;border-radius:var(--radius)"></div>
      <div class="skeleton" style="height:72px;border-radius:var(--radius)"></div>
      <div class="skeleton" style="height:72px;border-radius:var(--radius)"></div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">All projects</span>
        <div style="display:flex;gap:8px">
          <button class="btn btn-ghost btn-sm" onclick="filterProjects('all')"      id="fAll"      style="color:var(--brand)">All</button>
          <button class="btn btn-ghost btn-sm" onclick="filterProjects('active')"   id="fActive">Active</button>
          <button class="btn btn-ghost btn-sm" onclick="filterProjects('planning')" id="fPlanning">Planning</button>
          <button class="btn btn-ghost btn-sm" onclick="filterProjects('qc-hold')"  id="fQcHold">QC Hold</button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="data-table" id="projectTable">
          <thead>
            <tr>
              <th>Project ID</th><th>Description</th><th>Client</th>
              <th>Status</th><th>Phase</th><th>Progress</th>
              <th>Value</th><th>Due date</th><th></th>
            </tr>
          </thead>
          <tbody id="projectTableBody">
            <tr><td colspan="9" style="text-align:center;padding:32px;color:var(--text-muted)">Loading…</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="card-header"><span class="card-title">Project lifecycle phases</span></div>
      <div id="phaseFlow"></div>
    </div>

    <div id="modalBackdrop" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:200;backdrop-filter:blur(4px)" onclick="closeModal()">
      <div id="modalContent" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:min(520px,90vw)" onclick="event.stopPropagation()">
      </div>
    </div>
  `;

  try {
    const data = await ProjectsAPI.list();
    _allProjects = data.projects || data || [];
    AppState.projects = _allProjects;

    renderProjectMetrics(_allProjects);
    renderProjectTable(_allProjects);
    renderPhaseFlow(_allProjects);
  } catch (err) {
    document.getElementById('projectTableBody').innerHTML =
      `<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--red)">Failed to load projects: ${err.message}</td></tr>`;
  }
}

function _norm(p) {
  return {
    id:       p.id,
    no:       p.project_no || p.id,
    name:     p.name || p.project_name || '—',
    client:   p.client_name || p.client || '—',
    status:   p.status,
    phase:    p.current_phase || p.phase || 1,
    progress: p.progress_pct ?? p.progress ?? 0,
    value:    p.contract_value || p.value || 0,
    dueDate:  p.due_date || p.dueDate || '',
  };
}

function renderProjectMetrics(projects) {
  const ps    = projects.map(_norm);
  const total = ps.reduce((s, p) => s + p.value, 0);
  const active = ps.filter(p => p.status === 'active').length;
  const onHold = ps.filter(p => p.status === 'qc-hold').length;
  const avgProg = ps.length ? Math.round(ps.reduce((s, p) => s + p.progress, 0) / ps.length) : 0;

  document.getElementById('projMetrics').innerHTML = [
    { label: 'Total projects',   value: ps.length,       color: 'var(--brand)' },
    { label: 'Portfolio value',  value: fmt(total),       color: 'var(--blue)' },
    { label: 'Active',           value: active,           color: 'var(--green)' },
    { label: 'QC Hold',          value: onHold,           color: 'var(--amber)' },
    { label: 'Avg progress',     value: avgProg + '%',    color: 'var(--text-primary)' },
  ].map(m => `
    <div class="metric-card">
      <div class="metric-label">${m.label}</div>
      <div class="metric-value" style="font-size:24px;color:${m.color}">${m.value}</div>
    </div>`).join('');
}

function renderProjectTable(projects) {
  const tbody = document.getElementById('projectTableBody');
  if (!projects.length) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--text-muted)">No projects found</td></tr>`;
    return;
  }
  tbody.innerHTML = projects.map(p => {
    const n = _norm(p);
    const days = daysUntil(n.dueDate);
    const urgColor = days < 30 ? 'var(--red)' : days < 60 ? 'var(--amber)' : 'var(--text-secondary)';
    return `
    <tr onclick="openProjectDetail('${n.id}')" style="cursor:pointer">
      <td><span style="font-family:var(--font-mono);font-size:12px;color:var(--brand)">${n.no}</span></td>
      <td><div style="font-weight:500;color:var(--text-primary)">${n.name}</div></td>
      <td><span style="color:var(--text-secondary)">${n.client}</span></td>
      <td>${statusBadge(n.status)}</td>
      <td>
        <span style="font-size:12px;color:var(--text-secondary)">Ph.${n.phase}</span>
        <div style="font-size:11px;color:var(--text-muted)">${phaseLabel(n.phase)}</div>
      </td>
      <td>
        <div style="display:flex;align-items:center;gap:8px;min-width:100px">
          <div class="progress-bar" style="flex:1;height:4px">
            <div class="progress-fill" style="width:${n.progress}%;background:${n.status==='qc-hold'?'var(--amber)':n.progress>80?'var(--green)':'var(--brand)'}"></div>
          </div>
          <span style="font-size:11px;color:var(--text-secondary);min-width:28px">${n.progress}%</span>
        </div>
      </td>
      <td><span style="font-family:var(--font-mono);font-size:12px">${fmt(n.value)}</span></td>
      <td>
        <span style="font-size:12px;color:${urgColor}">${n.dueDate ? fmtDate(n.dueDate) : '—'}</span>
        ${n.dueDate ? `<div style="font-size:11px;color:${urgColor};opacity:0.7">${days}d</div>` : ''}
      </td>
      <td>
        <button class="btn-icon" onclick="event.stopPropagation();openProjectDetail('${n.id}')" title="View detail">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V8M8 1h4m0 0v4m0-4L5.5 7.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </td>
    </tr>`;
  }).join('');
}

function filterProjects(status) {
  ['All','Active','Planning','QcHold'].forEach(s => {
    const btn = document.getElementById('f'+s);
    if (btn) btn.style.color = '';
  });
  const btnId = { all:'fAll', active:'fActive', planning:'fPlanning', 'qc-hold':'fQcHold' }[status];
  const btn = document.getElementById(btnId);
  if (btn) btn.style.color = 'var(--brand)';
  const filtered = status === 'all' ? _allProjects : _allProjects.filter(p => p.status === status);
  renderProjectTable(filtered);
}

function renderPhaseFlow(projects = []) {
  const phases = [
    { n:1, name:'Initiation',   desc:'CRM → Project entity',  color:'var(--brand)' },
    { n:2, name:'Exec assign',  desc:'RBAC + capacity',        color:'var(--blue)' },
    { n:3, name:'Planning',     desc:'BOM + ITP parallel',     color:'var(--green)' },
    { n:4, name:'Procurement',  desc:'PR → PO → GRN',         color:'var(--amber)' },
    { n:5, name:'QC incoming',  desc:'Inspection + clearance', color:'var(--brand)' },
    { n:6, name:'Shop floor',   desc:'Weld + hold points',     color:'var(--green)' },
    { n:7, name:'Dispatch',     desc:'MRB + handover',         color:'var(--blue)' },
  ];
  document.getElementById('phaseFlow').innerHTML = `
    <div style="display:flex;align-items:stretch;gap:0;overflow-x:auto;padding-bottom:4px">
      ${phases.map((ph, i) => {
        const phProjects = projects.filter(p => (p.current_phase || p.phase) === ph.n);
        return `
        <div style="flex:1;min-width:90px;position:relative">
          <div style="padding:12px 14px;border-right:${i<phases.length-1?'1px solid var(--border)':'none'}">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
              <div style="width:8px;height:8px;border-radius:50%;background:${ph.color};flex-shrink:0"></div>
              <span style="font-size:10px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em">Ph. ${ph.n}</span>
            </div>
            <div style="font-size:12px;font-weight:500;color:var(--text-primary);margin-bottom:2px">${ph.name}</div>
            <div style="font-size:11px;color:var(--text-muted)">${ph.desc}</div>
            <div style="display:flex;gap:4px;margin-top:8px;flex-wrap:wrap">
              ${phProjects.map(p =>
                `<span style="background:${ph.color}22;border:1px solid ${ph.color}44;color:${ph.color};font-size:10px;padding:1px 6px;border-radius:99px;font-weight:500">${p.project_no || p.id}</span>`
              ).join('')}
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

async function openProjectDetail(id) {
  document.getElementById('modalBackdrop').style.display = 'block';
  document.getElementById('modalContent').innerHTML = `
    <div style="background:var(--bg-elevated);border:1px solid var(--border-md);border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-lg);padding:40px;text-align:center;color:var(--text-muted)">
      Loading project…
    </div>`;

  try {
    const p = await ProjectsAPI.get(id);
    const n = _norm(p);
    const days = daysUntil(n.dueDate);
    const urgColor = days < 30 ? 'var(--red)' : days < 60 ? 'var(--amber)' : 'var(--green)';
    const phases = Array.from({length:7}, (_, i) => i + 1 < n.phase ? 'done' : i + 1 === n.phase ? 'active' : 'pending');

    AppState.activeProject = p;
    const activeEl = document.getElementById('activeProject');
    if (activeEl) activeEl.textContent = n.name;

    if (typeof joinProjectRoom === 'function') joinProjectRoom(id);

    document.getElementById('modalContent').innerHTML = `
      <div style="background:var(--bg-elevated);border:1px solid var(--border-md);border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-lg)">
        <div style="padding:20px 24px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div style="font-family:var(--font-mono);font-size:12px;color:var(--brand);margin-bottom:4px">${n.no}</div>
            <div style="font-family:var(--font-display);font-size:16px;font-weight:700;color:var(--text-primary)">${n.name}</div>
            <div style="font-size:12px;color:var(--text-secondary);margin-top:2px">${n.client}</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            ${statusBadge(n.status)}
            <button class="btn-icon" onclick="closeModal()">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
            </button>
          </div>
        </div>
        <div style="padding:20px 24px">
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px">
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-md);padding:12px">
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.09em;margin-bottom:4px">Value</div>
              <div style="font-family:var(--font-display);font-size:18px;font-weight:700;color:var(--blue)">${fmt(n.value)}</div>
            </div>
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-md);padding:12px">
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.09em;margin-bottom:4px">Due in</div>
              <div style="font-family:var(--font-display);font-size:18px;font-weight:700;color:${urgColor}">${n.dueDate ? days + 'd' : '—'}</div>
            </div>
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-md);padding:12px">
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.09em;margin-bottom:4px">Progress</div>
              <div style="font-family:var(--font-display);font-size:18px;font-weight:700;color:var(--brand)">${n.progress}%</div>
            </div>
          </div>
          <div style="margin-bottom:16px">
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.08em">Phase progress</div>
            <div class="phase-strip" style="gap:4px">
              ${phases.map((ph,i) => `
                <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
                  <div style="height:6px;border-radius:99px;width:100%;background:${ph==='done'?'var(--green)':ph==='active'?'var(--brand)':'var(--bg-hover)'}"></div>
                  <div style="font-size:9px;color:var(--text-muted)">${i+1}</div>
                </div>`).join('')}
            </div>
            <div style="font-size:11px;color:var(--text-secondary);margin-top:6px">Current: <strong style="color:var(--brand)">Phase ${n.phase} — ${phaseLabel(n.phase)}</strong></div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-primary btn-sm" onclick="closeModal();navigate('production')">View production</button>
            <button class="btn btn-secondary btn-sm" onclick="closeModal();navigate('quality')">QC / ITP</button>
            <button class="btn btn-secondary btn-sm" onclick="exportMrb('${id}')">Export MRB</button>
            <button class="btn btn-secondary btn-sm" onclick="advancePhase('${id}', ${n.phase})">Advance phase</button>
          </div>
        </div>
      </div>`;
  } catch (err) {
    document.getElementById('modalContent').innerHTML = `
      <div style="background:var(--bg-elevated);border:1px solid var(--border-md);border-radius:var(--radius-xl);overflow:hidden;padding:32px;text-align:center;color:var(--red)">
        Failed to load project: ${err.message}
        <br><button class="btn btn-secondary btn-sm" style="margin-top:12px" onclick="closeModal()">Close</button>
      </div>`;
  }
}

async function advancePhase(projectId, currentPhase) {
  try {
    await ProjectsAPI.setPhase(projectId, currentPhase + 1);
    showToast(`Phase advanced to ${phaseLabel(currentPhase + 1)}`, 'success');
    closeModal();
    renderProjects();
  } catch (err) {
    showToast(err.message || 'Failed to advance phase', 'error');
  }
}

function exportMrb(projectId) {
  const url = QCAPI.mrbPdf(projectId);
  window.open(url, '_blank');
}

function closeModal() {
  const el = document.getElementById('modalBackdrop');
  if (el) el.style.display = 'none';
}

function showNewProjectModal() {
  document.getElementById('modalContent').innerHTML = `
    <div style="background:var(--bg-elevated);border:1px solid var(--border-md);border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-lg)">
      <div style="padding:20px 24px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <div style="font-family:var(--font-display);font-size:16px;font-weight:700">New project</div>
        <button class="btn-icon" onclick="closeModal()">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div style="padding:20px 24px;display:flex;flex-direction:column;gap:14px">
        <div>
          <label style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.09em;display:block;margin-bottom:5px">Project name</label>
          <input id="np_name" type="text" placeholder="e.g. 316L Storage Tank — 50,000L"
            style="width:100%;background:var(--bg-surface);border:1px solid var(--border-md);border-radius:var(--radius-sm);padding:8px 12px;font-size:13px;color:var(--text-primary);outline:none;box-sizing:border-box"
            onfocus="this.style.borderColor='var(--brand)'" onblur="this.style.borderColor='var(--border-md)'"/>
        </div>
        <div>
          <label style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.09em;display:block;margin-bottom:5px">Client / customer</label>
          <input id="np_client" type="text" placeholder="e.g. ADNOC"
            style="width:100%;background:var(--bg-surface);border:1px solid var(--border-md);border-radius:var(--radius-sm);padding:8px 12px;font-size:13px;color:var(--text-primary);outline:none;box-sizing:border-box"
            onfocus="this.style.borderColor='var(--brand)'" onblur="this.style.borderColor='var(--border-md)'"/>
        </div>
        <div>
          <label style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.09em;display:block;margin-bottom:5px">Contract value (USD)</label>
          <input id="np_value" type="number" placeholder="e.g. 250000"
            style="width:100%;background:var(--bg-surface);border:1px solid var(--border-md);border-radius:var(--radius-sm);padding:8px 12px;font-size:13px;color:var(--text-primary);outline:none;box-sizing:border-box"
            onfocus="this.style.borderColor='var(--brand)'" onblur="this.style.borderColor='var(--border-md)'"/>
        </div>
        <div>
          <label style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.09em;display:block;margin-bottom:5px">Delivery date</label>
          <input id="np_due" type="date"
            style="width:100%;background:var(--bg-surface);border:1px solid var(--border-md);border-radius:var(--radius-sm);padding:8px 12px;font-size:13px;color:var(--text-primary);outline:none;box-sizing:border-box"
            onfocus="this.style.borderColor='var(--brand)'" onblur="this.style.borderColor='var(--border-md)'"/>
        </div>
        <div style="display:flex;gap:10px;margin-top:4px">
          <button class="btn btn-primary" style="flex:1" onclick="submitNewProject()">Create project</button>
          <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        </div>
      </div>
    </div>`;
  document.getElementById('modalBackdrop').style.display = 'block';
}

async function submitNewProject() {
  const name  = document.getElementById('np_name')?.value?.trim();
  const client = document.getElementById('np_client')?.value?.trim();
  const value = parseFloat(document.getElementById('np_value')?.value) || 0;
  const due   = document.getElementById('np_due')?.value;

  if (!name || !client) {
    showToast('Project name and client are required', 'error');
    return;
  }

  try {
    await ProjectsAPI.create({ name, client_name: client, contract_value: value, due_date: due || null });
    showToast('Project created — workflow initiated', 'success');
    closeModal();
    renderProjects();
  } catch (err) {
    showToast(err.message || 'Failed to create project', 'error');
  }
}
