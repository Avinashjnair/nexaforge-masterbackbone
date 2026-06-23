/* ============================================================
   NexaForge ERP — WebSocket / Socket.io Client
   Real-time event bus bridge for the browser
   ============================================================ */

'use strict';

const WS_BASE = window.NF_WS_BASE || 'http://localhost:3000';

let _socket = null;
let _statusDot = null;

// ── Connect / disconnect ───────────────────────────────────────
function connectSocket() {
  if (_socket?.connected) return;
  if (!Auth.getAccess()) return;  // wait for login

  // socket.io must be loaded via CDN in index.html before this file
  if (typeof io === 'undefined') {
    console.warn('[WS] socket.io not loaded');
    return;
  }

  _socket = io(WS_BASE, {
    auth: { token: Auth.getAccess() },
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
  });

  _socket.on('connect', () => {
    console.log('[WS] connected:', _socket.id);
    _setStatusDot('green');
    showToast('Live event feed connected', 'success', 2500);

    // Re-subscribe to rooms after reconnect
    _resubscribe();
  });

  _socket.on('disconnect', (reason) => {
    console.warn('[WS] disconnected:', reason);
    _setStatusDot('red');
    if (reason !== 'io client disconnect') {
      showToast('Event feed disconnected — reconnecting…', 'warn', 3000);
    }
  });

  _socket.on('connect_error', (err) => {
    console.error('[WS] connect error:', err.message);
    _setStatusDot('red');
  });

  // ── Inbound event handlers ─────────────────────────────────

  _socket.on('project:phase_changed', (payload) => {
    showToast(`Phase advanced — ${payload.projectNo}: Phase ${payload.newPhase}`, 'info');
    _addEventFeedItem('phase', `${payload.projectNo} advanced to Phase ${payload.newPhase}`, payload);
    // Refresh projects list if on that page
    if (AppState.currentPage === 'projects') renderProjects();
  });

  _socket.on('qc:hold_triggered', (payload) => {
    showToast(`ITP Hold triggered — Project ${payload.projectId}`, 'error', 6000);
    _addEventFeedItem('hold', `ITP Hold triggered — Step ${payload.stepNo}: ${payload.activity}`, payload);
  });

  _socket.on('store:material_request', (payload) => {
    showToast(`Material request raised — ${payload.mrNo}`, 'info');
    _addEventFeedItem('mr', `MR ${payload.mrNo} raised for ${payload.lineCount} items`, payload);
  });

  _socket.on('finance:milestone_triggered', (payload) => {
    showToast(`Milestone triggered — invoice being drafted`, 'success');
    _addEventFeedItem('finance', `Milestone billing triggered — project ${payload.projectId}`, payload);
  });

  _socket.on('iiot:violation', (payload) => {
    showToast(`WPS Violation — Machine ${payload.machineId}: ${payload.message}`, 'error', 8000);
    _addEventFeedItem('violation', payload.message, payload);
  });

  _socket.on('iiot:telemetry', (payload) => {
    // Only update UI if on welding page — avoid DOM thrash
    if (AppState.currentPage === 'welding' && typeof updateLiveTelemetry === 'function') {
      updateLiveTelemetry(payload);
    }
  });

  _socket.on('iiot:machine_alert', (payload) => {
    showToast(`Machine alert — ${payload.machineId}: ${payload.message || 'Hardware fault'}`, 'error', 7000);
  });

  // S-10: GM intervention received by the target department
  _socket.on('gm:intervention', (payload) => {
    const actionLabel = {
      priority_override:    'Priority override',
      resource_reallocation:'Resource re-allocation',
      hold_release:         'Hold release',
      rush_order:           'Rush order',
    }[payload.action_type] || payload.action_type;

    showToast(`GM Intervention: ${actionLabel} — ${payload.reason}`, 'warn', 8000);
    _addEventFeedItem('gm', `${payload.gm_name}: ${actionLabel}${payload.project_id ? ' on project' : ''}`, payload);

    // Refresh dashboard intervention list if GM is viewing it
    if (AppState.currentPage === 'dashboard' && typeof loadInterventions === 'function') {
      loadInterventions();
    }
  });

  // S-10: Rush order — production and procurement get an urgent toast
  _socket.on('rush:order_triggered', (payload) => {
    showToast(`Rush order triggered by ${payload.triggered_by} — re-prioritise now`, 'error', 8000);
    _addEventFeedItem('rush', `Rush order — ${payload.triggered_by}: ${payload.reason}`, payload);
  });

  // ARCH-03: Project assigned by GM → Production + QC
  _socket.on('project:assigned', (payload) => {
    showToast(`Project assigned — ${payload.projectNo}: ${payload.projectName}`, 'info', 6000);
    _addEventFeedItem('assign', `${payload.assignedBy} assigned ${payload.projectNo} to Production & QC`, payload);
    if (AppState.currentPage === 'projects') renderProjects();
  });

  // ARCH-03: BOQ/MRP generated → Procurement + Store
  _socket.on('boq:generated', (payload) => {
    showToast(`BOQ ready for review — ${payload.shortageCount} shortages identified`, 'info', 6000);
    _addEventFeedItem('boq', `BOQ generated: ${payload.totalItems} items, ${payload.shortageCount} short`, payload);
  });

  // ARCH-03: GRN received → QC inspection call
  _socket.on('grn:received', (payload) => {
    showToast(`GRN ${payload.grnNo} received — incoming inspection required`, 'warn', 6000);
    _addEventFeedItem('grn', `GRN ${payload.grnNo} logged — ${payload.lineCount} lines pending QC`, payload);
  });

  // ARCH-03: NCR raised → Production notified to stop affected work
  _socket.on('ncr:raised', (payload) => {
    const urgency = payload.severity === 'critical' || payload.severity === 'major' ? 'error' : 'warn';
    showToast(`NCR raised — ${payload.ncrNo} (${payload.severity}) — check affected work`, urgency, 8000);
    _addEventFeedItem('ncr', `NCR ${payload.ncrNo} raised — ${payload.severity}`, payload);
  });

  // ARCH-03: Inspection passed → Store release
  _socket.on('inspection:passed', (payload) => {
    showToast(`Incoming inspection passed — GRN cleared for stock release`, 'success', 5000);
    _addEventFeedItem('inspect', `GRN inspection ${payload.result} — cleared for issue`, payload);
  });

  // ARCH-03: Deviation request → QC + GM
  _socket.on('deviation:requested', (payload) => {
    showToast(`Deviation request submitted — review required`, 'warn', 6000);
    _addEventFeedItem('deviation', `Deviation requested on project ${payload.projectId}`, payload);
  });
}

// ── Room management ────────────────────────────────────────────
const _subscribedRooms = { projects: new Set(), machines: new Set() };

function joinProjectRoom(projectId) {
  _subscribedRooms.projects.add(projectId);
  _socket?.emit('join:project', projectId);
}

function joinMachineRoom(machineId) {
  _subscribedRooms.machines.add(machineId);
  _socket?.emit('join:machine', machineId);
}

function leaveProjectRoom(projectId) {
  _subscribedRooms.projects.delete(projectId);
  _socket?.emit('leave:project', projectId);
}

function _resubscribe() {
  _subscribedRooms.projects.forEach((id) => _socket.emit('join:project', id));
  _subscribedRooms.machines.forEach((id) => _socket.emit('join:machine', id));
}

// ── Status dot (topbar indicator) ─────────────────────────────
function _setStatusDot(color) {
  if (!_statusDot) _statusDot = document.getElementById('wsStatusDot');
  if (!_statusDot) return;
  _statusDot.style.background = color === 'green' ? 'var(--green)' : 'var(--red)';
  _statusDot.title = color === 'green' ? 'Live feed connected' : 'Live feed disconnected';
}

// ── Event feed DOM helper ──────────────────────────────────────
function _addEventFeedItem(type, message, payload) {
  const feed = document.getElementById('activityFeed');
  if (!feed) return;

  const icons = {
    phase:     '🔄',
    hold:      '🛑',
    mr:        '📦',
    finance:   '💰',
    violation: '⚠️',
    gm:        '🏛️',
    rush:      '🚨',
    assign:    '📋',
    boq:       '📊',
    grn:       '🚚',
    ncr:       '❌',
    inspect:   '✅',
    deviation: '⚡',
  };

  const item = document.createElement('div');
  item.className = 'activity-item';
  item.innerHTML = `
    <div class="activity-icon">${icons[type] || '📡'}</div>
    <div class="activity-body">
      <div class="activity-text">${message}</div>
      <div class="activity-time">${new Date().toLocaleTimeString()}</div>
    </div>`;

  feed.prepend(item);

  // Keep feed to last 20 items
  while (feed.children.length > 20) feed.lastChild.remove();
}

// ── Boot: listen for auth events ───────────────────────────────
window.addEventListener('nf:auth:login',  () => connectSocket());
window.addEventListener('nf:auth:logout', () => {
  _socket?.disconnect();
  _socket = null;
  _setStatusDot('red');
});
