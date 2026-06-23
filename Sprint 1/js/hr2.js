/* ============================================================
   NexaForge ERP — HR Sub-page Renderers (part 2)
   ============================================================ */

/* ═══════════════════════════════════════════════════════════
   1. HR CONTROL CENTRE ( bespoke bento landing page )
   ═══════════════════════════════════════════════════════════ */
async function renderHRControlCentre() {
  await _loadHRFromAPI();
  const emps = HRData.employees;
  const totalCerts = emps.reduce((s, e) => s + e.certifications.length, 0);
  const expiredCerts = emps.reduce((s, e) => s + e.certifications.filter(c => c.status === 'expired').length, 0);
  const expiringCerts = emps.reduce((s, e) => s + e.certifications.filter(c => c.status === 'expiring').length, 0);
  const avgUtil = Math.round(emps.reduce((s, e) => s + e.utilisation, 0) / emps.length);
  
  // Calculate attendance numbers for snapshot
  const presentCount = HRData.attendance.filter(a => a.date === '2025-05-05' && (a.status === 'present' || a.status === 'late')).length;
  const lateCount = HRData.attendance.filter(a => a.date === '2025-05-05' && a.status === 'late').length;
  const absentCount = HRData.attendance.filter(a => a.date === '2025-05-05' && a.status === 'absent').length;
  const leaveCount = HRData.attendance.filter(a => a.date === '2025-05-05' && (a.status === 'leave' || a.status === 'sick')).length;
  const totalToday = presentCount + absentCount + leaveCount;
  
  const presentPct = totalToday > 0 ? Math.round((presentCount / totalToday) * 100) : 0;
  const leavePct = totalToday > 0 ? Math.round((leaveCount / totalToday) * 100) : 0;
  const absentPct = totalToday > 0 ? Math.round((absentCount / totalToday) * 100) : 0;

  // At risk certs
  const atRisk = emps.filter(e => e.certifications.some(c => c.status !== 'valid'));

  document.getElementById('pageContent').innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">HR Control Centre</div>
        <div class="page-subtitle">Workforce metrics, competency audits, and people operations overview</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" onclick="renderHRControlCentre()">
          <svg viewBox="0 0 15 15" fill="none" style="width:12px;height:12px"><path d="M13 7.5A5.5 5.5 0 112.5 5" stroke="currentColor" stroke-width="1.4"/><path d="M2 2v3h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Refresh
        </button>
        <button class="btn btn-primary btn-sm" onclick="renderHRSubPage('workforce')">
          Manage Workforce
        </button>
      </div>
    </div>

    <!-- KPI Strip -->
    <div class="metric-grid">
      ${kpiCard('Total Headcount', emps.length, 'Active contracts', 'var(--dept-accent)', [8,8,8,8,8,8,8,8])}
      ${kpiCard('On Shop Floor', emps.filter(e => e.dept === 'Production').length, 'Direct personnel', 'var(--blue)', [5,5,5,5,5,5,5,5])}
      ${kpiCard('Avg Utilisation', avgUtil + '%', 'Target: 80%+', avgUtil > 80 ? 'var(--green)' : 'var(--amber)', [72,74,75,76,78,79,80,avgUtil])}
      ${kpiCard('Expired Certs', expiredCerts, 'Requires renewal', expiredCerts > 0 ? 'var(--red)' : 'var(--text-muted)', [0,0,1,1,2,2,1,expiredCerts])}
      ${kpiCard('Expiring (90d)', expiringCerts, 'Scheduled audits', expiringCerts > 0 ? 'var(--amber)' : 'var(--text-muted)', [1,2,2,3,2,1,2,expiringCerts])}
      ${kpiCard('Training Pipeline', HRData.training.filter(t => t.status === 'scheduled').length, 'Active programs', 'var(--accent)', [2,3,4,3,2,4,3,4])}
    </div>

    <!-- Bento Grid -->
    <div class="hr-bento-grid">
      
      <!-- Row 2: Today's Attendance Snapshot -->
      <div class="card hr-bento-col-6">
        <div class="card-header">
          <span class="card-title">Today's Attendance Snapshot</span>
          <button class="btn btn-ghost btn-sm" onclick="renderHRSubPage('attendance')">View log →</button>
        </div>
        <div class="hr-attendance-ring-container">
          <!-- Custom SVG donut representation -->
          <svg width="120" height="120" viewBox="0 0 36 36" style="transform: rotate(-90deg);">
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--bg-card-inner)" stroke-width="3"></circle>
            
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--green)" stroke-width="3"
                    stroke-dasharray="${presentPct} ${100 - presentPct}" stroke-dashoffset="0"></circle>
                    
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--blue)" stroke-width="3"
                    stroke-dasharray="${leavePct} ${100 - leavePct}" stroke-dashoffset="-${presentPct}"></circle>
                    
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--red)" stroke-width="3"
                    stroke-dasharray="${absentPct} ${100 - absentPct}" stroke-dashoffset="-${presentPct + leavePct}"></circle>
            
            <text x="18" y="20.5" font-size="7" font-weight="700" fill="var(--text-primary)" text-anchor="middle" style="transform: rotate(90deg); transform-origin: 18px 18px;">
              ${presentCount}/${totalToday}
            </text>
          </svg>
          <div class="hr-attendance-legend">
            <div class="hr-legend-item">
              <span class="hr-legend-dot" style="background:var(--green)"></span>
              <span>Present/Late: <strong>${presentCount}</strong> (${presentPct}%)</span>
            </div>
            <div class="hr-legend-item">
              <span class="hr-legend-dot" style="background:var(--blue)"></span>
              <span>On Leave: <strong>${leaveCount}</strong> (${leavePct}%)</span>
            </div>
            <div class="hr-legend-item">
              <span class="hr-legend-dot" style="background:var(--red)"></span>
              <span>Absent/Sick: <strong>${absentCount}</strong> (${absentPct}%)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Row 2: Certification Risk Radar -->
      <div class="card hr-bento-col-6">
        <div class="card-header">
          <span class="card-title">Certification Risk Radar</span>
          <button class="btn btn-ghost btn-sm" onclick="renderHRSubPage('certs')">Manage certs →</button>
        </div>
        <div style="max-height: 140px; overflow-y: auto;">
          ${atRisk.length === 0 
            ? `<div class="empty-state" style="padding: 10px"><p>All active welder qualifications are valid.</p></div>`
            : atRisk.slice(0, 3).map(e => {
                const expired = e.certifications.filter(c => c.status === 'expired');
                const expiring = e.certifications.filter(c => c.status === 'expiring');
                return `
                  <div class="hr-alert-card">
                    <div style="display:flex; align-items:center; gap:8px">
                      <div class="emp-avatar" style="width:28px;height:28px;font-size:10px;background:${e.avatarBg}22;color:${e.avatarColor}">${e.initials}</div>
                      <div>
                        <div style="font-size:12px;font-weight:600">${e.name}</div>
                        <div style="font-size:10px;color:var(--text-muted)">
                          ${expired.length ? `<span style="color:var(--red);font-weight:600">${expired.length} expired</span>` : ''}
                          ${expired.length && expiring.length ? ' · ' : ''}
                          ${expiring.length ? `<span style="color:var(--amber);font-weight:600">${expiring.length} expiring</span>` : ''}
                        </div>
                      </div>
                    </div>
                    <button class="btn btn-secondary btn-sm" style="height:26px;font-size:10px" onclick="openEmployeeDetail('${e.id}')">Schedule Renewal</button>
                  </div>
                `;
              }).join('')}
        </div>
      </div>

      <!-- Row 3: Upcoming Training Pipeline -->
      <div class="card hr-bento-col-4">
        <div class="card-header">
          <span class="card-title">Upcoming Training</span>
          <button class="btn btn-ghost btn-sm" onclick="renderHRSubPage('training')">Details →</button>
        </div>
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${HRData.training.filter(t => t.status !== 'completed').slice(0, 3).map(t => `
            <div style="padding:10px; background:var(--bg-card-inner); border-radius:var(--radius-sm); border:1px solid var(--border)">
              <div style="display:flex; justify-content:space-between; margin-bottom:4px">
                <span style="font-size:10px; font-weight:700; color:var(--dept-accent)">${t.type.toUpperCase()}</span>
                <span class="badge ${t.status === 'scheduled' ? 'badge-blue' : 'badge-muted'}" style="font-size:9px">${t.status}</span>
              </div>
              <div style="font-size:12px; font-weight:600; color:var(--text-primary); text-overflow:ellipsis; overflow:hidden; white-space:nowrap">${t.title}</div>
              <div style="font-size:10px; color:var(--text-muted); margin-top:2px">${t.date} · ${t.attendees.length} candidates</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Row 3: Leave Calendar Heatmap -->
      <div class="card hr-bento-col-4">
        <div class="card-header">
          <span class="card-title">Leave Density Radar (May)</span>
          <button class="btn btn-ghost btn-sm" onclick="renderHRSubPage('leave')">Leave Ops →</button>
        </div>
        <div class="hr-leave-heatmap">
          ${Array.from({ length: 31 }, (_, i) => {
            const dayNum = i + 1;
            const dateStr = `2025-05-${dayNum.toString().padStart(2, '0')}`;
            // Count leave requests overlapping this date
            const count = HRData.leaveRequests.filter(r => r.status === 'approved' && dateStr >= r.from && dateStr <= r.to).length;
            const densityClass = count > 2 ? 'density-high' : count > 1 ? 'density-med' : count > 0 ? 'density-low' : '';
            return `<div class="hr-heatmap-day ${densityClass}" title="${count} on leave on May ${dayNum}">${dayNum}</div>`;
          }).join('')}
        </div>
        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px; font-size:9px; color:var(--text-muted)">
          <span>Legend:</span>
          <span style="display:flex; align-items:center; gap:2px"><span style="width:8px; height:8px; background:var(--bg-card-inner); border-radius:2px"></span>0</span>
          <span style="display:flex; align-items:center; gap:2px"><span style="width:8px; height:8px; background:rgba(244,63,94,0.15); border-radius:2px"></span>1</span>
          <span style="display:flex; align-items:center; gap:2px"><span style="width:8px; height:8px; background:rgba(244,63,94,0.35); border-radius:2px"></span>2</span>
          <span style="display:flex; align-items:center; gap:2px"><span style="width:8px; height:8px; background:var(--red-bg); border:1px solid var(--red); border-radius:2px"></span>3+</span>
        </div>
      </div>

      <!-- Row 3: Workforce Distribution -->
      <div class="card hr-bento-col-4">
        <div class="card-header">
          <span class="card-title">Workforce Mix</span>
          <button class="btn btn-ghost btn-sm" onclick="renderHRSubPage('analytics')">Analytics →</button>
        </div>
        <div>
          ${['Production', 'Quality', 'Management', 'Marketing'].map(dept => {
            const count = emps.filter(e => e.dept === dept).length;
            const pct = Math.round((count / emps.length) * 100);
            const deptColors = { Production: 'var(--brand)', Quality: 'var(--amber)', Management: 'var(--blue)', Marketing: 'var(--green)' };
            return `
              <div style="margin-bottom:8px">
                <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:2px">
                  <span style="font-weight:500">${dept}</span>
                  <span style="color:var(--text-muted)">${count} (${pct}%)</span>
                </div>
                <div class="progress-bar" style="height:6px">
                  <div class="progress-fill" style="width:${pct}%; background:${deptColors[dept] || 'var(--text-muted)'}"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Row 4: Recent HR Activities -->
      <div class="card hr-bento-col-12">
        <div class="card-header">
          <span class="card-title">Recent HR & Personnel Activity Log</span>
        </div>
        <div class="hr-timeline">
          ${HRData.activityFeed.slice(0, 4).map(act => {
            const empName = act.empId ? (hrEmp(act.empId)?.name || 'Employee') : '';
            return `
              <div class="hr-timeline-item">
                <span class="hr-timeline-dot ${act.severity}"></span>
                <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:600; color:var(--text-primary)">
                  <span>${empName ? empName + ' — ' : ''}${act.detail}</span>
                  <span style="font-size:10px; font-weight:400; color:var(--text-muted)">${act.date}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      
    </div>
  `;
}

/* ═══════════════════════════════════════════════════════════
   2. WORKFORCE DIRECTORY ( Existing - refactored )
   ═══════════════════════════════════════════════════════════ */
function renderHRWorkforce() {
  document.getElementById('pageContent').innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Workforce Directory</div>
        <div class="page-subtitle">Full personnel register, project assignments, and skill stats</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary btn-sm" onclick="openNewEmployeeModal()">
          <svg viewBox="0 0 15 15" fill="none" style="width:12px;height:12px"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          Add Employee
        </button>
      </div>
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${['All', 'Production', 'Quality', 'Management', 'Marketing'].map(d => `
          <button class="btn btn-secondary btn-sm" onclick="filterHRDept('${d}')" style="font-size:11px">${d}</button>`).join('')}
      </div>
    </div>
    <div class="emp-grid" id="empGrid"></div>`;
  renderEmpGrid(HRData.employees);
}

/* ═══════════════════════════════════════════════════════════
   3. ATTENDANCE & TIME ( New sub-page )
   ═══════════════════════════════════════════════════════════ */
function renderHRAttendance() {
  const emps = HRData.employees;
  
  // Stats
  const presentCount = HRData.attendance.filter(a => a.date === '2025-05-05' && (a.status === 'present' || a.status === 'late')).length;
  const lateCount = HRData.attendance.filter(a => a.date === '2025-05-05' && a.status === 'late').length;
  const absentCount = HRData.attendance.filter(a => a.date === '2025-05-05' && a.status === 'absent').length;
  const leaveCount = HRData.attendance.filter(a => a.date === '2025-05-05' && (a.status === 'leave' || a.status === 'sick')).length;

  document.getElementById('pageContent').innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Attendance & Time Tracking</div>
        <div class="page-subtitle">Real-time clock-in logs, shifts mapping, and overtime logs</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary btn-sm" onclick="triggerClockInModal()">
          Manual Clock Entry
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="metric-grid" style="margin-bottom:20px">
      ${[
        { label: 'Present Today', value: presentCount, color: 'var(--green)' },
        { label: 'Late Clock-in', value: lateCount, color: 'var(--amber)' },
        { label: 'Absent', value: absentCount, color: 'var(--red)' },
        { label: 'On Approved Leave', value: leaveCount, color: 'var(--blue)' },
      ].map(k => `<div class="metric-card"><div class="metric-label">${k.label}</div><div class="metric-value" style="font-size:26px;color:${k.color}">${k.value}</div></div>`).join('')}
    </div>

    <!-- Heatmap grid -->
    <div class="card" style="margin-bottom:20px">
      <div class="card-header">
        <span class="card-title">Weekly Attendance Dashboard (W18)</span>
      </div>
      <div class="table-wrap">
        <div class="attendance-heatmap-grid" style="grid-template-columns: 180px repeat(7, 1fr); font-weight:600; text-align:center; font-size:11px; margin-bottom:8px">
          <div style="text-align:left; padding-left:10px">Employee</div>
          <div>Mon 28/4</div>
          <div>Tue 29/4</div>
          <div>Wed 30/4</div>
          <div>Thu 1/5</div>
          <div>Fri 2/5</div>
          <div>Sat 3/5</div>
          <div>Sun 4/5</div>
        </div>
        ${emps.map(e => {
          const daysOfWeek = ['2025-04-28', '2025-04-29', '2025-04-30', '2025-05-01', '2025-05-02', '2025-05-03', '2025-05-04'];
          return `
            <div class="attendance-heatmap-grid" style="grid-template-columns: 180px repeat(7, 1fr); align-items:center; border-top:1px solid var(--border); padding: 4px 0">
              <div style="display:flex; align-items:center; gap:8px; padding-left:10px">
                <div class="emp-avatar" style="width:24px;height:24px;font-size:9px;background:${e.avatarBg}22;color:${e.avatarColor}">${e.initials}</div>
                <div style="font-size:12px; font-weight:500">${e.name}</div>
              </div>
              ${daysOfWeek.map(d => {
                // Mock statuses or look in record
                const rec = HRData.attendance.find(a => a.empId === e.id && a.date === d);
                // Rest day logic (sat/sun)
                const isRest = d.endsWith('03') || d.endsWith('04');
                const status = rec ? rec.status : (isRest ? 'rest' : 'present');
                const labelMap = { present: 'P', late: 'L', absent: 'A', sick: 'S', leave: 'LV', rest: 'OFF' };
                const classMap = { present: 'present', late: 'late', absent: 'absent', sick: 'absent', leave: 'leave', rest: 'rest' };
                return `<div class="attendance-heatmap-cell attendance-cell-${classMap[status] || 'rest'}" title="${e.name} — ${d}: ${status}">${labelMap[status] || 'P'}</div>`;
              }).join('')}
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Active Register Table -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">Live Clock Registry</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Date</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>Status</th>
              <th>Hours worked</th>
              <th>Overtime</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${HRData.attendance.map(a => {
              const e = hrEmp(a.empId);
              if (!e) return '';
              const badgeClass = a.status === 'present' ? 'badge-green' : a.status === 'late' ? 'badge-amber' : 'badge-red';
              return `
                <tr>
                  <td>
                    <div style="display:flex; align-items:center; gap:8px">
                      <div class="emp-avatar" style="width:26px;height:26px;font-size:9px;background:${e.avatarBg}22;color:${e.avatarColor}">${e.initials}</div>
                      <div>
                        <div style="font-weight:500">${e.name}</div>
                        <div style="font-size:10px; color:var(--text-muted)">${e.role}</div>
                      </div>
                    </div>
                  </td>
                  <td>${a.date}</td>
                  <td>${a.clockIn || '—'}</td>
                  <td>${a.clockOut || '—'}</td>
                  <td><span class="badge ${badgeClass}">${a.status}</span></td>
                  <td><strong>${a.hoursWorked}h</strong></td>
                  <td><span style="color:${a.overtime > 0 ? 'var(--green)' : 'var(--text-muted)'}">${a.overtime > 0 ? '+' + a.overtime + 'h' : '—'}</span></td>
                  <td>${a.location || '—'}</td>
                  <td>
                    <button class="btn btn-ghost btn-sm" onclick="triggerClockAdjustment('${a.empId}', '${a.date}')">Adjust</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function triggerClockInModal() {
  openHRModal(`
    <div class="hr-modal-inner">
      <div class="hr-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Manual Clock Entry</div>
        <button class="btn-icon" onclick="closeHRModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="hr-modal-body">
        <div class="hr-field">
          <label>Employee</label>
          <select id="manualClockEmp">${HRData.employees.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}</select>
        </div>
        <div class="hr-field">
          <label>Date</label>
          <input type="date" id="manualClockDate" value="2025-05-05"/>
        </div>
        <div class="hr-field-row">
          <div class="hr-field"><label>Clock In</label><input type="text" id="manualClockIn" placeholder="06:00"/></div>
          <div class="hr-field"><label>Clock Out</label><input type="text" id="manualClockOut" placeholder="14:30"/></div>
        </div>
        <div class="hr-field-row">
          <div class="hr-field">
            <label>Status</label>
            <select id="manualClockStatus"><option>present</option><option>late</option><option>absent</option></select>
          </div>
          <div class="hr-field"><label>Location</label><input type="text" id="manualClockLoc" value="Shop Floor"/></div>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="submitManualClock()">Save Entry</button>
          <button class="btn btn-ghost" onclick="closeHRModal()">Cancel</button>
        </div>
      </div>
    </div>
  `);
}

function submitManualClock() {
  const empId = document.getElementById('manualClockEmp').value;
  const date = document.getElementById('manualClockDate').value;
  const clockIn = document.getElementById('manualClockIn').value;
  const clockOut = document.getElementById('manualClockOut').value;
  const status = document.getElementById('manualClockStatus').value;
  const location = document.getElementById('manualClockLoc').value;

  HRData.attendance.unshift({
    empId, date, clockIn, clockOut, status, hoursWorked: 8.5, overtime: 0.5, location
  });
  closeHRModal();
  showToast('Manual attendance record added successfully', 'success');
  renderHRAttendance();
}

function triggerClockAdjustment(empId, date) {
  const rec = HRData.attendance.find(a => a.empId === empId && a.date === date);
  if (!rec) return;

  openHRModal(`
    <div class="hr-modal-inner">
      <div class="hr-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Adjust Attendance Record</div>
        <button class="btn-icon" onclick="closeHRModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="hr-modal-body">
        <div style="font-size:12px; color:var(--text-secondary); margin-bottom:8px">Adjusting record for <strong>${hrEmp(empId).name}</strong> on ${date}</div>
        <div class="hr-field-row">
          <div class="hr-field"><label>Clock In</label><input type="text" id="adjClockIn" value="${rec.clockIn || ''}"/></div>
          <div class="hr-field"><label>Clock Out</label><input type="text" id="adjClockOut" value="${rec.clockOut || ''}"/></div>
        </div>
        <div class="hr-field-row">
          <div class="hr-field">
            <label>Hours Worked</label>
            <input type="number" step="0.01" id="adjHours" value="${rec.hoursWorked}"/>
          </div>
          <div class="hr-field">
            <label>Overtime Hours</label>
            <input type="number" step="0.01" id="adjOvertime" value="${rec.overtime}"/>
          </div>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="saveClockAdjustment('${empId}', '${date}')">Save Adjustment</button>
          <button class="btn btn-ghost" onclick="closeHRModal()">Cancel</button>
        </div>
      </div>
    </div>
  `);
}

function saveClockAdjustment(empId, date) {
  const rec = HRData.attendance.find(a => a.empId === empId && a.date === date);
  if (rec) {
    rec.clockIn = document.getElementById('adjClockIn').value;
    rec.clockOut = document.getElementById('adjClockOut').value;
    rec.hoursWorked = parseFloat(document.getElementById('adjHours').value);
    rec.overtime = parseFloat(document.getElementById('adjOvertime').value);
  }
  closeHRModal();
  showToast('Attendance record adjusted successfully', 'success');
  renderHRAttendance();
}


/* ═══════════════════════════════════════════════════════════
   4. LEAVE MANAGEMENT ( New sub-page )
   ═══════════════════════════════════════════════════════════ */
function renderHRLeave() {
  const pendingRequests = HRData.leaveRequests.filter(r => r.status === 'pending');
  const pastRequests = HRData.leaveRequests.filter(r => r.status !== 'pending');

  document.getElementById('pageContent').innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Leave & Vacation Management</div>
        <div class="page-subtitle">Annual leave allocations, medical absences, and approval workflows</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary btn-sm" onclick="triggerApplyLeaveModal()">
          Apply Leave (Form)
        </button>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px">
      <!-- Leave Balance Register -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Leave Balance Balances</span>
        </div>
        <div style="max-height: 320px; overflow-y:auto">
          ${HRData.leaveBalances.map(b => {
            const e = hrEmp(b.empId);
            if (!e) return '';
            const usedPct = Math.round((b.annualUsed / b.annual) * 100);
            return `
              <div style="margin-bottom:12px; border-bottom:1px solid var(--border); padding-bottom:10px">
                <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:600; margin-bottom:4px">
                  <span style="display:flex; align-items:center; gap:6px">
                    <span class="emp-avatar" style="width:20px;height:20px;font-size:8px;background:${e.avatarBg}22;color:${e.avatarColor}">${e.initials}</span>
                    ${e.name}
                  </span>
                  <span>${b.annualUsed} / ${b.annual} days used</span>
                </div>
                <div class="leave-balance-progress">
                  <div class="leave-balance-fill" style="width:${usedPct}%; background:var(--dept-accent)"></div>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:10px; color:var(--text-muted)">
                  <span>Sick used: ${b.sickUsed}/${b.sick}d</span>
                  <span>Emergency used: ${b.emergencyUsed}/${b.emergency}d</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Pending Approval Queue -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Pending Leave Requests (${pendingRequests.length})</span>
        </div>
        <div style="max-height:320px; overflow-y:auto">
          ${pendingRequests.length === 0 
            ? `<div class="empty-state"><p>No pending leave requests to process.</p></div>`
            : pendingRequests.map(r => {
                const e = hrEmp(r.empId);
                if (!e) return '';
                return `
                  <div style="padding:12px; background:var(--bg-card-inner); border-radius:var(--radius-md); border:1px solid var(--border); margin-bottom:10px">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start">
                      <div style="display:flex; gap:8px">
                        <div class="emp-avatar" style="width:28px;height:28px;font-size:10px;background:${e.avatarBg}22;color:${e.avatarColor}">${e.initials}</div>
                        <div>
                          <div style="font-size:12px; font-weight:600">${e.name}</div>
                          <div style="font-size:10px; color:var(--text-muted)">${r.type.toUpperCase()} · ${r.days} day${r.days > 1 ? 's' : ''}</div>
                        </div>
                      </div>
                      <span class="badge badge-amber" style="font-size:8px">${r.status}</span>
                    </div>
                    <div style="font-size:11px; margin: 8px 0; color:var(--text-secondary); background:var(--bg-surface); padding:6px; border-radius:4px">
                      <strong>Reason:</strong> ${r.reason}
                    </div>
                    <div style="font-size:10px; color:var(--text-muted); margin-bottom:10px">Dates: ${r.from} to ${r.to}</div>
                    <div style="display:flex; gap:6px">
                      <button class="btn btn-primary btn-sm" style="flex:1; height:26px; font-size:10px" onclick="actionLeaveRequest('${r.id}', 'approved')">Approve</button>
                      <button class="btn btn-secondary btn-sm" style="flex:1; height:26px; font-size:10px; color:var(--red)" onclick="actionLeaveRequest('${r.id}', 'rejected')">Reject</button>
                    </div>
                  </div>
                `;
              }).join('')}
        </div>
      </div>
    </div>

    <!-- Leave Registry Log -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">Leave Audit Register</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Type</th>
              <th>From</th>
              <th>To</th>
              <th>Days</th>
              <th>Reason</th>
              <th>Applied On</th>
              <th>Status</th>
              <th>Approved By</th>
            </tr>
          </thead>
          <tbody>
            ${pastRequests.map(r => {
              const e = hrEmp(r.empId);
              if (!e) return '';
              const badgeClass = r.status === 'approved' ? 'badge-green' : 'badge-red';
              return `
                <tr>
                  <td>
                    <div style="display:flex; align-items:center; gap:8px">
                      <div class="emp-avatar" style="width:26px;height:26px;font-size:9px;background:${e.avatarBg}22;color:${e.avatarColor}">${e.initials}</div>
                      <div>
                        <div style="font-weight:500">${e.name}</div>
                        <div style="font-size:10px; color:var(--text-muted)">${e.role}</div>
                      </div>
                    </div>
                  </td>
                  <td><span style="text-transform:capitalize">${r.type}</span></td>
                  <td>${r.from}</td>
                  <td>${r.to}</td>
                  <td><strong>${r.days}</strong></td>
                  <td>${r.reason}</td>
                  <td>${r.appliedOn}</td>
                  <td><span class="badge ${badgeClass}">${r.status}</span></td>
                  <td>${r.approvedBy || '—'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function triggerApplyLeaveModal() {
  openHRModal(`
    <div class="hr-modal-inner">
      <div class="hr-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Submit Leave Request</div>
        <button class="btn-icon" onclick="closeHRModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="hr-modal-body">
        <div class="hr-field">
          <label>Employee</label>
          <select id="leaveReqEmp">${HRData.employees.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}</select>
        </div>
        <div class="hr-field">
          <label>Leave Type</label>
          <select id="leaveReqType"><option value="annual">Annual Leave</option><option value="sick">Sick Leave</option><option value="emergency">Emergency Leave</option></select>
        </div>
        <div class="hr-field-row">
          <div class="hr-field"><label>From Date</label><input type="date" id="leaveReqFrom"/></div>
          <div class="hr-field"><label>To Date</label><input type="date" id="leaveReqTo"/></div>
        </div>
        <div class="hr-field"><label>Reason</label><textarea id="leaveReqReason" placeholder="Purpose of leave"></textarea></div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="submitLeaveRequest()">Submit Request</button>
          <button class="btn btn-ghost" onclick="closeHRModal()">Cancel</button>
        </div>
      </div>
    </div>
  `);
}

function submitLeaveRequest() {
  const empId = document.getElementById('leaveReqEmp').value;
  const type = document.getElementById('leaveReqType').value;
  const from = document.getElementById('leaveReqFrom').value;
  const to = document.getElementById('leaveReqTo').value;
  const reason = document.getElementById('leaveReqReason').value;

  const fDate = new Date(from);
  const tDate = new Date(to);
  const days = Math.round((tDate - fDate) / 86400000) + 1;

  HRData.leaveRequests.unshift({
    id: 'LR-' + (HRData.leaveRequests.length + 1).toString().padStart(3, '0'),
    empId, type, from, to, days, status: 'pending', reason, appliedOn: '2025-05-05', approvedBy: null
  });

  closeHRModal();
  showToast('Leave request submitted and sent for manager approval', 'success');
  renderHRLeave();
}

function actionLeaveRequest(id, status) {
  const req = HRData.leaveRequests.find(r => r.id === id);
  if (req) {
    req.status = status;
    req.approvedBy = 'Sanjay Mathews';
    // If approved, deduct balance
    if (status === 'approved') {
      const bal = HRData.leaveBalances.find(b => b.empId === req.empId);
      if (bal) {
        if (req.type === 'annual') bal.annualUsed += req.days;
        else if (req.type === 'sick') bal.sickUsed += req.days;
        else if (req.type === 'emergency') bal.emergencyUsed += req.days;
      }
    }
  }
  showToast(`Leave request ${status} successfully`, 'success');
  renderHRLeave();
}


/* ═══════════════════════════════════════════════════════════
   5. ONBOARDING CHECKLISTS ( New sub-page )
   ═══════════════════════════════════════════════════════════ */
function renderHROnboarding() {
  document.getElementById('pageContent').innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Onboarding & Readiness</div>
        <div class="page-subtitle">New hire preparation lists, HSE drills tracker, and system checkouts</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary btn-sm" onclick="triggerNewOnboardingModal()">
          Initiate Onboarding
        </button>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr; gap:20px">
      ${HRData.onboarding.map(onb => {
        const e = hrEmp(onb.empId);
        if (!e) return '';
        const doneCount = onb.steps.filter(s => s.done).length;
        const totalCount = onb.steps.length;
        const progress = Math.round((doneCount / totalCount) * 100);

        return `
          <div class="card" style="margin-bottom:16px">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; border-bottom:1px solid var(--border); padding-bottom:10px">
              <div style="display:flex; gap:12px">
                <div class="emp-avatar" style="width:40px;height:40px;font-size:14px;background:${e.avatarBg}22;color:${e.avatarColor}">${e.initials}</div>
                <div>
                  <div style="font-size:14px; font-weight:700; color:var(--text-primary)">${e.name}</div>
                  <div style="font-size:11px; color:var(--text-muted)">Role: ${e.role} · Started: ${onb.startDate}</div>
                </div>
              </div>
              <div style="text-align:right">
                <span class="badge ${onb.status === 'complete' ? 'badge-green' : 'badge-amber'}">${onb.status}</span>
                <div style="font-size:11px; font-weight:600; margin-top:4px">${progress}% Complete (${doneCount}/${totalCount} tasks)</div>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="progress-bar" style="height:8px; margin-bottom:16px">
              <div class="progress-fill" style="width:${progress}%; background:var(--green)"></div>
            </div>

            <!-- Steps list -->
            <div class="onboard-steps" style="display:grid; grid-template-columns:1fr 1fr; gap:10px">
              ${onb.steps.map((step, idx) => {
                return `
                  <div class="onboard-step">
                    <div class="onboard-step-checkbox ${step.done ? 'done' : ''}" onclick="toggleOnboardStep('${onb.empId}', ${idx})">
                      ${step.done ? '✓' : ''}
                    </div>
                    <div>
                      <div style="font-size:12px; font-weight:500; text-decoration:${step.done ? 'line-through' : 'none'}; color:${step.done ? 'var(--text-muted)' : 'var(--text-primary)'}">${step.task}</div>
                      ${step.date ? `<div style="font-size:9px; color:var(--text-muted)">Completed: ${step.date}</div>` : ''}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function triggerNewOnboardingModal() {
  openHRModal(`
    <div class="hr-modal-inner">
      <div class="hr-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Initiate Employee Onboarding</div>
        <button class="btn-icon" onclick="closeHRModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="hr-modal-body">
        <div class="hr-field">
          <label>Employee Name</label>
          <input type="text" id="onbEmpName" placeholder="e.g. John Doe"/>
        </div>
        <div class="hr-field">
          <label>Role</label>
          <input type="text" id="onbEmpRole" placeholder="e.g. Weld Inspector"/>
        </div>
        <div class="hr-field">
          <label>Department</label>
          <select id="onbEmpDept"><option>Production</option><option>Quality</option><option>Management</option></select>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="submitNewOnboarding()">Start Journey</button>
          <button class="btn btn-ghost" onclick="closeHRModal()">Cancel</button>
        </div>
      </div>
    </div>
  `);
}

function submitNewOnboarding() {
  const name = document.getElementById('onbEmpName').value;
  const role = document.getElementById('onbEmpRole').value;
  const dept = document.getElementById('onbEmpDept').value;
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();

  // Create mock employee first
  const newId = 'E-' + (HRData.employees.length + 1).toString().padStart(3, '0');
  const newEmp = {
    id: newId, name, role, dept, grade: 'Junior', initials,
    avatarBg: '#534AB7', avatarColor: '#EEEDF6', accentColor: '#8b5cf6',
    joined: '2025-05-05', email: name.toLowerCase().replace(' ', '.') + '@nexaforge.com', phone: '+971-50-0000000',
    utilisation: 0, skills: {}, certifications: [], tags: ['new-hire']
  };

  HRData.employees.push(newEmp);

  // Add onboarding record
  HRData.onboarding.unshift({
    empId: newId,
    startDate: '2025-05-05',
    status: 'in-progress',
    steps: [
      { task: 'ID Badge Issued', done: false, date: null },
      { task: 'Safety Induction Completed', done: false, date: null },
      { task: 'PPE Issued (Standard)', done: false, date: null },
      { task: 'ERP NexaForge User setup', done: false, date: null },
      { task: 'HSE Drills walkthrough', done: false, date: null },
      { task: 'Initial Probation alignment', done: false, date: null }
    ]
  });

  closeHRModal();
  showToast(`Onboarding initialized for ${name}`, 'success');
  renderHROnboarding();
}

function toggleOnboardStep(empId, stepIndex) {
  const onb = HRData.onboarding.find(o => o.empId === empId);
  if (onb) {
    const step = onb.steps[stepIndex];
    step.done = !step.done;
    step.date = step.done ? '2025-05-05' : null;
    
    // Check if complete
    const allDone = onb.steps.every(s => s.done);
    onb.status = allDone ? 'complete' : 'in-progress';
  }
  renderHROnboarding();
}


/* ═══════════════════════════════════════════════════════════
   6. PAYROLL & SALARY ( New sub-page )
   ═══════════════════════════════════════════════════════════ */
function renderHRPayroll() {
  const totalSalaries = HRData.payroll.reduce((s, p) => s + p.netPay, 0);
  const avgNet = Math.round(totalSalaries / HRData.payroll.length);

  document.getElementById('pageContent').innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Payroll & Salary Ledger</div>
        <div class="page-subtitle">Monthly salary disbursements, allowances, and payslip access</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary btn-sm" onclick="runMockPayroll()">
          Run Payroll
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="metric-grid" style="margin-bottom:20px">
      ${[
        { label: 'Total Disbursement (AED)', value: 'AED ' + totalSalaries.toLocaleString(), color: 'var(--brand)' },
        { label: 'Headcount Paid', value: HRData.payroll.length, color: 'var(--blue)' },
        { label: 'Average Net Pay', value: 'AED ' + avgNet.toLocaleString(), color: 'var(--green)' },
        { label: 'Salary Period', value: 'April 2025', color: 'var(--text-muted)' },
      ].map(k => `<div class="metric-card"><div class="metric-label">${k.label}</div><div class="metric-value" style="font-size:26px;color:${k.color}">${k.value}</div></div>`).join('')}
    </div>

    <!-- Payroll Register Table -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">Salary Registry (April 2025)</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Basic Salary</th>
              <th>Housing Allow.</th>
              <th>Transport Allow.</th>
              <th>Overtime Pay</th>
              <th>Deductions</th>
              <th>Net Salary</th>
              <th>Status</th>
              <th>Payslip</th>
            </tr>
          </thead>
          <tbody>
            ${HRData.payroll.map(p => {
              const e = hrEmp(p.empId);
              if (!e) return '';
              return `
                <tr>
                  <td>
                    <div style="display:flex; align-items:center; gap:8px">
                      <div class="emp-avatar" style="width:26px;height:26px;font-size:9px;background:${e.avatarBg}22;color:${e.avatarColor}">${e.initials}</div>
                      <div>
                        <div style="font-weight:500">${e.name}</div>
                        <div style="font-size:10px; color:var(--text-muted)">${e.role}</div>
                      </div>
                    </div>
                  </td>
                  <td>AED ${p.basicSalary.toLocaleString()}</td>
                  <td>AED ${p.housingAllowance.toLocaleString()}</td>
                  <td>AED ${p.transportAllowance.toLocaleString()}</td>
                  <td style="color:var(--green)">+AED ${p.overtime.toLocaleString()}</td>
                  <td style="color:var(--red)">-AED ${p.deductions.toLocaleString()}</td>
                  <td><strong>AED ${p.netPay.toLocaleString()}</strong></td>
                  <td><span class="badge badge-green">Paid</span></td>
                  <td>
                    <button class="btn btn-secondary btn-sm" style="height:26px; font-size:10px" onclick="openPayslipModal('${p.empId}')">View Slip</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function openPayslipModal(empId) {
  const p = HRData.payroll.find(x => x.empId === empId);
  const e = hrEmp(empId);
  if (!p || !e) return;

  openHRModal(`
    <div class="hr-modal-inner payslip-modal">
      <div class="hr-modal-header" style="background:#FFF">
        <div>
          <div style="font-family:var(--font-display);font-size:18px;font-weight:800;color:var(--brand)">NexaForge Fabrication Ltd.</div>
          <div style="font-size:11px;color:var(--text-muted)">Pay Slip — April 2025</div>
        </div>
        <button class="btn-icon" onclick="closeHRModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="hr-modal-body" style="background:#FAF8FF; padding:22px">
        <div style="display:flex; justify-content:space-between; margin-bottom:16px; border-bottom:1px solid var(--border); padding-bottom:8px; font-size:12px">
          <div>
            <strong>Name:</strong> ${e.name}<br>
            <strong>ID:</strong> ${e.id}<br>
            <strong>Role:</strong> ${e.role}
          </div>
          <div style="text-align:right">
            <strong>Dept:</strong> ${e.dept}<br>
            <strong>Grade:</strong> ${e.grade}<br>
            <strong>Date:</strong> ${p.payDate}
          </div>
        </div>
        
        <div style="font-size:12px; margin-bottom:8px; font-weight:700">Salary Breakdown</div>
        <div style="background:#FFF; border:1px solid var(--border); border-radius:var(--radius-sm); padding:10px; font-size:12px">
          <div style="display:flex; justify-content:space-between; margin-bottom:6px"><span>Basic Salary</span><span>AED ${p.basicSalary.toLocaleString()}</span></div>
          <div style="display:flex; justify-content:space-between; margin-bottom:6px"><span>Housing Allowance</span><span>AED ${p.housingAllowance.toLocaleString()}</span></div>
          <div style="display:flex; justify-content:space-between; margin-bottom:6px"><span>Transport Allowance</span><span>AED ${p.transportAllowance.toLocaleString()}</span></div>
          <div style="display:flex; justify-content:space-between; margin-bottom:6px; color:var(--green)"><span>Overtime Pay</span><span>+AED ${p.overtime.toLocaleString()}</span></div>
          <div style="display:flex; justify-content:space-between; margin-bottom:6px; color:var(--red)"><span>Deductions</span><span>-AED ${p.deductions.toLocaleString()}</span></div>
          <div style="display:flex; justify-content:space-between; border-top:1px solid var(--border); padding-top:6px; font-weight:800; font-size:13px; color:var(--brand)">
            <span>Net Salary Paid</span>
            <span>AED ${p.netPay.toLocaleString()}</span>
          </div>
        </div>

        <div style="display:flex; gap:10px; margin-top:12px">
          <button class="btn btn-primary" style="flex:1" onclick="closeHRModal();showToast('Payslip downloaded in PDF format','success')">Download PDF</button>
          <button class="btn btn-ghost" onclick="closeHRModal()">Close</button>
        </div>
      </div>
    </div>
  `);
}

function runMockPayroll() {
  showToast('Recalculating monthly clockings, allowances, and deductions...', 'info');
  setTimeout(() => {
    showToast('Payroll processed for period May 2025. Total: AED 108,400', 'success');
  }, 1000);
}


/* ═══════════════════════════════════════════════════════════
   7. EXPENSE CLAIMS ( New sub-page )
   ═══════════════════════════════════════════════════════════ */
function renderHRExpenses() {
  const pendingClaims = HRData.expenses.filter(c => c.status === 'pending');
  const pastClaims = HRData.expenses.filter(c => c.status !== 'pending');
  const pendingAmount = pendingClaims.reduce((s, c) => s + c.totalAmount, 0);

  document.getElementById('pageContent').innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Expense Claims Ledger</div>
        <div class="page-subtitle">Reimbursement registers, travel allowances, and receipt checklists</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary btn-sm" onclick="triggerSubmitExpenseModal()">
          Submit Claim
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="metric-grid" style="margin-bottom:20px">
      ${[
        { label: 'Pending Reports Value', value: 'AED ' + pendingAmount.toLocaleString(), color: 'var(--amber)' },
        { label: 'Pending Approval Queue', value: pendingClaims.length, color: 'var(--blue)' },
        { label: 'Approved Claims (Mo)', value: 'AED ' + HRData.expenses.filter(c => c.status === 'approved').reduce((s, c) => s + c.totalAmount, 0).toLocaleString(), color: 'var(--green)' },
        { label: 'Total Claims Logged', value: HRData.expenses.reduce((s, r) => s + r.lines.length, 0), color: 'var(--text-secondary)' },
      ].map(k => `<div class="metric-card"><div class="metric-label">${k.label}</div><div class="metric-value" style="font-size:26px;color:${k.color}">${k.value}</div></div>`).join('')}
    </div>

    <div style="display:grid; grid-template-columns:1fr; gap:20px">
      <!-- Pending Claims List -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Pending Reports Queue</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Report Title</th>
                <th>Period</th>
                <th>Total Amount</th>
                <th>Items Count</th>
                <th>Submitted On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pendingClaims.length === 0 
                ? `<tr><td colspan="7" style="text-align:center; padding:30px">No pending expense reports.</td></tr>`
                : pendingClaims.map(c => {
                    const e = hrEmp(c.empId);
                    if (!e) return '';
                    return `
                      <tr>
                        <td>
                          <div style="display:flex; align-items:center; gap:8px">
                            <div class="emp-avatar" style="width:24px;height:24px;font-size:9px;background:${e.avatarBg}22;color:${e.avatarColor}">${e.initials}</div>
                            <strong>${e.name}</strong>
                          </div>
                        </td>
                        <td>${c.title}</td>
                        <td><span class="badge badge-accent">${c.month}</span></td>
                        <td><strong>${c.totalAmount} ${c.currency}</strong></td>
                        <td>${c.lines.length} items</td>
                        <td>${c.submittedOn}</td>
                        <td>
                          <div style="display:flex; gap:4px">
                            <button class="btn btn-secondary btn-sm" style="height:26px; font-size:10px" onclick="openExpenseReportDetailModal('${c.id}')">View Details</button>
                            <button class="btn btn-primary btn-sm" style="height:26px; font-size:10px" onclick="actionExpenseReport('${c.id}', 'approved')">Approve</button>
                            <button class="btn btn-secondary btn-sm" style="height:26px; font-size:10px; color:var(--red)" onclick="actionExpenseReport('${c.id}', 'rejected')">Reject</button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Expense Ledger Log -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Expense History Log</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Report Title</th>
                <th>Period</th>
                <th>Total Amount</th>
                <th>Items Count</th>
                <th>Status</th>
                <th>Approved By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pastClaims.map(c => {
                const e = hrEmp(c.empId);
                if (!e) return '';
                const badgeClass = c.status === 'approved' ? 'badge-green' : 'badge-red';
                return `
                  <tr>
                    <td>
                      <div style="display:flex; align-items:center; gap:8px">
                        <div class="emp-avatar" style="width:24px;height:24px;font-size:9px;background:${e.avatarBg}22;color:${e.avatarColor}">${e.initials}</div>
                        <span>${e.name}</span>
                      </div>
                    </td>
                    <td>${c.title}</td>
                    <td><span class="badge badge-outline">${c.month}</span></td>
                    <td><strong>${c.totalAmount} ${c.currency}</strong></td>
                    <td>${c.lines.length} items</td>
                    <td><span class="badge ${badgeClass}">${c.status}</span></td>
                    <td>${c.approvedBy || '—'}</td>
                    <td>
                      <button class="btn btn-secondary btn-sm" style="height:26px; font-size:10px" onclick="openExpenseReportDetailModal('${c.id}')">View Details</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function openExpenseReportDetailModal(reportId) {
  const report = HRData.expenses.find(r => r.id === reportId);
  if (!report) return;
  const e = hrEmp(report.empId);

  const linesHtml = report.lines.map((line, index) => `
    <tr>
      <td>${line.date}</td>
      <td><code>${line.refNo || '—'}</code></td>
      <td><span class="badge badge-outline">${line.category}</span></td>
      <td>${line.reason || '—'}</td>
      <td>${line.customerInvolved ? `<span class="badge badge-accent" style="background:var(--blue-bg);color:var(--blue);border:1px solid var(--blue-border)">${line.customerInvolved}</span>` : '<span style="color:var(--text-muted)">No</span>'}</td>
      <td><strong>${line.amount} ${report.currency}</strong></td>
      <td style="font-size:11px;color:var(--text-muted)">${line.description || '—'}</td>
    </tr>
  `).join('');

  openHRModal(`
    <div class="hr-modal-inner" style="width:min(800px, 95vw)">
      <div class="hr-modal-header">
        <div>
          <div style="font-family:var(--font-display);font-size:16px;font-weight:700;color:var(--text-primary)">${report.title}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">
            Submitted by <strong>${e ? e.name : 'Unknown'}</strong> on ${report.submittedOn} · Period: ${report.month}
          </div>
        </div>
        <button class="btn-icon" onclick="closeHRModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="hr-modal-body" style="padding-top:10px">
        <div class="table-wrap" style="max-height: 350px; overflow-y: auto; margin-bottom:15px; border: 1px solid var(--border)">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Ref No</th>
                <th>Category</th>
                <th>Reason</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${linesHtml}
            </tbody>
          </table>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;background:var(--bg-card-inner);padding:12px 16px;border-radius:var(--radius-sm);border:1px solid var(--border)">
          <div>
            <span style="font-size:12px;color:var(--text-muted)">Status:</span>
            <span class="badge ${report.status === 'approved' ? 'badge-green' : report.status === 'rejected' ? 'badge-red' : 'badge-amber'}" style="margin-left:5px">${report.status.toUpperCase()}</span>
            ${report.approvedBy ? `<span style="font-size:11px;color:var(--text-muted);margin-left:5px">by ${report.approvedBy}</span>` : ''}
          </div>
          <div style="font-size:14px">
            Total Report Value: <strong style="font-size:18px;color:var(--dept-accent)">${report.totalAmount} ${report.currency}</strong>
          </div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:15px">
          ${report.status === 'pending' ? `
            <button class="btn btn-primary btn-sm" onclick="actionExpenseReport('${report.id}', 'approved'); closeHRModal();">Approve Report</button>
            <button class="btn btn-secondary btn-sm" style="color:var(--red)" onclick="actionExpenseReport('${report.id}', 'rejected'); closeHRModal();">Reject Report</button>
          ` : ''}
          <button class="btn btn-ghost btn-sm" onclick="closeHRModal()">Close</button>
        </div>
      </div>
    </div>
  `);
}

function triggerSubmitExpenseModal() {
  openHRModal(`
    <div class="hr-modal-inner" style="width:min(900px, 95vw)">
      <div class="hr-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Submit Monthly Expense Report</div>
        <button class="btn-icon" onclick="closeHRModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="hr-modal-body">
        <div class="hr-field-row" style="margin-bottom:12px">
          <div class="hr-field" style="flex:1">
            <label>Employee</label>
            <select id="expenseReportEmp">${HRData.employees.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}</select>
          </div>
          <div class="hr-field" style="flex:1">
            <label>Report Title</label>
            <input type="text" id="expenseReportTitle" placeholder="e.g. May 2025 Consumables" />
          </div>
          <div class="hr-field" style="flex:1">
            <label>Month / Period</label>
            <select id="expenseReportMonth">
              <option>May 2025</option>
              <option>April 2025</option>
              <option>June 2025</option>
            </select>
          </div>
        </div>
        
        <div style="margin-bottom:15px">
          <div style="font-weight:600;font-size:12px;margin-bottom:8px;color:var(--text-secondary)">Line Items</div>
          <div class="table-wrap" style="max-height:300px;overflow-y:auto;border:1px solid var(--border)">
            <table class="data-table expense-builder-table">
              <thead>
                <tr>
                  <th style="width:140px">Date</th>
                  <th style="width:120px">Bill/Ref No</th>
                  <th style="width:130px">Category</th>
                  <th style="width:130px">Customer Involved</th>
                  <th style="width:100px">Amount (AED)</th>
                  <th>Reason & Description</th>
                  <th style="width:50px;text-align:center">Action</th>
                </tr>
              </thead>
              <tbody id="expenseBuilderBody">
                <!-- Rows will be added dynamically -->
              </tbody>
            </table>
          </div>
        </div>
        
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding:8px 0">
          <button class="btn btn-secondary btn-sm" onclick="addBuilderRow()">+ Add Item Row</button>
          <div style="font-size:14px;font-weight:600">
            Total Report Amount: <span id="expenseBuilderTotal" style="font-size:18px;color:var(--dept-accent)">0 AED</span>
          </div>
        </div>
        
        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button class="btn btn-primary" onclick="submitExpenseReport()">Submit Report</button>
          <button class="btn btn-ghost" onclick="closeHRModal()">Cancel</button>
        </div>
      </div>
    </div>
  `);
  // Add an initial row so the builder is not empty
  addBuilderRow();
}

function addBuilderRow() {
  const tbody = document.getElementById('expenseBuilderBody');
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.className = 'expense-builder-row';
  
  // Set default date to today (or 2025-05-29)
  const today = '2025-05-29';
  
  tr.innerHTML = `
    <td><input type="date" class="line-date" value="${today}" style="width:100%" /></td>
    <td><input type="text" class="line-ref" placeholder="Ref No" style="width:100%" /></td>
    <td>
      <select class="line-cat" style="width:100%">
        <option>Travel</option>
        <option>Tools</option>
        <option>Training</option>
        <option>Transport</option>
        <option>Entertainment</option>
        <option>Other</option>
      </select>
    </td>
    <td><input type="text" class="line-customer" placeholder="Optional" style="width:100%" /></td>
    <td><input type="number" class="line-amount" placeholder="0" min="0" style="width:100%" oninput="calculateBuilderTotal()" /></td>
    <td><input type="text" class="line-desc" placeholder="Reason/Description" style="width:100%" /></td>
    <td style="text-align:center">
      <button class="btn-icon" style="color:var(--red)" onclick="removeBuilderRow(this)">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2L2 10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
      </button>
    </td>
  `;
  tbody.appendChild(tr);
  calculateBuilderTotal();
}

function removeBuilderRow(btn) {
  const tr = btn.closest('tr');
  if (tr) {
    tr.remove();
    calculateBuilderTotal();
  }
}

function calculateBuilderTotal() {
  const amounts = document.querySelectorAll('.line-amount');
  let total = 0;
  amounts.forEach(input => {
    const val = parseFloat(input.value) || 0;
    total += val;
  });
  const totalDisplay = document.getElementById('expenseBuilderTotal');
  if (totalDisplay) {
    totalDisplay.textContent = total.toLocaleString() + ' AED';
  }
}

function submitExpenseReport() {
  const empId = document.getElementById('expenseReportEmp').value;
  const title = document.getElementById('expenseReportTitle').value.trim();
  const month = document.getElementById('expenseReportMonth').value;
  
  if (!title) {
    showToast('Please enter a report title.', 'error');
    return;
  }

  const rows = document.querySelectorAll('.expense-builder-row');
  if (rows.length === 0) {
    showToast('Please add at least one item to the report.', 'error');
    return;
  }

  const lines = [];
  let totalAmount = 0;

  for (const row of rows) {
    const amountVal = row.querySelector('.line-amount').value;
    const amount = parseFloat(amountVal) || 0;
    if (amount <= 0) {
      showToast('Each line item must have a valid amount greater than 0.', 'error');
      return;
    }
    
    const date = row.querySelector('.line-date').value;
    const refNo = row.querySelector('.line-ref').value.trim();
    const category = row.querySelector('.line-cat').value;
    const customerInvolved = row.querySelector('.line-customer').value.trim();
    const description = row.querySelector('.line-desc').value.trim();

    totalAmount += amount;
    lines.push({
      date,
      refNo,
      category,
      reason: description,
      customerInvolved,
      amount,
      description
    });
  }

  HRData.expenses.unshift({
    id: 'EXP-REP-' + (HRData.expenses.length + 1).toString().padStart(3, '0'),
    empId,
    title,
    month,
    status: 'pending',
    submittedOn: '2025-05-29',
    approvedBy: null,
    totalAmount,
    currency: 'AED',
    lines
  });

  closeHRModal();
  showToast('Monthly expense report submitted for approval.', 'success');
  renderHRExpenses();
}

function actionExpenseReport(id, status) {
  const report = HRData.expenses.find(r => r.id === id);
  if (report) {
    report.status = status;
    report.approvedBy = status === 'approved' ? 'Sanjay Mathews' : null;
    showToast(`Expense report ${status} successfully.`, 'success');
    renderHRExpenses();
  } else {
    showToast(`Expense report not found.`, 'error');
  }
}


/* ═══════════════════════════════════════════════════════════
   8. DOCUMENT VAULT ( New sub-page )
   ═══════════════════════════════════════════════════════════ */
function renderHRDocuments() {
  const expiredDocs = HRData.documents.filter(d => d.status === 'expired');
  const expiringDocs = HRData.documents.filter(d => d.status === 'expiring');

  document.getElementById('pageContent').innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Document Vault</div>
        <div class="page-subtitle">Passport checklists, employment visas, labor cards, and health certificates</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary btn-sm" onclick="triggerUploadDocModal()">
          Upload Document
        </button>
      </div>
    </div>

    <!-- Banner warnings if docs expired -->
    ${expiredDocs.length > 0 ? `
      <div style="padding:10px 14px;background:var(--red-bg);border:1px solid rgba(245,101,101,.25);border-radius:var(--radius-md);margin-bottom:14px;display:flex;align-items:center;gap:10px;font-size:12px;color:var(--red)">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L14 13H2L8 2z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M8 6v3M8 11v.3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        <strong>${expiredDocs.length} employee documents have EXPIRED</strong> — Legal compliance requires immediate renewal.
      </div>
    ` : ''}

    <div class="doc-vault-grid" style="margin-bottom:20px">
      ${HRData.documents.map(d => {
        const e = hrEmp(d.empId);
        if (!e) return '';
        const borderMap = { valid: 'status-valid', expiring: 'status-expiring', expired: 'status-expired' };
        const badgeMap = { valid: 'badge-green', expiring: 'badge-amber', expired: 'badge-red' };
        return `
          <div class="doc-vault-card ${borderMap[d.status]}" onclick="showToast('Loading document preview for ${d.name}...','info')">
            <div class="doc-vault-icon">
              <span>${d.type === 'passport' ? '🛂' : d.type === 'visa' ? '🛂' : '📄'}</span>
            </div>
            <div style="flex:1; min-width:0">
              <div style="font-size:13px; font-weight:700; color:var(--text-primary); text-overflow:ellipsis; overflow:hidden; white-space:nowrap">${d.name}</div>
              <div style="font-size:11px; color:var(--text-muted); margin-top:2px">${e.name} (${e.role})</div>
              <div style="font-size:10px; color:var(--text-muted); margin-top:4px">Expires: <strong>${d.expiry}</strong></div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px">
                <span class="badge ${badgeMap[d.status]}" style="font-size:8px">${d.status}</span>
                <span style="font-size:9px; color:var(--text-hint)">Uploaded ${d.uploaded}</span>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function triggerUploadDocModal() {
  openHRModal(`
    <div class="hr-modal-inner">
      <div class="hr-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Upload Employee Document</div>
        <button class="btn-icon" onclick="closeHRModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="hr-modal-body">
        <div class="hr-field">
          <label>Employee</label>
          <select id="uploadDocEmp">${HRData.employees.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}</select>
        </div>
        <div class="hr-field">
          <label>Document Name</label>
          <input type="text" id="uploadDocName" placeholder="e.g. Visa Page Copy"/>
        </div>
        <div class="hr-field">
          <label>Document Type</label>
          <select id="uploadDocType"><option value="passport">Passport</option><option value="visa">Employment Visa</option><option value="labour-card">Labour Card</option><option value="medical">Medical Fitness</option></select>
        </div>
        <div class="hr-field"><label>Expiry Date</label><input type="date" id="uploadDocExpiry"/></div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="submitUploadDoc()">Upload Document</button>
          <button class="btn btn-ghost" onclick="closeHRModal()">Cancel</button>
        </div>
      </div>
    </div>
  `);
}

function submitUploadDoc() {
  const empId = document.getElementById('uploadDocEmp').value;
  const name = document.getElementById('uploadDocName').value;
  const type = document.getElementById('uploadDocType').value;
  const expiry = document.getElementById('uploadDocExpiry').value;

  const expDate = new Date(expiry);
  const now = new Date();
  const diffTime = expDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  let status = 'valid';
  if (diffDays <= 0) status = 'expired';
  else if (diffDays <= 90) status = 'expiring';

  HRData.documents.unshift({
    id: 'DOC-' + (HRData.documents.length + 1).toString().padStart(3, '0'),
    empId, type, name, uploaded: '2025-05-05', expiry, status
  });

  closeHRModal();
  showToast('Document uploaded successfully to vaults', 'success');
  renderHRDocuments();
}


/* ═══════════════════════════════════════════════════════════
   9. HR ANALYTICS ( New sub-page )
   ═══════════════════════════════════════════════════════════ */
function renderHRAnalytics() {
  const emps = HRData.employees;
  const totalCerts = emps.reduce((s, e) => s + e.certifications.length, 0);
  const expiredCerts = emps.reduce((s, e) => s + e.certifications.filter(c => c.status === 'expired').length, 0);
  const complianceRate = totalCerts > 0 ? Math.round(((totalCerts - expiredCerts) / totalCerts) * 100) : 100;

  document.getElementById('pageContent').innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Workforce Analytics & KPIs</div>
        <div class="page-subtitle">Resource capacity utilization, certification rates, and skill gap reviews</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" onclick="showToast('Exporting analytics charts...','success')">Export Report</button>
      </div>
    </div>

    <!-- KPIs -->
    <div class="metric-grid" style="margin-bottom:20px">
      ${[
        { label: 'Workforce Compliance Rate', value: complianceRate + '%', color: complianceRate > 90 ? 'var(--green)' : 'var(--amber)' },
        { label: 'Skill Matrix Coverage', value: '88%', color: 'var(--brand)' },
        { label: 'Turnover Rate (YTD)', value: '4.2%', color: 'var(--green)' },
        { label: 'Average Employee Tenure', value: '3.4 Years', color: 'var(--text-secondary)' },
      ].map(k => `<div class="metric-card"><div class="metric-label">${k.label}</div><div class="metric-value" style="font-size:26px;color:${k.color}">${k.value}</div></div>`).join('')}
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px">
      <!-- Skill Gap Matrix Highlight -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Skill Gap Analysis (Proficiency Rate < 2)</span>
        </div>
        <div>
          ${HRData.skillDefs.map(s => {
            const proficient = emps.filter(e => (e.skills[s.key] ?? 0) >= 3).length;
            const pct = Math.round((proficient / emps.length) * 100);
            const lowStaff = proficient < 2;
            return `
              <div style="margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid var(--border)">
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px">
                  <span style="font-weight:600; color:${lowStaff ? 'var(--red)' : 'var(--text-primary)'}">${s.label}</span>
                  <span style="font-weight:700; color:${lowStaff ? 'var(--red)' : 'var(--text-muted)'}">${proficient} Staff Proficient ${lowStaff ? '⚠️ GAP' : ''}</span>
                </div>
                <div class="progress-bar" style="height:6px">
                  <div class="progress-fill" style="width:${pct}%; background:${lowStaff ? 'var(--red)' : 'var(--green)'}"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Compliance Metrics -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Training Metrics (Mandatory vs Optional)</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:16px">
          <div>
            <div style="font-size:12px; margin-bottom:4px">ASME Welder Training Coverage</div>
            <div class="progress-bar" style="height:10px"><div class="progress-fill" style="width:82%; background:var(--brand)"></div></div>
            <div style="display:flex; justify-content:space-between; font-size:10px; color:var(--text-muted); margin-top:2px">
              <span>82% Qualified</span>
              <span>18% Pending Renewals</span>
            </div>
          </div>
          
          <div>
            <div style="font-size:12px; margin-bottom:4px">HSE Safety Induction Coverage</div>
            <div class="progress-bar" style="height:10px"><div class="progress-fill" style="width:100%; background:var(--green)"></div></div>
            <div style="display:flex; justify-content:space-between; font-size:10px; color:var(--text-muted); margin-top:2px">
              <span>100% Induction Complete</span>
              <span>0% Overdue</span>
            </div>
          </div>

          <div>
            <div style="font-size:12px; margin-bottom:4px">API Tank Inspector Coverage</div>
            <div class="progress-bar" style="height:10px"><div class="progress-fill" style="width:66%; background:var(--amber)"></div></div>
            <div style="display:flex; justify-content:space-between; font-size:10px; color:var(--text-muted); margin-top:2px">
              <span>66% Staff Qualified</span>
              <span>34% Overdue / Planned</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}


/* ═══════════════════════════════════════════════════════════
   10. REST OF EXISTING PAGE RENDERERS & MODALS
   ═══════════════════════════════════════════════════════════ */

/* Skills Matrix */
function renderHRSkills() {
  const emps = HRData.employees;
  const skills = HRData.skillDefs;

  const levelLabel = { 0:'—', 1:'1', 2:'2', 3:'3', 4:'4' };
  const levelTitle = { 0:'No skill', 1:'Awareness', 2:'Basic', 3:'Proficient', 4:'Expert / Trainer' };

  document.getElementById('pageContent').innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Skills Matrix</div>
        <div class="page-subtitle">Welder qualifications and technical skill coverage matrix</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" onclick="showToast('Skills matrix exported to Excel','success')">Export</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">Skills matrix — all workforce</span>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <div style="display:flex;gap:6px;font-size:10px;color:var(--text-muted);flex-wrap:wrap">
            ${[
              ['sk-0','No skill'],['sk-1','Awareness'],['sk-2','Basic'],
              ['sk-3','Proficient'],['sk-4','Expert'],
            ].map(([cls,lbl])=>`<span style="display:flex;align-items:center;gap:4px"><span class="skill-cell ${cls}" style="width:18px;height:14px;border-radius:3px;font-size:9px">${cls==='sk-0'?'—':cls.replace('sk-','')}</span>${lbl}</span>`).join('')}
          </div>
        </div>
      </div>
      <div class="skills-matrix-wrap">
        <table class="skills-matrix">
          <thead>
            <tr>
              <th class="emp-col">Employee</th>
              ${skills.map(s=>`<th class="skill-col">${s.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${emps.map(e => `
              <tr>
                <td class="emp-name-cell">
                  <div style="display:flex;align-items:center;gap:8px">
                    <div class="emp-avatar" style="width:26px;height:26px;font-size:9px;background:${e.avatarBg}22;color:${e.avatarColor};border:1px solid ${e.avatarBg}44;flex-shrink:0">${e.initials}</div>
                    <div>
                      <div>${e.name}</div>
                      <div class="emp-role-sm">${e.role}</div>
                    </div>
                  </div>
                </td>
                ${skills.map(s => {
                  const level = e.skills[s.key] ?? 0;
                  return `<td><div class="skill-cell sk-${level}" title="${e.name} · ${s.label}: ${levelTitle[level]}">${levelLabel[level]}</div></td>`;
                }).join('')}
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

/* Certifications */
function renderHRCerts() {
  const allCerts = HRData.employees.flatMap(e =>
    e.certifications.map(c => ({ ...c, empId: e.id, empName: e.name, empRole: e.role, empInitials: e.initials, empAvatarBg: e.avatarBg, empAvatarColor: e.avatarColor }))
  ).sort((a, b) => {
    const order = { expired: 0, expiring: 1, valid: 2 };
    return (order[a.status] ?? 3) - (order[b.status] ?? 3);
  });

  const expired  = allCerts.filter(c=>c.status==='expired');
  const expiring = allCerts.filter(c=>c.status==='expiring');
  const valid    = allCerts.filter(c=>c.status==='valid');

  document.getElementById('pageContent').innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Certifications</div>
        <div class="page-subtitle">Welder WPQ qualifications, safety card tracking, and calibration certs</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary btn-sm" onclick="openNewCertModal()">Add Cert</button>
      </div>
    </div>

    <div class="metric-grid" style="margin-bottom:20px">
      ${[
        { label:'Total certifications', value:allCerts.length, color:'var(--text-primary)' },
        { label:'Valid',                value:valid.length,    color:'var(--green)' },
        { label:'Expiring (90 days)',   value:expiring.length, color:'var(--amber)' },
        { label:'Expired — action req', value:expired.length,  color:expired.length>0?'var(--red)':'var(--text-muted)' },
      ].map(k=>`<div class="metric-card"><div class="metric-label">${k.label}</div><div class="metric-value" style="font-size:26px;color:${k.color}">${k.value}</div></div>`).join('')}
    </div>

    ${expired.length ? `
      <div style="padding:10px 14px;background:var(--red-bg);border:1px solid rgba(245,101,101,.25);border-radius:var(--radius-md);margin-bottom:14px;display:flex;align-items:center;gap:10px;font-size:12px;color:var(--red)">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L14 13H2L8 2z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M8 6v3M8 11v.3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        <strong>${expired.length} certification${expired.length>1?'s':''} have EXPIRED</strong> — renew immediately.
      </div>` : ''}

    <div class="card">
      <div class="card-header">
        <span class="card-title">All certifications — sorted by urgency</span>
        <button class="btn btn-ghost btn-sm" onclick="showToast('Certification report exported','success')">Export</button>
      </div>
      <div class="cert-list">
        ${allCerts.map(c => {
          const days = certDaysLeft(c.expiry);
          const sc   = certStatusColor(c.status);
          const cardCls = `cert-${c.status==='expiring'?'expiring':c.status==='expired'?'expired':'valid'}`;
          const timelinePct = c.status === 'expired' ? 100
            : c.status === 'expiring' ? Math.max(0, Math.min(100, 100 - Math.round(days/90*100)))
            : Math.max(0, Math.min(40, 40 - Math.round(days/365*40)));
          return `
          <div class="cert-card ${cardCls}" onclick="openCertDetail('${c.code}','${c.empId}')">
            <div class="cert-icon" style="background:${sc}15">
              <span style="font-size:18px">${c.code.startsWith('WPQ')?'🔥':c.code.startsWith('SAFETY')||c.code.includes('H2S')?'🦺':c.code.startsWith('CSWIP')||c.code.startsWith('PCN')?'🔍':'📜'}</span>
            </div>
            <div class="cert-body">
              <div class="cert-name">${c.name}</div>
              <div class="cert-holder">
                <span style="display:inline-flex;align-items:center;gap:5px">
                  <span style="background:${c.empAvatarBg}22;color:${c.empAvatarColor};padding:1px 5px;border-radius:3px;font-size:9px;font-weight:700">${c.empInitials}</span>
                  ${c.empName} · ${c.empRole}
                </span>
              </div>
              <div class="cert-meta">
                <span>Code: <span style="font-family:var(--font-mono)">${c.code}</span></span>
                <span>Issued: ${c.issued}</span>
                <span>Expires: ${c.expiry}</span>
              </div>
              <div class="cert-timeline">
                <div class="cert-timeline-fill" style="width:${timelinePct}%;background:${sc}"></div>
              </div>
            </div>
            <div class="cert-right">
              ${certStatusBadge(c.status)}
              <div class="cert-days" style="color:${sc}">
                ${c.status === 'expired' ? 'EXPIRED' : days + 'd'}
              </div>
              ${c.status !== 'valid' ? `<button class="btn btn-primary btn-sm" onclick="event.stopPropagation();openNewTrainingModal();showToast('Renewal training opened','info')" style="background:${c.status==='expired'?'var(--red)':''}">Renew</button>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

/* Training Records */
function renderHRTraining() {
  document.getElementById('pageContent').innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Training Records</div>
        <div class="page-subtitle">Staff courses, induction classes, welder renewals logs</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary btn-sm" onclick="openNewTrainingModal()">
          <svg viewBox="0 0 15 15" fill="none" style="width:12px;height:12px"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          Log Training
        </button>
      </div>
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${[['All','badge-muted'],['Mandatory','badge-red'],['Scheduled','badge-blue'],['Completed','badge-green']].map(([f,cls])=>`
          <button class="btn btn-secondary btn-sm" style="font-size:11px" onclick="filterTraining('${f}')">${f}</button>`).join('')}
      </div>
    </div>
    <div class="training-grid" id="trainingGrid"></div>`;
  renderTrainingCards(HRData.training);
}

/* Shift Schedule */
function renderHRSchedule() {
  const { days, rows } = HRData.shiftSchedule;
  const shiftLabel = { M:'MOR', A:'AFT', N:'NGT', OFF:'OFF', AL:'A/L', SL:'SICK' };

  /* Summary stats */
  const present = rows.filter(r => r.shifts[4] === 'M' || r.shifts[4] === 'A' || r.shifts[4] === 'N').length;
  const onLeave = rows.filter(r => r.shifts[4] === 'AL').length;
  const onSick  = rows.filter(r => r.shifts[4] === 'SL').length;
  const onOff   = rows.filter(r => r.shifts[4] === 'OFF').length;

  document.getElementById('pageContent').innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Shift Schedule</div>
        <div class="page-subtitle">Weekly shift planner for direct fabrication floor operators</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" onclick="showToast('← Previous week','info')">‹ Prev</button>
        <button class="btn btn-secondary btn-sm" onclick="showToast('Next week →','info')">Next ›</button>
      </div>
    </div>

    <div class="metric-grid" style="margin-bottom:20px">
      ${[
        { label:'Present Today',  value:present, color:'var(--green)' },
        { label:'Annual Leave',   value:onLeave, color:'var(--blue)' },
        { label:'Sick / Absent',  value:onSick,  color:'var(--red)' },
        { label:'Rest Day',       value:onOff,   color:'var(--text-muted)' },
      ].map(k=>`<div class="metric-card"><div class="metric-label">${k.label}</div><div class="metric-value" style="font-size:26px;color:${k.color}">${k.value}</div></div>`).join('')}
    </div>

    <!-- Legend -->
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;font-size:11px">
      ${[['shift-M','MOR','Morning 06:00–14:00'],['shift-A','AFT','Afternoon 14:00–22:00'],['shift-N','NGT','Night 22:00–06:00'],
         ['shift-OFF','OFF','Rest day'],['shift-AL','A/L','Annual leave'],['shift-SL','SICK','Sick leave']].map(([cls,short,full])=>`
        <span style="display:flex;align-items:center;gap:4px">
          <span class="shift-block ${cls}" style="width:32px;height:18px;font-size:8px">${short}</span>
          <span style="color:var(--text-muted)">${full}</span>
        </span>`).join('')}
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">Weekly Shift Schedule — W18 (28 Apr – 04 May 2025)</span>
        <button class="btn btn-ghost btn-sm" onclick="showToast('Schedule exported','success')">Export</button>
      </div>
      <div class="shift-grid-wrap">
        <div class="shift-grid" style="grid-template-columns:180px repeat(${days.length},1fr)">
          <!-- Header row -->
          <div class="shift-header-row" style="display:contents">
            <div class="shift-emp-col">Employee</div>
            ${days.map(d=>`<div class="shift-day-col" style="padding:8px 4px;text-align:center;font-size:9px;white-space:pre-line">${d}</div>`).join('')}
          </div>
          <!-- Employee rows -->
          ${rows.map(row => {
            const e = hrEmp(row.empId);
            if (!e) return '';
            return `
            <div class="shift-emp-row" style="display:contents" onclick="openEmployeeDetail('${e.id}')">
              <div class="shift-emp-name" style="cursor:pointer">
                <span class="shift-dot" style="background:${e.accentColor}"></span>
                <span>
                  <div style="font-size:12px;font-weight:500">${e.name}</div>
                  <div style="font-size:10px;color:var(--text-muted)">${e.role}</div>
                </span>
              </div>
              ${row.shifts.map(shift=>`
                <div class="shift-cell" onclick="event.stopPropagation();showToast('${e.name}: ${shift} shift','info')">
                  <div class="shift-block shift-${shift}">${shiftLabel[shift]||shift}</div>
                </div>`).join('')}
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;
}

/* Labour Utilisation */
function renderHRUtilisation() {
  const emps    = HRData.employees;
  const avgUtil = Math.round(emps.reduce((s,e)=>s+e.utilisation,0)/emps.length);
  const totalDirect   = emps.reduce((s,e)=>s+e.directHours,0);
  const totalIndirect = emps.reduce((s,e)=>s+e.indirectHours,0);
  const totalHours    = totalDirect + totalIndirect;

  document.getElementById('pageContent').innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Labour Utilisation</div>
        <div class="page-subtitle">Billable vs indirect shop hours tracking across fabrication works</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" onclick="showToast('Exporting utilization metrics...','success')">Export</button>
      </div>
    </div>

    <div class="metric-grid" style="margin-bottom:20px">
      ${[
        { label:'Avg utilisation',   value:avgUtil+'%',                    color:avgUtil>80?'var(--green)':avgUtil>60?'var(--amber)':'var(--red)' },
        { label:'Direct hours (mo)', value:totalDirect+'h',               color:'var(--blue)' },
        { label:'Indirect hours',    value:totalIndirect+'h',              color:'var(--text-secondary)' },
        { label:'Efficiency ratio',  value:Math.round(totalDirect/totalHours*100)+'%', color:'var(--green)' },
      ].map(k=>`<div class="metric-card"><div class="metric-label">${k.label}</div><div class="metric-value" style="font-size:26px;color:${k.color}">${k.value}</div></div>`).join('')}
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">Labour utilisation — April 2025</span>
        <div style="display:flex;gap:10px;font-size:11px;color:var(--text-muted)">
          ${[['var(--brand)','Direct billable'],['var(--blue)','Indirect'],['var(--bg-active)','Idle']].map(([c,l])=>`
            <span class="util-legend-item"><span class="util-legend-dot" style="background:${c}"></span>${l}</span>`).join('')}
        </div>
      </div>

      ${emps.map(e => {
        const totalCap = 180; /* 180h / month */
        const dPct  = Math.round(e.directHours/totalCap*100);
        const iPct  = Math.round(e.indirectHours/totalCap*100);
        const idlePct = Math.max(0, 100 - dPct - iPct);
        return `
        <div class="util-emp-row">
          <div class="util-emp-info">
            <div style="display:flex;align-items:center;gap:7px">
              <div class="emp-avatar" style="width:28px;height:28px;font-size:10px;background:${e.avatarBg}22;color:${e.avatarColor};border:1px solid ${e.avatarBg}44;flex-shrink:0">${e.initials}</div>
              <div>
                <div class="util-emp-name">${e.name}</div>
                <div class="util-emp-role">${e.role}</div>
              </div>
            </div>
          </div>
          <div class="util-bar-wrap">
            <div class="util-bar-track">
              <div class="util-bar-seg" style="width:${dPct}%;background:var(--brand)" title="Direct: ${e.directHours}h"></div>
              <div class="util-bar-seg" style="width:${iPct}%;background:var(--blue)" title="Indirect: ${e.indirectHours}h"></div>
              <div class="util-bar-seg" style="width:${idlePct}%;background:var(--bg-active)" title="Idle: ${totalCap-e.directHours-e.indirectHours}h"></div>
            </div>
          </div>
          <div class="util-pct-label" style="color:${e.utilisation>80?'var(--green)':e.utilisation>60?'var(--amber)':'var(--red)'}">${e.utilisation}%</div>
        </div>`;
      }).join('')}
    </div>`;
}

/* Modals & Helpers */
function filterHRDept(dept) {
  const filtered = dept === 'All' ? HRData.employees : HRData.employees.filter(e => e.dept === dept);
  renderEmpGrid(filtered);
}

function renderEmpGrid(employees) {
  document.getElementById('empGrid').innerHTML = employees.map(e => {
    const expiredC  = e.certifications.filter(c=>c.status==='expired').length;
    const expiringC = e.certifications.filter(c=>c.status==='expiring').length;
    const alertColor = expiredC > 0 ? 'var(--red)' : expiringC > 0 ? 'var(--amber)' : null;
    return `
    <div class="emp-card" style="--emp-accent:${e.accentColor}" onclick="openEmployeeDetail('${e.id}')">
      <div class="emp-header">
        <div class="emp-avatar" style="background:${e.avatarBg}22;color:${e.avatarColor};border:1px solid ${e.avatarBg}44">${e.initials}</div>
        <div>
          <div class="emp-name">${e.name}</div>
          <div class="emp-role">${e.role}</div>
          <div class="emp-dept">${e.dept} · ${e.grade}</div>
        </div>
      </div>
      <div class="emp-stats">
        <div class="emp-stat">
          <div class="emp-stat-val" style="color:${e.utilisation>80?'var(--green)':e.utilisation>60?'var(--amber)':'var(--red)'}">${e.utilisation}%</div>
          <div class="emp-stat-lbl">Util.</div>
        </div>
        <div class="emp-stat">
          <div class="emp-stat-val">${e.certifications.length}</div>
          <div class="emp-stat-lbl">Certs</div>
        </div>
        <div class="emp-stat">
          <div class="emp-stat-val">${e.projects ? e.projects.length : 0}</div>
          <div class="emp-stat-lbl">Projects</div>
        </div>
      </div>
      <div class="emp-tags">${e.tags.slice(0,3).map(t=>`<span class="emp-tag">${t}</span>`).join('')}</div>
      ${alertColor ? `
        <div class="emp-cert-alert" style="background:${alertColor}15;color:${alertColor};border:1px solid ${alertColor}33;margin-top:8px">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2L11 10H1L6 2z" stroke="currentColor" stroke-width="1"/><path d="M6 5v2M6 8.5v.2" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>
          ${expiredC > 0 ? `${expiredC} cert${expiredC>1?'s':''} expired` : `${expiringC} cert${expiringC>1?'s':''} expiring soon`}
        </div>` : ''}
    </div>`;
  }).join('');
}

function openEmployeeDetail(id) {
  const e = hrEmp(id);
  if (!e) return;

  const expiredC  = e.certifications.filter(c=>c.status==='expired');
  const expiringC = e.certifications.filter(c=>c.status==='expiring');

  openHRModal(`
    <div class="hr-modal-inner">
      <div class="hr-modal-header">
        <div style="display:flex;align-items:center;gap:14px">
          <div class="emp-avatar" style="width:48px;height:48px;font-size:16px;background:${e.avatarBg}22;color:${e.avatarColor};border:1px solid ${e.avatarBg}44">${e.initials}</div>
          <div>
            <div style="font-family:var(--font-display);font-size:17px;font-weight:700">${e.name}</div>
            <div style="font-size:12px;color:var(--text-muted)">${e.role} · ${e.dept} · ${e.grade}</div>
          </div>
        </div>
        <button class="btn-icon" onclick="closeHRModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="hr-modal-body">
        <!-- Contact & details -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${[['Email',e.email],['Phone',e.phone],['Employee ID',e.id],['Joined',e.joined],['Nationality',e.nationality || 'UAE'],['Type',e.type]].map(([l,v])=>`
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px 10px">
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:2px">${l}</div>
              <div style="font-size:12px;color:var(--text-primary)">${v}</div>
            </div>`).join('')}
        </div>

        <!-- Cert summary -->
        <div>
          <div class="section-label" style="margin-bottom:6px">Certifications (${e.certifications.length})</div>
          ${e.certifications.map(c => {
            const days = certDaysLeft(c.expiry);
            return `
            <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border)">
              <div style="flex:1;min-width:0">
                <div style="font-size:12px;font-weight:500;color:var(--text-primary)">${c.name}</div>
                <div style="font-size:10px;color:var(--text-muted)">Expires: ${c.expiry}</div>
              </div>
              ${certStatusBadge(c.status)}
              <span style="font-size:11px;font-weight:600;color:${certStatusColor(c.status)};min-width:50px;text-align:right">${c.status==='expired'?'EXPIRED':days+'d'}</span>
            </div>`;
          }).join('')}
        </div>

        <!-- Tags -->
        <div style="display:flex;gap:5px;flex-wrap:wrap">
          ${e.tags.map(t=>`<span class="badge badge-muted" style="font-size:11px">${t}</span>`).join('')}
        </div>

        <!-- Projects -->
        ${e.projects && e.projects.length ? `
          <div style="font-size:12px;color:var(--text-secondary)">
            Active on: ${e.projects.map(p=>`<span class="badge badge-accent" style="font-size:11px;margin-right:4px">${p}</span>`).join('')}
          </div>` : ''}

        <!-- Alerts -->
        ${expiredC.length ? `<div style="padding:10px 12px;background:var(--red-bg);border:1px solid rgba(245,101,101,.2);border-radius:var(--radius-sm);font-size:12px;color:var(--red)">
          ⚠ ${expiredC.length} certification${expiredC.length>1?'s':''} expired — renewal training required.
        </div>` : ''}
        ${expiringC.length ? `<div style="padding:10px 12px;background:var(--amber-bg);border:1px solid rgba(245,158,11,.2);border-radius:var(--radius-sm);font-size:12px;color:var(--amber)">
          ⏰ ${expiringC.length} certification${expiringC.length>1?'s':''} expiring — schedule renewal training.
        </div>` : ''}

        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" onclick="closeHRModal();renderHRSubPage('training')">Schedule Training</button>
          <button class="btn btn-secondary btn-sm" onclick="closeHRModal();renderHRSubPage('certs')">View Certs</button>
          <button class="btn btn-ghost btn-sm" onclick="closeHRModal()">Close</button>
        </div>
      </div>
    </div>`);
}

function openCertDetail(code, empId) {
  const e = hrEmp(empId);
  const c = e?.certifications.find(x=>x.code===code);
  if (!e || !c) return;
  const days = certDaysLeft(c.expiry);
  openHRModal(`
    <div class="hr-modal-inner">
      <div class="hr-modal-header">
        <div>
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--brand);margin-bottom:3px">${c.code}</div>
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">${c.name}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${e.name} · ${e.role}</div>
        </div>
        <div style="display:flex;gap:8px">
          ${certStatusBadge(c.status)}
          <button class="btn-icon" onclick="closeHRModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
        </div>
      </div>
      <div class="hr-modal-body">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
          ${[
            ['Issued',  c.issued, 'var(--text-primary)'],
            ['Expires', c.expiry, certStatusColor(c.status)],
            ['Status',  c.status === 'expired' ? 'EXPIRED' : days+'d remaining', certStatusColor(c.status)],
          ].map(([l,v,col])=>`
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px;text-align:center">
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:4px">${l}</div>
              <div style="font-size:15px;font-weight:700;color:${col};font-family:var(--font-display)">${v}</div>
            </div>`).join('')}
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${c.status!=='valid'?`<button class="btn btn-primary" onclick="closeHRModal();renderHRSubPage('training')">Schedule Renewal</button>`:''}
          <button class="btn btn-secondary btn-sm" onclick="closeHRModal();showToast('Certificate record downloaded','info')">Download</button>
          <button class="btn btn-ghost btn-sm" onclick="closeHRModal()">Close</button>
        </div>
      </div>
    </div>`);
}

function openTrainingDetail(id) {
  const t = HRData.training.find(x=>x.id===id);
  if (!t) return;
  openHRModal(`
    <div class="hr-modal-inner">
      <div class="hr-modal-header">
        <div>
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--brand);margin-bottom:3px">${t.id}</div>
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">${t.title}</div>
        </div>
        <div style="display:flex;gap:8px">
          ${trTypeBadge(t.type)}
          ${trStatusBadge(t.status)}
          <button class="btn-icon" onclick="closeHRModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
        </div>
      </div>
      <div class="hr-modal-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${[['Date',t.date],['Duration',t.duration],['Provider',t.provider],['Cost',t.cost?'$'+t.cost.toLocaleString():'Free']].map(([l,v])=>`
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:9px 11px">
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:3px">${l}</div>
              <div style="font-size:13px;color:var(--text-primary)">${v}</div>
            </div>`).join('')}
        </div>
        <div>
          <div class="section-label" style="margin-bottom:7px">Attendees (${t.attendees.length})</div>
          ${t.attendees.map(aid => {
            const e = hrEmp(aid);
            if (!e) return '';
            const result = t.results?.[aid];
            return `
            <div style="display:flex;align-items:center;gap:9px;padding:7px 0;border-bottom:1px solid var(--border)">
              <div class="emp-avatar" style="width:26px;height:26px;font-size:9px;background:${e.avatarBg}22;color:${e.avatarColor}">${e.initials}</div>
              <div style="flex:1">
                <div style="font-size:12px;font-weight:500;color:var(--text-primary)">${e.name}</div>
                <div style="font-size:10px;color:var(--text-muted)">${e.role}</div>
              </div>
              ${result ? `<span class="badge ${result==='Pass'?'badge-green':'badge-red'}" style="font-size:10px">${result}</span>` : '<span class="badge badge-muted" style="font-size:10px">Pending</span>'}
            </div>`;
          }).join('')}
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${t.status!=='completed'?`<button class="btn btn-primary" onclick="closeHRModal();showToast('Training marked complete','success')">Mark Complete</button>`:''}
          <button class="btn btn-secondary btn-sm" onclick="closeHRModal();showToast('Training record exported','info')">Export Record</button>
          <button class="btn btn-ghost btn-sm" onclick="closeHRModal()">Close</button>
        </div>
      </div>
    </div>`);
}

function openNewEmployeeModal() {
  openHRModal(`
    <div class="hr-modal-inner">
      <div class="hr-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Add Employee</div>
        <button class="btn-icon" onclick="closeHRModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="hr-modal-body">
        <div class="hr-field-row">
          <div class="hr-field"><label>Full Name</label><input type="text" id="newEmpName" placeholder="Employee full name"/></div>
          <div class="hr-field"><label>Employee ID</label><input type="text" id="newEmpId" placeholder="e.g. E-009"/></div>
        </div>
        <div class="hr-field-row">
          <div class="hr-field"><label>Role / job title</label><input type="text" id="newEmpRole" placeholder="e.g. Senior Welder"/></div>
          <div class="hr-field"><label>Department</label>
            <select id="newEmpDept"><option>Production</option><option>Quality</option><option>Management</option><option>Marketing</option></select>
          </div>
        </div>
        <div class="hr-field-row">
          <div class="hr-field"><label>Grade</label>
            <select id="newEmpGrade"><option>Junior</option><option>Skilled</option><option>Senior</option><option>Lead</option><option>Manager</option></select>
          </div>
          <div class="hr-field"><label>Employment Type</label>
            <select id="newEmpType"><option>permanent</option><option>contract</option><option>probation</option></select>
          </div>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="submitNewEmployee()">Add Employee</button>
          <button class="btn btn-ghost" onclick="closeHRModal()">Cancel</button>
        </div>
      </div>
    </div>`);
}

function submitNewEmployee() {
  const name = document.getElementById('newEmpName').value;
  const id = document.getElementById('newEmpId').value;
  const role = document.getElementById('newEmpRole').value;
  const dept = document.getElementById('newEmpDept').value;
  const grade = document.getElementById('newEmpGrade').value;
  const type = document.getElementById('newEmpType').value;
  const initials = name.split(' ').map(n=>n[0]).join('').toUpperCase();

  HRData.employees.push({
    id, name, role, dept, grade, type, initials,
    avatarBg:'#185FA5', avatarColor:'#85B7EB', accentColor:'#4a9eff',
    joined:'2025-05-05', email:name.toLowerCase().replace(' ', '.')+'@nexaforge.com', phone:'+971-50-0000000',
    utilisation:0, skills:{}, certifications:[], tags:['new-hire']
  });

  closeHRModal();
  showToast(`Employee ${name} added to records`, 'success');
  renderHRWorkforce();
}

function openNewTrainingModal() {
  openHRModal(`
    <div class="hr-modal-inner">
      <div class="hr-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Log Training / Certification</div>
        <button class="btn-icon" onclick="closeHRModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="hr-modal-body">
        <div class="hr-field"><label>Training Title</label><input type="text" id="newTrTitle" placeholder="e.g. ASME IX WPQ GTAW Renewal"/></div>
        <div class="hr-field-row">
          <div class="hr-field"><label>Type</label>
            <select id="newTrType"><option>Certification</option><option>Safety</option><option>Technical</option><option>Systems</option><option>Quality</option></select>
          </div>
          <div class="hr-field"><label>Status</label>
            <select id="newTrStatus"><option>planned</option><option>scheduled</option><option>completed</option></select>
          </div>
        </div>
        <div class="hr-field-row">
          <div class="hr-field"><label>Date</label><input type="date" id="newTrDate" value="2025-05-15"/></div>
          <div class="hr-field"><label>Duration</label><input type="text" id="newTrDur" placeholder="e.g. 2 days"/></div>
        </div>
        <div class="hr-field-row">
          <div class="hr-field"><label>Provider</label><input type="text" id="newTrProv" placeholder="Training provider name"/></div>
          <div class="hr-field"><label>Cost (AED)</label><input type="number" id="newTrCost" placeholder="e.g. 2800"/></div>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="submitNewTraining()">Log Training</button>
          <button class="btn btn-ghost" onclick="closeHRModal()">Cancel</button>
        </div>
      </div>
    </div>`);
}

function submitNewTraining() {
  const title = document.getElementById('newTrTitle').value;
  const type = document.getElementById('newTrType').value;
  const status = document.getElementById('newTrStatus').value;
  const date = document.getElementById('newTrDate').value;
  const duration = document.getElementById('newTrDur').value;
  const provider = document.getElementById('newTrProv').value;
  const cost = parseFloat(document.getElementById('newTrCost').value);

  HRData.training.unshift({
    id: 'TR-' + (HRData.training.length + 1).toString().padStart(3, '0'),
    title, type, date, duration, provider, status, attendees: [], cost, mandatory: true
  });

  closeHRModal();
  showToast('Training record added successfully', 'success');
  renderHRTraining();
}

function openNewCertModal() {
  openHRModal(`
    <div class="hr-modal-inner">
      <div class="hr-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Add Certification</div>
        <button class="btn-icon" onclick="closeHRModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="hr-modal-body">
        <div class="hr-field"><label>Employee</label>
          <select id="newCertEmp">${HRData.employees.map(e=>`<option value="${e.id}">${e.name}</option>`).join('')}</select>
        </div>
        <div class="hr-field"><label>Certification Name</label><input type="text" id="newCertName" placeholder="e.g. WPQ GTAW — 316L SS (ASME IX)"/></div>
        <div class="hr-field"><label>Certificate code / reference</label><input type="text" id="newCertCode" placeholder="e.g. WPQ-GTAW-316L"/></div>
        <div class="hr-field-row">
          <div class="hr-field"><label>Issue date</label><input type="date" id="newCertIssued" value="2025-05-05"/></div>
          <div class="hr-field"><label>Expiry date</label><input type="date" id="newCertExpiry" value="2026-05-05"/></div>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="submitNewCert()">Add Certification</button>
          <button class="btn btn-ghost" onclick="closeHRModal()">Cancel</button>
        </div>
      </div>
    </div>`);
}

function submitNewCert() {
  const empId = document.getElementById('newCertEmp').value;
  const name = document.getElementById('newCertName').value;
  const code = document.getElementById('newCertCode').value;
  const issued = document.getElementById('newCertIssued').value;
  const expiry = document.getElementById('newCertExpiry').value;

  const emp = hrEmp(empId);
  if (emp) {
    emp.certifications.push({ code, name, issued, expiry, status: 'valid' });
  }

  closeHRModal();
  showToast('Certification added to employee records', 'success');
  renderHRCerts();
}

function filterTraining(filter) {
  const map = {
    'All':       HRData.training,
    'Mandatory': HRData.training.filter(t=>t.mandatory),
    'Scheduled': HRData.training.filter(t=>t.status==='scheduled'||t.status==='planned'),
    'Completed': HRData.training.filter(t=>t.status==='completed'),
  };
  renderTrainingCards(map[filter] || HRData.training);
}

function renderTrainingCards(list) {
  document.getElementById('trainingGrid').innerHTML = list.map(t => {
    const totalCost = t.cost ? `AED ${t.cost.toLocaleString()}` : 'Free';
    return `
    <div class="training-card" onclick="openTrainingDetail('${t.id}')">
      <div class="tr-header">
        <div class="tr-title">${t.title}</div>
        ${trTypeBadge(t.type)}
      </div>
      <div class="tr-meta">
        <span>📅 ${t.date}</span>
        <span>⏱ ${t.duration}</span>
        <span>💰 ${totalCost}</span>
        <span>🏫 ${t.provider}</span>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        ${trStatusBadge(t.status)}
        ${t.mandatory ? '<span class="badge badge-red" style="font-size:9px">Mandatory</span>' : '<span class="badge badge-muted" style="font-size:9px">Optional</span>'}
      </div>
      <div class="tr-attendees">
        ${t.attendees ? t.attendees.slice(0,4).map(aid => {
          const e = hrEmp(aid);
          if (!e) return '';
          const result = t.results?.[aid];
          return `
          <div class="tr-attendee">
            <div class="tr-attendee-avatar" style="background:${e.avatarBg}22;color:${e.avatarColor}">${e.initials}</div>
            <span>${e.name}</span>
            ${result ? `<span class="tr-result" style="color:${result==='Pass'?'var(--green)':'var(--red)'}">${result}</span>` : ''}
          </div>`;
        }).join('') : ''}
        ${t.attendees && t.attendees.length > 4 ? `<div style="font-size:10px;color:var(--text-muted);padding-left:27px">+${t.attendees.length-4} more</div>` : ''}
      </div>
    </div>`;
  }).join('');
}
