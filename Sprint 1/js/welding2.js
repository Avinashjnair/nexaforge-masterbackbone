/* ============================================================
   NexaForge ERP — Welding Tab Renderers (part 2)
   ============================================================ */

/* ═══════════════════════════════════════════════════════════
   TAB 1 — OVERVIEW
═══════════════════════════════════════════════════════════ */
function renderWldOverview() {
  const pid    = WeldData.selectedProject;
  const joints = WeldData.joints[pid] || [];
  const done   = joints.filter(j=>j.status==='complete').length;
  const active = joints.filter(j=>j.status==='in-progress').length;
  const ncr    = joints.filter(j=>j.status==='ncr').length;
  const blk    = joints.filter(j=>j.status==='blocked').length;

  const expiredWPQ  = WeldData.wpq.reduce((s,w)=>s+w.qualifications.filter(q=>q.status==='expired').length,0);
  const expiringWPQ = WeldData.wpq.reduce((s,w)=>s+w.qualifications.filter(q=>q.status==='expiring').length,0);
  const faultM = WeldData.machines.filter(m=>m.status==='fault').length;
  const activeM= WeldData.machines.filter(m=>m.status==='active').length;

  document.getElementById('wldTabContent').innerHTML = `
    <div class="metric-grid" style="margin-bottom:20px">
      ${[
        { label:'Weld joints — project',   value:`${done}/${joints.length}`,     color:'var(--green)' },
        { label:'In progress',              value:active,                          color:'var(--brand)' },
        { label:'NCR joints',               value:ncr,  color:ncr>0?'var(--red)':'var(--text-muted)' },
        { label:'Blocked',                  value:blk,  color:blk>0?'var(--amber)':'var(--text-muted)' },
        { label:'WPQ expired',              value:expiredWPQ,  color:expiredWPQ>0?'var(--red)':'var(--text-muted)' },
        { label:'Machines active',          value:activeM, color:faultM>0?'var(--amber)':'var(--green)' },
      ].map(k=>`<div class="metric-card"><div class="metric-label">${k.label}</div><div class="metric-value" style="font-size:26px;color:${k.color}">${k.value}</div></div>`).join('')}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
      <!-- Joint status breakdown -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Weld joint status — ${pid}</span>
          <button class="btn btn-ghost btn-sm" onclick="switchWldTab('joints')">Register →</button>
        </div>
        ${[
          ['Complete',   joints.filter(j=>j.status==='complete').length,    'var(--green)'],
          ['In progress',joints.filter(j=>j.status==='in-progress').length, 'var(--brand)'],
          ['Pending',    joints.filter(j=>j.status==='pending').length,     'var(--text-muted)'],
          ['NCR raised', joints.filter(j=>j.status==='ncr').length,         'var(--red)'],
          ['Blocked',    joints.filter(j=>j.status==='blocked').length,     'var(--amber)'],
        ].map(([label, count, color]) => {
          const pct = joints.length ? Math.round(count/joints.length*100) : 0;
          return `
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
            <span style="min-width:88px;font-size:12px;color:var(--text-primary)">${label}</span>
            <div class="progress-bar" style="flex:1;height:7px">
              <div class="progress-fill" style="width:${pct}%;background:${color}"></div>
            </div>
            <span style="font-size:12px;font-weight:600;color:${color};min-width:24px">${count}</span>
          </div>`;
        }).join('')}
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border);font-size:11px;color:var(--text-muted)">
          NDE acceptance rate: <strong style="color:var(--green)">${joints.length?Math.round(joints.filter(j=>j.result==='Accept').length/Math.max(1,joints.filter(j=>j.result!=='—'&&j.result!=='Pending').length)*100):0}%</strong>
        </div>
      </div>

      <!-- WPQ alert summary -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Welder qualification status</span>
          <button class="btn btn-ghost btn-sm" onclick="switchWldTab('wpq')">Passports →</button>
        </div>
        ${WeldData.wpq.map(w => {
          const expired  = w.qualifications.filter(q=>q.status==='expired').length;
          const expiring = w.qualifications.filter(q=>q.status==='expiring').length;
          const valid    = w.qualifications.filter(q=>q.status==='valid').length;
          const alertC   = expired > 0 ? 'var(--red)' : expiring > 0 ? 'var(--amber)' : 'var(--green)';
          return `
          <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)" onclick="switchWldTab('wpq')" style="cursor:pointer">
            <div class="passport-avatar" style="width:32px;height:32px;font-size:10px;background:${w.avatarBg}22;color:${w.avatarColor};border:1px solid ${w.avatarBg}44">${w.welderName.split(' ').map(x=>x[0]).join('')}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:12px;font-weight:500;color:var(--text-primary)">${w.welderName}</div>
              <div style="font-size:10px;color:var(--text-muted)">Stamp: <span style="font-family:var(--font-mono)">${w.stampNo}</span></div>
            </div>
            <div style="display:flex;gap:4px;align-items:center">
              <span style="font-size:10px;color:var(--green)">${valid}✓</span>
              ${expiring?`<span style="font-size:10px;color:var(--amber)">${expiring}⚠</span>`:''}
              ${expired ?`<span style="font-size:10px;color:var(--red)">${expired}✕</span>`:''}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <!-- IIoT live machines strip -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">Machine status — live</span>
        <button class="btn btn-ghost btn-sm" onclick="switchWldTab('iot')">IIoT dashboard →</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">
        ${WeldData.machines.map(m => {
          const stColor = {active:'var(--green)',idle:'var(--text-muted)',fault:'var(--red)'}[m.status];
          return `
          <div style="padding:10px 12px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-md);border-left:3px solid ${stColor};cursor:pointer" onclick="switchWldTab('iot')">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
              <span style="font-size:12px;font-weight:500;color:var(--text-primary)">${m.name.split('—')[0].trim()}</span>
              <span class="badge ${m.status==='active'?'badge-green':m.status==='fault'?'badge-red':'badge-muted'}" style="font-size:9px">${m.status}</span>
            </div>
            ${m.status==='active' ? `
              <div style="font-size:11px;color:var(--text-muted)">${m.operator} · <span style="font-family:var(--font-mono);color:var(--brand)">${m.wps}</span></div>
              <div style="display:flex;gap:10px;margin-top:5px;font-size:11px">
                <span style="color:var(--text-secondary)">${m.current}A</span>
                <span style="color:var(--text-secondary)">${m.voltage}V</span>
                <span style="color:${m.heatInput>2?'var(--amber)':'var(--green)'}">${m.heatInput} kJ/mm</span>
              </div>` :
              m.status==='fault' ? `<div style="font-size:10px;color:var(--red);margin-top:4px">⚠ ${m.alert.split(':')[1]?.trim()||m.alert}</div>` :
              `<div style="font-size:11px;color:var(--text-muted);margin-top:4px">Available</div>`}
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   TAB 2 — WPS LIBRARY
═══════════════════════════════════════════════════════════ */
function renderWldWPS() {
  document.getElementById('wldTabContent').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${['All','GTAW','SMAW','GMAW'].map(p=>`<button class="btn btn-secondary btn-sm" style="font-size:11px" onclick="filterWPS('${p}')">${p}</button>`).join('')}
      </div>
      ${(typeof weldCanEdit!=='function'||weldCanEdit('wps')) ? `<button class="btn btn-primary btn-sm" onclick="openNewWPSModal()">
        <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        New WPS
      </button>` : `<span class="badge badge-muted" style="font-size:10px">View only</span>`}
    </div>
    <div class="wps-grid" id="wpsGrid"></div>`;
  renderWPSCards(WeldData.wps);
}

function filterWPS(process) {
  const filtered = process === 'All' ? WeldData.wps : WeldData.wps.filter(w => w.process.includes(process));
  renderWPSCards(filtered);
}

function renderWPSCards(list) {
  document.getElementById('wpsGrid').innerHTML = list.map(w => `
    <div class="wps-card" style="--wps-color:${w.color}" onclick="openWPSDetail('${w.ref}')">
      <div class="wps-header">
        <div>
          <div class="wps-ref">${w.ref} Rev.${w.rev}</div>
          <div class="wps-title">${w.title}</div>
        </div>
        <span class="badge ${w.status==='approved'?'badge-green':w.status==='draft'?'badge-amber':'badge-muted'}" style="font-size:10px;flex-shrink:0">${w.status}</span>
      </div>
      <div class="wps-params">
        ${[
          ['Process',    w.process],
          ['Standard',   w.standard],
          ['Material',   w.material],
          ['Thickness',  w.thickness],
          ['Position',   w.position],
          ['Filler',     w.fillerMetal.split('(')[0].trim()],
          ['Amperage',   w.amperage],
          ['Heat input', w.heatInput],
        ].map(([l,v])=>`
          <div class="wps-param">
            <div class="wps-param-label">${l}</div>
            <div class="wps-param-value">${v}</div>
          </div>`).join('')}
      </div>
      <div class="wps-footer">
        <span>Approved: ${w.approved||'Pending'}</span>
        <span>Projects: ${w.projects.length ? w.projects.join(', ') : 'None assigned'}</span>
        <span>PQR: <span style="font-family:var(--font-mono);color:var(--brand)">${w.linkedPQR}</span></span>
      </div>
    </div>`).join('');
}

/* ═══════════════════════════════════════════════════════════
   TAB 3 — PQR RECORDS
═══════════════════════════════════════════════════════════ */
function renderWldPQR() {
  document.getElementById('wldTabContent').innerHTML = `
    <div class="card">
      <div class="card-header">
        <span class="card-title">Procedure Qualification Records</span>
        ${(typeof weldCanEdit!=='function'||weldCanEdit('pqr')) ? `<button class="btn btn-primary btn-sm" onclick="showToast('Creating new PQR record','info')">New PQR</button>` : `<span class="badge badge-muted" style="font-size:10px">View only</span>`}
      </div>
      <div style="overflow-x:auto">
        <table class="weld-table" style="min-width:700px">
          <thead>
            <tr>
              <th>PQR ref</th>
              <th>Linked WPS</th>
              <th>Process</th>
              <th>Material</th>
              <th>Test date</th>
              <th>Lab</th>
              <th>Tensile</th>
              <th>Bend</th>
              <th>Hardness</th>
              <th>Radiography</th>
              <th>Status</th>
              <th>Valid until</th>
            </tr>
          </thead>
          <tbody>
            ${WeldData.pqr.map(p => `
              <tr onclick="openPQRDetail('${p.ref}')">
                <td class="mono">${p.ref}</td>
                <td class="mono" style="color:var(--brand)">${p.linkedWPS}</td>
                <td>${p.process}</td>
                <td>${p.material}</td>
                <td style="font-size:12px;color:var(--text-secondary)">${p.date||'—'}</td>
                <td style="font-size:11px;color:var(--text-muted)">${p.lab}</td>
                <td>
                  <span class="badge ${p.tensileResult.includes('Pass')?'badge-green':p.tensileResult==='—'?'badge-muted':'badge-red'}" style="font-size:10px">
                    ${p.tensileResult.includes('Pass')?'Pass':p.tensileResult==='—'?'—':'Fail'}
                  </span>
                </td>
                <td>
                  <span class="badge ${p.bendResult.includes('Pass')?'badge-green':p.bendResult==='—'?'badge-muted':'badge-red'}" style="font-size:10px">
                    ${p.bendResult.includes('Pass')?'Pass':p.bendResult==='—'?'—':'Fail'}
                  </span>
                </td>
                <td>
                  <span class="badge ${p.hardnessResult.includes('Pass')?'badge-green':p.hardnessResult==='—'?'badge-muted':'badge-red'}" style="font-size:10px">
                    ${p.hardnessResult.includes('Pass')?'Pass':p.hardnessResult==='—'?'—':'Fail'}
                  </span>
                </td>
                <td>
                  <span class="badge ${p.radiographyResult.includes('Pass')?'badge-green':p.radiographyResult==='—'?'badge-muted':'badge-red'}" style="font-size:10px">
                    ${p.radiographyResult.includes('Pass')?'Pass':p.radiographyResult==='—'?'—':'Fail'}
                  </span>
                </td>
                <td><span class="badge ${p.status==='approved'?'badge-green':p.status==='pending'?'badge-amber':'badge-muted'}" style="font-size:10px">${p.status}</span></td>
                <td style="font-size:12px;color:var(--text-secondary)">${p.validUntil||'—'}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   TAB 4 — WPQ PASSPORTS
═══════════════════════════════════════════════════════════ */
function renderWldWPQ() {
  const expiredTotal  = WeldData.wpq.reduce((s,w)=>s+w.qualifications.filter(q=>q.status==='expired').length,0);
  const expiringTotal = WeldData.wpq.reduce((s,w)=>s+w.qualifications.filter(q=>q.status==='expiring').length,0);

  document.getElementById('wldTabContent').innerHTML = `
    ${expiredTotal ? `
      <div style="padding:10px 14px;background:var(--red-bg);border:1px solid rgba(245,101,101,.25);border-radius:var(--radius-md);margin-bottom:14px;font-size:12px;color:var(--red);display:flex;align-items:center;gap:8px">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2L13 12H1L7 2z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M7 6v2.5M7 10v.3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
        <strong>${expiredTotal} WPQ${expiredTotal>1?'s':''} expired</strong> — Affected welders cannot perform certified welding until renewed under ASME IX.
      </div>` : ''}
    ${expiringTotal ? `
      <div style="padding:10px 14px;background:var(--amber-bg);border:1px solid rgba(245,158,11,.2);border-radius:var(--radius-md);margin-bottom:14px;font-size:12px;color:var(--amber);display:flex;align-items:center;gap:8px">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/><path d="M7 4v4M7 10v.3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
        <strong>${expiringTotal} WPQ${expiringTotal>1?'s':''} expiring within 90 days</strong> — Schedule continuity tests or renewal welding immediately.
      </div>` : ''}

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px">
      ${WeldData.wpq.map(w => {
        const expired  = w.qualifications.filter(q=>q.status==='expired');
        const expiring = w.qualifications.filter(q=>q.status==='expiring');
        return `
        <div class="welder-passport" onclick="openWPQDetail('${w.welderId}')">
          <div class="passport-header">
            <div class="passport-avatar" style="background:${w.avatarBg}22;color:${w.avatarColor};border:1px solid ${w.avatarBg}44">${w.welderName.split(' ').map(x=>x[0]).join('')}</div>
            <div style="flex:1">
              <div class="passport-name">${w.welderName}</div>
              <div class="passport-id">Stamp No: ${w.stampNo}</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
              ${expired.length  ? `<span class="badge badge-red"   style="font-size:10px">${expired.length} expired</span>`  : ''}
              ${expiring.length ? `<span class="badge badge-amber" style="font-size:10px">${expiring.length} expiring</span>` : ''}
              ${!expired.length && !expiring.length ? `<span class="badge badge-green" style="font-size:10px">All valid</span>` : ''}
            </div>
          </div>
          <div class="passport-body">
            <div class="passport-quals">
              ${w.qualifications.map(q => {
                const days = wldDaysLeft(q.expiry);
                const dc = wpqStatusColor(q.status);
                const contPct = Math.min(100, Math.round(q.continuityMonths / 24 * 100));
                return `
                <div class="qual-row">
                  <span class="qual-process">${q.process}</span>
                  <div style="flex:1;min-width:0">
                    <div class="qual-desc">${q.material} · ${q.thickness} · ${q.position}</div>
                    <div class="continuity-bar" style="margin-top:3px">
                      <div class="continuity-fill" style="width:${contPct}%;background:${contPct>50?'var(--green)':'var(--amber)'}"></div>
                    </div>
                    <div style="font-size:9px;color:var(--text-muted);margin-top:1px">Continuity: ${q.continuityMonths}mo</div>
                  </div>
                  <span class="qual-expiry">${q.expiry}</span>
                  <span class="qual-days" style="color:${dc}">${q.status==='expired'?'EXPIRED':days+'d'}</span>
                </div>`;
              }).join('')}
            </div>
          </div>
          <div class="passport-footer">
            <span style="font-size:11px;color:var(--text-muted)">${w.qualifications.length} quals</span>
            <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();showToast('WPQ dossier for ${w.welderName} exported','success')">Export WPQ</button>
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   TAB 5 — WELD REGISTER
═══════════════════════════════════════════════════════════ */
function renderWldJoints() {
  const pid    = WeldData.selectedProject;
  const joints = WeldData.joints[pid] || [];
  const done   = joints.filter(j=>j.status==='complete').length;

  const methodIcon = { RT:'📡', UT:'🔊', VT:'👁', 'VT+PT':'👁+', 'RT+UT':'📡+' };

  document.getElementById('wldTabContent').innerHTML = `
    <div class="metric-grid" style="margin-bottom:20px">
      ${[
        { label:'Total joints', value:joints.length,                                 color:'var(--text-primary)' },
        { label:'Complete',     value:done,                                           color:'var(--green)' },
        { label:'In progress',  value:joints.filter(j=>j.status==='in-progress').length, color:'var(--brand)' },
        { label:'NCR / blocked',value:joints.filter(j=>['ncr','blocked'].includes(j.status)).length, color:'var(--red)' },
      ].map(k=>`<div class="metric-card"><div class="metric-label">${k.label}</div><div class="metric-value" style="font-size:26px;color:${k.color}">${k.value}</div></div>`).join('')}
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">Weld joint register — ${pid}</span>
        <div style="display:flex;gap:8px">
          ${(typeof weldCanEdit!=='function'||weldCanEdit('joints')) ? `<button class="btn btn-secondary btn-sm" onclick="openNewJointModal()">Add joint</button>` : ''}
          <button class="btn btn-ghost btn-sm" onclick="showToast('Weld register exported','success')">Export</button>
        </div>
      </div>
      <div style="overflow-x:auto">
        <table class="weld-table" style="min-width:700px">
          <thead>
            <tr>
              <th>Joint ID</th>
              <th>Type</th>
              <th>Description</th>
              <th>WPS</th>
              <th>Welder stamp</th>
              <th>NDE method</th>
              <th>Status</th>
              <th>NDE result</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${joints.map(j => `
              <tr onclick="openJointDetail('${j.id}','${pid}')">
                <td class="mono" style="color:var(--brand)">${j.id}</td>
                <td style="font-size:12px">${j.type}</td>
                <td style="font-size:12px;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${j.desc}</td>
                <td class="mono" style="color:var(--text-secondary)">${j.wps}</td>
                <td class="mono">${j.welder||'<span style="color:var(--text-muted)">Unassigned</span>'}</td>
                <td>
                  <span style="font-size:11px;font-family:var(--font-mono)">${methodIcon[j.nde]||''} ${j.nde}</span>
                </td>
                <td>${jointStatusBadge(j.status)}</td>
                <td>
                  <span class="badge ${j.result==='Accept'?'badge-green':j.result==='Reject'?'badge-red':'badge-muted'}" style="font-size:10px">${j.result}</span>
                </td>
                <td style="font-size:12px;color:var(--text-muted)">${j.date||'—'}</td>
                <td>
                  <button class="btn-icon" onclick="event.stopPropagation();openJointDetail('${j.id}','${pid}')">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.1"/><path d="M6 4v4M6 3.2v.2" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>
                  </button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   TAB 6 — IIoT LIVE
═══════════════════════════════════════════════════════════ */
function renderWldIoT() {
  const paramColors = {
    amperage:     '#4a9eff',
    voltage:      '#f59e0b',
    heatInput:    '#e8622a',
    gasFlow:      '#2dd4a0',
    interpassTemp:'#7F77DD',
  };

  document.getElementById('wldTabContent').innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-muted)">
        <span class="status-dot" style="background:var(--green);box-shadow:0 0 6px var(--green)"></span>
        IIoT telemetry — live feed · polling every 5s
      </div>
      <button class="btn btn-secondary btn-sm" onclick="showToast('IIoT data refreshed','info')">
        <svg viewBox="0 0 15 15" fill="none"><path d="M13 7.5A5.5 5.5 0 112.5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M2 2v3h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Refresh
      </button>
      <button class="btn btn-ghost btn-sm" onclick="showToast('Heat input log exported','success')">Export heat log</button>
    </div>

    <!-- Fault alert -->
    ${WeldData.machines.filter(m=>m.alert&&m.status!=='active').map(m=>`
      <div style="padding:10px 14px;background:var(--red-bg);border:1px solid rgba(245,101,101,.25);border-radius:var(--radius-md);margin-bottom:12px;font-size:12px;color:var(--red);display:flex;align-items:center;gap:8px">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2L13 12H1L7 2z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M7 6v2.5M7 10v.3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
        <strong>${m.name}:</strong> ${m.alert}
      </div>`).join('')}

    <!-- Active machine alerts -->
    ${WeldData.machines.filter(m=>m.alert&&m.status==='active').map(m=>`
      <div style="padding:10px 14px;background:var(--amber-bg);border:1px solid rgba(245,158,11,.2);border-radius:var(--radius-md);margin-bottom:12px;font-size:12px;color:var(--amber);display:flex;align-items:center;gap:8px">
        ⚠ <strong>${m.name}:</strong> ${m.alert}
      </div>`).join('')}

    <div class="iot-grid">
      ${WeldData.machines.map(m => {
        const stColor = { active:'var(--green)', idle:'var(--text-muted)', fault:'var(--red)' }[m.status];
        const waveHeights = m.status === 'active'
          ? Array.from({length:12}, () => 20 + Math.random() * 80)
          : Array.from({length:12}, () => 5);
        return `
        <div class="iot-machine iot-${m.status}" onclick="openMachineDetail('${m.id}')">
          <div class="iot-status-row">
            <div class="iot-machine-name">${m.name.split('—')[0].trim()}</div>
            <span class="iot-live-dot" style="background:${stColor};box-shadow:0 0 5px ${stColor}"></span>
          </div>
          <div style="font-size:10px;color:var(--text-muted);margin-bottom:6px">${m.name.split('—')[1]?.trim()||'Bay'} · ${m.type}</div>
          ${m.status === 'active' ? `
            <div class="iot-params">
              <div class="iot-param">
                <div class="iot-param-label">Current</div>
                <div class="iot-param-val" style="color:${paramColors.amperage}">${m.current}A</div>
              </div>
              <div class="iot-param">
                <div class="iot-param-label">Voltage</div>
                <div class="iot-param-val" style="color:${paramColors.voltage}">${m.voltage}V</div>
              </div>
              <div class="iot-param">
                <div class="iot-param-label">Heat input</div>
                <div class="iot-param-val" style="color:${m.heatInput>2?'var(--red)':paramColors.heatInput}">${m.heatInput} kJ/mm</div>
              </div>
              <div class="iot-param">
                <div class="iot-param-label">Interpass °C</div>
                <div class="iot-param-val" style="color:${m.interpassTemp>150?'var(--red)':m.interpassTemp>130?'var(--amber)':'var(--text-primary)'}">${m.interpassTemp}°C</div>
              </div>
            </div>
            ${m.gasFlow !== null ? `
            <div class="iot-param" style="margin-top:4px">
              <div class="iot-param-label">Shielding gas</div>
              <div class="iot-param-val" style="color:${paramColors.gasFlow}">${m.gasFlow} L/min</div>
            </div>` : ''}
            <div class="iot-wps-ref">WPS: <span>${m.wps}</span> · Joint: <span>${m.joint}</span></div>
            <div class="iot-wave">
              ${waveHeights.map((h,i) => `<div class="iot-wave-bar" style="background:${paramColors.amperage};height:${h}%;animation-delay:${i*0.07}s"></div>`).join('')}
            </div>` :
          m.status === 'fault' ? `
            <div style="padding:8px;background:var(--red-bg);border-radius:var(--radius-sm);font-size:11px;color:var(--red);margin-top:8px">
              ${m.alert}
            </div>` :
          `<div style="font-size:12px;color:var(--text-muted);margin-top:12px;text-align:center">Machine idle — available for assignment</div>`}
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;font-size:10px;color:var(--text-muted)">
            <span>Arc time: ${m.arcTime}min</span>
            <span class="badge ${m.status==='active'?'badge-green':m.status==='fault'?'badge-red':'badge-muted'}" style="font-size:9px">${m.status}</span>
          </div>
        </div>`;
      }).join('')}
    </div>

    <!-- Heat input compliance -->
    <div class="card" style="margin-top:16px">
      <div class="card-header"><span class="card-title">Heat input compliance — active welds</span></div>
      ${WeldData.machines.filter(m=>m.status==='active').map(m => {
        const wps = WeldData.wps.find(w => w.ref === m.wps);
        if (!wps) return '';
        const [minHI, maxHI] = wps.heatInput.split('–').map(parseFloat);
        const pct = Math.round(((m.heatInput - minHI) / (maxHI - minHI)) * 100);
        const inSpec = m.heatInput >= minHI && m.heatInput <= maxHI;
        return `
        <div style="padding:10px 0;border-bottom:1px solid var(--border)">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:12px">
            <span style="color:var(--text-primary);font-weight:500">${m.name.split('—')[0].trim()} — <span style="font-family:var(--font-mono);color:var(--brand)">${m.wps}</span></span>
            <span style="font-family:var(--font-mono);color:${inSpec?'var(--green)':'var(--red)'}">${m.heatInput} kJ/mm ${inSpec?'✓':'⚠ OUT OF SPEC'}</span>
          </div>
          <div style="position:relative;height:10px;background:var(--bg-elevated);border-radius:99px;overflow:visible">
            <!-- Allowed range band -->
            <div style="position:absolute;left:0;right:0;top:0;bottom:0;background:var(--green-bg);border-radius:99px"></div>
            <!-- Actual value marker -->
            <div style="position:absolute;top:-3px;width:4px;height:16px;background:${inSpec?'var(--green)':'var(--red)'};border-radius:2px;left:${Math.max(0,Math.min(100,pct))}%;transform:translateX(-50%)"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted);margin-top:3px">
            <span>Min: ${minHI} kJ/mm</span>
            <span>Allowed range (${wps.heatInput})</span>
            <span>Max: ${maxHI} kJ/mm</span>
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   TAB 7 — NDE / NDT
═══════════════════════════════════════════════════════════ */
function renderWldNDE() {
  const pid    = WeldData.selectedProject;
  const nde    = WeldData.nde.filter(n => n.project === pid);
  const accept = nde.filter(n=>n.result==='Accept').length;
  const reject = nde.filter(n=>n.result==='Reject').length;
  const pending= nde.filter(n=>n.result==='Pending').length;
  const acceptRate = nde.filter(n=>n.result!=='Pending').length
    ? Math.round(accept / nde.filter(n=>n.result!=='Pending').length * 100) : 0;

  const methodIcon = { RT:'📡', UT:'🔊', VT:'👁', 'VT+PT':'👁', 'RT+UT':'📡' };

  document.getElementById('wldTabContent').innerHTML = `
    <div class="metric-grid" style="margin-bottom:20px">
      ${[
        { label:'NDE records', value:nde.length, color:'var(--text-primary)' },
        { label:'Accepted',    value:accept,     color:'var(--green)' },
        { label:'Rejected',    value:reject,     color:reject>0?'var(--red)':'var(--text-muted)' },
        { label:'Pending',     value:pending,    color:'var(--amber)' },
        { label:'Accept rate', value:acceptRate+'%', color:acceptRate>90?'var(--green)':acceptRate>75?'var(--amber)':'var(--red)' },
      ].map(k=>`<div class="metric-card"><div class="metric-label">${k.label}</div><div class="metric-value" style="font-size:26px;color:${k.color}">${k.value}</div></div>`).join('')}
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">NDE records — ${pid}</span>
        <div style="display:flex;gap:8px">
          ${(typeof weldCanEdit!=='function'||weldCanEdit('nde')) ? `<button class="btn btn-primary btn-sm" onclick="openNewNDEModal()">Log NDE</button>` : ''}
          <button class="btn btn-ghost btn-sm" onclick="showToast('NDE dossier exported','success')">Export</button>
        </div>
      </div>
      ${nde.map(n => `
        <div class="nde-row" onclick="openNDEDetail('${n.id}')">
          <div class="nde-icon" style="background:${n.result==='Accept'?'var(--green-bg)':n.result==='Reject'?'var(--red-bg)':'var(--amber-bg)'}">
            ${methodIcon[n.method]||'📋'}
          </div>
          <div class="nde-body">
            <div class="nde-title">${n.method} — Joint <span style="font-family:var(--font-mono);color:var(--brand)">${n.joint}</span></div>
            <div class="nde-meta">
              <span>ID: ${n.id}</span>
              <span>${n.technique}</span>
              <span>${n.contractor}</span>
              <span>Operator: ${n.operator}</span>
              ${n.date ? `<span>Date: ${n.date}</span>` : '<span style="color:var(--amber)">Not yet performed</span>'}
              ${n.report ? `<span>Report: <span style="font-family:var(--font-mono);color:var(--brand)">${n.report}</span></span>` : ''}
            </div>
          </div>
          <div class="nde-right">
            ${ndeResultEl(n.result)}
            ${n.result==='Pending' ? `<button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();showToast('Opening NDE order for ${n.joint}','info')">Order NDE</button>` : ''}
            ${n.result==='Reject' ? `<button class="btn btn-primary btn-sm" style="background:var(--red)" onclick="event.stopPropagation();navigate('quality');showToast('Opening NCR for ${n.joint}','warn')">View NCR</button>` : ''}
          </div>
        </div>`).join('')}
    </div>

    <!-- Welder repair-rate dashboard -->
    <div class="card" style="margin-top:16px">
      <div class="card-header">
        <span class="card-title">Welder repair-rate by individual</span>
        <span style="font-size:12px;color:var(--text-muted)">NDE pass / fail per welder — all projects</span>
      </div>
      ${(() => {
        const allJoints = Object.values(WeldData.joints).flat();
        const byWelder = {};
        allJoints.forEach(j => {
          const w = j.welder || 'Unassigned';
          if (!byWelder[w]) byWelder[w] = { pass: 0, fail: 0, pending: 0 };
          if (j.ndeResult === 'Accept')  byWelder[w].pass++;
          else if (j.ndeResult === 'Reject') byWelder[w].fail++;
          else byWelder[w].pending++;
        });
        const rows = Object.entries(byWelder).map(([name, d]) => {
          const total = d.pass + d.fail;
          const repairRate = total ? Math.round(d.fail / total * 100) : 0;
          const rag = repairRate === 0 ? 'var(--green)' : repairRate <= 5 ? 'var(--amber)' : 'var(--red)';
          return { name, ...d, total: total + d.pending, repairRate, rag };
        }).sort((a, b) => b.repairRate - a.repairRate);
        if (!rows.length) return `<div style="padding:24px;text-align:center;color:var(--text-muted)">No NDE records yet — joint data will appear here once loaded.</div>`;
        return `
        <div style="overflow-x:auto">
          <table class="weld-table" style="min-width:520px">
            <thead><tr><th>Welder</th><th style="text-align:center">Accepted</th><th style="text-align:center">Rejected</th><th style="text-align:center">Pending</th><th style="text-align:right">Repair rate</th></tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td style="font-weight:500">${r.name}</td>
                  <td style="text-align:center;color:var(--green)">${r.pass}</td>
                  <td style="text-align:center;color:${r.fail>0?'var(--red)':'var(--text-muted)'}">${r.fail}</td>
                  <td style="text-align:center;color:var(--amber)">${r.pending}</td>
                  <td style="text-align:right">
                    <span style="font-weight:600;color:${r.rag}">${r.repairRate}%</span>
                    ${r.repairRate > 5 ? `<span class="badge badge-red" style="font-size:10px;margin-left:6px">Above threshold</span>` : ''}
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
      })()}
    </div>

    <!-- Consumable traceability -->
    <div class="card" style="margin-top:16px">
      <div class="card-header"><span class="card-title">Consumable heat traceability — ${pid}</span></div>
      <div style="overflow-x:auto">
        <table class="weld-table" style="min-width:560px">
          <thead><tr><th>Lot</th><th>Material / spec</th><th>Brand</th><th>Qty</th><th>Heat no.</th><th>Received</th><th>MTC</th></tr></thead>
          <tbody>
            ${WeldData.consumables.filter(c=>c.project===pid).map(c=>`
              <tr onclick="showToast('Opening MTC for ${c.lot}','info')">
                <td class="mono">${c.lot}</td>
                <td>${c.material}</td>
                <td style="font-size:12px;color:var(--text-secondary)">${c.brand}</td>
                <td class="mono">${c.qty}</td>
                <td class="mono" style="color:var(--brand)">${c.heatNo}</td>
                <td style="font-size:12px;color:var(--text-muted)">${c.received}</td>
                <td><span class="badge ${c.certified?'badge-green':'badge-red'}" style="font-size:10px">${c.certified?'Certified':'Missing'}</span></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   TAB — CONTINUITY MATRIX
═══════════════════════════════════════════════════════════ */
function renderWldContinuity() {
  const el = document.getElementById('wldTabContent');
  const wpsList = WeldData.wps;
  const wpqList = WeldData.wpq;

  if (!wpsList.length || !wpqList.length) {
    el.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted)">WPS and WPQ data not yet loaded. Switch to another tab and return, or check API connection.</div>`;
    return;
  }

  // Build qualification lookup: welderStampNo → Set of WPS refs they're qualified for
  // A welder is qualified for a WPS if they have a non-expired qual with matching process
  const qualMap = {};   // welderStampNo → { wpsRef: status }
  wpqList.forEach(w => {
    qualMap[w.stampNo] = qualMap[w.stampNo] || {};
    w.qualifications.forEach(q => {
      // Match by process prefix (e.g. "GTAW" matches WPS-316L-04 which is GTAW)
      wpsList.forEach(wps => {
        const wpsProcess = (wps.process || '').split(' ')[0].toUpperCase();
        const qualProcess = (q.process || '').split(' ')[0].toUpperCase();
        if (wpsProcess === qualProcess || wps.process.toUpperCase().includes(qualProcess)) {
          // Take worst status if multiple quals match
          const current = qualMap[w.stampNo][wps.ref];
          const priority = { expired: 0, expiring: 1, valid: 2 };
          if (!current || (priority[q.status] || 0) < (priority[current] || 0)) {
            qualMap[w.stampNo][wps.ref] = q.status;
          }
        }
      });
    });
  });

  // Coverage summary per WPS
  const coverageSummary = wpsList.map(wps => {
    const qualified = wpqList.filter(w => qualMap[w.stampNo]?.[wps.ref] === 'valid').length;
    const expiring  = wpqList.filter(w => qualMap[w.stampNo]?.[wps.ref] === 'expiring').length;
    return { ref: wps.ref, qualified, expiring, gap: qualified < 2 };
  });
  const gapWPS = coverageSummary.filter(c => c.gap);

  const cellStyle = (status) => {
    if (!status) return 'background:var(--bg-base);color:var(--text-muted)';
    if (status === 'valid')    return 'background:rgba(16,185,129,0.15);color:var(--green)';
    if (status === 'expiring') return 'background:rgba(245,158,11,0.15);color:var(--amber)';
    return 'background:rgba(239,68,68,0.12);color:var(--red)';
  };
  const cellIcon = (status) => ({ valid: '✓', expiring: '⚠', expired: '✗' }[status] || '—');

  el.innerHTML = `
    ${gapWPS.length ? `
    <div style="padding:10px 14px;background:var(--red-bg);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-md);margin-bottom:14px;font-size:12px;color:var(--red);display:flex;align-items:center;gap:8px">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2L13 12H1L7 2z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M7 6v2.5M7 10v.3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
      <strong>Coverage gap:</strong> ${gapWPS.map(g => g.ref).join(', ')} — fewer than 2 valid welders qualified. Schedule renewals or additional qualifications.
    </div>` : `
    <div style="padding:10px 14px;background:var(--green-bg);border:1px solid rgba(16,185,129,0.2);border-radius:var(--radius-md);margin-bottom:14px;font-size:12px;color:var(--green)">
      All WPS codes have ≥ 2 qualified welders — continuity requirements met.
    </div>`}

    <div class="card">
      <div class="card-header">
        <span class="card-title">Welder × WPS Qualification Matrix</span>
        <div style="display:flex;gap:12px;font-size:11px;color:var(--text-muted)">
          <span style="color:var(--green)">✓ Valid</span>
          <span style="color:var(--amber)">⚠ Expiring &lt;90d</span>
          <span style="color:var(--red)">✗ Expired</span>
          <span>— Not qualified</span>
        </div>
      </div>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead>
            <tr style="background:var(--bg-elevated)">
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid var(--border);white-space:nowrap;min-width:160px">Welder</th>
              ${wpsList.map(wps => `
                <th style="padding:8px 6px;text-align:center;border-bottom:2px solid var(--border);font-size:10px;white-space:nowrap;color:${coverageSummary.find(c=>c.ref===wps.ref)?.gap ? 'var(--red)' : 'var(--text-secondary)'}">
                  ${wps.ref}<br>
                  <span style="font-weight:400;color:var(--text-muted)">${wps.process.split(' ')[0]}</span>
                </th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${wpqList.map((w, idx) => `
              <tr style="border-bottom:1px solid var(--border-subtle)${idx % 2 ? ';background:var(--bg-elevated)18' : ''}">
                <td style="padding:8px 12px;font-weight:500">
                  <span style="font-family:var(--font-mono);font-size:11px;color:var(--brand);margin-right:6px">${w.stampNo}</span>
                  ${w.welderName}
                </td>
                ${wpsList.map(wps => {
                  const status = qualMap[w.stampNo]?.[wps.ref];
                  return `<td style="padding:6px;text-align:center;font-weight:700;font-size:13px;${cellStyle(status)}">${cellIcon(status)}</td>`;
                }).join('')}
              </tr>`).join('')}
          </tbody>
          <tfoot>
            <tr style="background:var(--bg-elevated);font-size:11px;border-top:2px solid var(--border)">
              <td style="padding:8px 12px;color:var(--text-muted);font-weight:600">Qualified count</td>
              ${wpsList.map(wps => {
                const c = coverageSummary.find(s => s.ref === wps.ref);
                return `<td style="padding:8px 6px;text-align:center;font-weight:700;color:${c.gap ? 'var(--red)' : 'var(--green)'}">${c.qualified}</td>`;
              }).join('')}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   TAB — PWHT LOGGING
═══════════════════════════════════════════════════════════ */
function renderWldPWHT() {
  const pid   = WeldData.selectedProject;
  const rows  = WeldData.pwht[pid] || [];
  const el    = document.getElementById('wldTabContent');

  const resultBadge = r => ({ pass:'badge-green', fail:'badge-red', pending:'badge-amber' }[r] || 'badge-muted');

  el.innerHTML = `
    <div class="metric-grid" style="margin-bottom:20px">
      ${[
        { label:'PWHT records', value: rows.length,                                 color:'var(--text-primary)' },
        { label:'Pass',         value: rows.filter(r=>r.result==='pass').length,    color:'var(--green)' },
        { label:'Fail',         value: rows.filter(r=>r.result==='fail').length,    color: rows.filter(r=>r.result==='fail').length ? 'var(--red)' : 'var(--text-muted)' },
        { label:'Pending',      value: rows.filter(r=>r.result==='pending').length, color:'var(--amber)' },
      ].map(k=>`<div class="metric-card"><div class="metric-label">${k.label}</div><div class="metric-value" style="font-size:26px;color:${k.color}">${k.value}</div></div>`).join('')}
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">PWHT records — ${pid}</span>
        <button class="btn btn-primary btn-sm" onclick="openPWHTModal()">+ Log PWHT</button>
      </div>
      ${rows.length === 0 ? `
        <div style="padding:40px;text-align:center;color:var(--text-muted);font-size:13px">
          No PWHT records for ${pid}. Click "+ Log PWHT" to add the first record.
        </div>` : `
      <div style="overflow-x:auto">
        <table class="weld-table" style="min-width:720px">
          <thead>
            <tr>
              <th>PWHT No</th>
              <th>Joint</th>
              <th>Furnace</th>
              <th>Hold Temp (°C)</th>
              <th>Hold Time (min)</th>
              <th>Heat Rate (°C/hr)</th>
              <th>Start Time</th>
              <th>Witnessed by</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(r => `
              <tr onclick="openPWHTDetail('${r.id}')">
                <td class="mono" style="color:var(--brand)">${r.pwht_no}</td>
                <td class="mono">${r.joint_no || r.joint_id || '—'}</td>
                <td style="font-size:12px">${r.furnace_id || '—'}</td>
                <td style="font-weight:600">${r.hold_temp_c}°C</td>
                <td>${r.hold_duration_min} min</td>
                <td style="font-size:12px;color:var(--text-secondary)">${r.heat_rate_per_hr ? r.heat_rate_per_hr + ' °C/hr' : '—'}</td>
                <td style="font-size:11px;color:var(--text-muted)">${r.start_time ? r.start_time.slice(0,16).replace('T',' ') : '—'}</td>
                <td style="font-size:12px">${r.witnessed_by || '—'}</td>
                <td><span class="badge ${resultBadge(r.result)}">${r.result.toUpperCase()}</span></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`}
    </div>`;

  window.openPWHTModal = () => {
    openWldModal(`
      <div class="wld-modal-inner">
        <div class="wld-modal-header" style="border-left:4px solid var(--brand)">
          <div class="wld-modal-title">Log PWHT Record</div>
          <div class="wld-modal-sub">${pid}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:20px">
          <div><label style="font-size:11px;color:var(--text-muted)">PWHT No *</label>
            <input id="pwht_no" class="form-control" placeholder="PWHT-${pid}-001" style="margin-top:4px"></div>
          <div><label style="font-size:11px;color:var(--text-muted)">Furnace ID</label>
            <input id="pwht_furnace" class="form-control" placeholder="F-01" style="margin-top:4px"></div>
          <div><label style="font-size:11px;color:var(--text-muted)">Hold Temp °C *</label>
            <input id="pwht_temp" type="number" class="form-control" placeholder="620" style="margin-top:4px"></div>
          <div><label style="font-size:11px;color:var(--text-muted)">Hold Duration (min) *</label>
            <input id="pwht_dur" type="number" class="form-control" placeholder="120" style="margin-top:4px"></div>
          <div><label style="font-size:11px;color:var(--text-muted)">Heat rate (°C/hr)</label>
            <input id="pwht_hrate" type="number" class="form-control" placeholder="150" style="margin-top:4px"></div>
          <div><label style="font-size:11px;color:var(--text-muted)">Cool rate (°C/hr)</label>
            <input id="pwht_crate" type="number" class="form-control" placeholder="150" style="margin-top:4px"></div>
          <div><label style="font-size:11px;color:var(--text-muted)">Witnessed by</label>
            <input id="pwht_witness" class="form-control" placeholder="Name (role)" style="margin-top:4px"></div>
          <div><label style="font-size:11px;color:var(--text-muted)">Result</label>
            <select id="pwht_result" class="form-control" style="margin-top:4px"><option value="pending">Pending</option><option value="pass">Pass</option><option value="fail">Fail</option></select></div>
          <div style="grid-column:1/-1"><label style="font-size:11px;color:var(--text-muted)">Notes</label>
            <textarea id="pwht_notes" class="form-control" rows="2" style="margin-top:4px;resize:vertical"></textarea></div>
        </div>
        <div style="padding:0 20px 20px;display:flex;gap:10px;justify-content:flex-end">
          <button class="btn btn-secondary" onclick="closeWldModal()">Cancel</button>
          <button class="btn btn-primary" onclick="submitPWHTRecord()">Save Record</button>
        </div>
      </div>`);
  };

  window.submitPWHTRecord = async () => {
    const body = {
      pwht_no:          document.getElementById('pwht_no')?.value,
      furnace_id:       document.getElementById('pwht_furnace')?.value,
      hold_temp_c:      parseFloat(document.getElementById('pwht_temp')?.value),
      hold_duration_min:parseInt(document.getElementById('pwht_dur')?.value),
      heat_rate_per_hr: parseFloat(document.getElementById('pwht_hrate')?.value) || null,
      cool_rate_per_hr: parseFloat(document.getElementById('pwht_crate')?.value) || null,
      witnessed_by:     document.getElementById('pwht_witness')?.value,
      result:           document.getElementById('pwht_result')?.value,
      notes:            document.getElementById('pwht_notes')?.value,
    };
    if (!body.pwht_no || !body.hold_temp_c || !body.hold_duration_min) {
      typeof showToast === 'function' && showToast('PWHT No, Hold Temp and Duration are required', 'error');
      return;
    }
    try {
      const result = await WeldingAPI.pwhtCreate(pid, body);
      WeldData.pwht[pid] = [result, ...(WeldData.pwht[pid] || [])];
      closeWldModal();
      renderWldPWHT();
      typeof showToast === 'function' && showToast(`PWHT record ${result.pwht_no} saved`, 'success');
    } catch {
      typeof showToast === 'function' && showToast('Failed to save PWHT record', 'error');
    }
  };

  window.openPWHTDetail = (id) => {
    const r = rows.find(x => x.id === id);
    if (!r) return;
    openWldModal(`
      <div class="wld-modal-inner">
        <div class="wld-modal-header" style="border-left:4px solid var(--brand)">
          <div class="wld-modal-title">${r.pwht_no}</div>
          <div class="wld-modal-sub">${r.result.toUpperCase()} · ${r.hold_temp_c}°C for ${r.hold_duration_min} min</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:20px">
          ${[
            ['Furnace', r.furnace_id || '—'],
            ['Joint', r.joint_no || '—'],
            ['Hold Temp', r.hold_temp_c + ' °C'],
            ['Hold Duration', r.hold_duration_min + ' min'],
            ['Heat Rate', r.heat_rate_per_hr ? r.heat_rate_per_hr + ' °C/hr' : '—'],
            ['Cool Rate', r.cool_rate_per_hr ? r.cool_rate_per_hr + ' °C/hr' : '—'],
            ['Start Time', r.start_time ? r.start_time.slice(0,16).replace('T',' ') : '—'],
            ['End Time',   r.end_time   ? r.end_time.slice(0,16).replace('T',' ')   : '—'],
            ['Witnessed by', r.witnessed_by || '—'],
            ['Result', r.result.toUpperCase()],
          ].map(([l,v]) => `<div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;margin-bottom:2px">${l}</div><div style="font-size:13px;font-weight:500">${v}</div></div>`).join('')}
          ${r.notes ? `<div style="grid-column:1/-1"><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;margin-bottom:2px">Notes</div><div style="font-size:13px">${r.notes}</div></div>` : ''}
        </div>
        <div style="padding:0 20px 20px"><button class="btn btn-secondary btn-sm" onclick="closeWldModal()">Close</button></div>
      </div>`);
  };
}

/* ═══════════════════════════════════════════════════════════
   TAB — CONSUMABLE TRACEABILITY
═══════════════════════════════════════════════════════════ */
function renderWldConsumables() {
  const pid    = WeldData.selectedProject;
  const allCons = WeldData.consumables;
  const projCons = allCons.filter(c => c.project === pid || !c.project);
  const el = document.getElementById('wldTabContent');

  // Batch→joint usage cache (populated on demand)
  const _usageCache = {};

  const certBadge = c => c.mtc_available || c.certified
    ? `<span class="badge badge-green" style="font-size:10px">Certified</span>`
    : `<span class="badge badge-red"   style="font-size:10px">Missing MTC</span>`;

  el.innerHTML = `
    <div class="metric-grid" style="margin-bottom:20px">
      ${[
        { label:'Batches on-project', value: projCons.length,                                      color:'var(--text-primary)' },
        { label:'MTC attached',       value: projCons.filter(c=>c.mtc_available||c.certified).length, color:'var(--green)' },
        { label:'MTC missing',        value: projCons.filter(c=>!c.mtc_available&&!c.certified).length, color: projCons.filter(c=>!c.mtc_available&&!c.certified).length ? 'var(--red)' : 'var(--text-muted)' },
        { label:'Total received',     value: projCons.reduce((s,c)=>s+(parseFloat(c.qty_received)||0),0).toFixed(1) + ' KG', color:'var(--brand)' },
      ].map(k=>`<div class="metric-card"><div class="metric-label">${k.label}</div><div class="metric-value" style="font-size:22px;color:${k.color}">${k.value}</div></div>`).join('')}
    </div>

    <!-- Batch search -->
    <div class="card" style="margin-bottom:16px">
      <div class="card-header">
        <span class="card-title">Batch traceability search</span>
        <span style="font-size:11px;color:var(--text-muted)">Find all joints where a batch was used</span>
      </div>
      <div style="padding:16px;display:flex;gap:10px;align-items:flex-end">
        <div style="flex:1">
          <label style="font-size:11px;color:var(--text-muted);display:block;margin-bottom:4px">Batch / Lot number</label>
          <input id="consumSearchInput" class="form-control" placeholder="e.g. FW-2231" list="consumBatchList"
            style="font-family:var(--font-mono)">
          <datalist id="consumBatchList">
            ${allCons.map(c=>`<option value="${c.batch_no||c.lot}">`).join('')}
          </datalist>
        </div>
        <button class="btn btn-secondary" onclick="consumSearch()">Search</button>
        <button class="btn btn-ghost" onclick="consumSearchClear()">Clear</button>
      </div>
      <div id="consumSearchResult" style="padding:0 16px 16px"></div>
    </div>

    <!-- Batch register -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">Consumable batch register — ${pid}</span>
        <button class="btn btn-primary btn-sm" onclick="openConsumBatchModal()">+ Log Batch</button>
      </div>
      ${projCons.length === 0 ? `
        <div style="padding:40px;text-align:center;color:var(--text-muted)">No consumable batches logged for this project.</div>` : `
      <div style="overflow-x:auto">
        <table class="weld-table" style="min-width:700px">
          <thead><tr>
            <th>Batch / Lot</th><th>Material spec</th><th>Brand</th>
            <th>Heat No.</th><th>Qty received</th><th>Storage</th>
            <th>Received</th><th>MTC</th><th>Joints</th>
          </tr></thead>
          <tbody>
            ${projCons.map(c => `
              <tr onclick="consumShowJoints('${c.id||c.lot}','${c.batch_no||c.lot}')">
                <td class="mono" style="color:var(--brand)">${c.batch_no||c.lot}</td>
                <td style="font-size:12px">${c.material_spec||c.material}</td>
                <td style="font-size:12px;color:var(--text-secondary)">${c.brand||'—'}</td>
                <td class="mono" style="color:var(--brand)">${c.heat_no||c.heatNo||'—'}</td>
                <td class="mono">${c.qty_received||c.qty}</td>
                <td style="font-size:11px;color:var(--text-muted)">${c.storage_location||'—'}</td>
                <td style="font-size:11px;color:var(--text-muted)">${c.received_date||c.received||'—'}</td>
                <td>${certBadge(c)}</td>
                <td style="font-size:11px;color:var(--brand);font-weight:600">
                  ${c.joint_count ? c.joint_count + ' joints' : '<span style="color:var(--text-muted)">0</span>'}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`}
    </div>`;

  window.consumSearch = async () => {
    const q = document.getElementById('consumSearchInput')?.value?.trim();
    const resultEl = document.getElementById('consumSearchResult');
    if (!q) return;
    const batch = allCons.find(c => (c.batch_no||c.lot) === q);
    if (!batch) {
      resultEl.innerHTML = `<div style="color:var(--text-muted);font-size:12px">No batch found with ID "${q}".</div>`;
      return;
    }
    resultEl.innerHTML = `<div style="font-size:12px;color:var(--text-muted)">Loading joint usage...</div>`;
    try {
      const usage = batch.id && batch.id.length > 10
        ? await WeldingAPI.consumableBatchUsage(batch.id)
        : [];
      if (!usage.length) {
        resultEl.innerHTML = `<div style="font-size:12px;color:var(--text-muted);padding:8px 0">Batch <strong>${q}</strong> (${batch.material_spec||batch.material}) — no joint usage recorded yet.</div>`;
        return;
      }
      resultEl.innerHTML = `
        <div style="margin-top:4px;border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden">
          <div style="padding:8px 12px;background:var(--bg-elevated);font-size:12px;font-weight:600">
            Batch <span style="font-family:var(--font-mono);color:var(--brand)">${q}</span> used on ${usage.length} joint(s):
          </div>
          <table class="weld-table">
            <thead><tr><th>Joint No</th><th>Qty used</th><th>Welder</th><th>Date</th></tr></thead>
            <tbody>
              ${usage.map(u=>`<tr>
                <td class="mono" style="color:var(--brand)">${u.joint_no||'—'}</td>
                <td>${u.qty_used||'—'} ${u.qty_unit||''}</td>
                <td>${u.welder_name||'—'}</td>
                <td style="font-size:11px;color:var(--text-muted)">${u.usage_date||'—'}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    } catch {
      resultEl.innerHTML = `<div style="font-size:12px;color:var(--text-muted);padding:8px 0">Usage data unavailable (backend offline — demo mode).</div>`;
    }
  };

  window.consumSearchClear = () => {
    const i = document.getElementById('consumSearchInput');
    const r = document.getElementById('consumSearchResult');
    if (i) i.value = '';
    if (r) r.innerHTML = '';
  };

  window.consumShowJoints = (id, batchNo) => {
    document.getElementById('consumSearchInput').value = batchNo;
    consumSearch();
    document.getElementById('consumSearchInput')?.scrollIntoView({ behavior:'smooth' });
  };

  window.openConsumBatchModal = () => {
    openWldModal(`
      <div class="wld-modal-inner">
        <div class="wld-modal-header" style="border-left:4px solid var(--brand)">
          <div class="wld-modal-title">Log Consumable Batch</div>
          <div class="wld-modal-sub">Project ${pid}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:20px">
          <div><label style="font-size:11px;color:var(--text-muted)">Batch / Lot No *</label>
            <input id="cb_no" class="form-control" style="margin-top:4px;font-family:var(--font-mono)" placeholder="FW-XXXX"></div>
          <div><label style="font-size:11px;color:var(--text-muted)">Material Spec *</label>
            <input id="cb_spec" class="form-control" style="margin-top:4px" placeholder="ER316L 2.4mm"></div>
          <div><label style="font-size:11px;color:var(--text-muted)">Brand</label>
            <input id="cb_brand" class="form-control" style="margin-top:4px" placeholder="Lincoln Electric"></div>
          <div><label style="font-size:11px;color:var(--text-muted)">Heat No.</label>
            <input id="cb_heat" class="form-control" style="margin-top:4px;font-family:var(--font-mono)"></div>
          <div><label style="font-size:11px;color:var(--text-muted)">Qty received</label>
            <input id="cb_qty" type="number" class="form-control" style="margin-top:4px" placeholder="45"></div>
          <div><label style="font-size:11px;color:var(--text-muted)">Unit</label>
            <select id="cb_unit" class="form-control" style="margin-top:4px"><option>KG</option><option>PKT</option><option>ROLL</option></select></div>
          <div><label style="font-size:11px;color:var(--text-muted)">Received date</label>
            <input id="cb_date" type="date" class="form-control" style="margin-top:4px"></div>
          <div><label style="font-size:11px;color:var(--text-muted)">Storage location</label>
            <input id="cb_store" class="form-control" style="margin-top:4px" placeholder="Cold Store A"></div>
          <div style="display:flex;align-items:center;gap:8px;padding-top:20px">
            <input type="checkbox" id="cb_mtc">
            <label for="cb_mtc" style="font-size:12px">MTC available</label>
          </div>
        </div>
        <div style="padding:0 20px 20px;display:flex;gap:10px;justify-content:flex-end">
          <button class="btn btn-secondary" onclick="closeWldModal()">Cancel</button>
          <button class="btn btn-primary" onclick="submitConsumBatch()">Save</button>
        </div>
      </div>`);
  };

  window.submitConsumBatch = async () => {
    const body = {
      project_id:    pid,
      batch_no:      document.getElementById('cb_no')?.value,
      material_spec: document.getElementById('cb_spec')?.value,
      brand:         document.getElementById('cb_brand')?.value,
      heat_no:       document.getElementById('cb_heat')?.value,
      qty_received:  parseFloat(document.getElementById('cb_qty')?.value) || 0,
      qty_unit:      document.getElementById('cb_unit')?.value,
      received_date: document.getElementById('cb_date')?.value,
      storage_location: document.getElementById('cb_store')?.value,
      mtc_available: document.getElementById('cb_mtc')?.checked,
    };
    if (!body.batch_no || !body.material_spec) {
      typeof showToast === 'function' && showToast('Batch No and Material Spec are required', 'error');
      return;
    }
    try {
      const result = await WeldingAPI.consumableBatchCreate(body);
      WeldData.consumables.push({
        id: result.id, lot: result.batch_no, batch_no: result.batch_no,
        material: result.material_spec, material_spec: result.material_spec,
        brand: result.brand, qty: `${result.qty_received}${result.qty_unit}`,
        qty_received: result.qty_received, qty_unit: result.qty_unit,
        received: result.received_date, heat_no: result.heat_no, heatNo: result.heat_no,
        certified: result.mtc_available, mtc_available: result.mtc_available,
        storage_location: result.storage_location, project: pid,
      });
      closeWldModal();
      renderWldConsumables();
      typeof showToast === 'function' && showToast(`Batch ${result.batch_no} logged`, 'success');
    } catch(e) {
      const msg = e?.message?.includes('409') ? 'Batch number already exists' : 'Failed to save batch';
      typeof showToast === 'function' && showToast(msg, 'error');
    }
  };
}

/* ═══════════════════════════════════════════════════════════
   MODALS
═══════════════════════════════════════════════════════════ */
function openWPSDetail(ref) {
  const w = WeldData.wps.find(x=>x.ref===ref);
  if (!w) return;
  openWldModal(`
    <div class="wld-modal-inner">
      <div class="wld-modal-header" style="border-left:4px solid ${w.color}">
        <div>
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--brand);margin-bottom:2px">${w.ref} Rev.${w.rev}</div>
          <div style="font-family:var(--font-display);font-size:16px;font-weight:700">${w.title}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${w.standard} · ${w.material}</div>
        </div>
        <div style="display:flex;gap:8px">
          <span class="badge ${w.status==='approved'?'badge-green':'badge-amber'}" style="font-size:11px">${w.status}</span>
          <button class="btn-icon" onclick="closeWldModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
        </div>
      </div>
      <div class="wld-modal-body">
        <div class="section-label">Process parameters</div>
        <div class="spec-grid">
          ${[
            ['Process',       w.process],
            ['Current type',  w.currentType + ' · ' + w.polarity],
            ['Voltage range', w.voltage],
            ['Amperage',      w.amperage],
            ['Travel speed',  w.travelSpeed],
            ['Heat input',    w.heatInput],
            ['Positions',     w.position],
            ['Thickness',     w.thickness],
            ['Preheat',       w.preheat],
            ['Interpass max', w.interpass],
            ['PWHT',          w.pwht],
            ['Filler metal',  w.fillerMetal],
            ['Shielding gas', w.shieldingGas],
            ['Linked PQR',    w.linkedPQR],
          ].map(([l,v])=>`
            <div class="spec-item">
              <div class="spec-label">${l}</div>
              <div class="spec-value mono">${v}</div>
            </div>`).join('')}
        </div>
        <div style="font-size:12px;color:var(--text-muted)">
          Approved: ${w.approved||'Pending'} · By: ${w.approvedBy} · Projects: ${w.projects.join(', ')||'None'}
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" onclick="closeWldModal();showToast('WPS-${w.ref} PDF exported','success')">Export PDF</button>
          <button class="btn btn-secondary btn-sm" onclick="closeWldModal();switchWldTab('pqr')">View PQR</button>
          <button class="btn btn-ghost btn-sm" onclick="closeWldModal()">Close</button>
        </div>
      </div>
    </div>`);
}

function openWPQDetail(welderId) {
  const w = WeldData.wpq.find(x=>x.welderId===welderId);
  if (!w) return;
  openWldModal(`
    <div class="wld-modal-inner">
      <div class="wld-modal-header">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="passport-avatar" style="width:44px;height:44px;font-size:15px;background:${w.avatarBg}22;color:${w.avatarColor};border:1px solid ${w.avatarBg}44">${w.welderName.split(' ').map(x=>x[0]).join('')}</div>
          <div>
            <div style="font-family:var(--font-display);font-size:16px;font-weight:700">${w.welderName}</div>
            <div style="font-size:12px;color:var(--text-muted)">Stamp: <span style="font-family:var(--font-mono)">${w.stampNo}</span></div>
          </div>
        </div>
        <button class="btn-icon" onclick="closeWldModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="wld-modal-body">
        ${w.qualifications.map(q => {
          const days = wldDaysLeft(q.expiry);
          const dc   = wpqStatusColor(q.status);
          return `
          <div style="padding:12px;background:var(--bg-surface);border:1px solid var(--border);border-left:3px solid ${dc};border-radius:var(--radius-sm)">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
              <div>
                <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--brand)">${q.code}</div>
                <div style="font-size:13px;color:var(--text-primary)">${q.process} · ${q.material}</div>
              </div>
              <div style="text-align:right">
                <span class="badge ${q.status==='valid'?'badge-green':q.status==='expiring'?'badge-amber':'badge-red'}" style="font-size:10px">${q.status}</span>
                <div style="font-size:16px;font-weight:700;color:${dc};margin-top:3px">${q.status==='expired'?'EXPIRED':days+'d'}</div>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;font-size:11px;color:var(--text-muted)">
              <div>Thickness: <strong style="color:var(--text-primary)">${q.thickness}</strong></div>
              <div>Position: <strong style="color:var(--text-primary)">${q.position}</strong></div>
              <div>Continuity: <strong style="color:var(--text-primary)">${q.continuityMonths}mo</strong></div>
              <div>Issued: <strong style="color:var(--text-primary)">${q.issued}</strong></div>
              <div>Expires: <strong style="color:${dc}">${q.expiry}</strong></div>
            </div>
          </div>`;
        }).join('')}
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" onclick="closeWldModal();showToast('WPQ passport for ${w.welderName} exported','success')">Export WPQ PDF</button>
          <button class="btn btn-secondary btn-sm" onclick="closeWldModal();showToast('Renewal training scheduled','info')">Schedule renewal</button>
          <button class="btn btn-ghost btn-sm" onclick="closeWldModal()">Close</button>
        </div>
      </div>
    </div>`);
}

function openJointDetail(id, pid) {
  const j = (WeldData.joints[pid]||[]).find(x=>x.id===id);
  if (!j) return;
  const wps = WeldData.wps.find(w=>w.ref===j.wps);
  openWldModal(`
    <div class="wld-modal-inner">
      <div class="wld-modal-header">
        <div>
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--brand);margin-bottom:2px">${j.id} — ${pid}</div>
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">${j.desc}</div>
        </div>
        <div style="display:flex;gap:8px">
          ${jointStatusBadge(j.status)}
          <button class="btn-icon" onclick="closeWldModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
        </div>
      </div>
      <div class="wld-modal-body">
        <div class="spec-grid">
          ${[
            ['Joint type',    j.type],
            ['WPS ref',       j.wps],
            ['Welder stamp',  j.welder||'Unassigned'],
            ['NDE method',    j.nde],
            ['NDE result',    j.result],
            ['Weld date',     j.date||'—'],
          ].map(([l,v])=>`
            <div class="spec-item">
              <div class="spec-label">${l}</div>
              <div class="spec-value mono">${v}</div>
            </div>`).join('')}
        </div>
        ${wps ? `
          <div style="padding:10px 12px;background:var(--brand-light);border:1px solid var(--brand-light);border-radius:var(--radius-sm);font-size:12px">
            <strong>WPS parameters:</strong> ${wps.amperage} · ${wps.voltage} · ${wps.heatInput} heat input · ${wps.position}
          </div>` : ''}
        ${j.status==='ncr' ? `<div style="padding:10px 12px;background:var(--red-bg);border:1px solid rgba(245,101,101,.2);border-radius:var(--radius-sm);font-size:12px;color:var(--red)">NCR raised on this joint. Repair weld required before re-testing.</div>` : ''}
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${!j.welder ? `<button class="btn btn-primary btn-sm" onclick="closeWldModal();showToast('Assigning welder to ${j.id}','info')">Assign welder</button>` : ''}
          ${j.status==='in-progress' ? `<button class="btn btn-primary btn-sm" onclick="closeWldModal();switchWldTab('nde');showToast('Opening NDE order for ${j.id}','info')">Order NDE</button>` : ''}
          <button class="btn btn-secondary btn-sm" onclick="closeWldModal();showToast('Weld traveller for ${j.id} opened','info')">View traveller</button>
          <button class="btn btn-ghost btn-sm" onclick="closeWldModal()">Close</button>
        </div>
      </div>
    </div>`);
}

function openMachineDetail(id) {
  const m = WeldData.machines.find(x=>x.id===id);
  if (!m) return;
  openWldModal(`
    <div class="wld-modal-inner">
      <div class="wld-modal-header">
        <div>
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--brand);margin-bottom:2px">${m.id} · ${m.type}</div>
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">${m.name}</div>
        </div>
        <div style="display:flex;gap:8px">
          <span class="badge ${m.status==='active'?'badge-green':m.status==='fault'?'badge-red':'badge-muted'}" style="font-size:11px">${m.status}</span>
          <button class="btn-icon" onclick="closeWldModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
        </div>
      </div>
      <div class="wld-modal-body">
        ${m.status === 'active' ? `
          <div class="spec-grid">
            ${[['Current',m.current+'A'],['Voltage',m.voltage+'V'],['Travel speed',m.travelSpeed+'mm/min'],
               ['Heat input',m.heatInput+' kJ/mm'],['Arc time',m.arcTime+'min'],
               ['Interpass',m.interpassTemp+'°C'],['Gas flow',(m.gasFlow||'N/A')+'L/min'],
               ['Operator',m.operator],['Project',m.project],['Joint',m.joint],['WPS',m.wps]
            ].map(([l,v])=>`<div class="spec-item"><div class="spec-label">${l}</div><div class="spec-value mono">${v}</div></div>`).join('')}
          </div>` :
          m.status === 'fault' ? `<div style="padding:12px;background:var(--red-bg);border:1px solid rgba(245,101,101,.2);border-radius:var(--radius-sm);font-size:12px;color:var(--red)">${m.alert}</div>` :
          `<div style="padding:12px;background:var(--bg-elevated);border-radius:var(--radius-sm);font-size:12px;color:var(--text-muted)">Machine is idle and available for assignment.</div>`}
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${m.status==='fault' ? `<button class="btn btn-primary btn-sm" onclick="closeWldModal();showToast('Maintenance order raised for ${m.id}','success')">Raise maintenance order</button>` : ''}
          <button class="btn btn-secondary btn-sm" onclick="closeWldModal();showToast('Heat input log exported','success')">Export heat log</button>
          <button class="btn btn-ghost btn-sm" onclick="closeWldModal()">Close</button>
        </div>
      </div>
    </div>`);
}

function openNewWPSModal() {
  openWldModal(`
    <div class="wld-modal-inner">
      <div class="wld-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">New Welding Procedure Specification</div>
        <button class="btn-icon" onclick="closeWldModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="wld-modal-body">
        <div class="wld-field-row">
          <div class="wld-field"><label>WPS reference</label><input type="text" placeholder="e.g. WPS-316L-08"/></div>
          <div class="wld-field"><label>Revision</label><input type="text" placeholder="A"/></div>
        </div>
        <div class="wld-field"><label>WPS title / description</label><input type="text" placeholder="e.g. GTAW — 316L Stainless Steel, Butt Joint"/></div>
        <div class="wld-field-row">
          <div class="wld-field"><label>Welding process</label>
            <select><option>GTAW (TIG)</option><option>SMAW (MMA)</option><option>GMAW (MIG)</option><option>FCAW</option><option>SAW</option><option>GTAW + SMAW</option></select>
          </div>
          <div class="wld-field"><label>Standard</label>
            <select><option>ASME IX</option><option>AWS D1.1</option><option>AWS D1.6</option><option>EN ISO 15614-1</option></select>
          </div>
        </div>
        <div class="wld-field-3">
          <div class="wld-field"><label>Base material</label><input type="text" placeholder="e.g. 316L SS"/></div>
          <div class="wld-field"><label>Thickness range</label><input type="text" placeholder="e.g. 6–25mm"/></div>
          <div class="wld-field"><label>Position(s)</label><input type="text" placeholder="e.g. 1G, 5G"/></div>
        </div>
        <div class="wld-field-3">
          <div class="wld-field"><label>Amperage range</label><input type="text" placeholder="e.g. 80–140A"/></div>
          <div class="wld-field"><label>Voltage range</label><input type="text" placeholder="e.g. 10–14V"/></div>
          <div class="wld-field"><label>Heat input (kJ/mm)</label><input type="text" placeholder="e.g. 0.5–2.0"/></div>
        </div>
        <div class="wld-field-row">
          <div class="wld-field"><label>Preheat temp</label><input type="text" placeholder="e.g. 15°C min"/></div>
          <div class="wld-field"><label>Interpass max</label><input type="text" placeholder="e.g. 150°C"/></div>
        </div>
        <div class="wld-field"><label>Filler metal / electrode</label><input type="text" placeholder="e.g. ER316L 2.4mm"/></div>
        <div class="wld-field"><label>Shielding gas</label><input type="text" placeholder="e.g. Argon 99.99% · 12–15 L/min"/></div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="closeWldModal();showToast('WPS draft created — pending PQR and approval','info')">Create WPS draft</button>
          <button class="btn btn-ghost" onclick="closeWldModal()">Cancel</button>
        </div>
      </div>
    </div>`);
}

function openPQRDetail(ref) {
  const p = WeldData.pqr.find(x=>x.ref===ref);
  if (!p) return;
  openWldModal(`
    <div class="wld-modal-inner">
      <div class="wld-modal-header">
        <div>
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--brand);margin-bottom:2px">${p.ref}</div>
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Procedure Qualification Record</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${p.process} · ${p.material} · ${p.thickness}</div>
        </div>
        <div style="display:flex;gap:8px">
          <span class="badge ${p.status==='approved'?'badge-green':'badge-amber'}" style="font-size:11px">${p.status}</span>
          <button class="btn-icon" onclick="closeWldModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
        </div>
      </div>
      <div class="wld-modal-body">
        <div class="spec-grid">
          ${[['Test date',p.date||'—'],['Testing lab',p.lab],['Linked WPS',p.linkedWPS],['Valid until',p.validUntil||'—'],
             ['Tensile',p.tensileResult],['Bend',p.bendResult],['Hardness',p.hardnessResult],['Impact',p.impactResult],
             ['Radiography',p.radiographyResult],
          ].map(([l,v])=>`<div class="spec-item"><div class="spec-label">${l}</div><div class="spec-value mono" style="font-size:11px">${v}</div></div>`).join('')}
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" onclick="closeWldModal();showToast('PQR ${p.ref} exported','success')">Export PDF</button>
          <button class="btn btn-ghost btn-sm" onclick="closeWldModal()">Close</button>
        </div>
      </div>
    </div>`);
}

function openNewJointModal() {
  openWldModal(`
    <div class="wld-modal-inner">
      <div class="wld-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Add weld joint</div>
        <button class="btn-icon" onclick="closeWldModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="wld-modal-body">
        <div class="wld-field-row">
          <div class="wld-field"><label>Joint ID</label><input type="text" placeholder="e.g. WJ-12"/></div>
          <div class="wld-field"><label>Joint type</label>
            <select><option>Long seam</option><option>Circ seam</option><option>Nozzle</option><option>Head attach</option><option>Fillet</option></select>
          </div>
        </div>
        <div class="wld-field"><label>Description</label><input type="text" placeholder="e.g. Shell course 5 — longitudinal seam"/></div>
        <div class="wld-field-row">
          <div class="wld-field"><label>Applicable WPS</label>
            <select>${WeldData.wps.filter(w=>w.status==='approved').map(w=>`<option>${w.ref}</option>`).join('')}</select>
          </div>
          <div class="wld-field"><label>NDE method</label>
            <select><option>RT</option><option>UT</option><option>VT</option><option>VT+PT</option><option>RT+UT</option><option>MT</option></select>
          </div>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="closeWldModal();showToast('Weld joint added to register','success')">Add joint</button>
          <button class="btn btn-ghost" onclick="closeWldModal()">Cancel</button>
        </div>
      </div>
    </div>`);
}

function openNewNDEModal() {
  openWldModal(`
    <div class="wld-modal-inner">
      <div class="wld-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Log NDE record</div>
        <button class="btn-icon" onclick="closeWldModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="wld-modal-body">
        <div class="wld-field-row">
          <div class="wld-field"><label>Weld joint</label>
            <select>${(WeldData.joints[WeldData.selectedProject]||[]).map(j=>`<option>${j.id} — ${j.type}</option>`).join('')}</select>
          </div>
          <div class="wld-field"><label>NDE method</label>
            <select><option>RT</option><option>UT</option><option>VT</option><option>VT+PT</option><option>RT+UT</option><option>MT</option></select>
          </div>
        </div>
        <div class="wld-field-row">
          <div class="wld-field"><label>Date performed</label><input type="date"/></div>
          <div class="wld-field"><label>Result</label>
            <select><option>Accept</option><option>Reject</option><option>Pending</option></select>
          </div>
        </div>
        <div class="wld-field-row">
          <div class="wld-field"><label>NDE contractor</label><input type="text" placeholder="e.g. NDT Services UAE"/></div>
          <div class="wld-field"><label>NDE operator</label><input type="text" placeholder="Operator name"/></div>
        </div>
        <div class="wld-field"><label>Report reference</label><input type="text" placeholder="e.g. RT-2401-048"/></div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="closeWldModal();showToast('NDE record logged — ITP updated','success')">Log NDE</button>
          <button class="btn btn-ghost" onclick="closeWldModal()">Cancel</button>
        </div>
      </div>
    </div>`);
}

function openNDEDetail(id) {
  const n = WeldData.nde.find(x=>x.id===id);
  if (!n) return;
  openWldModal(`
    <div class="wld-modal-inner">
      <div class="wld-modal-header">
        <div>
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--brand);margin-bottom:2px">${n.id}</div>
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">${n.method} — Joint ${n.joint}</div>
          <div style="font-size:12px;color:var(--text-muted)">${n.project} · ${n.contractor}</div>
        </div>
        <div style="display:flex;gap:8px">
          ${ndeResultEl(n.result)}
          <button class="btn-icon" onclick="closeWldModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
        </div>
      </div>
      <div class="wld-modal-body">
        <div class="spec-grid">
          ${[['Method',n.method],['Technique',n.technique],['Date',n.date||'Pending'],
             ['Operator',n.operator],['Film density',n.density],['Sensitivity',n.sensitivity],
             ['Report ref',n.report||'—'],['Result',n.result]].map(([l,v])=>`
            <div class="spec-item"><div class="spec-label">${l}</div><div class="spec-value mono" style="font-size:11px">${v}</div></div>`).join('')}
        </div>
        ${n.result==='Reject' ? `<div style="padding:10px 12px;background:var(--red-bg);border:1px solid rgba(245,101,101,.2);border-radius:var(--radius-sm);font-size:12px;color:var(--red)">NDE rejected — weld repair required. NCR must be raised and repair weld re-examined.</div>` : ''}
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${n.report ? `<button class="btn btn-primary btn-sm" onclick="closeWldModal();showToast('NDE report ${n.report} downloaded','success')">Download report</button>` : ''}
          ${n.result==='Reject' ? `<button class="btn btn-primary btn-sm" style="background:var(--red)" onclick="closeWldModal();navigate('quality');showToast('Opening NCR for ${n.joint}','warn')">Raise NCR</button>` : ''}
          <button class="btn btn-ghost btn-sm" onclick="closeWldModal()">Close</button>
        </div>
      </div>
    </div>`);
}
