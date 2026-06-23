/* ============================================================
   NexaForge ERP — QC Module Tab Renderers (part 2)
   ============================================================ */

/* ═══════════════════════════════════════════════════════════
   TAB 1 — OVERVIEW
═══════════════════════════════════════════════════════════ */
function renderQCOverview() {
  const pid   = QCData.selectedProject;
  const itp   = QCData.itp[pid] || [];
  const myNcrs = QCData.ncrs.filter(n => n.project === pid);
  const done   = itp.filter(i => i.status === 'done').length;
  const active = itp.filter(i => i.status === 'active').length;
  const blocked= itp.filter(i => i.status === 'blocked').length;
  const holds  = itp.filter(i => (i.internal === 'H' || i.customer === 'H' || i.tpi === 'H' || i.internal_code === 'H' || i.customer_code === 'H' || i.tpi_code === 'H') && i.status !== 'done' && i.status !== 'approved').length;
  const fpy    = itp.length ? Math.round((done / itp.length) * 100) : 0;

  document.getElementById('qcTabContent').innerHTML = `
    <!-- KPI strip -->
    <div class="metric-grid" style="margin-bottom:20px">
      ${[
        { label:'ITP steps complete',  value:`${done}/${itp.length}`, color:'var(--green)' },
        { label:'Active inspections',  value:active,   color:'var(--brand)' },
        { label:'Hard holds (H) open', value:holds,    color:holds>0?'var(--red)':'var(--text-muted)' },
        { label:'Open NCRs (project)', value:myNcrs.filter(n=>n.status!=='closed').length, color:myNcrs.some(n=>n.severity==='critical'&&n.status!=='closed')?'var(--red)':'var(--amber)' },
        { label:'ITP progress',        value:`${fpy}%`, color:'var(--blue)' },
      ].map(k=>`<div class="metric-card"><div class="metric-label">${k.label}</div><div class="metric-value" style="font-size:26px;color:${k.color}">${k.value}</div></div>`).join('')}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <!-- ITP hold-point summary -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Hold point status</span>
          <button class="btn btn-ghost btn-sm" onclick="switchQCTab('itp')">Full ITP →</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${['H','W','R'].map(ht => {
            const htItems = itp.filter(i=>(i.internal===ht||i.customer===ht||i.tpi===ht||i.internal_code===ht||i.customer_code===ht||i.tpi_code===ht));
            const htDone  = htItems.filter(i=>i.status==='done'||i.status==='approved').length;
            const htOpen  = htItems.filter(i=>i.status!=='done'&&i.status!=='approved').length;
            const htLabel = { H:'Hold (H) — hard stop', W:'Witness (W) — attend', R:'Review (R) — document' }[ht];
            const htColor = { H:'var(--red)', W:'var(--amber)', R:'var(--blue)' }[ht];
            return `
            <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--bg-subtle);border-radius:var(--radius-sm);border:1px solid var(--border)">
              <span class="hold-pill hold-${ht}">${ht}</span>
              <div style="flex:1">
                <div style="font-size:12px;color:var(--text-primary);margin-bottom:4px">${htLabel}</div>
                <div class="progress-bar" style="height:4px">
                  <div class="progress-fill" style="width:${htItems.length?Math.round(htDone/htItems.length*100):0}%;background:${htColor}"></div>
                </div>
              </div>
              <span style="font-size:12px;font-family:var(--font-mono);color:${htOpen>0?htColor:'var(--text-muted)'}">${htDone}/${htItems.length}</span>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Recent NCRs -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">NCRs — ${pid}</span>
          <button class="btn btn-ghost btn-sm" onclick="switchQCTab('ncr')">All NCRs →</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${myNcrs.length ? myNcrs.slice(0,4).map(n => `
            <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--bg-subtle);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;transition:background .1s" onclick="openNCRDetail('${n.id}')" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='var(--bg-elevated)'">
              <span class="ncr-severity ncr-sev-${n.severity}" style="font-size:10px">${n.severity}</span>
              <div style="flex:1;min-width:0">
                <div style="font-size:12px;font-weight:500;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${n.title}</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${n.id} · ${n.raisedBy}</div>
              </div>
              <span class="badge ${n.status==='closed'?'badge-green':n.status==='review'?'badge-amber':'badge-red'}" style="font-size:10px;flex-shrink:0">${n.status}</span>
            </div>`).join('')
          : `<div class="empty-state" style="padding:24px"><p style="font-size:13px">No NCRs for ${pid}</p></div>`}
          <button class="btn btn-secondary btn-sm" style="margin-top:4px" onclick="openNewNCRModal()">
            <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Raise NCR
          </button>
        </div>
      </div>
    </div>

    <!-- COPQ & quality metrics -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-top:16px">
      ${[
        { label:'First pass yield', value:'91.4%', sub:'Target ≥ 95%', color:'var(--brand)' },
        { label:'Rework rate',      value:'8.6%',  sub:'↑ from 6.2% last month', color:'var(--red)' },
        { label:'COPQ estimate',    value:'$14.2K',sub:'P-2401 rework cost', color:'var(--amber)' },
        { label:'NDT compliance',   value:'100%',  sub:'All required tests done', color:'var(--green)' },
        { label:'Supplier NCR rate',value:'4.8%',  sub:'Rolled Alloys outlier', color:'var(--red)' },
      ].map(k=>`
        <div class="metric-card">
          <div class="metric-label">${k.label}</div>
          <div class="metric-value" style="font-size:22px;color:${k.color}">${k.value}</div>
          <div class="metric-delta">${k.sub}</div>
        </div>`).join('')}
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   TAB 2 — ITP
═══════════════════════════════════════════════════════════ */
function _codeLabel(c) {
  return c ? `<span class="hold-pill hold-${c}" title="${{P:'Perform',R:'Review',W:'Witness',H:'Hold'}[c]||c}">${c}</span>` : '<span style="color:var(--text-muted);font-size:12px">—</span>';
}

function renderQCITP() {
  const pid  = QCData.selectedProject;
  const itp  = QCData.itp[pid] || [];
  const done = itp.filter(i=>i.status==='done'||i.status==='approved').length;
  const blocked = itp.filter(i=>i.status==='blocked').length;

  const role = AppState.currentUser?.role || 'manager';
  const isInspector = role === 'user';
  const isLead = role === 'senior';
  const isManager = role === 'manager' || role === 'gm';

  const closeSVG = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;

  document.getElementById('qcTabContent').innerHTML = `
    <div class="card">
      <div class="card-header">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <span class="card-title">Inspection & Test Plan — ${pid}</span>
          <span class="badge badge-green" style="font-size:10px">${done}/${itp.length} complete</span>
          ${blocked ? `<span class="badge badge-red" style="font-size:10px">${blocked} blocked</span>` : ''}
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary btn-sm" onclick="showToast('ITP exported to PDF','success')">Export PDF</button>
          ${!isInspector ? `
          <button class="btn btn-primary btn-sm" onclick="openAddITPModal()">
            <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Add step
          </button>
          ` : ''}
        </div>
      </div>

      <!-- Legend -->
      <div style="display:flex;gap:16px;flex-wrap:wrap;padding:0 0 10px;border-bottom:1px solid var(--border);margin-bottom:4px;font-size:11px;color:var(--text-muted)">
        <span style="display:flex;align-items:center;gap:5px"><span class="hold-pill hold-H">H</span>Hold — production stops until approved</span>
        <span style="display:flex;align-items:center;gap:5px"><span class="hold-pill hold-W">W</span>Witness — inspector must attend</span>
        <span style="display:flex;align-items:center;gap:5px"><span class="hold-pill hold-R">R</span>Review — document check only</span>
        <span style="display:flex;align-items:center;gap:5px"><span class="hold-pill hold-P">P</span>Perform — party executes the inspection</span>
      </div>

      <div style="overflow-x:auto">
        <table class="itp-table" style="min-width:900px">
          <thead>
            <tr>
              <th style="width:46px">Step</th>
              <th>Activity</th>
              <th style="width:110px">Ref Doc</th>
              <th style="width:180px">Parameters</th>
              <th style="width:110px">Responsible</th>
              <th colspan="3" style="text-align:center;background:var(--bg-subtle);border-bottom:2px solid var(--brand)">Inspection</th>
              <th style="width:160px">Remarks</th>
            </tr>
            <tr class="itp-subheader">
              <th colspan="5" style="background:var(--bg-subtle)"></th>
              <th style="width:52px;text-align:center">Internal</th>
              <th style="width:52px;text-align:center">Customer</th>
              <th style="width:52px;text-align:center">TPI/Client</th>
              <th style="background:var(--bg-subtle)"></th>
            </tr>
          </thead>
          <tbody>
            ${itp.map(row => {
              const isDone    = row.status === 'done' || row.status === 'approved';
              const isBlocked = row.status === 'blocked';
              const isActive  = row.status === 'active';
              const rowCls = isBlocked ? 'itp-hold-row' : isActive ? 'itp-active-row' : isDone ? 'itp-done-row' : '';
              const stBadge = isDone    ? `<span class="itp-status-chip chip-done">Done</span>`
                            : isBlocked ? `<span class="itp-status-chip chip-blocked">Blocked</span>`
                            : isActive  ? `<span class="itp-status-chip chip-active">Active</span>`
                            : '';
              return `
              <tr class="${rowCls}" onclick="openITPDetail('${row.seq}','${pid}')">
                <td style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);white-space:nowrap">
                  ${row.seq}${stBadge ? '<br>'+stBadge : ''}
                </td>
                <td style="font-size:13px;color:var(--text-primary);font-weight:${isActive?'500':'400'}">${row.activity}</td>
                <td style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted)">${row.ref||'—'}</td>
                <td style="font-size:11px;color:var(--text-secondary);line-height:1.5">${row.parameters||'—'}</td>
                <td style="font-size:12px;color:var(--text-secondary)">${row.responsible||'—'}</td>
                <td style="text-align:center">${_codeLabel(row.internal)}</td>
                <td style="text-align:center">${_codeLabel(row.customer)}</td>
                <td style="text-align:center">${_codeLabel(row.tpi)}</td>
                <td style="font-size:11px;color:var(--text-muted)">
                  ${row.remarks||''}
                  ${isActive ? (() => {
                    const isManagerStep = row.responsible && row.responsible.toLowerCase().includes('manager');
                    if (isInspector) {
                      return `<button class="btn btn-secondary btn-sm" style="margin-top:4px;font-size:10px;opacity:0.5;cursor:not-allowed" onclick="event.stopPropagation();showToast('QC Inspectors cannot sign off ITP steps','warn')">Sign off</button>`;
                    } else if (isManagerStep && isLead) {
                      return `<span style="font-size:10.5px;color:var(--text-muted);font-style:italic;display:block;margin-top:4px">Awaiting Manager Sign-off</span>`;
                    } else {
                      return `<button class="btn btn-primary btn-sm" style="margin-top:4px;font-size:10px" onclick="event.stopPropagation();openITPSignOff('${row.seq}','${pid}')">Sign off</button>`;
                    }
                  })() : ''}
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

function openITPDetail(seq, pid) {
  const row = (QCData.itp[pid]||[]).find(r=>r.seq===seq);
  if (!row) return;
  const role = AppState.currentUser?.role || 'manager';
  const isInspector = role === 'user';
  const isLead = role === 'senior';
  const isManager = role === 'manager' || role === 'gm';
  const closeSVG = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  openQCModal(`
    <div class="qc-modal-inner">
      <div class="qc-modal-header">
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px">ITP step ${row.seq} — ${pid}</div>
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">${row.activity}</div>
        </div>
        <button class="btn-icon" onclick="closeQCModal()">${closeSVG}</button>
      </div>
      <div class="qc-modal-body">
        ${row.parameters ? `
        <div style="background:var(--bg-subtle);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px;font-size:12px;color:var(--text-secondary);line-height:1.6">
          <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">Parameters / Acceptance Criteria</div>
          ${row.parameters}
        </div>` : ''}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${[['Responsible',row.responsible||'—'],['Reference doc',row.ref||'—'],['Status',row.status],['Inspector',row.inspector||'Pending']].map(([l,v])=>`
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px">
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:4px">${l}</div>
              <div style="font-size:13px;font-weight:500;color:var(--text-primary)">${v}</div>
            </div>`).join('')}
        </div>
        <div style="background:var(--bg-subtle);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px">
          <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">Inspection assignments</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
            ${[['Internal',row.internal],['Customer',row.customer],['TPI / Client',row.tpi]].map(([party,code])=>`
              <div style="text-align:center">
                <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">${party}</div>
                ${_codeLabel(code)}
              </div>`).join('')}
          </div>
        </div>
        ${row.date ? `<div style="font-size:12px;color:var(--text-secondary)">Signed off by <strong>${row.inspector||'—'}</strong> on ${row.date} — Result: <strong style="color:${row.result==='Pass'?'var(--green)':'var(--red)'}">${row.result}</strong></div>` : ''}
        ${row.remarks ? `<div style="font-size:12px;color:var(--text-muted);font-style:italic">"${row.remarks}"</div>` : ''}
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          ${row.status==='active'
            ? (() => {
                const isManagerStep = row.responsible && row.responsible.toLowerCase().includes('manager');
                let signBtn = '';
                if (isInspector) {
                  signBtn = `<button class="btn btn-secondary" style="opacity:0.5;cursor:not-allowed" onclick="showToast('QC Inspectors cannot sign off ITP steps','warn')">Sign off this step</button>`;
                } else if (isManagerStep && isLead) {
                  signBtn = `<button class="btn btn-secondary" style="opacity:0.5;cursor:not-allowed" onclick="showToast('This step requires QC Manager approval','warn')">Awaiting Manager Sign-off</button>`;
                } else {
                  signBtn = `<button class="btn btn-primary" onclick="closeQCModal();openITPSignOff('${row.seq}','${pid}')">Sign off this step</button>`;
                }
                return signBtn + `<button class="btn btn-secondary" style="color:var(--red)" onclick="closeQCModal();openNewNCRModal()">Log NCR — Fail</button>`;
              })()
            : `<button class="btn btn-secondary" onclick="closeQCModal();showToast('Inspection report opened','info')">View report</button>`}
          <button class="btn btn-secondary" onclick="closeQCModal()">Close</button>
        </div>
      </div>
    </div>`);
}

function openITPSignOff(seq, pid) {
  const row = (QCData.itp[pid]||[]).find(r=>r.seq===seq);
  if (!row) return;
  const closeSVG = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  const partyOptions = [
    row.internal ? `<option value="internal">Internal (NexaForge QC) — ${row.internal}</option>` : '',
    row.customer ? `<option value="customer">Customer representative — ${row.customer}</option>` : '',
    row.tpi      ? `<option value="tpi">TPI / Client inspector — ${row.tpi}</option>` : '',
  ].join('');

  openQCModal(`
    <div class="qc-modal-inner">
      <div class="qc-modal-header">
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:2px">Sign off — step ${seq} · ${pid}</div>
          <div style="font-family:var(--font-display);font-size:14px;font-weight:700">${row.activity}</div>
        </div>
        <button class="btn-icon" onclick="closeQCModal()">${closeSVG}</button>
      </div>
      <div class="qc-modal-body">
        <div class="qc-field"><label>Signing party</label>
          <select id="itp-party">${partyOptions}</select>
        </div>
        <div class="qc-field"><label>Result</label>
          <select id="itp-result">
            <option value="approved">Pass — approved</option>
            <option value="conditional">Pass with observation / conditional</option>
            <option value="rejected">Fail — raise NCR</option>
          </select>
        </div>
        <div class="qc-field"><label>Inspection report ref</label>
          <input type="text" id="itp-ref" placeholder="e.g. IR-005"/>
        </div>
        <div class="qc-field"><label>Date</label>
          <input type="date" id="itp-date" value="${new Date().toISOString().split('T')[0]}"/>
        </div>
        <div class="qc-field"><label>Remarks</label>
          <textarea id="itp-remarks" rows="3" placeholder="Observations, conditions or NCR reference…"></textarea>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="submitITPSignOff('${seq}','${pid}')">Submit sign-off</button>
          <button class="btn btn-secondary" onclick="closeQCModal()">Cancel</button>
        </div>
      </div>
    </div>`);
}

async function submitITPSignOff(seq, pid) {
  const result  = document.getElementById('itp-result')?.value  || 'approved';
  const party   = document.getElementById('itp-party')?.value   || 'internal';
  const remarks = document.getElementById('itp-remarks')?.value || '';
  const ref     = document.getElementById('itp-ref')?.value     || '';

  const row = (QCData.itp[pid]||[]).find(r=>r.seq===seq);
  if (!row || !row.id) {
    // Optimistic local update (no live step id)
    if (result === 'rejected') {
      row.status = 'blocked';
    } else {
      row.status = 'done';
      row.result = 'Pass';
      row.date   = new Date().toISOString().split('T')[0];
      if (remarks) row.remarks = remarks;
    }
    closeQCModal();
    showToast(`Step ${seq} signed off (${party}) — ${result}`, result === 'rejected' ? 'error' : 'success');
    renderQCITP();
    return;
  }

  try {
    await QCAPI.signOff(pid, row.id, { result, party, comments: remarks || ref || null });
    closeQCModal();
    showToast(`Step ${seq} signed off — ${result}`, result === 'rejected' ? 'error' : 'success');
    // Refresh from server
    const fresh = await QCAPI.itp(pid);
    QCData.itp[pid] = fresh.steps || fresh.itp || fresh || [];
    renderQCITP();
  } catch (e) {
    showToast(`Sign-off failed: ${e.message}`, 'error');
  }
}

function openAddITPModal() {
  const closeSVG = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  const codeOpts = (sel='P') => ['P','R','W','H'].map(c=>`<option value="${c}"${c===sel?' selected':''}>${c} — ${{P:'Perform',R:'Review',W:'Witness',H:'Hold'}[c]}</option>`).join('');
  openQCModal(`
    <div class="qc-modal-inner">
      <div class="qc-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Add ITP step</div>
        <button class="btn-icon" onclick="closeQCModal()">${closeSVG}</button>
      </div>
      <div class="qc-modal-body">
        <div class="qc-field-row">
          <div class="qc-field" style="width:90px"><label>Step no.</label><input id="nitp-seq" type="text" placeholder="e.g. 4.4"/></div>
          <div class="qc-field" style="flex:1"><label>Activity</label><input id="nitp-activity" type="text" placeholder="Inspection activity description"/></div>
        </div>
        <div class="qc-field-row">
          <div class="qc-field" style="flex:1"><label>Reference doc</label><input id="nitp-ref" type="text" placeholder="ASME VIII UW-51, API 650 §7.3…"/></div>
          <div class="qc-field" style="flex:1"><label>Responsible</label><input id="nitp-resp" type="text" placeholder="QC Inspector, NDT Contractor…"/></div>
        </div>
        <div class="qc-field"><label>Parameters / Acceptance criteria</label>
          <textarea id="nitp-params" rows="2" placeholder="Dimensional tolerances, acceptance standards, test conditions…"></textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
          <div class="qc-field"><label>Internal</label><select id="nitp-int">${codeOpts('P')}</select></div>
          <div class="qc-field"><label>Customer</label><select id="nitp-cust"><option value="">—</option>${codeOpts('R')}</select></div>
          <div class="qc-field"><label>TPI / Client</label><select id="nitp-tpi"><option value="">—</option>${codeOpts('W')}</select></div>
        </div>
        <div class="qc-field"><label>Remarks</label><textarea id="nitp-remarks" rows="2" placeholder="Optional notes…"></textarea></div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="submitAddITPStep()">Add step</button>
          <button class="btn btn-secondary" onclick="closeQCModal()">Cancel</button>
        </div>
      </div>
    </div>`);
}

async function submitAddITPStep() {
  const pid      = QCData.selectedProject;
  const activity = document.getElementById('nitp-activity')?.value?.trim();
  if (!activity) { showToast('Activity is required','error'); return; }

  const payload = {
    step_no:       parseFloat(document.getElementById('nitp-seq')?.value) || undefined,
    activity,
    reference_doc: document.getElementById('nitp-ref')?.value    || null,
    responsible:   document.getElementById('nitp-resp')?.value   || null,
    parameters:    document.getElementById('nitp-params')?.value || null,
    internal_code: document.getElementById('nitp-int')?.value    || 'P',
    customer_code: document.getElementById('nitp-cust')?.value   || null,
    tpi_code:      document.getElementById('nitp-tpi')?.value    || null,
    remarks:       document.getElementById('nitp-remarks')?.value|| null,
  };

  try {
    const step = await QCAPI.addItpStep(pid, payload);
    // Map API response to local format
    QCData.itp[pid] = QCData.itp[pid] || [];
    QCData.itp[pid].push({
      id:          step.id,
      seq:         String(step.step_no),
      activity:    step.activity,
      ref:         step.reference_doc,
      parameters:  step.parameters,
      responsible: step.responsible,
      internal:    step.internal_code,
      customer:    step.customer_code,
      tpi:         step.tpi_code,
      status:      step.status,
      inspector:   null, date: null, result: null,
      remarks:     step.remarks || '',
    });
    closeQCModal();
    showToast('ITP step added','success');
    renderQCITP();
  } catch (e) {
    showToast(`Failed to add step: ${e.message}`,'error');
  }
}

/* ═══════════════════════════════════════════════════════════
   TAB 3 — CONTROL PLAN
═══════════════════════════════════════════════════════════ */
function renderQCControlPlan() {
  const pid   = QCData.selectedProject;
  const view  = QCData.cpView || 'project';
  const items = QCData.controlPlan[pid] || [];
  const tpls  = QCData.cpTemplates || [];

  const role = AppState.currentUser?.role || 'manager';
  const isInspector = role === 'user';
  const isLead = role === 'senior';
  const isManager = role === 'manager' || role === 'gm';

  const closeSVG = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;

  const statusBadge = s => ({
    pending:     '<span class="badge badge-muted"  style="font-size:10px">Pending</span>',
    in_progress: '<span class="badge badge-blue"   style="font-size:10px">In progress</span>',
    passed:      '<span class="badge badge-green"  style="font-size:10px">Passed</span>',
    failed:      '<span class="badge badge-red"    style="font-size:10px">Failed</span>',
    na:          '<span class="badge badge-muted"  style="font-size:10px">N/A</span>',
  }[s] || '');

  const cpTableHeader = `
    <thead>
      <tr>
        <th style="width:28px">#</th>
        <th style="width:100px">Stage</th>
        <th>Activity</th>
        <th style="width:110px">Ref Doc</th>
        <th style="width:180px">Parameters</th>
        <th style="width:110px">Responsible</th>
        <th colspan="3" style="text-align:center;background:var(--bg-subtle);border-bottom:2px solid var(--brand)">Inspection</th>
        <th style="width:100px">Status</th>
        <th style="width:120px">Remarks</th>
      </tr>
      <tr class="itp-subheader">
        <th colspan="6" style="background:var(--bg-subtle)"></th>
        <th style="width:52px;text-align:center">Internal</th>
        <th style="width:52px;text-align:center">Customer</th>
        <th style="width:52px;text-align:center">TPI/Client</th>
        <th colspan="2" style="background:var(--bg-subtle)"></th>
      </tr>
    </thead>`;

  if (view === 'standard') {
    // Group templates by project_type
    const byType = {};
    tpls.forEach(t => { (byType[t.project_type] = byType[t.project_type]||[]).push(t); });
    const typeKeys = Object.keys(byType).sort();

    document.getElementById('qcTabContent').innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap">
        <div class="itp-view-toggle">
          <button class="btn btn-ghost btn-sm" onclick="QCData.cpView='project';renderQCControlPlan()">Project Plan</button>
          <button class="btn btn-primary btn-sm">Standard Library</button>
        </div>
        <span style="font-size:12px;color:var(--text-muted)">${tpls.length} standard items across ${typeKeys.length} project types</span>
        ${isManager ? `
        <button class="btn btn-secondary btn-sm" style="margin-left:auto" onclick="openAddCPTemplateModal()">
          <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          Add template item
        </button>
        ` : ''}
      </div>

      ${typeKeys.map(type => {
        const rows = byType[type];
        const byStage = {};
        rows.forEach(r => { (byStage[r.stage_name] = byStage[r.stage_name]||[]).push(r); });
        return `
        <div class="card" style="margin-bottom:16px">
          <div class="card-header">
            <span class="card-title">${type}</span>
            <span class="badge badge-muted" style="font-size:10px">${rows.length} items</span>
          </div>
          <div style="overflow-x:auto">
            <table class="itp-table" style="min-width:900px">
              ${cpTableHeader}
              <tbody>
                ${rows.map((r,i) => `
                <tr>
                  <td style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono)">${r.stage_no}.${i+1}</td>
                  <td style="font-size:11px;color:var(--brand)">${r.stage_name}</td>
                  <td style="font-size:13px;color:var(--text-primary)">${r.activity}</td>
                  <td style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted)">${r.reference_doc||'—'}</td>
                  <td style="font-size:11px;color:var(--text-secondary);line-height:1.5">${r.parameters||'—'}</td>
                  <td style="font-size:12px;color:var(--text-secondary)">${r.responsible||'—'}</td>
                  <td style="text-align:center">${_codeLabel(r.internal_code)}</td>
                  <td style="text-align:center">${_codeLabel(r.customer_code)}</td>
                  <td style="text-align:center">${_codeLabel(r.tpi_code)}</td>
                  <td colspan="2" style="font-size:11px;color:var(--text-muted)">${r.remarks||''}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>`;
      }).join('')}

      ${typeKeys.length === 0 ? `<div class="empty-state"><p>No standard templates loaded yet.</p>${isManager ? '<button class="btn btn-primary" onclick="openAddCPTemplateModal()">Add first template item</button>' : ''}</div>` : ''}
    `;
    return;
  }

  // ── Project Control Plan view ──────────────────────────────
  const passed  = items.filter(i=>i.status==='passed').length;
  const failed  = items.filter(i=>i.status==='failed').length;
  const pending = items.filter(i=>i.status==='pending').length;

  // Group by stage
  const byStage = {};
  items.forEach(r => { (byStage[r.stage_name] = byStage[r.stage_name]||[]).push(r); });
  const stageKeys = Object.keys(byStage);

  document.getElementById('qcTabContent').innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      <div class="itp-view-toggle">
        <button class="btn btn-primary btn-sm">Project Plan</button>
        <button class="btn btn-ghost btn-sm" onclick="QCData.cpView='standard';renderQCControlPlan()">Standard Library</button>
      </div>
      <span class="badge badge-green"  style="font-size:10px">${passed} passed</span>
      <span class="badge badge-red"    style="font-size:10px">${failed} failed</span>
      <span class="badge badge-muted"  style="font-size:10px">${pending} pending</span>
      ${!isInspector ? `
      <div style="margin-left:auto;display:flex;gap:8px">
        <button class="btn btn-secondary btn-sm" onclick="applyStandardTemplate()">
          Apply standard template
        </button>
        <button class="btn btn-secondary btn-sm" onclick="openAddCPItemModal()">
          <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          Add item
        </button>
        <button class="btn btn-primary btn-sm" onclick="openCreateFromRequirementsModal()">
          <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          From Customer Requirements
        </button>
      </div>
      ` : ''}
    </div>

    ${items.length === 0 ? `
      <div class="empty-state" style="padding:48px;text-align:center">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style="margin:0 auto 12px;display:block;opacity:.35"><rect x="6" y="4" width="28" height="32" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="M12 13h16M12 20h16M12 27h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        <p style="color:var(--text-muted);font-size:13px;margin-bottom:16px">No control plan items for this project yet.</p>
        ${!isInspector ? `
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="openCreateFromRequirementsModal()">Create from Customer Requirements</button>
          <button class="btn btn-secondary" onclick="applyStandardTemplate()">Apply standard template</button>
          <button class="btn btn-secondary" onclick="openAddCPItemModal()">Add custom item</button>
        </div>
        ` : '<p style="font-size:12px;color:var(--text-hint);font-style:italic">Please contact a Lead QC Engineer or QC Manager to initialize the project Control Plan.</p>'}
      </div>` : `
    <div class="card">
      <div style="overflow-x:auto">
        <table class="itp-table" style="min-width:900px">
          ${cpTableHeader}
          <tbody>
            ${stageKeys.map(stage => {
              const stageRows = byStage[stage];
              return stageRows.map((r, si) => {
                const isFirst = si === 0;
                const rowCls = r.status === 'failed' ? 'itp-hold-row' : r.status === 'in_progress' ? 'itp-active-row' : r.status === 'passed' ? 'itp-done-row' : '';
                return `
                <tr class="${rowCls}">
                  ${isFirst ? `<td rowspan="${stageRows.length}" style="font-size:11px;color:var(--brand);font-weight:600;vertical-align:top;padding-top:12px;border-right:2px solid var(--border)">${r.stage_no}</td>
                               <td rowspan="${stageRows.length}" style="font-size:11px;color:var(--brand);vertical-align:top;padding-top:12px;border-right:1px solid var(--border)">${stage}</td>`
                          : ''}
                  <td style="font-size:13px;color:var(--text-primary)">${r.activity}</td>
                  <td style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted)">${r.reference_doc||'—'}</td>
                  <td style="font-size:11px;color:var(--text-secondary);line-height:1.5">${r.parameters||'—'}</td>
                  <td style="font-size:12px;color:var(--text-secondary)">${r.responsible||'—'}</td>
                  <td style="text-align:center">${_codeLabel(r.internal_code)}</td>
                  <td style="text-align:center">${_codeLabel(r.customer_code)}</td>
                  <td style="text-align:center">${_codeLabel(r.tpi_code)}</td>
                  <td>${statusBadge(r.status)}
                    ${(r.status === 'pending' || r.status === 'in_progress') && !isInspector ? `
                    <div style="display:flex;gap:4px;margin-top:6px">
                      <button class="btn btn-ghost btn-sm" style="font-size:10px;color:var(--green)" onclick="updateCPItemStatus('${pid}','${r.id}','passed')">✓ Pass</button>
                      <button class="btn btn-ghost btn-sm" style="font-size:10px;color:var(--red)"   onclick="updateCPItemStatus('${pid}','${r.id}','failed')">✕ Fail</button>
                    </div>` : ''}
                  </td>
                  <td style="font-size:11px;color:var(--text-muted)">${r.remarks||''}</td>
                </tr>`;
              }).join('');
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`}
  `;
}

async function applyStandardTemplate() {
  const pid = QCData.selectedProject;
  try {
    const res = await QCAPI.applyTemplate(pid);
    showToast(`Template applied — ${res.inserted} items added`, 'success');
    const fresh = await QCAPI.projectCP(pid);
    QCData.controlPlan[pid] = fresh.items || [];
    renderQCControlPlan();
  } catch (e) {
    showToast(`Could not apply template: ${e.message}`, 'error');
  }
}

async function updateCPItemStatus(pid, itemId, status) {
  try {
    await QCAPI.updateCpItem(pid, itemId, { status });
    const item = (QCData.controlPlan[pid]||[]).find(i=>i.id===itemId);
    if (item) item.status = status;
    showToast(`Item marked as ${status}`, 'success');
    renderQCControlPlan();
  } catch (e) {
    showToast(`Update failed: ${e.message}`, 'error');
  }
}

function openAddCPItemModal() {
  const closeSVG = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  const codeOpts = (sel='P') => ['P','R','W','H'].map(c=>`<option value="${c}"${c===sel?' selected':''}>${c} — ${{P:'Perform',R:'Review',W:'Witness',H:'Hold'}[c]}</option>`).join('');
  openQCModal(`
    <div class="qc-modal-inner">
      <div class="qc-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Add control plan item</div>
        <button class="btn-icon" onclick="closeQCModal()">${closeSVG}</button>
      </div>
      <div class="qc-modal-body">
        <div class="qc-field-row">
          <div class="qc-field" style="flex:1"><label>Stage</label><input id="ncp-stage" type="text" placeholder="e.g. Fit-up, Welding, NDE…"/></div>
          <div class="qc-field" style="width:70px"><label>Stage no.</label><input id="ncp-stageno" type="number" min="1" placeholder="1"/></div>
        </div>
        <div class="qc-field"><label>Activity</label><input id="ncp-activity" type="text" placeholder="Inspection / test activity description"/></div>
        <div class="qc-field-row">
          <div class="qc-field" style="flex:1"><label>Reference doc</label><input id="ncp-ref" type="text" placeholder="API 650 §7.3, ASME VIII UW-51…"/></div>
          <div class="qc-field" style="flex:1"><label>Responsible</label><input id="ncp-resp" type="text" placeholder="QC Inspector, NDT Contractor…"/></div>
        </div>
        <div class="qc-field"><label>Parameters / Acceptance criteria</label>
          <textarea id="ncp-params" rows="2" placeholder="Tolerances, acceptance limits, test conditions…"></textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
          <div class="qc-field"><label>Internal</label><select id="ncp-int">${codeOpts('P')}</select></div>
          <div class="qc-field"><label>Customer</label><select id="ncp-cust"><option value="">—</option>${codeOpts('R')}</select></div>
          <div class="qc-field"><label>TPI / Client</label><select id="ncp-tpi"><option value="">—</option>${codeOpts('W')}</select></div>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="submitAddCPItem()">Add item</button>
          <button class="btn btn-secondary" onclick="closeQCModal()">Cancel</button>
        </div>
      </div>
    </div>`);
}

async function submitAddCPItem() {
  const pid      = QCData.selectedProject;
  const activity = document.getElementById('ncp-activity')?.value?.trim();
  const stage    = document.getElementById('ncp-stage')?.value?.trim();
  if (!activity || !stage) { showToast('Stage and activity are required','error'); return; }

  const payload = {
    stage_name:    stage,
    stage_no:      parseInt(document.getElementById('ncp-stageno')?.value) || 99,
    activity,
    reference_doc: document.getElementById('ncp-ref')?.value    || null,
    responsible:   document.getElementById('ncp-resp')?.value   || null,
    parameters:    document.getElementById('ncp-params')?.value || null,
    internal_code: document.getElementById('ncp-int')?.value    || 'P',
    customer_code: document.getElementById('ncp-cust')?.value   || null,
    tpi_code:      document.getElementById('ncp-tpi')?.value    || null,
  };

  try {
    const item = await QCAPI.addCpItem(pid, payload);
    (QCData.controlPlan[pid] = QCData.controlPlan[pid]||[]).push(item);
    closeQCModal();
    showToast('Control plan item added','success');
    renderQCControlPlan();
  } catch (e) {
    showToast(`Failed: ${e.message}`,'error');
  }
}

function openAddCPTemplateModal() {
  const closeSVG = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  const codeOpts = (sel='P') => ['P','R','W','H'].map(c=>`<option value="${c}"${c===sel?' selected':''}>${c} — ${{P:'Perform',R:'Review',W:'Witness',H:'Hold'}[c]}</option>`).join('');
  openQCModal(`
    <div class="qc-modal-inner">
      <div class="qc-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Add standard template item</div>
        <button class="btn-icon" onclick="closeQCModal()">${closeSVG}</button>
      </div>
      <div class="qc-modal-body">
        <div class="qc-field"><label>Project type</label>
          <select id="ntpl-type">
            <option>Storage Tank</option>
            <option>Pressure Vessel</option>
            <option>Heat Exchanger</option>
            <option>Structural Steel</option>
            <option>Piping / Spoolwork</option>
            <option>General</option>
          </select>
        </div>
        <div class="qc-field-row">
          <div class="qc-field" style="flex:1"><label>Stage name</label><input id="ntpl-stage" type="text" placeholder="Material Incoming, Fit-up, Welding…"/></div>
          <div class="qc-field" style="width:70px"><label>Stage no.</label><input id="ntpl-stageno" type="number" min="1" placeholder="1"/></div>
        </div>
        <div class="qc-field"><label>Activity</label><input id="ntpl-activity" type="text" placeholder="Inspection / test activity"/></div>
        <div class="qc-field-row">
          <div class="qc-field" style="flex:1"><label>Reference doc</label><input id="ntpl-ref" type="text" placeholder="API 650 §7.3…"/></div>
          <div class="qc-field" style="flex:1"><label>Responsible</label><input id="ntpl-resp" type="text" placeholder="QC Inspector…"/></div>
        </div>
        <div class="qc-field"><label>Parameters / Acceptance criteria</label>
          <textarea id="ntpl-params" rows="2" placeholder="Tolerances, acceptance limits…"></textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
          <div class="qc-field"><label>Internal</label><select id="ntpl-int">${codeOpts('P')}</select></div>
          <div class="qc-field"><label>Customer</label><select id="ntpl-cust"><option value="">—</option>${codeOpts('R')}</select></div>
          <div class="qc-field"><label>TPI / Client</label><select id="ntpl-tpi"><option value="">—</option>${codeOpts('W')}</select></div>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="submitAddCPTemplate()">Add to library</button>
          <button class="btn btn-secondary" onclick="closeQCModal()">Cancel</button>
        </div>
      </div>
    </div>`);
}

async function submitAddCPTemplate() {
  const activity = document.getElementById('ntpl-activity')?.value?.trim();
  const stage    = document.getElementById('ntpl-stage')?.value?.trim();
  const type     = document.getElementById('ntpl-type')?.value;
  if (!activity || !stage || !type) { showToast('Project type, stage and activity are required','error'); return; }

  const payload = {
    project_type:  type,
    stage_name:    stage,
    stage_no:      parseInt(document.getElementById('ntpl-stageno')?.value) || undefined,
    activity,
    reference_doc: document.getElementById('ntpl-ref')?.value    || null,
    responsible:   document.getElementById('ntpl-resp')?.value   || null,
    parameters:    document.getElementById('ntpl-params')?.value || null,
    internal_code: document.getElementById('ntpl-int')?.value    || 'P',
    customer_code: document.getElementById('ntpl-cust')?.value   || null,
    tpi_code:      document.getElementById('ntpl-tpi')?.value    || null,
  };

  try {
    const item = await QCAPI.addCpTemplate(payload);
    QCData.cpTemplates.push(item);
    closeQCModal();
    showToast('Template item added to library','success');
    renderQCControlPlan();
  } catch (e) {
    showToast(`Failed: ${e.message}`,'error');
  }
}

/* ═══════════════════════════════════════════════════════════
   CREATE FROM CUSTOMER REQUIREMENTS — 3-step wizard
═══════════════════════════════════════════════════════════ */
const _cpWizard = { step:1, pid:null, prereqs:{}, items:[] };

function openCreateFromRequirementsModal() {
  _cpWizard.step  = 1;
  _cpWizard.pid   = QCData.selectedProject;
  _cpWizard.items = [];
  _renderCPWizardStep1();
}

function _wizardProgress(active) {
  return ['Customer prerequisites','Build inspection items','Review & create'].map((lbl,i)=>`
    <div style="display:flex;align-items:center;flex:1">
      <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
        <div style="width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;
          background:${i<=active?'var(--brand)':'var(--bg-subtle)'};color:${i<=active?'#fff':'var(--text-muted)'}">${i+1}</div>
        <span style="font-size:11px;color:${i<=active?'var(--text-primary)':'var(--text-muted)'};white-space:nowrap">${lbl}</span>
      </div>
      ${i<2?`<div style="flex:1;height:1px;background:${i<active?'var(--brand)':'var(--border)'};margin:0 8px"></div>`:''}
    </div>`).join('');
}

function _renderCPWizardStep1() {
  const pid = _cpWizard.pid;
  const p   = _cpWizard.prereqs;
  const closeSVG = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  openQCModal(`
    <div class="qc-modal-inner" style="max-width:600px">
      <div class="qc-modal-header">
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px">Step 1 of 3 — Customer prerequisites</div>
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Create ITP & Control Plan — ${pid}</div>
        </div>
        <button class="btn-icon" onclick="closeQCModal()">${closeSVG}</button>
      </div>
      <div class="qc-modal-body">
        <div style="display:flex;align-items:center;gap:0;margin-bottom:20px">${_wizardProgress(0)}</div>
        <div class="qc-field-row">
          <div class="qc-field"><label>Customer reference / PO</label>
            <input id="cpRef" type="text" value="${p.ref||''}" placeholder="e.g. CUST-REQ-2401-R1"/>
          </div>
          <div class="qc-field"><label>Customer name</label>
            <input id="cpCustomer" type="text" value="${p.customer||''}" placeholder="e.g. Saudi Aramco"/>
          </div>
        </div>
        <div class="qc-field"><label>Applicable standards & codes <span style="font-weight:400;color:var(--text-muted)">(comma-separated)</span></label>
          <input id="cpStandards" type="text" value="${(p.standards||[]).join(', ')}" placeholder="e.g. ASME Section VIII Div.1, API 650, AWS D1.6"/>
        </div>
        <div class="qc-field"><label>Customer inspection level</label>
          <select id="cpInspLevel">
            ${['Review only','Witness & Hold','Full surveillance','Hold points only'].map(v=>`<option value="${v}"${(p.inspLevel||'Witness & Hold')===v?' selected':''}>${v}</option>`).join('')}
          </select>
        </div>
        <div class="qc-field-row">
          <div class="qc-field"><label>TPI required?</label>
            <select id="cpTPI">
              <option value="no"${!p.tpiRequired?' selected':''}>No</option>
              <option value="yes"${p.tpiRequired?' selected':''}>Yes</option>
            </select>
          </div>
          <div class="qc-field"><label>TPI body</label>
            <input id="cpTPIName" type="text" value="${p.tpiName||''}" placeholder="e.g. Bureau Veritas, Lloyd's Register"/>
          </div>
        </div>
        <div class="qc-field"><label>Special customer requirements</label>
          <textarea id="cpSpecial" rows="3" placeholder="e.g. Hydrostatic test — customer witness mandatory. 100% RT on all welds.">${p.special||''}</textarea>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="_cpStep1Next()">Next — Build inspection items →</button>
          <button class="btn btn-secondary" onclick="closeQCModal()">Cancel</button>
        </div>
      </div>
    </div>`);
}

function _cpStep1Next() {
  _cpWizard.prereqs = {
    ref:         document.getElementById('cpRef').value.trim()       || ('CP-' + _cpWizard.pid + '-R1'),
    customer:    document.getElementById('cpCustomer').value.trim()  || 'Customer',
    standards:   document.getElementById('cpStandards').value.split(',').map(s=>s.trim()).filter(Boolean),
    inspLevel:   document.getElementById('cpInspLevel').value,
    tpiRequired: document.getElementById('cpTPI').value === 'yes',
    tpiName:     document.getElementById('cpTPIName').value.trim(),
    special:     document.getElementById('cpSpecial').value.trim(),
  };
  if (_cpWizard.items.length === 0) {
    _cpWizard.items = [{ stageNo:'', stageName:'', activity:'', refDoc:'', parameters:'', responsible:'QC Inspector', internalCode:'P', customerCode:'', tpiCode:'' }];
  }
  _renderCPWizardStep2();
}

function _renderCPWizardStep2() {
  const items    = _cpWizard.items;
  const closeSVG = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  const codeOpts = (sel, required) => {
    const base = required ? [] : [`<option value="">— None —</option>`];
    return base.concat(['P','R','W','H'].map(v=>`<option value="${v}"${sel===v?' selected':''}>${v} — ${{P:'Perform',R:'Review',W:'Witness',H:'Hold'}[v]}</option>`)).join('');
  };

  const rowsHtml = items.map((item,i) => `
    <div style="background:var(--bg-subtle);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;position:relative">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <span style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.08em">Item ${i+1}</span>
        ${items.length > 1 ? `<button class="btn-icon" title="Remove" onclick="_cpRemoveItem(${i})">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2L2 10" stroke="var(--red)" stroke-width="1.4" stroke-linecap="round"/></svg>
        </button>` : ''}
      </div>
      <div class="qc-field-row">
        <div class="qc-field" style="flex:0 0 80px"><label>Stage no.</label>
          <input type="text" value="${item.stageNo}" oninput="_cpWizard.items[${i}].stageNo=this.value" placeholder="e.g. 3"/>
        </div>
        <div class="qc-field"><label>Stage name</label>
          <input type="text" value="${item.stageName}" oninput="_cpWizard.items[${i}].stageName=this.value" placeholder="e.g. Welding"/>
        </div>
        <div class="qc-field"><label>Responsible</label>
          <input type="text" value="${item.responsible}" oninput="_cpWizard.items[${i}].responsible=this.value" placeholder="e.g. QC Inspector"/>
        </div>
      </div>
      <div class="qc-field"><label>Inspection activity</label>
        <input type="text" value="${item.activity}" oninput="_cpWizard.items[${i}].activity=this.value" placeholder="Describe the inspection activity"/>
      </div>
      <div class="qc-field-row">
        <div class="qc-field"><label>Reference doc / standard</label>
          <input type="text" value="${item.refDoc}" oninput="_cpWizard.items[${i}].refDoc=this.value" placeholder="e.g. ASME V Art.2"/>
        </div>
        <div class="qc-field"><label>Acceptance parameters</label>
          <input type="text" value="${item.parameters}" oninput="_cpWizard.items[${i}].parameters=this.value" placeholder="e.g. Per ASME UW-51"/>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
        <div class="qc-field"><label>Internal</label><select onchange="_cpWizard.items[${i}].internalCode=this.value">${codeOpts(item.internalCode,true)}</select></div>
        <div class="qc-field"><label>Customer</label><select onchange="_cpWizard.items[${i}].customerCode=this.value">${codeOpts(item.customerCode,false)}</select></div>
        <div class="qc-field"><label>TPI / Client</label><select onchange="_cpWizard.items[${i}].tpiCode=this.value">${codeOpts(item.tpiCode,false)}</select></div>
      </div>
    </div>`).join('');

  openQCModal(`
    <div class="qc-modal-inner" style="max-width:680px">
      <div class="qc-modal-header">
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px">Step 2 of 3 — Build inspection items</div>
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Create ITP & Control Plan — ${_cpWizard.pid}</div>
        </div>
        <button class="btn-icon" onclick="closeQCModal()">${closeSVG}</button>
      </div>
      <div class="qc-modal-body">
        <div style="display:flex;align-items:center;gap:0;margin-bottom:14px">${_wizardProgress(1)}</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;padding:9px 12px;background:var(--bg-subtle);border:1px solid var(--border);border-radius:var(--radius-sm)">
          <span style="font-size:11px;color:var(--text-muted);width:100%;margin-bottom:3px">Prerequisites from Step 1:</span>
          ${_cpWizard.prereqs.standards.map(s=>`<span class="badge badge-muted" style="font-size:10px">${s}</span>`).join('')}
          <span class="badge badge-accent" style="font-size:10px">${_cpWizard.prereqs.inspLevel}</span>
          ${_cpWizard.prereqs.tpiRequired ? `<span class="badge badge-accent" style="font-size:10px">TPI: ${_cpWizard.prereqs.tpiName||'TPI'}</span>` : ''}
        </div>
        <div id="cpItemsList" style="display:flex;flex-direction:column;gap:12px;max-height:360px;overflow-y:auto;padding-right:4px">
          ${rowsHtml}
        </div>
        <button class="btn btn-secondary btn-sm" style="margin-top:10px;width:100%" onclick="_cpAddItem()">
          <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          Add inspection item
        </button>
        <div style="display:flex;gap:10px;margin-top:6px">
          <button class="btn btn-secondary" onclick="_renderCPWizardStep1()">← Back</button>
          <button class="btn btn-primary" style="flex:1" onclick="_cpStep2Next()">Next — Review & create →</button>
          <button class="btn btn-ghost" onclick="closeQCModal()">Cancel</button>
        </div>
      </div>
    </div>`);
}

function _cpAddItem() {
  _cpWizard.items.push({ stageNo:'', stageName:'', activity:'', refDoc:'', parameters:'', responsible:'QC Inspector', internalCode:'P', customerCode:'', tpiCode:'' });
  _renderCPWizardStep2();
}

function _cpRemoveItem(idx) {
  _cpWizard.items.splice(idx, 1);
  _renderCPWizardStep2();
}

function _cpStep2Next() {
  if (!_cpWizard.items.every(it => it.activity.trim())) {
    showToast('Each item needs an inspection activity', 'error');
    return;
  }
  _renderCPWizardStep3();
}

function _renderCPWizardStep3() {
  const pre      = _cpWizard.prereqs;
  const items    = _cpWizard.items;
  const closeSVG = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;

  openQCModal(`
    <div class="qc-modal-inner" style="max-width:680px">
      <div class="qc-modal-header">
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px">Step 3 of 3 — Review & create</div>
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Create ITP & Control Plan — ${_cpWizard.pid}</div>
        </div>
        <button class="btn-icon" onclick="closeQCModal()">${closeSVG}</button>
      </div>
      <div class="qc-modal-body">
        <div style="display:flex;align-items:center;gap:0;margin-bottom:14px">${_wizardProgress(2)}</div>
        <div style="padding:12px;background:var(--bg-subtle);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:14px;font-size:12px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div><span style="color:var(--text-muted)">Customer ref:</span> <strong>${pre.ref}</strong></div>
            <div><span style="color:var(--text-muted)">Customer:</span> <strong>${pre.customer}</strong></div>
            <div><span style="color:var(--text-muted)">Inspection level:</span> <strong>${pre.inspLevel}</strong></div>
            <div><span style="color:var(--text-muted)">TPI:</span> <strong>${pre.tpiRequired ? (pre.tpiName||'Yes') : 'No'}</strong></div>
          </div>
          ${pre.standards.length ? `<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:5px">${pre.standards.map(s=>`<span class="badge badge-muted" style="font-size:10px">${s}</span>`).join('')}</div>` : ''}
          ${pre.special ? `<div style="margin-top:8px;padding:7px 9px;background:var(--amber-bg);border-radius:3px;font-size:11px;color:var(--amber)">${pre.special}</div>` : ''}
        </div>
        <div style="overflow-x:auto;max-height:280px;overflow-y:auto;margin-bottom:14px">
          <table class="itp-table" style="min-width:560px;font-size:11px">
            <thead>
              <tr>
                <th style="width:44px">Stage</th>
                <th style="width:110px">Stage name</th>
                <th>Activity</th>
                <th style="width:44px;text-align:center">Int.</th>
                <th style="width:44px;text-align:center">Cust.</th>
                <th style="width:44px;text-align:center">TPI</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item=>`
                <tr>
                  <td style="font-family:var(--font-mono);color:var(--text-muted)">${item.stageNo||'—'}</td>
                  <td style="color:var(--text-secondary)">${item.stageName||'—'}</td>
                  <td>${item.activity}</td>
                  <td style="text-align:center">${_codeLabel(item.internalCode||'P')}</td>
                  <td style="text-align:center">${_codeLabel(item.customerCode)}</td>
                  <td style="text-align:center">${_codeLabel(item.tpiCode)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-secondary" onclick="_renderCPWizardStep2()">← Back</button>
          <button class="btn btn-primary" style="flex:1" id="cpCreateBtn" onclick="_cpWizardCreate()">
            <svg viewBox="0 0 15 15" fill="none"><path d="M2 8l4 4 7-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Create ITP & Control Plan (${items.length} items)
          </button>
          <button class="btn btn-ghost" onclick="closeQCModal()">Cancel</button>
        </div>
      </div>
    </div>`);
}

async function _cpWizardCreate() {
  const btn = document.getElementById('cpCreateBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Creating…'; }

  const pid   = _cpWizard.pid;
  const pre   = _cpWizard.prereqs;
  const items = _cpWizard.items;

  try {
    const results = [];
    for (const it of items) {
      const payload = {
        stage_name:    it.stageName || 'General',
        stage_no:      parseInt(it.stageNo) || 99,
        activity:      it.activity,
        reference_doc: it.refDoc      || null,
        responsible:   it.responsible || null,
        parameters:    it.parameters  || null,
        internal_code: it.internalCode || 'P',
        customer_code: it.customerCode || null,
        tpi_code:      it.tpiCode      || null,
        remarks:       pre.special     || null,
      };
      const item = await QCAPI.addCpItem(pid, payload);
      results.push(item);
    }
    QCData.controlPlan[pid] = (QCData.controlPlan[pid] || []).concat(results);
    closeQCModal();
    showToast(`ITP & Control Plan created — ${results.length} items added for ${pid}`, 'success');
    renderQCControlPlan();
  } catch (e) {
    if (btn) { btn.disabled = false; btn.textContent = 'Create ITP & Control Plan'; }
    showToast(`Failed: ${e.message}`, 'error');
  }
}

/* ═══════════════════════════════════════════════════════════
   TAB 4 — NCR & COMPLAINT LOG BOOKS
═══════════════════════════════════════════════════════════ */
function renderQCNCR() {
  const view = QCData.ncrView || 'ncr';
  if (view === 'complaints') { renderComplaintLogBook(); return; }
  renderNCRLogBook();
}

/* ─── NCR LOG BOOK ─── */
function renderNCRLogBook() {
  const wfLabels = ['Raised','Under review','Disposition','Closed'];
  const ncrs     = QCData.ncrs;
  const open     = ncrs.filter(n=>n.status==='open').length;
  const review   = ncrs.filter(n=>n.status==='review').length;
  const closed   = ncrs.filter(n=>n.status==='closed').length;

  document.getElementById('qcTabContent').innerHTML = `
    <!-- Sub-view toggle -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      <div class="itp-view-toggle">
        <button class="btn btn-primary btn-sm">NCR Log Book</button>
        <button class="btn btn-ghost btn-sm" onclick="QCData.ncrView='complaints';renderComplaintLogBook()">Customer Complaint Log</button>
      </div>
      <span class="badge badge-red">${open} open</span>
      <span class="badge badge-amber">${review} in review</span>
      <span class="badge badge-green">${closed} closed</span>
      <span style="color:var(--text-muted);font-size:12px">${ncrs.length} total</span>
      <div style="margin-left:auto;display:flex;gap:8px">
        <button class="btn btn-secondary btn-sm" onclick="openNewNCRModal()">
          <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          Raise NCR (inspection)
        </button>
        <button class="btn btn-primary btn-sm" onclick="openAddManualNCRModal()">
          <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          Log NCR manually
        </button>
      </div>
    </div>

    <!-- Log table -->
    <div class="card" style="padding:0;overflow:hidden">
      <div style="overflow-x:auto">
        <table class="itp-table" style="min-width:900px">
          <thead>
            <tr>
              <th style="width:88px">NCR No.</th>
              <th style="width:88px">Date</th>
              <th style="width:70px">Project</th>
              <th>Title / Description</th>
              <th style="width:90px">Area</th>
              <th style="width:66px">Severity</th>
              <th style="width:100px">Status</th>
              <th style="width:160px">Disposition</th>
              <th style="width:80px">Raised by</th>
              <th style="width:40px"></th>
            </tr>
          </thead>
          <tbody>
            ${ncrs.map(n => {
              const sevColor = { critical:'var(--red)', major:'var(--amber)', minor:'var(--blue)' }[n.severity]||'var(--text-muted)';
              const rowCls   = n.status==='open'&&n.severity==='critical' ? 'itp-hold-row' : n.status==='review' ? 'itp-active-row' : n.status==='closed' ? 'itp-done-row' : '';
              return `
              <tr class="${rowCls}" style="cursor:pointer" onclick="openNCRDetail('${n.id}')">
                <td style="font-family:var(--font-mono);font-size:11px;color:var(--brand);font-weight:600">${n.id}</td>
                <td style="font-size:11px;color:var(--text-muted)">${n.raised}</td>
                <td style="font-size:11px;font-family:var(--font-mono);color:var(--text-secondary)">${n.project}</td>
                <td>
                  <div style="font-size:13px;color:var(--text-primary);font-weight:500">${n.title}</div>
                  <div style="font-size:11px;color:var(--text-muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:280px">${n.desc.slice(0,90)}…</div>
                </td>
                <td style="font-size:11px;color:var(--text-secondary)">${n.area}</td>
                <td><span style="display:inline-block;padding:2px 7px;border-radius:3px;font-size:10px;font-weight:700;text-transform:uppercase;background:${sevColor}20;color:${sevColor}">${n.severity}</span></td>
                <td>
                  <span class="badge ${n.status==='closed'?'badge-green':n.status==='review'?'badge-amber':'badge-red'}" style="font-size:10px">${n.status}</span>
                  <div class="ncr-workflow" style="margin-top:5px;gap:2px">
                    ${wfLabels.map((l,i)=>`
                      <div class="ncr-wf-step ${i<n.currentStep?'done':i===n.currentStep?'active':''}" style="font-size:9px">
                        <span class="ncr-wf-dot" style="width:6px;height:6px"></span>
                      </div>
                      ${i<wfLabels.length-1?'<div class="ncr-wf-line" style="height:1px"></div>':''}`).join('')}
                  </div>
                </td>
                <td style="font-size:11px;color:var(--text-secondary)">${n.disposition||'—'}</td>
                <td style="font-size:11px;color:var(--text-muted)">${n.raisedBy}</td>
                <td>
                  <button class="btn-icon" title="View detail" onclick="event.stopPropagation();openNCRDetail('${n.id}')">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" stroke-width="1.2"/><path d="M6.5 5v4M6.5 4V3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
                  </button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* ─── CUSTOMER COMPLAINT LOG BOOK ─── */
function renderComplaintLogBook() {
  QCData.ncrView = 'complaints';
  const cc       = QCData.complaints || [];
  const open     = cc.filter(c=>c.status==='open').length;
  const closed   = cc.filter(c=>c.status==='closed').length;
  const catColor = { Quality:'var(--red)', Documentation:'var(--blue)', Delivery:'var(--amber)', Communication:'var(--brand)', Safety:'var(--red)' };

  document.getElementById('qcTabContent').innerHTML = `
    <!-- Sub-view toggle -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      <div class="itp-view-toggle">
        <button class="btn btn-ghost btn-sm" onclick="QCData.ncrView='ncr';renderNCRLogBook()">NCR Log Book</button>
        <button class="btn btn-primary btn-sm">Customer Complaint Log</button>
      </div>
      <span class="badge badge-red">${open} open</span>
      <span class="badge badge-green">${closed} closed</span>
      <span style="color:var(--text-muted);font-size:12px">${cc.length} total complaints</span>
      <button class="btn btn-primary btn-sm" style="margin-left:auto" onclick="openAddComplaintModal()">
        <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        Log customer complaint
      </button>
    </div>

    <!-- Log table -->
    <div class="card" style="padding:0;overflow:hidden">
      <div style="overflow-x:auto">
        <table class="itp-table" style="min-width:960px">
          <thead>
            <tr>
              <th style="width:78px">CC No.</th>
              <th style="width:88px">Date</th>
              <th style="width:110px">Customer</th>
              <th style="width:68px">Project</th>
              <th style="width:90px">Category</th>
              <th>Subject / Description</th>
              <th style="width:66px">Severity</th>
              <th style="width:72px">Status</th>
              <th style="width:130px">Action taken</th>
              <th style="width:80px">Target date</th>
              <th style="width:40px"></th>
            </tr>
          </thead>
          <tbody>
            ${cc.length === 0 ? `<tr><td colspan="11" style="text-align:center;padding:32px;color:var(--text-muted);font-size:13px">No customer complaints logged yet.</td></tr>` : ''}
            ${cc.map((c,i) => {
              const sevColor = { critical:'var(--red)', major:'var(--amber)', minor:'var(--blue)' }[c.severity]||'var(--text-muted)';
              const catCol   = catColor[c.category] || 'var(--text-muted)';
              const overdue  = c.status==='open' && c.targetDate && new Date(c.targetDate) < new Date();
              const rowCls   = c.status==='closed' ? 'itp-done-row' : overdue ? 'itp-hold-row' : '';
              return `
              <tr class="${rowCls}" style="cursor:pointer" onclick="openComplaintDetail(${i})">
                <td style="font-family:var(--font-mono);font-size:11px;color:var(--brand);font-weight:600">${c.id}</td>
                <td style="font-size:11px;color:var(--text-muted)">${c.date}</td>
                <td style="font-size:12px;color:var(--text-primary);font-weight:500">${c.customer}</td>
                <td style="font-size:11px;font-family:var(--font-mono);color:var(--text-secondary)">${c.project}</td>
                <td><span style="display:inline-block;padding:2px 7px;border-radius:3px;font-size:10px;font-weight:600;background:${catCol}20;color:${catCol}">${c.category}</span></td>
                <td>
                  <div style="font-size:13px;color:var(--text-primary);font-weight:500">${c.subject}</div>
                  <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${c.description.slice(0,80)}…</div>
                </td>
                <td><span style="display:inline-block;padding:2px 7px;border-radius:3px;font-size:10px;font-weight:700;text-transform:uppercase;background:${sevColor}20;color:${sevColor}">${c.severity}</span></td>
                <td>
                  <span class="badge ${c.status==='closed'?'badge-green':'badge-red'}" style="font-size:10px">${c.status}</span>
                  ${overdue ? `<div style="font-size:10px;color:var(--red);margin-top:3px">Overdue</div>` : ''}
                </td>
                <td style="font-size:11px;color:var(--text-secondary)">${c.actionTaken ? c.actionTaken.slice(0,50)+'…' : '—'}</td>
                <td style="font-size:11px;color:${overdue?'var(--red)':'var(--text-muted)'}">${c.targetDate||'—'}</td>
                <td>
                  <button class="btn-icon" onclick="event.stopPropagation();openComplaintDetail(${i})">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" stroke-width="1.2"/><path d="M6.5 5v4M6.5 4V3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
                  </button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function openComplaintDetail(idx) {
  const c = (QCData.complaints||[])[idx];
  if (!c) return;
  const sevColor = { critical:'var(--red)', major:'var(--amber)', minor:'var(--blue)' }[c.severity]||'var(--text-muted)';
  const catColor = { Quality:'var(--red)', Documentation:'var(--blue)', Delivery:'var(--amber)', Communication:'var(--brand)', Safety:'var(--red)' };
  const catCol   = catColor[c.category] || 'var(--text-muted)';
  const closeSVG = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  openQCModal(`
    <div class="qc-modal-inner">
      <div class="qc-modal-header">
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span style="font-family:var(--font-mono);font-size:12px;color:var(--brand)">${c.id}</span>
            <span style="display:inline-block;padding:2px 7px;border-radius:3px;font-size:10px;font-weight:600;background:${catCol}20;color:${catCol}">${c.category}</span>
            <span style="display:inline-block;padding:2px 7px;border-radius:3px;font-size:10px;font-weight:700;text-transform:uppercase;background:${sevColor}20;color:${sevColor}">${c.severity}</span>
          </div>
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">${c.subject}</div>
        </div>
        <button class="btn-icon" onclick="closeQCModal()">${closeSVG}</button>
      </div>
      <div class="qc-modal-body">
        <p style="font-size:13px;color:var(--text-secondary);line-height:1.6">${c.description}</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${[['Customer',c.customer],['Project',c.project],['Date received',c.date],['Received by',c.receivedBy],
             ['Received via',c.receivedVia],['Status',c.status],
             ['Target date',c.targetDate||'—'],['Closed date',c.closedDate||'—']].map(([l,v])=>`
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px">
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:3px">${l}</div>
              <div style="font-size:12px;color:var(--text-primary)">${v}</div>
            </div>`).join('')}
        </div>
        ${c.actionTaken ? `
          <div style="padding:10px 12px;background:var(--green-bg);border:1px solid rgba(45,212,160,.2);border-radius:var(--radius-sm);font-size:12px;color:var(--green)">
            <strong>Action taken:</strong> ${c.actionTaken}
          </div>` : ''}
        <div>
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:8px">Activity log</div>
          ${(c.comments||[]).map(cm=>`
            <div style="display:flex;gap:10px;margin-bottom:10px;font-size:12px">
              <div style="width:28px;height:28px;border-radius:var(--radius-sm);background:var(--bg-subtle);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--text-secondary);flex-shrink:0">${cm.by.split(' ').map(x=>x[0]).join('').slice(0,2)}</div>
              <div>
                <div style="color:var(--text-secondary);margin-bottom:2px"><strong style="color:var(--text-primary)">${cm.by}</strong> · ${cm.time}</div>
                <div style="color:var(--text-secondary)">${cm.text}</div>
              </div>
            </div>`).join('')}
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          ${c.status!=='closed' ? `<button class="btn btn-primary" onclick="closeQCModal();showToast('Complaint ${c.id} closed','success')">Close complaint</button>` : ''}
          <button class="btn btn-secondary" onclick="closeQCModal();showToast('Complaint report downloaded','info')">Download PDF</button>
          <button class="btn btn-ghost" onclick="closeQCModal()">Close</button>
        </div>
      </div>
    </div>`);
}

function openAddComplaintModal() {
  const closeSVG = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  openQCModal(`
    <div class="qc-modal-inner" style="max-width:580px">
      <div class="qc-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Log Customer Complaint</div>
        <button class="btn-icon" onclick="closeQCModal()">${closeSVG}</button>
      </div>
      <div class="qc-modal-body">
        <div class="qc-field-row">
          <div class="qc-field"><label>Customer name</label><input id="cc-customer" type="text" placeholder="e.g. Saudi Aramco"/></div>
          <div class="qc-field"><label>Project</label>
            <select id="cc-project">${AppState.projects.map(p=>`<option value="${p.id}">${p.id} — ${p.name.split('—')[0].trim()}</option>`).join('')}</select>
          </div>
        </div>
        <div class="qc-field"><label>Complaint subject</label><input id="cc-subject" type="text" placeholder="Brief subject / title of the complaint"/></div>
        <div class="qc-field"><label>Description</label><textarea id="cc-desc" rows="3" placeholder="Full description of the complaint, observations, customer's exact concern…"></textarea></div>
        <div class="qc-field-row">
          <div class="qc-field"><label>Category</label>
            <select id="cc-category">
              <option>Quality</option>
              <option>Documentation</option>
              <option>Delivery</option>
              <option>Communication</option>
              <option>Safety</option>
              <option>Other</option>
            </select>
          </div>
          <div class="qc-field"><label>Severity</label>
            <select id="cc-severity">
              <option value="critical">Critical</option>
              <option value="major" selected>Major</option>
              <option value="minor">Minor</option>
            </select>
          </div>
        </div>
        <div class="qc-field-row">
          <div class="qc-field"><label>Received by</label><input id="cc-by" type="text" placeholder="Your name"/></div>
          <div class="qc-field"><label>Received via</label>
            <select id="cc-via">
              <option>Email</option>
              <option>Phone call</option>
              <option>Site meeting</option>
              <option>Formal letter</option>
              <option>Video call</option>
            </select>
          </div>
        </div>
        <div class="qc-field-row">
          <div class="qc-field"><label>Date received</label><input id="cc-date" type="date" value="${new Date().toISOString().split('T')[0]}"/></div>
          <div class="qc-field"><label>Target close date</label><input id="cc-target" type="date"/></div>
        </div>
        <div class="qc-field"><label>Initial action taken / planned</label><textarea id="cc-action" rows="2" placeholder="Immediate steps taken or planned…"></textarea></div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="_submitComplaint()">Log complaint</button>
          <button class="btn btn-secondary" onclick="closeQCModal()">Cancel</button>
        </div>
      </div>
    </div>`);
}

function _submitComplaint() {
  const subject = document.getElementById('cc-subject')?.value?.trim();
  const customer = document.getElementById('cc-customer')?.value?.trim();
  if (!subject || !customer) { showToast('Customer name and subject are required', 'error'); return; }
  const nextId = 'CC-' + String((QCData.complaints||[]).length + 6).padStart(3,'0');
  const entry = {
    id:          nextId,
    date:        document.getElementById('cc-date')?.value || new Date().toISOString().split('T')[0],
    customer,
    project:     document.getElementById('cc-project')?.value || '',
    category:    document.getElementById('cc-category')?.value || 'Quality',
    severity:    document.getElementById('cc-severity')?.value || 'major',
    status:      'open',
    subject,
    description: document.getElementById('cc-desc')?.value?.trim() || '',
    receivedBy:  document.getElementById('cc-by')?.value?.trim() || '',
    receivedVia: document.getElementById('cc-via')?.value || 'Email',
    actionTaken: document.getElementById('cc-action')?.value?.trim() || null,
    targetDate:  document.getElementById('cc-target')?.value || null,
    closedDate:  null,
    comments: [],
  };
  (QCData.complaints = QCData.complaints||[]).unshift(entry);
  closeQCModal();
  showToast(`Complaint ${nextId} logged — QC Manager notified`, 'success');
  renderComplaintLogBook();
}

function openAddManualNCRModal() {
  const closeSVG = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  openQCModal(`
    <div class="qc-modal-inner" style="max-width:580px">
      <div class="qc-modal-header">
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px">Manual entry — not linked to inspection step</div>
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Log NCR Manually</div>
        </div>
        <button class="btn-icon" onclick="closeQCModal()">${closeSVG}</button>
      </div>
      <div class="qc-modal-body">
        <div class="qc-field-row">
          <div class="qc-field"><label>Project</label>
            <select id="mncr-project">${AppState.projects.map(p=>`<option value="${p.id}">${p.id} — ${p.name.split('—')[0].trim()}</option>`).join('')}</select>
          </div>
          <div class="qc-field"><label>Severity</label>
            <select id="mncr-severity"><option value="critical">Critical</option><option value="major" selected>Major</option><option value="minor">Minor</option></select>
          </div>
        </div>
        <div class="qc-field"><label>NCR title</label><input id="mncr-title" type="text" placeholder="Brief description of non-conformance"/></div>
        <div class="qc-field"><label>Detailed description</label><textarea id="mncr-desc" rows="3" placeholder="Full description, measurements, deviations from spec…"></textarea></div>
        <div class="qc-field-row">
          <div class="qc-field"><label>Area / process</label><input id="mncr-area" type="text" placeholder="e.g. Fabrication, Assembly, Delivery"/></div>
          <div class="qc-field"><label>NC type</label>
            <select id="mncr-type">
              <option>Process NC</option>
              <option>Product NC</option>
              <option>Documentation NC</option>
              <option>Supplier NC</option>
              <option>Customer-identified</option>
              <option>Audit finding</option>
            </select>
          </div>
        </div>
        <div class="qc-field-row">
          <div class="qc-field"><label>Drawing / reference</label><input id="mncr-drawing" type="text" placeholder="e.g. DWG-SH-001-A"/></div>
          <div class="qc-field"><label>Detected by</label><input id="mncr-by" type="text" placeholder="Your name"/></div>
        </div>
        <div class="qc-field-row">
          <div class="qc-field"><label>Date detected</label><input id="mncr-date" type="date" value="${new Date().toISOString().split('T')[0]}"/></div>
          <div class="qc-field"><label>Proposed disposition</label>
            <select id="mncr-disp"><option value="">— To be determined —</option><option>Rework</option><option>Scrap & replace</option><option>Return to vendor</option><option>Accept as-is (concession)</option><option>Engineering review</option></select>
          </div>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="_submitManualNCR()">Log NCR</button>
          <button class="btn btn-secondary" onclick="closeQCModal()">Cancel</button>
        </div>
      </div>
    </div>`);
}

function _submitManualNCR() {
  const title = document.getElementById('mncr-title')?.value?.trim();
  if (!title) { showToast('NCR title is required', 'error'); return; }
  const nextNum = Math.max(...QCData.ncrs.map(n=>parseInt(n.id.replace('NCR-',''))||0), 31) + 1;
  const entry = {
    id:          'NCR-' + String(nextNum).padStart(3,'0'),
    project:     document.getElementById('mncr-project')?.value || '',
    severity:    document.getElementById('mncr-severity')?.value || 'major',
    status:      'open',
    title,
    desc:        document.getElementById('mncr-desc')?.value?.trim() || '',
    raised:      document.getElementById('mncr-date')?.value || new Date().toISOString().split('T')[0],
    raisedBy:    document.getElementById('mncr-by')?.value?.trim() || 'Manual entry',
    area:        document.getElementById('mncr-area')?.value?.trim() || '—',
    drawing:     document.getElementById('mncr-drawing')?.value?.trim() || null,
    weldJoint:   null,
    disposition: document.getElementById('mncr-disp')?.value || null,
    workflow:    ['raised','review','disposition','closed'],
    currentStep: 0,
    attachments: [],
    comments:    [],
    source:      'manual',
  };
  QCData.ncrs.unshift(entry);
  closeQCModal();
  showToast(`NCR ${entry.id} logged — QC Manager notified`, 'success');
  renderNCRLogBook();
}

function openNCRDetail(id) {
  const n = QCData.ncrs.find(x=>x.id===id);
  if (!n) return;
  const role = AppState.currentUser?.role || 'manager';
  const isInspector = role === 'user';
  const isLead = role === 'senior';
  const isManager = role === 'manager' || role === 'gm';
  const wfLabels = ['Raised','Under review','Disposition','Closed'];
  const sevCls   = { critical:'ncr-sev-critical', major:'ncr-sev-major', minor:'ncr-sev-minor' }[n.severity]||'ncr-sev-minor';

  openQCModal(`
    <div class="qc-modal-inner">
      <div class="qc-modal-header">
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span style="font-family:var(--font-mono);font-size:12px;color:var(--brand)">${n.id}</span>
            <span class="ncr-severity ${sevCls}" style="font-size:10px">${n.severity}</span>
          </div>
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">${n.title}</div>
        </div>
        <button class="btn-icon" onclick="closeQCModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="qc-modal-body">
        <!-- Workflow -->
        <div class="ncr-workflow" style="padding:10px 0">
          ${wfLabels.map((lbl,i)=>`
            <div class="ncr-wf-step ${i<n.currentStep?'done':i===n.currentStep?'active':''}" style="font-size:12px">
              <span class="ncr-wf-dot"></span><span>${lbl}</span>
            </div>${i<wfLabels.length-1?'<div class="ncr-wf-line"></div>':''}`).join('')}
        </div>
        <p style="font-size:13px;color:var(--text-secondary);line-height:1.6">${n.desc}</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${[['Project',n.project],['Area',n.area],['Raised',n.raised],['Raised by',n.raisedBy],
             ['Drawing',n.drawing||'—'],['Weld joint',n.weldJoint||'—']].map(([l,v])=>`
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px">
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:3px">${l}</div>
              <div style="font-size:12px;color:var(--text-primary)">${v}</div>
            </div>`).join('')}
        </div>
        ${n.disposition?`<div style="padding:10px 12px;background:var(--amber-bg);border:1px solid rgba(245,158,11,.25);border-radius:var(--radius-sm);font-size:12px;color:var(--amber)"><strong>Disposition:</strong> ${n.disposition}</div>`:''}
        <!-- Comments -->
        <div>
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:8px">Activity log</div>
          ${n.comments.map(c=>`
            <div style="display:flex;gap:10px;margin-bottom:10px;font-size:12px">
              <div style="width:28px;height:28px;border-radius:var(--radius-sm);background:var(--bg-subtle);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--text-secondary);flex-shrink:0">${c.by.split(' ').map(x=>x[0]).join('').slice(0,2)}</div>
              <div>
                <div style="color:var(--text-secondary);margin-bottom:2px"><strong style="color:var(--text-primary)">${c.by}</strong> · ${c.time}</div>
                <div style="color:var(--text-secondary)">${c.text}</div>
              </div>
            </div>`).join('')}
        </div>
        <!-- Attachments -->
        ${n.attachments.length?`
          <div>
            <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:8px">Attachments (${n.attachments.length})</div>
            ${n.attachments.map(a=>`
              <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:5px;cursor:pointer" onclick="showToast('Opening ${a}','info')">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="1" width="8" height="11" rx="1" stroke="var(--blue)" stroke-width="1.2"/><path d="M5 4h4M5 7h4M5 10h2" stroke="var(--blue)" stroke-width="1" stroke-linecap="round"/></svg>
                <span style="font-size:12px;color:var(--text-primary);flex:1">${a}</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 9h8M6 2v5M3.5 5l2.5 2.5L9 5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>`).join('')}
          </div>`:''}
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          ${n.status!=='closed' ? (
            isInspector 
              ? `<button class="btn btn-primary" style="opacity:0.5;cursor:not-allowed" onclick="showToast('QC Inspectors cannot progress NCR status','warn')">Progress NCR</button>` 
              : `<button class="btn btn-primary" onclick="progressNCR('${n.id}')">Progress NCR</button>`
          ) : ''}
          <button class="btn btn-secondary" onclick="closeQCModal();showToast('NCR report downloaded','info')">Download PDF</button>
          <button class="btn btn-ghost" onclick="closeQCModal()">Close</button>
        </div>
      </div>
    </div>`);
}

function openNewNCRModal() {
  openQCModal(`
    <div class="qc-modal-inner">
      <div class="qc-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Raise Non-Conformance Report</div>
        <button class="btn-icon" onclick="closeQCModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="qc-modal-body">
        <div class="qc-field-row">
          <div class="qc-field"><label>Project</label>
            <select id="nncr-project">${AppState.projects.map(p=>`<option value="${p.id}">${p.id} — ${p.name.split('—')[0].trim()}</option>`).join('')}</select>
          </div>
          <div class="qc-field"><label>Severity</label>
            <select id="nncr-severity"><option value="critical">Critical</option><option value="major">Major</option><option value="minor">Minor</option></select>
          </div>
        </div>
        <div class="qc-field"><label>NCR title</label><input type="text" id="nncr-title" placeholder="Brief description of non-conformance"/></div>
        <div class="qc-field"><label>Detailed description</label><textarea id="nncr-desc" rows="3" placeholder="Full description, measurements, observations…"></textarea></div>
        <div class="qc-field-row">
          <div class="qc-field"><label>Area / process</label><input type="text" id="nncr-area" placeholder="e.g. Incoming inspection"/></div>
          <div class="qc-field"><label>Weld joint (if applicable)</label><input type="text" id="nncr-joint" placeholder="e.g. WJ-04"/></div>
        </div>
        <div class="qc-field-row">
          <div class="qc-field"><label>Drawing ref</label><input type="text" id="nncr-drawing" placeholder="e.g. DWG-SH-001-A"/></div>
          <div class="qc-field"><label>Raised by</label><input type="text" id="nncr-raisedby" value="${AppState.currentUser?.name || ''}" disabled /></div>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="submitNewNCR()">Raise NCR</button>
          <button class="btn btn-secondary" onclick="closeQCModal()">Cancel</button>
        </div>
      </div>
    </div>`);
}

async function submitNewNCR() {
  const pid = document.getElementById('nncr-project')?.value || 'P-2401';
  const severity = document.getElementById('nncr-severity')?.value.toLowerCase() || 'minor';
  const title = document.getElementById('nncr-title')?.value || '';
  const desc = document.getElementById('nncr-desc')?.value || '';
  const area = document.getElementById('nncr-area')?.value || 'Field';
  const weldJoint = document.getElementById('nncr-joint')?.value || null;
  const drawing = document.getElementById('nncr-drawing')?.value || null;
  
  if (!title) {
    showToast('Please enter an NCR title', 'error');
    return;
  }

  try {
    const res = await QCAPI.ncrCreate({ project_id: pid, title, description: desc, severity, area, weldJoint, drawing });
    QCData.ncrs.unshift({
      id: res.id,
      project: pid,
      severity: severity,
      status: 'open',
      title: title,
      desc: desc,
      raised: res.raised || new Date().toISOString().split('T')[0],
      raisedBy: res.raisedBy || AppState.currentUser.name,
      area: area,
      drawing: drawing,
      weldJoint: weldJoint,
      disposition: null,
      workflow: ['raised','review','disposition','closed'],
      currentStep: 0,
      attachments: [],
      comments: []
    });
    showToast('NCR raised successfully', 'success');
    closeQCModal();
    renderQCNCR();
  } catch (e) {
    showToast(`Failed to raise NCR: ${e.message}`, 'error');
  }
}

function progressNCR(id) {
  const n = QCData.ncrs.find(x=>x.id===id);
  if (!n) return;
  const role = AppState.currentUser?.role || 'manager';
  const isInspector = role === 'user';
  const isLead = role === 'senior';
  const isManager = role === 'manager' || role === 'gm';
  
  if (isInspector) {
    showToast('QC Inspectors cannot change NCR status.', 'warn');
    return;
  }

  if (n.status === 'open') {
    openQCModal(`
      <div class="qc-modal-inner">
        <div class="qc-modal-header">
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">RCA & Progress NCR — ${n.id}</div>
          <button class="btn-icon" onclick="closeQCModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
        </div>
        <div class="qc-modal-body">
          <p style="font-size:12px;color:var(--text-secondary)">Please record the Root Cause Analysis (RCA) to move this NCR to <strong>Under Review</strong> status.</p>
          <div class="qc-field"><label>Root Cause Analysis</label>
            <textarea id="ncr-rca" rows="3" placeholder="Identify the root cause of the weld undercut / material failure..."></textarea>
          </div>
          <div style="display:flex;gap:10px">
            <button class="btn btn-primary" style="flex:1" onclick="submitNCRRCA('${n.id}')">Submit RCA & Progress</button>
            <button class="btn btn-secondary" onclick="openNCRDetail('${n.id}')">Back</button>
          </div>
        </div>
      </div>
    `);
  } else if (n.status === 'review') {
    if (!isManager) {
      showToast('Only the QC Manager can set NCR disposition and close NCRs.', 'warn');
      return;
    }
    openQCModal(`
      <div class="qc-modal-inner">
        <div class="qc-modal-header">
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Set Disposition — ${n.id}</div>
          <button class="btn-icon" onclick="closeQCModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
        </div>
        <div class="qc-modal-body">
          <div class="qc-field"><label>Disposition Decision</label>
            <select id="ncr-disposition">
              <option value="Rework — grind & repair weld">Rework (Repair)</option>
              <option value="Accept as-is (concession)">Accept As-Is (Engineering Concession)</option>
              <option value="Scrap & replace">Scrap & Replace</option>
              <option value="Return to vendor">Return to Vendor</option>
            </select>
          </div>
          <div class="qc-field"><label>Disposition Comments</label>
            <textarea id="ncr-disp-comments" rows="2" placeholder="Explain the reasoning for this disposition decision..."></textarea>
          </div>
          <div style="display:flex;gap:10px">
            <button class="btn btn-primary" style="flex:1" onclick="submitNCRDisposition('${n.id}')">Set Disposition & Close</button>
            <button class="btn btn-secondary" onclick="openNCRDetail('${n.id}')">Back</button>
          </div>
        </div>
      </div>
    `);
  }
}

async function submitNCRRCA(id) {
  const comments = document.getElementById('ncr-rca')?.value || 'RCA submitted.';
  try {
    await QCAPI.ncrStatus(id, 'review', comments);
    const n = QCData.ncrs.find(x=>x.id===id);
    if (n) {
      n.status = 'review';
      n.currentStep = 2; // move step to Disposition
      n.comments.push({ by: AppState.currentUser.name, time: 'Just now', text: `RCA submitted: ${comments}` });
    }
    showToast(`NCR ${id} advanced to Under Review status`, 'success');
    closeQCModal();
    renderQCNCR();
  } catch (e) {
    showToast(`Action failed: ${e.message}`, 'error');
  }
}

async function submitNCRDisposition(id) {
  const disposition = document.getElementById('ncr-disposition')?.value || 'Rework';
  const comments = document.getElementById('ncr-disp-comments')?.value || '';
  try {
    await api.patch(`/ncr/${id}/disposition`, { disposition, comments });
    const n = QCData.ncrs.find(x=>x.id===id);
    if (n) {
      n.status = 'closed';
      n.currentStep = 3; // closed
      n.disposition = disposition;
      n.comments.push({ by: AppState.currentUser.name, time: 'Just now', text: `Disposition set: ${disposition}. Comments: ${comments}` });
    }
    showToast(`NCR ${id} closed successfully`, 'success');
    closeQCModal();
    renderQCNCR();
  } catch (e) {
    showToast(`Action failed: ${e.message}`, 'error');
  }
}

/* ═══════════════════════════════════════════════════════════
   TAB 4 — INCOMING INSPECTION
═══════════════════════════════════════════════════════════ */
function renderQCInspection() {
  document.getElementById('qcTabContent').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">
      <div style="display:flex;gap:8px">
        <span class="badge badge-amber">${QCData.inspections.filter(i=>i.status==='pending').length} pending</span>
        <span class="badge badge-green">${QCData.inspections.filter(i=>i.status==='pass').length} passed</span>
        <span class="badge badge-red">${QCData.inspections.filter(i=>i.status==='fail').length} failed</span>
      </div>
      <button class="btn btn-primary btn-sm" onclick="openNewInspModal()">
        <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        Log inspection
      </button>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px">
      ${QCData.inspections.map(insp => {
        const stCls = { pending:'insp-pending', pass:'insp-pass', fail:'insp-fail' }[insp.status]||'insp-pending';
        const stColor = { pending:'var(--amber)', pass:'var(--green)', fail:'var(--red)' }[insp.status];
        const doneChecks = insp.checks.filter(c=>c.done).length;
        return `
        <div class="insp-card ${stCls}" onclick="openInspDetail('${insp.id}')">
          <div class="insp-header">
            <div>
              <div class="insp-lot">${insp.id} · ${insp.lot}</div>
              <div class="insp-item">${insp.item}</div>
              <div class="insp-meta">${insp.project} · ${insp.supplier} · Received: ${insp.received} · Qty: ${insp.qty}</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0">
              <span class="badge ${insp.status==='pass'?'badge-green':insp.status==='fail'?'badge-red':'badge-amber'}" style="font-size:11px">${insp.status}</span>
              <span style="font-size:11px;color:var(--text-muted)">${doneChecks}/${insp.checks.length} checks</span>
            </div>
          </div>
          <div class="progress-bar" style="margin:10px 0 8px">
            <div class="progress-fill" style="width:${Math.round(doneChecks/insp.checks.length*100)}%;background:${stColor}"></div>
          </div>
          <div class="insp-checklist">
            ${insp.checks.map(c=>`
              <div class="insp-check-row">
                <svg class="insp-check-icon" viewBox="0 0 16 16" fill="none">
                  ${c.done
                    ? `<circle cx="8" cy="8" r="7" fill="var(--green-bg)" stroke="var(--green)" stroke-width="1.2"/><path d="M5 8l2 2 4-4" stroke="var(--green)" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`
                    : `<circle cx="8" cy="8" r="7" stroke="var(--border-md)" stroke-width="1.2"/>`}
                </svg>
                <span style="color:${c.done?'var(--text-primary)':'var(--text-muted)'}">${c.label}</span>
              </div>`).join('')}
          </div>
          ${insp.status==='pending'?`
            <div style="display:flex;gap:8px;margin-top:12px" onclick="event.stopPropagation()">
              <button class="btn btn-primary btn-sm" onclick="showToast('Opening inspection form for ${insp.id}','info')">Continue inspection</button>
              <button class="btn btn-secondary btn-sm" onclick="showToast('External lab order raised for ${insp.id}','success')">Order ext. lab</button>
            </div>`:''}
          ${insp.status==='fail'?`
            <div style="margin-top:10px;padding:8px 10px;background:var(--red-bg);border:1px solid rgba(245,101,101,.2);border-radius:var(--radius-sm);font-size:12px;color:var(--red)">
              Failed inspection — NCR auto-linked. Material in quarantine.
            </div>`:''}
        </div>`;
      }).join('')}
    </div>`;
}

function openInspDetail(id) {
  const insp = QCData.inspections.find(i=>i.id===id);
  if (!insp) return;
  const closeSVG = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  const role = AppState.currentUser?.role || 'manager';
  const isInspector = role === 'user';
  
  openQCModal(`
    <div class="qc-modal-inner">
      <div class="qc-modal-header">
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:2px">Incoming Quality Control</div>
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">${insp.id} — ${insp.item}</div>
        </div>
        <button class="btn-icon" onclick="closeQCModal()">${closeSVG}</button>
      </div>
      <div class="qc-modal-body">
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.6;background:var(--bg-subtle);padding:10px;border-radius:var(--radius-sm);border:1px solid var(--border)">
          <strong>Supplier:</strong> ${insp.supplier} <br>
          <strong>Project:</strong> ${insp.project} <br>
          <strong>Lot / Batch:</strong> ${insp.lot} <br>
          <strong>Received:</strong> ${insp.received} · <strong>Qty:</strong> ${insp.qty}
        </div>
        
        <div>
          <div style="font-size:11.5px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;font-weight:700">Checklist Items</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${insp.checks.map((c, idx)=>`
              <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm)">
                <span style="font-size:12.5px;color:var(--text-primary)">${c.label}</span>
                <input type="checkbox" ${c.done ? 'checked' : ''} onchange="toggleInspCheck('${insp.id}', ${idx})" style="cursor:pointer;width:16px;height:16px" />
              </div>
            `).join('')}
          </div>
        </div>
        
        <div style="display:flex;gap:10px;margin-top:12px">
          ${insp.status === 'pending'
            ? (isInspector 
                ? `<button class="btn btn-secondary" style="flex:1;opacity:0.5;cursor:not-allowed" onclick="showToast('QC Inspectors cannot execute final inspection clearance','warn')">Clear Pass</button>
                   <button class="btn btn-secondary" style="color:var(--red);flex:1;opacity:0.5;cursor:not-allowed" onclick="showToast('QC Inspectors cannot execute final inspection clearance','warn')">Clear Fail</button>`
                : `<button class="btn btn-primary" style="flex:1" onclick="submitInspClearance('${insp.id}', 'pass')">Clear Pass</button>
                   <button class="btn btn-secondary" style="color:var(--red);flex:1" onclick="submitInspClearance('${insp.id}', 'fail')">Clear Fail</button>`)
            : `<div style="font-size:13px;font-weight:700;color:${insp.status==='pass'?'var(--green)':'var(--red)'};text-align:center;width:100%;padding:10px;background:var(--bg-subtle);border-radius:var(--radius-sm)">Inspection Complete: Status is ${insp.status.toUpperCase()}</div>`
          }
          <button class="btn btn-secondary" onclick="closeQCModal()">Close</button>
        </div>
      </div>
    </div>
  `);
}

function toggleInspCheck(id, index) {
  const insp = QCData.inspections.find(i=>i.id===id);
  if (insp && insp.checks[index]) {
    insp.checks[index].done = !insp.checks[index].done;
    showToast('Inspection checklist updated', 'success');
    renderQCInspection();
    openInspDetail(id); // refresh modal
  }
}

async function submitInspClearance(id, result) {
  try {
    await QCAPI.inspResult(id, result);
    const insp = QCData.inspections.find(i=>i.id===id);
    if (insp) insp.status = result;
    showToast(`Inspection ${id} cleared as ${result.toUpperCase()}`, 'success');
    closeQCModal();
    renderQCInspection();
  } catch (e) {
    showToast(`Failed to clear inspection: ${e.message}`, 'error');
  }
}

function openNewInspModal() {
  openQCModal(`
    <div class="qc-modal-inner">
      <div class="qc-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Log incoming inspection</div>
        <button class="btn-icon" onclick="closeQCModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="qc-modal-body">
        <div class="qc-field"><label>GRN / Lot number</label><input type="text" id="ninsp-lot" placeholder="e.g. GRN-090 / Lot XX-0001"/></div>
        <div class="qc-field"><label>Item description</label><input type="text" id="ninsp-item" placeholder="e.g. Shell plate 316L 10mm"/></div>
        <div class="qc-field-row">
          <div class="qc-field"><label>Project</label>
            <select id="ninsp-project">${AppState.projects.map(p=>`<option value="${p.id}">${p.id}</option>`).join('')}</select>
          </div>
          <div class="qc-field"><label>Supplier</label><input type="text" id="ninsp-supplier" placeholder="Supplier name"/></div>
        </div>
        <div class="qc-field-row">
          <div class="qc-field"><label>Quantity received</label><input type="text" id="ninsp-qty" placeholder="e.g. 8 SHT"/></div>
          <div class="qc-field"><label>Heat / batch number</label><input type="text" id="ninsp-heat" placeholder="e.g. HN-44830"/></div>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="submitNewInsp()">Create inspection</button>
          <button class="btn btn-secondary" onclick="closeQCModal()">Cancel</button>
        </div>
      </div>
    </div>`);
}

async function submitNewInsp() {
  const lot = document.getElementById('ninsp-lot')?.value || '';
  const item = document.getElementById('ninsp-item')?.value || '';
  const project = document.getElementById('ninsp-project')?.value || 'P-2401';
  const supplier = document.getElementById('ninsp-supplier')?.value || '';
  const qty = document.getElementById('ninsp-qty')?.value || '';
  
  if (!lot || !item) {
    showToast('Please enter GRN / Lot and Item description', 'error');
    return;
  }

  const newInsp = {
    id: `INSP-${String(QCData.inspections.length + 90).padStart(3, '0')}`,
    project,
    status: 'pending',
    item,
    lot,
    supplier,
    received: new Date().toISOString().split('T')[0],
    qty,
    checks: [
      { label: 'Dimensional check', done: false },
      { label: 'MTC verification (chem)', done: false },
      { label: 'MTC verification (mech)', done: false },
      { label: 'Visual surface inspection', done: false }
    ]
  };

  QCData.inspections.unshift(newInsp);
  showToast('Incoming inspection record logged', 'success');
  closeQCModal();
  renderQCInspection();
}

/* ═══════════════════════════════════════════════════════════
   TAB 5 — WELD MAP
═══════════════════════════════════════════════════════════ */
function renderQCWeldMap() {
  const pid    = QCData.selectedProject;
  const joints = QCData.weldJoints[pid] || [];

  const stColor = { done:'#2dd4a0', active:'#e8622a', pending:'#4d5968', ncr:'#f56565', blocked:'#f59e0b' };
  const stLabel = { done:'Complete', active:'In progress', pending:'Pending', ncr:'NCR raised', blocked:'Blocked' };

  document.getElementById('qcTabContent').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 300px;gap:16px;align-items:start">
      <!-- Vessel schematic -->
      <div class="weld-map-container">
        <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:12px">${pid} — weld joint map (schematic)</div>
        <div class="weld-vessel-wrap">
          <svg class="weld-vessel-svg" viewBox="0 0 540 280" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Tank shell outline -->
            <rect x="60" y="40" width="380" height="180" rx="8" stroke="var(--border-strong)" stroke-width="1.5" fill="var(--bg-surface)"/>
            <!-- Shell courses (vertical lines) -->
            <line x1="155" y1="40" x2="155" y2="220" stroke="var(--border)" stroke-width="0.8" stroke-dasharray="4 3"/>
            <line x1="250" y1="40" x2="250" y2="220" stroke="var(--border)" stroke-width="0.8" stroke-dasharray="4 3"/>
            <line x1="345" y1="40" x2="345" y2="220" stroke="var(--border)" stroke-width="0.8" stroke-dasharray="4 3"/>
            <!-- Course labels -->
            <text x="105" y="35" font-size="9" fill="var(--text-muted)" text-anchor="middle" font-family="monospace">Course 1</text>
            <text x="200" y="35" font-size="9" fill="var(--text-muted)" text-anchor="middle" font-family="monospace">Course 2</text>
            <text x="295" y="35" font-size="9" fill="var(--text-muted)" text-anchor="middle" font-family="monospace">Course 3</text>
            <text x="390" y="35" font-size="9" fill="var(--text-muted)" text-anchor="middle" font-family="monospace">Course 4</text>
            <!-- Bottom dish -->
            <ellipse cx="60" cy="130" rx="20" ry="90" stroke="var(--border-strong)" stroke-width="1.5" fill="var(--bg-elevated)"/>
            <!-- Top nozzle area label -->
            <text x="250" y="16" font-size="9" fill="var(--text-muted)" text-anchor="middle" font-family="monospace">Top nozzle ring</text>
            <!-- Nozzle row line -->
            <line x1="80" y1="220" x2="440" y2="220" stroke="var(--border-md)" stroke-width="1" stroke-dasharray="3 3"/>
            <text x="60" y="232" font-size="8" fill="var(--text-muted)" font-family="monospace">Nozzles</text>

            ${joints.map(j => {
              const col = stColor[j.status] || '#4d5968';
              const r   = j.status === 'ncr' ? 9 : 7;
              return `
              <g class="weld-joint" onclick="openWeldJointDetail('${j.id}','${pid}')" title="${j.id}: ${j.type}">
                <circle cx="${j.x}" cy="${j.y}" r="${r+3}" fill="${col}" opacity="0.15"/>
                <circle cx="${j.x}" cy="${j.y}" r="${r}" fill="${col}" stroke="${col}" stroke-width="1.5" opacity="0.9"/>
                <text class="weld-joint-label" x="${j.x}" y="${j.y+3.5}" text-anchor="middle" font-size="7" fill="${j.status==='pending'?'var(--text-secondary)':'#0d0f12'}" font-weight="600">${j.id.replace('WJ-','')}</text>
              </g>`;
            }).join('')}
          </svg>
        </div>
        <div class="weld-legend">
          ${Object.entries(stColor).map(([st,col])=>`
            <div class="weld-legend-item">
              <div class="weld-legend-dot" style="background:${col}"></div>
              <span>${stLabel[st]}</span>
            </div>`).join('')}
        </div>
      </div>

      <!-- Joint list -->
      <div class="card" style="padding:0;overflow:hidden">
        <div style="padding:12px 14px;background:var(--bg-subtle);border-bottom:1px solid var(--border)">
          <span class="card-title">Weld joints — ${pid}</span>
        </div>
        <div style="max-height:340px;overflow-y:auto">
          ${joints.map(j=>{
            const col = stColor[j.status]||'#4d5968';
            return `
            <div style="display:flex;gap:10px;align-items:center;padding:10px 14px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .1s" onclick="openWeldJointDetail('${j.id}','${pid}')" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background=''">
              <div style="width:10px;height:10px;border-radius:50%;background:${col};flex-shrink:0;box-shadow:0 0 5px ${col}40"></div>
              <div style="flex:1;min-width:0">
                <div style="font-size:12px;font-weight:500;font-family:var(--font-mono);color:var(--text-primary)">${j.id}</div>
                <div style="font-size:11px;color:var(--text-muted)">${j.type} · ${j.wps}</div>
              </div>
              <div style="text-align:right;flex-shrink:0">
                <div style="font-size:11px;color:${col};font-weight:500">${j.ndt}</div>
                <div style="font-size:10px;color:var(--text-muted)">${j.welder||'Unassigned'}</div>
              </div>
            </div>`;
          }).join('')}
        </div>
        <div style="padding:10px 14px;border-top:1px solid var(--border)">
          <button class="btn btn-secondary btn-sm" style="width:100%" onclick="showToast('Weld map exported as PDF','success')">Export weld map PDF</button>
        </div>
      </div>
    </div>`;
}

function openWeldJointDetail(jid, pid) {
  const j = (QCData.weldJoints[pid]||[]).find(x=>x.id===jid);
  if (!j) return;
  const role = AppState.currentUser?.role || 'manager';
  const isInspector = role === 'user';
  const stColor = { done:'var(--green)', active:'var(--brand)', pending:'var(--text-muted)', ncr:'var(--red)', blocked:'var(--amber)' };
  openQCModal(`
    <div class="qc-modal-inner">
      <div class="qc-modal-header">
        <div>
          <div style="font-family:var(--font-mono);font-size:12px;color:var(--brand);margin-bottom:3px">${j.id} — ${pid}</div>
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">${j.type} — Course ${j.course}</div>
        </div>
        <button class="btn-icon" onclick="closeQCModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="qc-modal-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${[['Status',`<span style="color:${stColor[j.status]};font-weight:500">${j.status}</span>`],
             ['WPS',j.wps],['NDT status',j.ndt],['Welder',j.welder||'Unassigned']].map(([l,v])=>`
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px">
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:4px">${l}</div>
              <div style="font-size:13px;color:var(--text-primary)">${v}</div>
            </div>`).join('')}
        </div>
        ${j.status==='ncr'?`<div style="padding:10px 12px;background:var(--red-bg);border:1px solid rgba(245,101,101,.2);border-radius:var(--radius-sm);font-size:12px;color:var(--red)">NCR defect raised on this joint — weld undercut detected. Pending rework.</div>`:''}
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          ${j.status==='active'
            ? (isInspector
                ? `<button class="btn btn-secondary" style="opacity:0.5;cursor:not-allowed" onclick="showToast('QC Inspectors cannot order NDT','warn')">Order NDT</button>`
                : `<button class="btn btn-primary" onclick="closeQCModal();showToast('NDT order raised for ${j.id}','success')">Order NDT</button>`)
            : ''}
          ${j.status==='pending' || j.status==='active'
            ? (isInspector
                ? `<button class="btn btn-secondary" style="opacity:0.5;cursor:not-allowed" onclick="showToast('QC Inspectors cannot assign welders','warn')">Assign Welder</button>`
                : `<button class="btn btn-secondary" onclick="closeQCModal();openAssignWelderModal('${j.id}','${pid}')">Assign Welder</button>`)
            : ''}
          ${j.status==='active'
            ? (isInspector
                ? `<button class="btn btn-secondary" style="opacity:0.5;cursor:not-allowed" onclick="showToast('QC Inspectors cannot submit NDT reports','warn')">Submit NDT</button>`
                : `<button class="btn btn-secondary" onclick="closeQCModal();openSubmitNDTModal('${j.id}','${pid}')">Submit NDT</button>`)
            : ''}
          <button class="btn btn-secondary" onclick="closeQCModal();showToast('Weld traveller opened for ${j.id}','info')">View traveller</button>
          <button class="btn btn-ghost" onclick="closeQCModal()">Close</button>
        </div>
      </div>
    </div>`);
}

function openAssignWelderModal(jid, pid) {
  const j = (QCData.weldJoints[pid]||[]).find(x=>x.id===jid);
  if (!j) return;
  const closeSVG = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  const welderOptions = ['K. Suresh', 'T. Kumar', 'M. Ali', 'A. Smith'].map(w => `<option value="${w}" ${j.welder === w ? 'selected' : ''}>${w}</option>`).join('');

  openQCModal(`
    <div class="qc-modal-inner">
      <div class="qc-modal-header">
        <div>
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);margin-bottom:2px">Weld Map Assignment</div>
          <div style="font-family:var(--font-display);font-size:14px;font-weight:700">Assign Welder — ${j.id}</div>
        </div>
        <button class="btn-icon" onclick="closeQCModal()">${closeSVG}</button>
      </div>
      <div class="qc-modal-body">
        <div class="qc-field"><label>Select Welder</label>
          <select id="weld-assign-welder">
            ${welderOptions}
          </select>
        </div>
        <div class="qc-field"><label>WPS (Weld Procedure Specification)</label>
          <input type="text" id="weld-assign-wps" value="${j.wps || 'WPS-316L-04'}" />
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="submitWelderAssignment('${j.id}','${pid}')">Save Assignment</button>
          <button class="btn btn-secondary" onclick="closeQCModal();openWeldJointDetail('${j.id}','${pid}')">Cancel</button>
        </div>
      </div>
    </div>`);
}

function submitWelderAssignment(jid, pid) {
  const welder = document.getElementById('weld-assign-welder')?.value;
  const wps = document.getElementById('weld-assign-wps')?.value.trim() || 'WPS-316L-04';
  const j = (QCData.weldJoints[pid]||[]).find(x=>x.id===jid);
  if (j) {
    j.welder = welder;
    j.wps = wps;
    if (j.status === 'pending') {
      j.status = 'active';
    }
    showToast(`Welder ${welder} assigned to joint ${jid}`, 'success');
    closeQCModal();
    renderQCWeldMap();
  }
}

function openSubmitNDTModal(jid, pid) {
  const j = (QCData.weldJoints[pid]||[]).find(x=>x.id===jid);
  if (!j) return;
  const closeSVG = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;

  openQCModal(`
    <div class="qc-modal-inner">
      <div class="qc-modal-header">
        <div>
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);margin-bottom:2px">NDT Report Entry</div>
          <div style="font-family:var(--font-display);font-size:14px;font-weight:700">Submit NDT Report — ${j.id}</div>
        </div>
        <button class="btn-icon" onclick="closeQCModal()">${closeSVG}</button>
      </div>
      <div class="qc-modal-body">
        <div class="qc-field"><label>NDT Method</label>
          <select id="ndt-submit-method">
            <option value="RT">RT (Radiographic Testing)</option>
            <option value="UT">UT (Ultrasonic Testing)</option>
            <option value="MT">MT (Magnetic Particle Testing)</option>
            <option value="PT">PT (Dye Penetrant Testing)</option>
          </select>
        </div>
        <div class="qc-field"><label>NDT Result</label>
          <select id="ndt-submit-result">
            <option value="Pass">Pass (Acceptable)</option>
            <option value="Fail">Fail (Reject — Raise NCR)</option>
          </select>
        </div>
        <div class="qc-field"><label>Report Reference</label>
          <input type="text" id="ndt-submit-ref" placeholder="e.g. NDT-RT-2401-44" />
        </div>
        <div class="qc-field"><label>Remarks / Findings</label>
          <textarea id="ndt-submit-remarks" rows="2" placeholder="Describe any indications, slag inclusions, or specify sound metal..."></textarea>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="submitNDTReport('${j.id}','${pid}')">Submit Report</button>
          <button class="btn btn-secondary" onclick="closeQCModal();openWeldJointDetail('${j.id}','${pid}')">Cancel</button>
        </div>
      </div>
    </div>`);
}

function submitNDTReport(jid, pid) {
  const method = document.getElementById('ndt-submit-method')?.value || 'RT';
  const result = document.getElementById('ndt-submit-result')?.value || 'Pass';
  const ref = document.getElementById('ndt-submit-ref')?.value.trim() || 'NDT-REF-001';
  const remarks = document.getElementById('ndt-submit-remarks')?.value.trim() || '';
  
  const j = (QCData.weldJoints[pid]||[]).find(x=>x.id===jid);
  if (j) {
    if (result === 'Pass') {
      j.ndt = `${method}-Pass`;
      j.status = 'done';
      showToast(`NDT report (${method}) passed for ${jid}`, 'success');
      
      if (QCData.mrb && QCData.mrb[pid]) {
        const ndtSection = QCData.mrb[pid].sections.find(s => s.title.toLowerCase().includes('ndt') || s.title.toLowerCase().includes('examination') || s.title.toLowerCase().includes('welding'));
        if (ndtSection) {
          ndtSection.docs.push({
            name: `${method} Report — Joint ${jid} (${ref})`,
            ref: ref,
            date: new Date().toISOString().split('T')[0],
            status: 'approved',
            pages: 2
          });
        }
      }
    } else {
      j.ndt = `${method}-Fail`;
      j.status = 'ncr';
      showToast(`NDT report (${method}) failed for ${jid}. NCR generated.`, 'error');
      
      const ncrId = `NCR-${String(QCData.ncrs.length + 20).padStart(3, '0')}`;
      QCData.ncrs.unshift({
        id: ncrId,
        project: pid,
        severity: 'major',
        status: 'open',
        title: `NDT Defect detected on ${jid} via ${method}`,
        desc: `NDT Report ${ref} indicates defect: ${remarks || 'weld defect detected'}. Joint status: Rejected.`,
        raised: new Date().toISOString().split('T')[0],
        raisedBy: AppState.currentUser?.name || 'QC Inspector',
        area: 'Weld NDT',
        drawing: 'DWG-SH-001-A',
        weldJoint: jid,
        disposition: null,
        workflow: ['raised','review','disposition','closed'],
        currentStep: 0,
        attachments: [],
        comments: [{ by: AppState.currentUser?.name || 'System', time: 'Just now', text: `Auto-generated from NDT failure report on ${jid}.` }]
      });
    }
    closeQCModal();
    renderQCWeldMap();
  }
}

/* ═══════════════════════════════════════════════════════════
   TAB 6 — MRB DOSSIER
═══════════════════════════════════════════════════════════ */
function renderQCMRB() {
  const pid  = QCData.selectedProject;
  const mrb  = QCData.mrb[pid];

  if (!mrb) {
    document.getElementById('qcTabContent').innerHTML = `
      <div class="card"><div class="empty-state"><p>No MRB data for ${pid}</p></div></div>`;
    return;
  }

  const totalDocs    = mrb.sections.reduce((s,sec)=>s+sec.docs.length,0);
  const approvedDocs = mrb.sections.reduce((s,sec)=>s+sec.docs.filter(d=>d.status==='approved').length,0);
  const pendingDocs  = mrb.sections.reduce((s,sec)=>s+sec.docs.filter(d=>d.status==='pending'||d.status==='draft').length,0);
  const openItems    = mrb.sections.reduce((s,sec)=>s+sec.docs.filter(d=>d.status==='open'||d.status==='ncr').length,0);
  const completePct  = totalDocs ? Math.round((approvedDocs/totalDocs)*100) : 0;

  document.getElementById('qcTabContent').innerHTML = `
    <!-- MRB completion banner -->
    <div class="card" style="margin-bottom:16px;background:${completePct===100?'var(--green-bg)':completePct>70?'var(--bg-surface)':'var(--bg-surface)'};border-color:${completePct===100?'rgba(45,212,160,.3)':'var(--border)'}">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <div style="font-family:var(--font-display);font-size:16px;font-weight:700;margin-bottom:4px">Manufacturing Record Book — ${pid}</div>
          <div style="font-size:12px;color:var(--text-secondary)">${approvedDocs} of ${totalDocs} documents approved · ${pendingDocs} pending · ${openItems} open items</div>
        </div>
        <div style="display:flex;align-items:center;gap:16px">
          <div style="text-align:center">
            <div style="font-family:var(--font-display);font-size:28px;font-weight:700;color:${completePct>80?'var(--green)':'var(--amber)'}">${completePct}%</div>
            <div style="font-size:10px;color:var(--text-muted)">MRB complete</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <button class="btn btn-primary btn-sm" onclick="showToast('MRB PDF compiled — ${totalDocs} docs, ${approvedDocs} approved','success')">Export MRB PDF</button>
            <button class="btn btn-secondary btn-sm" onclick="showToast('Sending MRB to client portal…','info')">Send to client</button>
          </div>
        </div>
      </div>
      <div class="progress-bar" style="margin-top:12px;height:6px">
        <div class="progress-fill" style="width:${completePct}%;background:${completePct>80?'var(--green)':'var(--brand)'}"></div>
      </div>
    </div>

    <!-- Document sections -->
    ${mrb.sections.map((sec,si) => {
      const secDone = sec.docs.filter(d=>d.status==='approved').length;
      return `
      <div class="mrb-section">
        <div class="mrb-section-header" onclick="toggleMRBSection(${si})">
          <div class="mrb-section-title">
            <div style="width:28px;height:28px;border-radius:var(--radius-sm);background:${sec.iconBg};color:${sec.iconColor};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;font-family:var(--font-display);flex-shrink:0">${sec.icon}</div>
            ${sec.title}
            <span class="badge badge-muted" style="font-size:10px;margin-left:4px">${secDone}/${sec.docs.length}</span>
          </div>
          <svg id="mrb-arrow-${si}" width="14" height="14" viewBox="0 0 14 14" fill="none" style="transition:transform .2s;flex-shrink:0"><path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        </div>
        <div class="mrb-section-body" id="mrb-body-${si}">
          ${sec.docs.map(doc => {
            const stMap = { approved:['badge-green','Approved'], pending:['badge-amber','Pending'], draft:['badge-muted','Draft'], open:['badge-red','Open'], ncr:['badge-red','NCR'], closed:['badge-green','Closed'] };
            const [badgeCls,badgeLbl] = stMap[doc.status]||['badge-muted',doc.status];
            return `
            <div class="mrb-doc-row" onclick="showToast('Opening ${doc.ref}…','info')">
              <div class="mrb-doc-icon" style="background:${sec.iconBg};color:${sec.iconColor};font-size:9px">${sec.icon}</div>
              <div class="mrb-doc-name">${doc.name}</div>
              <div class="mrb-doc-meta">${doc.ref}${doc.pages?` · ${doc.pages}p`:''}</div>
              <div class="mrb-doc-meta">${doc.date||'—'}</div>
              <div class="mrb-doc-status"><span class="badge ${badgeCls}" style="font-size:10px">${badgeLbl}</span></div>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 9h8M6 2v5M3.5 5l2.5 2.5L9 5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    }).join('')}`;
}

function toggleMRBSection(i) {
  const body  = document.getElementById('mrb-body-' + i);
  const arrow = document.getElementById('mrb-arrow-' + i);
  if (!body) return;
  const open = body.style.display !== 'none' && body.style.display !== '';
  body.style.display  = open ? 'none' : 'block';
  if (arrow) arrow.style.transform = open ? 'rotate(-90deg)' : 'rotate(0deg)';
}

/* ═══════════════════════════════════════════════════════════
   TAB 7 — SUPPLIER QUALITY
═══════════════════════════════════════════════════════════ */
function renderQCSuppliers() {
  const avgScore = Math.round(QCData.suppliers.reduce((s,sup)=>s+sup.score,0)/QCData.suppliers.length);

  document.getElementById('qcTabContent').innerHTML = `
    <div class="metric-grid" style="margin-bottom:20px">
      ${[
        { label:'Suppliers tracked', value:QCData.suppliers.length, color:'var(--text-primary)' },
        { label:'Avg quality score',  value:avgScore+'%', color:avgScore>85?'var(--green)':'var(--amber)' },
        { label:'High performers (≥90)', value:QCData.suppliers.filter(s=>s.score>=90).length, color:'var(--green)' },
        { label:'At-risk (< 80)',    value:QCData.suppliers.filter(s=>s.score<80).length, color:'var(--red)' },
      ].map(k=>`<div class="metric-card"><div class="metric-label">${k.label}</div><div class="metric-value" style="font-size:26px;color:${k.color}">${k.value}</div></div>`).join('')}
    </div>

    <div class="supplier-grid">
      ${QCData.suppliers.map(sup => {
        const scoreColor = sup.score>=90?'var(--green)':sup.score>=80?'var(--amber)':'var(--red)';
        const trendIcon  = { up:'↑', down:'↓', stable:'→' }[sup.trend]||'→';
        const trendColor = { up:'var(--green)', down:'var(--red)', stable:'var(--text-muted)' }[sup.trend];
        const stars      = Math.round(sup.score/20);
        return `
        <div class="supplier-card" onclick="showToast('Opening supplier profile: ${sup.name}','info')">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
            <div>
              <div class="supplier-name">${sup.name}</div>
              <div class="supplier-cat">${sup.category}</div>
            </div>
            <span style="font-size:13px;color:${trendColor};font-weight:700">${trendIcon}</span>
          </div>
          <div class="supplier-score-row">
            <span class="supplier-score-label">Quality score</span>
            <span class="supplier-score-num" style="color:${scoreColor}">${sup.score}%</span>
          </div>
          <div class="progress-bar" style="height:5px;margin-bottom:10px">
            <div class="progress-fill" style="width:${sup.score}%;background:${scoreColor}"></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px;color:var(--text-muted)">
            <div>On-time delivery<br><strong style="color:var(--text-primary);font-size:12px">${sup.onTime}%</strong></div>
            <div>NCR rate<br><strong style="color:${sup.ncrRate>3?'var(--red)':'var(--text-primary)'};font-size:12px">${sup.ncrRate}%</strong></div>
            <div>Orders (YTD)<br><strong style="color:var(--text-primary);font-size:12px">${sup.orders}</strong></div>
            <div>Rating<br>
              <div class="supplier-stars">
                ${Array.from({length:5},(_,i)=>`<span class="supplier-star" style="color:${i<stars?'var(--amber)':'var(--border-strong)'};font-size:13px">★</span>`).join('')}
              </div>
            </div>
          </div>
          ${sup.score<80?`<div style="margin-top:10px;padding:7px 9px;background:var(--red-bg);border:1px solid rgba(245,101,101,.2);border-radius:var(--radius-sm);font-size:11px;color:var(--red)">
            At-risk supplier — escalation review recommended
          </div>`:''}
        </div>`;
      }).join('')}
    </div>`;
}
