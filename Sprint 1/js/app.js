/* ============================================================
   NexaForge ERP — Core Application
   ============================================================ */

'use strict';

// ── State ──────────────────────────────────────────────────
const DEFAULT_PROJECTS = [
  {
    id: 'P-2401', name: '316L Storage Tank — 50,000L', client: 'ADNOC',
    status: 'active', phase: 4, progress: 58,
    value: 284000, dueDate: '2025-08-15',
    phases: ['done','done','done','active','pending','pending','pending']
  },
  {
    id: 'P-2402', name: 'Pressure Vessel ASME VIII — 3-unit', client: 'Petrofac',
    status: 'planning', phase: 2, progress: 22,
    value: 97500, dueDate: '2025-10-30',
    phases: ['done','active','pending','pending','pending','pending','pending']
  },
  {
    id: 'P-2403', name: '304 Stainless Heat Exchanger', client: 'ENOC',
    status: 'qc-hold', phase: 5, progress: 71,
    value: 142000, dueDate: '2025-07-01',
    phases: ['done','done','done','done','active','pending','pending']
  }
];

const DEFAULT_ALERTS = [
  { type: 'error', title: 'QC Hold — P-2403', desc: 'MTC verification failed on batch HN-44821. NCR raised.' },
  { type: 'warn', title: 'Welder cert expiry', desc: 'Ali Hassan — GTAW cert expires in 12 days.' },
  { type: 'warn', title: 'PO overdue — P-2401', desc: '316L plate (15mm) from Outokumpu — 4 days delayed.' },
  { type: 'info', title: 'GRN logged — P-2402', desc: 'Dish ends received. Pending incoming QC inspection.' },
];

const AppState = {
  currentPage: 'dashboard',
  sidebarCollapsed: false,
  activeProject: null,
  projects: [...DEFAULT_PROJECTS],
  alerts: [...DEFAULT_ALERTS],
  purchaseRequests: [],

  // ── P0.6.1 — Auth store (formalised) ────────────────────────
  currentUser:  null,    // { id?, name, role, department, email? }
  department:   null,    // 'gm' | 'production' | 'qc' | 'finance' | ...
  permissions:  [],      // [{ page, label, group }] — sidebar nav entries the user is allowed
  isDemoMode:   false,
  accent:       null,    // dept-specific accent colour (set by buildSidebar)

  // Role hierarchy mirror of backend `middleware/auth.js`
  // user (0) < senior (1) < manager (2) < admin (3) < gm (4)
  ROLES: ['user', 'senior', 'manager', 'admin', 'gm'],

  /** True if current user's role meets or exceeds `minRole`. */
  hasRole(minRole) {
    const cur = this.ROLES.indexOf((this.currentUser?.role || '').toLowerCase());
    const req = this.ROLES.indexOf((minRole || '').toLowerCase());
    return cur >= 0 && req >= 0 && cur >= req;
  },

  /** GM and admin bypass all department/page checks. */
  isGM() { return (this.currentUser?.role || '').toLowerCase() === 'gm'; },
  isAdmin() { return this.hasRole('admin'); },

  /**
   * Returns true if the user can navigate to a given sidebar page.
   * GM bypasses; otherwise the page must be in their permissions table.
   */
  canAccessPage(page) {
    if (this.isGM()) return true;
    if (!this.permissions || !this.permissions.length) return true; // pre-login or open mode
    return this.permissions.some(n => n.page === page);
  },

  /**
   * Action-level permission check, e.g. hasPermission('finance.invoice.approve').
   * Looks up PERMISSION_KEYS map keyed by dept + min-role.
   */
  hasPermission(key) {
    if (this.isGM()) return true;
    if (!key) return false;
    const rule = PERMISSION_KEYS[key];
    if (!rule) return false; // unknown key → deny by default
    const deptOk = !rule.depts || rule.depts.includes(this.department);
    const roleOk = !rule.minRole || this.hasRole(rule.minRole);
    return deptOk && roleOk;
  },

  /** Shorthand: `AppState.can('approve', 'finance.invoice')` → 'finance.invoice.approve' */
  can(action, resource) { return this.hasPermission(`${resource}.${action}`); },
};

/**
 * P0.6.2 — Permission key registry
 * Maps action keys to { depts, minRole }. GM bypasses all checks.
 * Format: `<module>.<resource>.<action>`. Add new keys as features ship.
 */
const PERMISSION_KEYS = {
  // Finance & Job Costing (Module 6)
  'finance.invoice.create':  { depts: ['finance'], minRole: 'user' },
  'finance.invoice.approve': { depts: ['finance'], minRole: 'manager' },
  'finance.payment.release': { depts: ['finance'], minRole: 'manager' },
  'finance.budget.approve':  { depts: ['finance'], minRole: 'manager' },
  'finance.report.view':     { depts: ['finance'], minRole: 'user' },

  // Procurement
  'procurement.po.create':   { depts: ['procurement'], minRole: 'user' },
  'procurement.po.approve':  { depts: ['procurement'], minRole: 'manager' },
  'procurement.vendor.edit': { depts: ['procurement'], minRole: 'senior' },

  // QC
  'qc.inspection.perform':   { depts: ['qc'], minRole: 'user' },
  'qc.ncr.raise':            { depts: ['qc', 'production'], minRole: 'user' },
  'qc.ncr.close':            { depts: ['qc'], minRole: 'senior' },
  'qc.report.sign':          { depts: ['qc'], minRole: 'manager' },

  // Production
  'production.jobcard.start':   { depts: ['production'], minRole: 'user' },
  'production.jobcard.close':   { depts: ['production'], minRole: 'senior' },
  'production.dispatch.release':{ depts: ['production'], minRole: 'manager' },

  // Welding
  'welding.wpq.approve':     { depts: ['welding', 'qc'], minRole: 'manager' },
  'welding.joint.signoff':   { depts: ['welding'], minRole: 'senior' },

  // Store
  'store.material.issue':    { depts: ['store'], minRole: 'user' },
  'store.stock.adjust':      { depts: ['store'], minRole: 'senior' },

  // HR
  'hr.leave.approve':        { depts: ['hr'], minRole: 'manager' },
  'hr.payroll.run':          { depts: ['hr'], minRole: 'manager' },

  // HSE (Module 8 — new)
  'hse.permit.issue':        { depts: ['production', 'qc', 'welding'], minRole: 'manager' },
  'hse.incident.raise':      { minRole: 'user' }, // any dept can raise
  'hse.incident.investigate':{ minRole: 'senior' },

  // Maintenance (Module 9 — new)
  'maintenance.pm.execute':  { minRole: 'user' },
  'maintenance.calibration.approve': { minRole: 'senior' },

  // Documents (Module 7 — new)
  'document.publish':        { minRole: 'manager' },
  'document.approve':        { minRole: 'manager' },

  // Analytics (Module 10 — new)
  'analytics.report.export': { minRole: 'senior' },
  'analytics.builder.save':  { depts: ['analytics'], minRole: 'senior' },
};
window.PERMISSION_KEYS = PERMISSION_KEYS;

/**
 * fmt - formats values for display
 * @param {any} val - value to format
 * @returns {string} formatted value
 */
function fmt(val) {
  if (val === undefined || val === null || val === '') return '—';
  if (typeof val === 'number') {
    return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  return val;
}

// ── Navigation ─────────────────────────────────────────────
function navigate(page) {
  // P0.6.2 — Route guard via AppState.canAccessPage() (GM bypasses)
  if (!AppState.canAccessPage(page)) {
    render403(page);
    return;
  }

  AppState.currentPage = page;

  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  const labels = {
    dashboard:   'Dashboard',
    projects:    'Projects',
    marketing:   'Marketing & CRM',
    production:  'Production',
    quality:     'Quality Control',
    procurement: 'Procurement',
    inventory:   'Store & Inventory',
    finance:     'Finance',
    hr:          'HR & Workforce',
    welding:     'Welding / WPS',
    analytics:   'Analytics & KPIs',
    documents:   'Document Management',
    hse:         'HSE & Compliance',
    maintenance: 'Maintenance & Calibration',
  };
  document.getElementById('breadcrumb').textContent = labels[page] || page;

  const content = document.getElementById('pageContent');

  // S-16: page slide transition
  content.classList.remove('page-transitioning');
  void content.offsetWidth; // force reflow
  content.innerHTML = '';
  content.classList.add('page-transitioning');

  // S-16: dept colour identity
  const deptMap = {
    dashboard:'', projects:'', marketing:'marketing', production:'production',
    quality:'qc', procurement:'procurement', inventory:'store', finance:'finance',
    hr:'hr', welding:'welding', analytics:'analytics', documents:'documents',
    hse:'hse', maintenance:'maintenance',
  };
  const deptNames = {
    marketing:'Marketing', production:'Production', quality:'Quality Control',
    procurement:'Procurement', inventory:'Store', finance:'Finance', hr:'HR',
    welding:'Welding', analytics:'Analytics', documents:'Documents',
    hse:'HSE & Compliance', maintenance:'Maintenance',
  };
  const dept = deptMap[page] || '';
  document.body.dataset.dept = dept || 'gm';
  const badge = document.getElementById('deptBadge');
  if (badge) {
    if (dept) { badge.textContent = deptNames[page] || dept; badge.style.display = 'inline-flex'; }
    else { badge.style.display = 'none'; }
  }

  const renderers = {
    dashboard:   renderDashboard,
    projects:    renderProjects,
    marketing:   enterMarketingModule,
    production:  enterProductionModule,
    quality:     enterQCModule,
    procurement: renderProcurement,
    inventory:   renderInventory,
    finance:     enterFinanceModule,
    hr:          enterHRModule,
    welding:     () => { window._weldSidebarMode = false; return renderWelding(); },
    analytics:   renderAnalytics,
    documents:   () => renderPlaceholderPage('documents'),
    hse:         () => renderPlaceholderPage('hse'),
    maintenance: () => renderPlaceholderPage('maintenance'),
  };

  const renderer = renderers[page];
  if (renderer) {
    // Production, QC, Store & Finance handle their own sidebar and breadcrumb
    if (['production', 'quality', 'inventory', 'finance', 'hr'].includes(page)) {
      const r = renderer();
      if (r instanceof Promise) r.catch(err => renderPageError(page, err));
      return;
    }
    const prevHTML = content.innerHTML;
    const result = renderer();
    if (result instanceof Promise) {
      if (content.innerHTML === prevHTML) {
        content.innerHTML = '<div class="page-loader"><div class="page-loader-spinner"></div></div>';
      }
      result
        .then(() => _postNavigateEffects(content))
        .catch(err => renderPageError(page, err));
    } else {
      _postNavigateEffects(content);
    }
  }
}

function _postNavigateEffects(content) {
  // S-16: add stagger-in animation to KPI strips and metric grids
  content.querySelectorAll('.kpi-strip, .metric-grid, .bento-grid').forEach(strip => {
    strip.classList.add('stagger-in');
  });

  // S-16: re-trigger animations for the new page content
  if (window.S16) {
    S16.initCountUps(content);
    S16.triggerSparklines(content);
    S16.triggerChartLines(content);
  }
}

function renderPageError(page, err) {
  const content = document.getElementById('pageContent');
  content.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                padding:80px 24px;text-align:center;gap:20px;
                background:var(--bg-surface);border:1px solid var(--border);
                border-radius:var(--radius-xl);margin-top:24px">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style="opacity:0.35">
        <circle cx="24" cy="24" r="20" stroke="var(--amber)" stroke-width="2"/>
        <path d="M24 16v10M24 30v2" stroke="var(--amber)" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
      <div style="font-size:17px;font-weight:700;color:var(--text-primary)">Failed to load page</div>
      <div style="font-size:13px;color:var(--text-muted);max-width:400px">${err?.message || 'An unexpected error occurred'}</div>
      <button class="btn btn-primary btn-sm" onclick="navigate('${page}')">Retry</button>
    </div>`;
}

function render403(page) {
  document.getElementById('breadcrumb').textContent = 'Access Denied';
  document.getElementById('pageContent').innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                padding:80px 24px;text-align:center;gap:20px;
                background:var(--bg-surface);border:1px solid var(--border);
                border-radius:var(--radius-xl);margin-top:24px">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style="opacity:0.35">
        <circle cx="24" cy="24" r="20" stroke="var(--red)" stroke-width="2"/>
        <path d="M24 14v12M24 30v2" stroke="var(--red)" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
      <div>
        <div style="font-family:var(--font-display);font-size:18px;font-weight:700;
                    color:var(--text-primary);margin-bottom:8px">Access restricted</div>
        <div style="font-size:13px;color:var(--text-secondary);max-width:380px;line-height:1.7">
          You don't have permission to view the <strong>${page}</strong> module.
          Contact your GM if you need access.
        </div>
      </div>
      <span class="badge" style="background:rgba(220,38,38,0.12);color:var(--red)">403 — Forbidden</span>
    </div>`;
}

// ── Sidebar — always expanded ────────────────────────────────
function toggleSidebar() {
  // Mobile only: toggle open/close overlay
  if (window.innerWidth <= 768) {
    document.body.classList.toggle('sidebar-open');
  }
}

// Always expanded on desktop
document.body.classList.add('sidebar-expanded');
AppState.sidebarCollapsed = false;

// Close sidebar on outside click (mobile)
document.addEventListener('click', (e) => {
  if (window.innerWidth <= 768) {
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('mobileMenuBtn');
    if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
      document.body.classList.remove('sidebar-open');
    }
  }
});

// ── Toast system ────────────────────────────────────────────
function showToast(message, type = 'info', duration = 4000) {
  const icons = {
    success: `<svg class="toast-icon" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="var(--green)" stroke-width="1.4"/><path d="M6 9l2 2 4-4" stroke="var(--green)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    warn:    `<svg class="toast-icon" viewBox="0 0 18 18" fill="none"><path d="M9 3L16 15H2L9 3z" stroke="var(--amber)" stroke-width="1.4" stroke-linejoin="round"/><path d="M9 8v3M9 13v.5" stroke="var(--amber)" stroke-width="1.4" stroke-linecap="round"/></svg>`,
    error:   `<svg class="toast-icon" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="var(--red)" stroke-width="1.4"/><path d="M6.5 6.5l5 5M11.5 6.5l-5 5" stroke="var(--red)" stroke-width="1.4" stroke-linecap="round"/></svg>`,
    info:    `<svg class="toast-icon" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="var(--blue)" stroke-width="1.4"/><path d="M9 8v5M9 6v.5" stroke="var(--blue)" stroke-width="1.4" stroke-linecap="round"/></svg>`,
  };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;
  document.getElementById('toastContainer').appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(20px)'; toast.style.transition = '0.25s'; setTimeout(() => toast.remove(), 260); }, duration);
}

// ── Chart helpers (shared across all department dashboards) ──
function sparkline(data, color, height = 32, width = 80) {
  if (!data?.length) return '';
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const lastPt = pts.split(' ').pop().split(',');
  return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="display:block">
    <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${parseFloat(lastPt[0])}" cy="${parseFloat(lastPt[1])}" r="2.5" fill="${color}"/>
  </svg>`;
}

function kpiCard(label, value, sub, color, trend = null) {
  // S-16: extract raw number for count-up; keep prefix/suffix (e.g. $, %)
  const numMatch = String(value).match(/^([^0-9-]*)(-?[\d,.]+)([^0-9]*)$/);
  const prefix   = numMatch ? numMatch[1] : '';
  const rawNum   = numMatch ? numMatch[2].replace(/,/g, '') : null;
  const suffix   = numMatch ? numMatch[3] : '';
  const valueHtml = rawNum !== null
    ? `<span data-countup data-target="${rawNum}" data-prefix="${prefix}" data-suffix="${suffix}">${value}</span>`
    : value;

  return `
    <div class="kpi-card metric-card--glass">
      <div class="kpi-accent-bar" style="background:${color}"></div>
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div style="flex:1;min-width:0">
          <div class="kpi-label">${label}</div>
          <div class="kpi-value" style="color:${color}">${valueHtml}</div>
          <div class="kpi-sub">${sub}</div>
        </div>
        ${trend ? `<div style="padding-top:4px;flex-shrink:0">${sparkline(trend, color)}</div>` : ''}
      </div>
    </div>`;
}

// ── Utility helpers ─────────────────────────────────────────
function fmt(num) {
  if (num >= 1000000) return '$' + (num/1000000).toFixed(1) + 'M';
  if (num >= 1000)    return '$' + (num/1000).toFixed(0) + 'K';
  return '$' + num;
}
function fmtDate(str) {
  const d = new Date(str);
  return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}
function daysUntil(str) {
  const diff = new Date(str) - new Date();
  return Math.ceil(diff / 86400000);
}
function phaseLabel(n) {
  return ['Initiation','Exec assign','Planning','Inventory','QC inspect','Shop floor','Dispatch'][n-1] || 'Unknown';
}
function statusBadge(status) {
  const map = {
    active:   ['badge-green',  'Active'],
    planning: ['badge-blue',   'Planning'],
    'qc-hold':['badge-amber',  'QC Hold'],
    complete: ['badge-muted',  'Complete'],
    dispatch: ['badge-green',  'Dispatched'],
  };
  const [cls, label] = map[status] || ['badge-muted', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

// ── Placeholder page renderer ───────────────────────────────
function renderPlaceholderPage(page) {
  const meta = {
    marketing:   { icon: '📊', title: 'Marketing & CRM', desc: 'Customer pipeline, quoting engine, CAD ingestion, project entity creation.' },
    production:  { icon: '⚙️', title: 'Production', desc: 'BOM management, MRP engine, shop-floor scheduling, MES integration.' },
    quality:     { icon: '✅', title: 'Quality Control', desc: 'Digital ITP, hold/witness points, NCR workflow, MRB auto-generation.' },
    procurement: { icon: '🛒', title: 'Procurement', desc: 'PR automation, supplier scorecards, PO management, approval workflows.' },
    inventory:   { icon: '📦', title: 'Store & Inventory', desc: 'Heat-number traceability, GRN, quarantine management, remnant tracking.' },
    finance:     { icon: '💰', title: 'Finance', desc: 'Job costing, milestone billing, AP/AR, revenue recognition.' },
    hr:          { icon: '👥', title: 'HR & Workforce', desc: 'Skills matrix, welder certification management, expiry alerts.' },
    welding:     { icon: '🔥', title: 'Welding / WPS', desc: 'WPS/PQR/WPQ management, visual weld mapping, IIoT telemetry.' },
    analytics:   { icon: '📈', title: 'Analytics & KPIs', desc: 'Role-specific dashboards, OEE, FPY, COPQ, real-time metrics.' },
    documents:   { icon: '📂', title: 'Document Management', desc: 'MDR register, GA drawings, transmittal logs, automated approval workflows.' },
    hse:         { icon: '🛡️', title: 'HSE & Compliance', desc: 'Permit-to-work requests, audit calendars, continuity logs, incident reports.' },
    maintenance: { icon: '🔧', title: 'Maintenance & Calibration', desc: 'Preventive maintenance schedules, breakdown work orders, instrument calibration.' },
  };
  const m = meta[page] || { icon: '🔧', title: page, desc: 'Module under construction.' };

  document.getElementById('pageContent').innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">${m.title}</div>
        <div class="page-subtitle">${m.desc}</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" onclick="showToast('Module coming in next build phase','info')">
          <svg viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6" stroke="currentColor" stroke-width="1.4"/><path d="M7.5 5v3l2 1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
          Scheduled
        </button>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 24px;text-align:center;gap:20px;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-xl);border-style:dashed">
      <div style="font-size:48px;opacity:0.4">${m.icon}</div>
      <div>
        <div style="font-family:var(--font-display);font-size:18px;font-weight:700;color:var(--text-primary);margin-bottom:8px">${m.title} module</div>
        <div style="font-size:13px;color:var(--text-secondary);max-width:400px;line-height:1.7">${m.desc}</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
        <span class="badge badge-blue">Phase 3–5 build</span>
        <span class="badge badge-muted">UI scaffold ready</span>
        <span class="badge badge-muted">Event bus wired</span>
      </div>
      <button class="btn btn-primary btn-sm" onclick="showToast('Added to build queue — coming next sprint','success')">Request priority build</button>
    </div>`;
}

// ── Dept-driven sidebar builder ─────────────────────────────
// Nav item SVG icons keyed by page name
const NAV_ICONS = {
  dashboard:   `<rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.4"/><rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.4"/><rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.4"/><rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.4"/>`,
  projects:    `<path d="M3 5C3 3.9 3.9 3 5 3h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" stroke="currentColor" stroke-width="1.4"/><path d="M7 8h6M7 11h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  marketing:   `<path d="M17 3L10.5 9.5M17 3H12M17 3V8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 6H5a2 2 0 00-2 2v7a2 2 0 002 2h7a2 2 0 002-2v-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  production:  `<path d="M4 16V9l6-6 6 6v7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><rect x="8" y="12" width="4" height="4" rx="0.5" stroke="currentColor" stroke-width="1.4"/>`,
  quality:     `<path d="M10 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3L10 14.2l-4.8 2.4.9-5.3L2.3 7.6l5.3-.8L10 2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>`,
  procurement: `<path d="M6 2l1 4h10l-1.5 6H7L6 2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><circle cx="8" cy="17" r="1.2" stroke="currentColor" stroke-width="1.4"/><circle cx="15" cy="17" r="1.2" stroke="currentColor" stroke-width="1.4"/>`,
  inventory:   `<rect x="3" y="8" width="14" height="10" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M7 8V6a3 3 0 016 0v2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  finance:     `<rect x="2" y="5" width="16" height="12" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M2 9h16" stroke="currentColor" stroke-width="1.4"/><path d="M6 13h2M10 13h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  hr:          `<circle cx="10" cy="7" r="3.5" stroke="currentColor" stroke-width="1.4"/><path d="M3 18c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  welding:     `<path d="M5 15l3-8 4 10 3-6 2 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  analytics:   `<path d="M3 17l4-5 4 3 3-6 3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 17h14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  documents:   `<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  hse:         `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 11l2 2 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  maintenance: `<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`,
};

async function loadPermissionsAndBuildSidebar() {
  if (['production', 'quality', 'inventory', 'finance', 'hr'].includes(AppState.currentPage)) return;
  try {
    let data;
    if (AppState.isDemoMode) {
      const currentDept = AppState.department || 'gm';
      const nav = (typeof DEPT_NAV !== 'undefined' ? DEPT_NAV[currentDept] : null) || [
        { page: 'dashboard',   label: 'Dashboard',       group: 'Overview' },
        { page: 'projects',    label: 'Projects',         group: 'Overview', badge: '3' },
        { page: 'production',  label: 'Production',       group: 'Operations' },
        { page: 'quality',     label: 'Quality Control',  group: 'Operations' },
        { page: 'procurement', label: 'Procurement',      group: 'Operations' },
        { page: 'inventory',   label: 'Store & Inventory',group: 'Operations' },
        { page: 'marketing',   label: 'Marketing & CRM',  group: 'Business' },
        { page: 'finance',     label: 'Finance',          group: 'Business' },
        { page: 'hr',          label: 'HR & Workforce',   group: 'Business' },
        { page: 'analytics',   label: 'Analytics & KPIs', group: 'Technical' },
        { page: 'documents',   label: 'Documents',        group: 'Technical' },
        { page: 'hse',         label: 'HSE & Compliance', group: 'Technical' },
        { page: 'maintenance', label: 'Maintenance',      group: 'Technical' },
      ];
      
      const accentsMap = {
        gm:          '#103B2E',
        production:  '#f97316',
        qc:          '#14b8a6',
        procurement: '#84cc16',
        store:       '#06b6d4',
        finance:     '#f59e0b',
        marketing:   '#8b5cf6',
        hr:          '#f43f5e',
        welding:     '#3b82f6',
        analytics:   '#6366f1',
      };
      
      data = {
        department: currentDept,
        accent: accentsMap[currentDept] || '#103B2E',
        nav: nav,
      };
    } else {
      data = await api.get('/me/permissions');
    }

    AppState.permissions = data.nav;
    AppState.department  = data.department;
    AppState.accent      = data.accent;

    // Apply department accent colour as CSS variable
    document.documentElement.style.setProperty('--dept-accent', data.accent);

    // S-16: set data-dept on body for CSS colour-identity scope
    const deptSlug = data.department || 'gm';
    document.body.dataset.dept = deptSlug;

    buildSidebar(data.nav, data.accent);
  } catch (err) {
    console.error('[ARCH-01] Failed to load permissions', err);
  }
}

function buildSidebar(navItems, accent) {
  const nav = document.querySelector('.sidebar-nav');
  if (!nav) return;
  if (!navItems || !Array.isArray(navItems)) return;

  // Group items
  const groups = {};
  navItems.forEach(item => {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  });

  nav.innerHTML = Object.entries(groups).map(([groupName, items]) => `
    <div class="nav-group">
      <span class="nav-group-label">${groupName}</span>
      ${items.map(item => `
        <a class="nav-item${item.page === AppState.currentPage ? ' active' : ''}"
           data-page="${item.page}"
           data-tooltip="${item.label}"
           onclick="navigate('${item.page}')"
           style="--item-accent:${accent}">
          <svg class="nav-icon" viewBox="0 0 20 20" fill="none">
            ${NAV_ICONS[item.page] || ''}
          </svg>
          <span>${item.label}</span>
          ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
        </a>
      `).join('')}
    </div>
  `).join('');
}

/* ── Production Module — Sidebar Context Switching ─────────── */
let _globalNavCache = null;
let _prodActiveSubPage = 'control-centre';

const PROD_NAV_ICONS = {
  'control-centre': `<rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.4"/><rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.4"/><rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.4"/><rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.4"/>`,
  'projects': `<path d="M4 7h12M4 11h8M4 15h10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><rect x="2" y="3" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.4"/>`,
  'manufacturing': `<path d="M10 3v5l4 2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.4"/>`,
  'bom': `<path d="M4 4h12M4 8h8M4 12h10M4 16h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  'schedule': `<rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M3 8h14M7 4V2M13 4V2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  'workcentres': `<path d="M4 16V9l6-6 6 6v7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><rect x="8" y="12" width="4" height="4" rx="0.5" stroke="currentColor" stroke-width="1.4"/>`,
  'routing': `<circle cx="5" cy="5" r="2.5" stroke="currentColor" stroke-width="1.4"/><circle cx="15" cy="5" r="2.5" stroke="currentColor" stroke-width="1.4"/><circle cx="10" cy="15" r="2.5" stroke="currentColor" stroke-width="1.4"/><path d="M7 6l3 7M13 6l-3 7" stroke="currentColor" stroke-width="1.2"/>`,
  'mrp': `<rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M3 10h14M10 3v14" stroke="currentColor" stroke-width="1.2"/>`,
  'assets': `<path d="M7 3l-4 6h6l-2 8 8-10h-6l3-4H7z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>`,
  'maintenance': `<path d="M14.5 5.5l-3 3M4 16l6-6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="14" cy="6" r="3" stroke="currentColor" stroke-width="1.4"/><path d="M3 13l2 2 2-2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  'mrf': `<path d="M6 3h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z" stroke="currentColor" stroke-width="1.4"/><path d="M7 8h6M7 11h4M7 14h2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  'quality': `<path d="M10 2l2.2 4.4 4.8.7-3.5 3.4.8 4.8L10 13l-4.3 2.3.8-4.8L3 7.1l4.8-.7L10 2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>`,
  'skills': `<circle cx="10" cy="7" r="3.5" stroke="currentColor" stroke-width="1.4"/><path d="M4 18c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M13 7l1.5 1.5 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  'analytics': `<path d="M3 17l4-5 4 3 3-6 3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 17h14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
};

const PROD_SIDEBAR_NAV = [
  { page: 'control-centre', label: 'Control Centre',        group: 'Overview' },
  { page: 'projects',       label: 'Projects',              group: 'Overview' },
  { page: 'manufacturing',  label: 'Manufacturing',         group: 'Operations' },
  { page: 'bom',            label: 'BOM Management',        group: 'Operations' },
  { page: 'schedule',       label: 'Master Schedule',       group: 'Operations' },
  { page: 'workcentres',    label: 'Work Centres',          group: 'Operations' },
  { page: 'routing',        label: 'Routing Steps',         group: 'Operations' },
  { page: 'mrp',            label: 'MRP / Materials',       group: 'Operations' },
  { page: 'assets',         label: 'Assets & Tooling',      group: 'Operations' },
  { page: 'maintenance',    label: 'Maintenance (MOM)',     group: 'Operations' },
  { page: 'mrf',            label: 'Inventory (MRF)',       group: 'Operations' },
  { page: 'quality',        label: 'Quality Gates',         group: 'Operations' },
  { page: 'skills',         label: 'Skill Matrix',          group: 'Technical' },
  { page: 'analytics',      label: 'Analytics',             group: 'Technical' },
  { page: 'welding-module', label: 'Welding / WPS',         group: 'Technical', onclick: 'enterWeldingModule("production")' },
];

let _preProductionPage = 'dashboard';

function enterProductionModule() {
  _preProductionPage = AppState.currentPage !== 'production' ? AppState.currentPage : _preProductionPage;
  if (!_globalNavCache) {
    _globalNavCache = AppState.permissions;
  }
  AppState.currentPage = 'production';

  buildProductionSidebar();
  renderProdSubPage(_prodActiveSubPage);
}

function exitProductionModule() {
  if (_globalNavCache) {
    buildSidebar(_globalNavCache, AppState.accent || '#e8622a');
    AppState.permissions = _globalNavCache;
  }
  _globalNavCache = null;
  const targetHash = '#/';
  if (location.hash !== targetHash && location.hash !== '') {
    history.pushState(null, '', targetHash);
  }
  navigate((_preProductionPage && AppState.canAccessPage(_preProductionPage))
    ? _preProductionPage : deptHome(AppState.department));
}

function buildProductionSidebar() {
  const nav = document.querySelector('.sidebar-nav');
  if (!nav) return;

  const qcLockCount = (typeof ProdData !== 'undefined' && ProdData.inspectionCalls)
    ? ProdData.inspectionCalls.filter(c => c.status === 'locked').length : 0;

  // Group items
  const groups = {};
  PROD_SIDEBAR_NAV.forEach(item => {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  });

  nav.innerHTML = Object.entries(groups).map(([groupName, items]) => `
    <div class="nav-group">
      <span class="nav-group-label">${groupName}</span>
      ${items.map(item => {
        const isActive = item.page === _prodActiveSubPage;
        const newProjCount = (item.page === 'projects' && typeof ProdData !== 'undefined')
          ? (ProdData._newlyAssigned || []).length : 0;
        const badge = (item.page === 'quality' && qcLockCount > 0)
          ? `<span class="nav-badge nav-badge-danger">${qcLockCount}</span>`
          : (newProjCount > 0)
          ? `<span class="nav-badge nav-badge-warn">${newProjCount} NEW</span>` : '';
        return `
        <a class="nav-item${isActive ? ' active' : ''}"
           data-page="${item.page}"
           data-tooltip="${item.label}"
           onclick="${item.onclick || `renderProdSubPage('${item.page}')`}"
           style="--item-accent:var(--dept-accent, var(--brand))">
          <svg class="nav-icon" viewBox="0 0 20 20" fill="none">
            ${PROD_NAV_ICONS[item.page] || '<path d=\'M3 15l4-8 4 10 3-6 2 4\' stroke=\'currentColor\' stroke-width=\'1.4\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/>'}
          </svg>
          <span>${item.label}</span>
          ${badge}
        </a>`;
      }).join('')}
    </div>
  `).join('');
}

function renderProdSubPage(subPage) {
  _prodActiveSubPage = subPage;

  // Sprint D: persist sub-page in URL hash for deep-linking + back button
  const targetHash = '#/production/' + subPage;
  if (location.hash !== targetHash) {
    history.pushState(null, '', targetHash);
  }

  // Update sidebar active state
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === subPage);
  });

  // Update breadcrumb
  const labels = {
    'control-centre': 'Control Centre',
    'projects':       'Projects',
    'manufacturing': 'Manufacturing',
    'bom': 'BOM Management',
    'schedule': 'Master Schedule',
    'workcentres': 'Work Centres',
    'routing': 'Routing Steps',
    'mrp': 'MRP / Materials',
    'assets': 'Assets & Tooling',
    'maintenance': 'Maintenance (MOM)',
    'mrf': 'Inventory (MRF)',
    'quality': 'Quality Gates',
    'skills': 'Skill Matrix',
    'analytics': 'Analytics',
    'schedule-builder': 'Schedule Builder',
  };
  document.getElementById('breadcrumb').textContent = 'Production › ' + (labels[subPage] || subPage);

  // Dept badge
  document.body.dataset.dept = 'production';
  const badge = document.getElementById('deptBadge');
  if (badge) { badge.textContent = 'PRODUCTION'; badge.style.display = 'inline-flex'; }

  // Page transition
  const content = document.getElementById('pageContent');
  content.classList.remove('page-transitioning');
  void content.offsetWidth;
  content.innerHTML = '';
  content.classList.add('page-transitioning');

  // Dispatch to renderer
  const renderers = {
    'control-centre': renderProdOverview,
    'projects':       renderProdProjects,
    'manufacturing':  renderProdManufacturing,
    'bom':            renderProdBOM,
    'schedule':       renderProdSchedule,
    'workcentres':    renderProdWorkCentres,
    'routing':        renderProdRouting,
    'mrp':            renderProdMRP,
    'assets':         renderProdAssets,
    'maintenance':    renderProdMaintenance,
    'mrf':            renderProdInventory,
    'quality':        renderProdQuality,
    'skills':         renderProdSkillMatrix,
    'analytics':      renderProdAnalytics,
    'schedule-builder': renderProdScheduleBuilder,
  };

  const renderer = renderers[subPage];
  if (renderer) renderer();

  // S-16 animations
  content.querySelectorAll('.kpi-strip, .metric-grid, .bento-grid').forEach(s => s.classList.add('stagger-in'));
  if (window.S16) { S16.initCountUps(content); S16.triggerSparklines(content); S16.triggerChartLines(content); }

  // Refresh QC badge without full sidebar rebuild (avoids focus reset)
  refreshQcBadge();

  // Mobile: auto-close sidebar after navigation
  if (window.innerWidth <= 768) document.body.classList.remove('sidebar-open');
}

function refreshQcBadge() {
  const count = (typeof ProdData !== 'undefined' && ProdData.inspectionCalls)
    ? ProdData.inspectionCalls.filter(c => c.status === 'locked').length : 0;
  const qualityNavItem = document.querySelector('.sidebar-nav .nav-item[data-page="quality"]');
  if (!qualityNavItem) return;
  let badge = qualityNavItem.querySelector('.nav-badge-danger');
  if (count > 0) {
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'nav-badge nav-badge-danger';
      qualityNavItem.appendChild(badge);
    }
    badge.textContent = count;
  } else if (badge) {
    badge.remove();
  }
}

// ── Boot ─────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  let loggedIn = false;
  if (typeof Auth !== 'undefined') {
    if (Auth.isLoggedIn()) {
      loggedIn = true;
    } else {
      try {
        await Auth.refresh();
        loggedIn = Auth.isLoggedIn();
      } catch (e) {
        // No valid session
      }
    }
  }

  if (loggedIn) {
    window.dispatchEvent(new CustomEvent('nf:auth:login'));
    loadPermissionsAndBuildSidebar().then(() => {
      // Sprint D: deep-link restore — if URL hash encodes a production/qc/store/finance sub-page, restore it
      const hashMatch = location.hash.match(/^#\/(production|qc|store|finance|hr|welding)\/(.+)$/);
      if (hashMatch) {
        const mod = hashMatch[1];
        const sub = hashMatch[2];
        if (mod === 'production') { enterProductionModule(); renderProdSubPage(sub); }
        else if (mod === 'qc') { enterQCModule(); renderQCSubPage(sub); }
        else if (mod === 'store') { enterStoreModule(); renderStoreSubPage(sub); }
        else if (mod === 'finance') { enterFinanceModule(); renderFinSubPage(sub); }
        else if (mod === 'hr') { enterHRModule(); renderHRSubPage(sub); }
        else if (mod === 'welding') { enterWeldingModule(); renderWeldSubPage(sub); }
      } else {
        // No deep-link hash — land in the user's module (GM → command centre).
        navigate(typeof deptHome === 'function' ? deptHome(AppState.department) : 'dashboard');
      }
    });
  } else if (typeof renderLogin === 'function') {
    if (!document.getElementById('loginOverlay')) {
      renderLogin();
    }
  } else {
    navigate('dashboard');
  }
});

// Sprint D: handle browser back/forward within sub-pages and modules
window.addEventListener('popstate', () => {
  const hashMatch = location.hash.match(/^#\/(production|qc|store|finance|hr|welding)\/(.+)$/);
  if (hashMatch) {
    const [_, mod, sub] = hashMatch;
    if (mod === 'production') {
      if (AppState.currentPage !== 'production') enterProductionModule();
      renderProdSubPage(sub);
    } else if (mod === 'qc') {
      if (AppState.currentPage !== 'quality') enterQCModule();
      renderQCSubPage(sub);
    } else if (mod === 'welding') {
      if (AppState.currentPage !== 'welding') enterWeldingModule();
      renderWeldSubPage(sub);
    } else if (mod === 'store') {
      if (AppState.currentPage !== 'inventory') enterStoreModule();
      renderStoreSubPage(sub);
    } else if (mod === 'finance') {
      if (AppState.currentPage !== 'finance') enterFinanceModule();
      renderFinSubPage(sub);
    } else if (mod === 'hr') {
      if (AppState.currentPage !== 'hr') enterHRModule();
      renderHRSubPage(sub);
    }
  } else {
    // If we are currently in a subpage module, exit it to restore global state
    if (AppState.currentPage === 'production') exitProductionModule();
    else if (AppState.currentPage === 'welding') exitWeldingModule();
    else if (AppState.currentPage === 'quality') exitQCModule();
    else if (AppState.currentPage === 'inventory') exitStoreModule();
    else if (AppState.currentPage === 'finance') exitFinanceModule();
    else if (AppState.currentPage === 'hr') exitHRModule();
  }
});

// Sprint D: Alt+1–9 keyboard shortcuts for module sidebar nav
window.addEventListener('keydown', e => {
  if (!e.altKey) return;
  const idx = parseInt(e.key, 10);
  if (idx < 1 || idx > 9) return;
  
  if (AppState.currentPage === 'production') {
    const target = PROD_SIDEBAR_NAV[idx - 1];
    if (target) { e.preventDefault(); renderProdSubPage(target.page); }
  } else if (AppState.currentPage === 'inventory') {
    const target = STORE_SIDEBAR_NAV[idx - 1];
    if (target) { e.preventDefault(); renderStoreSubPage(target.page); }
  } else if (AppState.currentPage === 'finance') {
    const target = FIN_SIDEBAR_NAV[idx - 1];
    if (target) { e.preventDefault(); renderFinSubPage(target.page); }
  } else if (AppState.currentPage === 'hr') {
    const target = HR_SIDEBAR_NAV[idx - 1];
    if (target) { e.preventDefault(); renderHRSubPage(target.page); }
  }
});

// ── P0.6.2 — Permission-gated UI helper ───────────────────────
/**
 * Wraps HTML in a permission check. If user lacks the key, returns ''.
 * Usage in templates:
 *   ${gated('finance.invoice.approve', `<button>Approve</button>`)}
 */
function gated(permKey, html) {
  return AppState.hasPermission(permKey) ? html : '';
}

/**
 * Hide-on-deny variant — renders a disabled stub with tooltip when user lacks the key.
 * Useful for surfacing forbidden actions to senior staff so they know what they're missing.
 */
function gatedDisabled(permKey, html, reason = 'You do not have permission for this action') {
  if (AppState.hasPermission(permKey)) return html;
  return `<span style="opacity:0.4;pointer-events:none" title="${reason}">${html}</span>`;
}

// Expose globally for inline use in module renderers
window.gated = gated;
window.gatedDisabled = gatedDisabled;

// ── Logout handler ────────────────────────────────────────────
async function handleLogout() {
  if (typeof logout === 'function') await logout();

  // UAT-01: Full state purge — prevent cross-department data leakage
  _purgeSessionState();

  window.dispatchEvent(new CustomEvent('nf:auth:logout'));
  document.getElementById('sidebar').style.display = 'none';
  document.getElementById('topbar').style.display  = 'none';
  if (typeof renderLogin === 'function' && !document.getElementById('loginOverlay')) {
    renderLogin();
  }
}

window.addEventListener('nf:auth:login', () => {
  // Re-load permissions whenever auth state refreshes (e.g. silent re-login)
  loadPermissionsAndBuildSidebar();
});

window.addEventListener('nf:auth:logout', () => {
  // UAT-01: Aggressive state purge — destroy all cached dept data
  _purgeSessionState();

  document.documentElement.style.removeProperty('--dept-accent');
  const nav = document.querySelector('.sidebar-nav');
  if (nav) nav.innerHTML = '';

  if (typeof renderLogin === 'function' && !document.getElementById('loginOverlay')) {
    document.getElementById('sidebar').style.display = 'none';
    document.getElementById('topbar').style.display  = 'none';
    renderLogin();
  }
});

/* ═══════════════════════════════════════════════════════════
   QUALITY CONTROL (QC) MODULE LOADER
   ═══════════════════════════════════════════════════════════ */
let _qcActiveSubPage = 'control-centre';

function enterQCModule() {
  if (!_globalNavCache) {
    _globalNavCache = AppState.permissions;
  }
  AppState.currentPage = 'quality';
  buildQCSidebar();
  renderQCSubPage(_qcActiveSubPage);
}

function exitQCModule() {
  if (_globalNavCache) {
    buildSidebar(_globalNavCache, AppState.accent || '#e8622a');
    AppState.permissions = _globalNavCache;
  }
  _globalNavCache = null;
  const targetHash = '#/';
  if (location.hash !== targetHash && location.hash !== '') {
    history.pushState(null, '', targetHash);
  }
  navigate(deptHome(AppState.department));
}

function buildQCSidebar() {
  const nav = document.querySelector('.sidebar-nav');
  if (!nav) return;

  document.body.dataset.dept = 'qc';

  const navItems = [
    { id: 'control-centre', label: 'QC Control Centre',  group: 'QC OVERVIEW', icon: 'M3 13h8V3H3v10zm0-2V5h4v6H3zm10 2h8V3h-8v10zm0-2V5h4v6h-4zM3 21h8v-6H3v6zm0-2v-2h4v2H3zm10 2h8v-6h-8v6zm0-2v-2h4v2h-4z' },
    { id: 'projects',        label: 'QC Projects',        group: 'QC OVERVIEW', icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z' },
    { id: 'itp',             label: 'ITP & Control Plan', group: 'OPERATIONS',  icon: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z' },
    { id: 'inspections',     label: 'Inspection Request', group: 'OPERATIONS',  icon: 'M18 17H6v-2h12v2zm0-4H6v-2h12v2zm0-4H6V7h12v2zM3 22l1.5-1.5L6 22l1.5-1.5L9 22l1.5-1.5L12 22l1.5-1.5L15 22l1.5-1.5L16.5 22l1.5-1.5L19.5 22l1.5-1.5L21 22V2l-1.5 1.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2l-1.5 1.5L6 2 4.5 3.5 3 2v20z' },
    { id: 'audits',          label: 'Audit Management',   group: 'OPERATIONS',  icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z' },
    { id: 'calibration',     label: 'Calibration',        group: 'OPERATIONS',  icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM7 13h10v-2H7v2z' },
    { id: 'documents',       label: 'Document Control',   group: 'OPERATIONS',  icon: 'M14 2H6c-1.1 0-1.99.89-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z' },
    { id: 'ncr',              label: 'NCR Management',     group: 'OPERATIONS',  icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z' },
    { id: 'reports-registry', label: 'Inspection Reports', group: 'OPERATIONS',  icon: 'M14 2H6c-1.1 0-1.99.89-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 14H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z' },
    { id: 'qc-dossier',       label: 'QC Dossier / MDR',   group: 'OPERATIONS',  icon: 'M10 2H4c-1.1 0-1.99.9-1.99 2L2 20c0 1.1.89 2 1.99 2h16c1.1 0 2-.9 2-2V8l-6-6zM8 18H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V8h2v2zm10 8h-8v-2h8v2zm0-4h-8v-2h8v2zm0-4h-8V8h8v2z' },
    { id: 'incoming',         label: 'Incoming QC',        group: 'OPERATIONS',  icon: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-1 14H5V8h14v10z' },
    { id: 'skills',          label: 'QC Skill Matrix',    group: 'PEOPLE',      icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
    { id: 'training',        label: 'Training Records',   group: 'PEOPLE',      icon: 'M12 3L1 9l11 6 9-4.91V17h2V9L12 3z' },
    { id: 'analytics',       label: 'Quality Analytics',  group: 'PEOPLE',      icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z' },
    { id: 'welding-module',  label: 'Welding / WPS',      group: 'WELDING',     icon: 'M3 17l4-9 5 12 3-7 2 4h4', onclick: 'enterWeldingModule("quality")' },
  ];

  const groups = {};
  navItems.forEach(item => {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  });

  nav.innerHTML = Object.entries(groups).map(([groupName, items]) => `
    <div class="nav-group">
      <span class="nav-group-label">${groupName}</span>
      ${items.map(item => `
        <a class="nav-item${item.id === _qcActiveSubPage ? ' active' : ''}"
           data-page="${item.id}"
           data-tooltip="${item.label}"
           onclick="${item.onclick || `renderQCSubPage('${item.id}')`}"
           style="--item-accent:var(--dept-accent, var(--brand))">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="${item.icon}"/>
          </svg>
          <span>${item.label}</span>
        </a>`).join('')}
    </div>
  `).join('');
}

function renderQCSubPage(subPage, params = {}) {
  _qcActiveSubPage = subPage;
  
  // Persist in URL hash for deep-linking
  const targetHash = '#/qc/' + subPage;
  if (location.hash !== targetHash) {
    history.pushState(null, '', targetHash);
  }

  // Update sidebar active state
  document.querySelectorAll('#sidebar .nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === subPage);
  });

  const content = document.getElementById('pageContent');
  if (!content) return;
  
  // Transition effect
  content.classList.remove('page-transitioning');
  void content.offsetWidth;
  content.innerHTML = '';
  content.classList.add('page-transitioning');

  // Breadcrumb update
  const labels = {
    'control-centre': 'Control Centre',
    'projects':       'Projects',
    'itp':            'ITP & Control Plan',
    'inspections':     'Inspection Requests',
    'audits':          'Audit Management',
    'calibration':     'Calibration',
    'documents':       'Document Control',
    'ncr':             'NCR Management',
    'reports-registry': 'Inspection Reports',
    'qc-dossier':      'QC Dossier / MDR',
    'incoming':        'Incoming QC',
    'skills':          'QC Skill Matrix',
    'training':        'Training & Certification',
    'analytics':       'Quality Analytics',
  };
  document.getElementById('breadcrumb').textContent = `Quality Control › ${labels[subPage] || subPage}`;

  // Call the renderer from qc.js
  const fnName1 = 'renderQC_' + subPage.replace(/-/g, '_');
  const fnName2 = 'renderQC' + subPage.charAt(0).toUpperCase() + subPage.slice(1);
  
  if (typeof window[fnName1] === 'function') {
    window[fnName1](params.id || null);
  } else if (typeof window[fnName2] === 'function') {
    window[fnName2](params.id || null);
  } else {
    content.innerHTML = `
      <div class="card" style="padding:40px;text-align:center">
        <div style="font-size:48px;margin-bottom:16px">🛠️</div>
        <div style="font-weight:600;font-size:18px">Page Under Construction</div>
        <div style="color:var(--text-muted);font-size:13px;margin-top:8px">The <b>${labels[subPage] || subPage}</b> module is currently being wired for live data.</div>
      </div>
    `;
  }
}

/* ═══════════════════════════════════════════════════════════
   WELDING / WPS SUB-MODULE — embedded under QC with its own sidebar
   ═══════════════════════════════════════════════════════════ */
let _weldActiveSubPage = 'overview';
const WELD_ACCENT = '#3b82f6';

// access: which departments see each section, and at what level ('edit' | 'view').
// Absent dept = section hidden for that department.
const WELD_SIDEBAR_NAV = [
  { page: 'overview', label: 'Overview',       group: 'WELDING OVERVIEW', icon: 'M3 13h8V3H3v10zm10 0h8V3h-8v10zM3 21h8v-6H3v6zm10 0h8v-6h-8v6z', access: { quality:'edit', production:'edit', hr:'edit' } },
  { page: 'wps',      label: 'WPS Library',     group: 'RECORDS',   icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z', access: { quality:'edit', production:'view' } },
  { page: 'pqr',      label: 'PQR Records',     group: 'RECORDS',   icon: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z', access: { quality:'edit', production:'view' } },
  { page: 'wpq',      label: 'WPQ Passports',   group: 'RECORDS',   icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z', access: { quality:'edit', hr:'edit' } },
  { page: 'joints',   label: 'Weld Register',   group: 'EXECUTION', icon: 'M3 17l6-6 4 4 8-8', access: { quality:'view', production:'edit' } },
  { page: 'iot',      label: 'IIoT Live',       group: 'EXECUTION', icon: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a6 6 0 016 6h-2a4 4 0 00-4-4V6z', access: { production:'edit' } },
  { page: 'nde',      label: 'NDE / NDT',       group: 'EXECUTION', icon: 'M11 4a7 7 0 105.29 11.71l4 4 1.42-1.42-4-4A7 7 0 0011 4zm0 2a5 5 0 110 10 5 5 0 010-10z', access: { quality:'edit', production:'view' } },
];

const WELD_LABELS = {
  overview:'Overview', wps:'WPS Library', pqr:'PQR Records', wpq:'WPQ Passports',
  joints:'Weld Register', iot:'IIoT Live', nde:'NDE / NDT',
};

// Department that launched the welding sub-module — drives section visibility + "Back to" target.
let _weldOrigin = 'quality';
const WELD_ORIGINS = {
  quality:    { label: 'QC',         accent: '#14b8a6', enter: 'enterQCModule' },
  production: { label: 'Production', accent: '#f97316', enter: 'enterProductionModule' },
  hr:         { label: 'HR',         accent: '#f43f5e', enter: 'enterHRModule' },
};

// Sections visible to the launching department, in nav order.
function weldVisibleNav() {
  return WELD_SIDEBAR_NAV.filter(item => item.access && item.access[_weldOrigin]);
}

// Whether the launching department may edit a welding section (vs. view-only).
// Standalone (non-embedded) welding access keeps full edit rights.
function weldCanEdit(section) {
  if (!window._weldSidebarMode) return true;
  const item = WELD_SIDEBAR_NAV.find(i => i.page === section);
  return !!(item && item.access && item.access[_weldOrigin] === 'edit');
}

function enterWeldingModule(origin) {
  if (origin && WELD_ORIGINS[origin]) _weldOrigin = origin;
  if (!_globalNavCache) _globalNavCache = AppState.permissions;
  window._weldSidebarMode = true;
  AppState.currentPage = 'welding';
  document.body.dataset.dept = 'welding';
  document.documentElement.style.setProperty('--dept-accent', WELD_ACCENT);

  const badge = document.getElementById('deptBadge');
  if (badge) { badge.textContent = 'Welding / WPS'; badge.style.display = 'inline-flex'; }

  // Land on a section this department can actually see.
  const visible = weldVisibleNav();
  if (!visible.some(i => i.page === _weldActiveSubPage)) {
    _weldActiveSubPage = visible.length ? visible[0].page : 'overview';
  }

  buildWeldingSidebar();
  renderWeldSubPage(_weldActiveSubPage);
}

function exitWeldingModule() {
  window._weldSidebarMode = false;
  const origin = WELD_ORIGINS[_weldOrigin] || WELD_ORIGINS.quality;
  document.documentElement.style.setProperty('--dept-accent', origin.accent);
  const enterFn = window[origin.enter];
  if (typeof enterFn === 'function') enterFn();
  else enterQCModule();
}

function buildWeldingSidebar() {
  const nav = document.querySelector('.sidebar-nav');
  if (!nav) return;

  const groups = {};
  weldVisibleNav().forEach(item => {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  });

  const originLabel = (WELD_ORIGINS[_weldOrigin] || WELD_ORIGINS.quality).label;
  const backItem = `
    <div class="nav-group">
      <a class="nav-item" data-tooltip="Back to ${originLabel}" onclick="exitWeldingModule()"
         style="--item-accent:${WELD_ACCENT}">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
          <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Back to ${originLabel}</span>
      </a>
    </div>`;

  nav.innerHTML = backItem + Object.entries(groups).map(([groupName, items]) => `
    <div class="nav-group">
      <span class="nav-group-label">${groupName}</span>
      ${items.map(item => `
        <a class="nav-item${item.page === _weldActiveSubPage ? ' active' : ''}"
           data-page="${item.page}"
           data-tooltip="${item.label}"
           onclick="renderWeldSubPage('${item.page}')"
           style="--item-accent:${WELD_ACCENT}">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="${item.icon}"/>
          </svg>
          <span>${item.label}</span>
        </a>`).join('')}
    </div>
  `).join('');
}

function renderWeldSubPage(subPage) {
  // Guard against deep-links / stale state to a section this department can't access.
  const visible = weldVisibleNav();
  if (!visible.some(i => i.page === subPage)) {
    subPage = visible.length ? visible[0].page : 'overview';
  }
  _weldActiveSubPage = subPage;
  if (typeof WeldData !== 'undefined') WeldData.activeTab = subPage;
  window._weldSidebarMode = true;

  const targetHash = '#/welding/' + subPage;
  if (location.hash !== targetHash) history.pushState(null, '', targetHash);

  document.querySelectorAll('#sidebar .nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === subPage);
  });

  document.getElementById('breadcrumb').textContent = `Welding / WPS › ${WELD_LABELS[subPage] || subPage}`;

  // Build the welding shell once (renderWelding ends by rendering WeldData.activeTab),
  // then just swap tabs on subsequent navigation.
  if (!document.getElementById('wldTabContent')) {
    if (typeof renderWelding === 'function') renderWelding();
  } else if (typeof switchWldTab === 'function') {
    switchWldTab(subPage);
  }
}

/* ═══════════════════════════════════════════════════════════
   STORE & INVENTORY MODULE LOADER
   ═══════════════════════════════════════════════════════════ */
let _storeActiveSubPage = 'control-centre';

const STORE_NAV_ICONS = {
  'control-centre': `<rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.4"/><rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.4"/><rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.4"/><rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.4"/>`,
  'stock-ledger': `<path d="M4 4h12M4 8h12M4 12h12M4 16h12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  'movements': `<path d="M4 12h12M12 8l4 4-4 4M8 16l-4-4 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  'bin-locator': `<path d="M3 3h14v14H3zM3 10h14M10 3v14" stroke="currentColor" stroke-width="1.4"/>`,
  'incoming-qc': `<path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3L12 14.2l-4.8 2.4.9-5.3L4.3 7.6l5.3-.8L12 2z" stroke="currentColor" stroke-width="1.4"/>`,
  'requisitions': `<path d="M5 3h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zM7 7h6M7 11h4M7 15h2" stroke="currentColor" stroke-width="1.4"/>`,
  'kitting': `<path d="M4 4h6v6H4zM10 10h6v6h-6z" stroke="currentColor" stroke-width="1.4"/><path d="M10 4h6v6h-6zM4 10h6v6H4z" stroke="currentColor" stroke-width="1.2" opacity="0.4"/>`,
  'quarantine': `<circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.4"/><path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" stroke-width="1.4"/>`,
  'remnants': `<path d="M3 17h14M3 17l4-5 4 3 3-6 3 3" stroke="currentColor" stroke-width="1.4"/>`,
  'heat-trace': `<path d="M10 2v16M5 7h10M5 13h10" stroke="currentColor" stroke-width="1.4"/><circle cx="10" cy="7" r="2" fill="currentColor"/><circle cx="10" cy="13" r="2" fill="currentColor"/>`,
  'cycle-count': `<path d="M15 3l-10 10M5 3l10 10" stroke="currentColor" stroke-width="1.4" opacity="0.3"/><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.4"/><path d="M10 3v3M10 14v3M3 10h3M14 10h3" stroke="currentColor" stroke-width="1.4"/>`,
  'reports': `<path d="M4 16h12V4a2 2 0 00-2-2H6a2 2 0 00-2 2v12z" stroke="currentColor" stroke-width="1.4"/><path d="M7 7h6M7 11h4" stroke="currentColor" stroke-width="1.4"/>`,
  'analytics': `<path d="M3 17l4-5 4 3 3-6 3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M3 17h14" stroke="currentColor" stroke-width="1.4"/>`,
};

const STORE_SIDEBAR_NAV = [
  { page: 'control-centre',  label: 'Store Control Centre', group: 'OVERVIEW' },
  { page: 'stock-ledger',    label: 'Stock Ledger',         group: 'WAREHOUSE' },
  { page: 'movements',       label: 'Material Movements',   group: 'WAREHOUSE' },
  { page: 'bin-locator',     label: 'Bin & Bay Locator',    group: 'WAREHOUSE' },
  { page: 'incoming-qc',     label: 'Incoming QC Hold',     group: 'RECEIVING' },
  { page: 'requisitions',    label: 'Material Requisitions',group: 'ISSUANCE' },
  { page: 'kitting',         label: 'Kitting & Staging',    group: 'ISSUANCE' },
  { page: 'quarantine',      label: 'Quarantine Register',  group: 'COMPLIANCE' },
  { page: 'remnants',        label: 'Remnant Yard',         group: 'COMPLIANCE' },
  { page: 'heat-trace',      label: 'Heat Number Trace',    group: 'TRACEABILITY' },
  { page: 'cycle-count',     label: 'Cycle Count',          group: 'TRACEABILITY' },
  { page: 'reports',         label: 'Store Reports',        group: 'ANALYTICS' },
  { page: 'analytics',       label: 'Store Analytics',      group: 'ANALYTICS' },
];

function enterStoreModule() {
  if (!_globalNavCache) {
    _globalNavCache = AppState.permissions;
  }
  AppState.currentPage = 'inventory';
  buildStoreSidebar();
  renderStoreSubPage(_storeActiveSubPage);
}

function exitStoreModule() {
  if (_globalNavCache) {
    buildSidebar(_globalNavCache, AppState.accent || '#e8622a');
    AppState.permissions = _globalNavCache;
  }
  _globalNavCache = null;
  const targetHash = '#/';
  if (location.hash !== targetHash && location.hash !== '') {
    history.pushState(null, '', targetHash);
  }
  navigate(deptHome(AppState.department));
}

function buildStoreSidebar() {
  const nav = document.querySelector('.sidebar-nav');
  if (!nav) return;

  document.body.dataset.dept = 'store';
  const accent = '#06b6d4'; // Store cyan

  const groups = {};
  STORE_SIDEBAR_NAV.forEach(item => {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  });

  nav.innerHTML = Object.entries(groups).map(([groupName, items]) => `
    <div class="nav-group">
      <span class="nav-group-label">${groupName}</span>
      ${items.map(item => `
        <a class="nav-item${item.page === _storeActiveSubPage ? ' active' : ''}"
           data-page="${item.page}"
           onclick="renderStoreSubPage('${item.page}')"
           style="--item-accent:${accent}">
          <svg class="nav-icon" viewBox="0 0 20 20" fill="none">
            ${STORE_NAV_ICONS[item.page] || ''}
          </svg>
          <span>${item.label}</span>
        </a>`).join('')}
    </div>
  `).join('');
}

function renderStoreSubPage(subPage, params = {}) {
  _storeActiveSubPage = subPage;
  const targetHash = '#/store/' + subPage;
  if (location.hash !== targetHash) {
    history.pushState(null, '', targetHash);
  }

  document.querySelectorAll('#sidebar .nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === subPage);
  });

  const content = document.getElementById('pageContent');
  if (!content) return;
  
  content.classList.remove('page-transitioning');
  void content.offsetWidth;
  content.innerHTML = '';
  content.classList.add('page-transitioning');

  const labels = {
    'control-centre': 'Store Control Centre',
    'stock-ledger':   'Stock Ledger',
    'movements':      'Material Movements',
    'bin-locator':    'Bin & Bay Locator',
    'incoming-qc':    'Incoming QC Hold',
    'requisitions':   'Material Requisitions',
    'kitting':        'Kitting & Staging',
    'quarantine':     'Quarantine Register',
    'remnants':       'Remnant Yard',
    'heat-trace':     'Heat Number Trace',
    'cycle-count':    'Cycle Count',
    'reports':        'Store Reports',
    'analytics':      'Store Analytics',
  };
  document.getElementById('breadcrumb').textContent = `Store & Inventory › ${labels[subPage] || subPage}`;

  // Call the renderer from inventory.js
  const fnName = 'renderStore_' + subPage.replace(/-/g, '_');
  if (typeof window[fnName] === 'function') {
    window[fnName](params.id || null);
  } else {
    content.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 24px;text-align:center;gap:20px;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-xl);border-style:dashed">
        <div style="font-size:48px;opacity:0.4">📦</div>
        <div>
          <div style="font-family:var(--font-display);font-size:18px;font-weight:700;color:var(--text-primary);margin-bottom:8px">${labels[subPage] || subPage}</div>
          <div style="font-size:13px;color:var(--text-secondary);max-width:400px;line-height:1.7">The ${labels[subPage] || subPage} module is currently being wired for live data.</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
          <span class="badge badge-blue">Sprint 2–5 build</span>
          <span class="badge badge-muted">UI scaffold ready</span>
        </div>
        <button class="btn btn-primary btn-sm" onclick="showToast('Added to build queue','success')">Request priority build</button>
      </div>`;
  }
}

// UAT-01: Centralised state purge — called on logout, session expiry, and role switch
function _purgeSessionState() {
  _globalNavCache = null;
  // Reset AppState to initial empty structure
  AppState.currentPage      = 'dashboard';
  AppState.activeProject    = null;
  AppState.projects         = [...DEFAULT_PROJECTS]; // Re-seed with default demo projects
  AppState.alerts           = [...DEFAULT_ALERTS];   // Re-seed with default demo alerts
  AppState.permissions      = null;
  AppState.department       = null;
  AppState.accent           = null;
  AppState.currentUser      = null;
  AppState.isDemoMode       = false;
  AppState.purchaseRequests = [];

  // Purge browser storage
  try { localStorage.clear(); }      catch { /* private browsing */ }
  try { sessionStorage.clear(); }     catch { /* private browsing */ }

  // Clear auth tokens from memory
  if (typeof Auth !== 'undefined') Auth.clearTokens();
}

/* ═══════════════════════════════════════════════════════════
   FINANCE MODULE LOADER
   ═══════════════════════════════════════════════════════════ */
let _finActiveSubPage = 'overview';

const FIN_SIDEBAR_NAV = [
  { page: 'overview',    label: 'Executive Overview', group: 'Overview' },
  { page: 'jobcost',     label: 'Job Costing',        group: 'Overview' },
  { page: 'ap',          label: 'Accounts Payable',   group: 'Operations' },
  { page: 'ar',          label: 'Accounts Receivable',  group: 'Operations' },
  { page: 'milestones',  label: 'Milestone Billing',  group: 'Operations' },
  { page: 'budget',      label: 'Budget Management',  group: 'Operations' },
  { page: 'cashflow',    label: 'Cash Flow',          group: 'Analysis' },
  { page: 'overhead',    label: 'Overhead Absorption', group: 'Analysis' },
  { page: 'reports',     label: 'Reports',            group: 'Analysis' },
];

const FIN_NAV_ICONS = {
  overview: `<rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.4"/><rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.4"/><rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.4"/><rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.4"/>`,
  jobcost: `<path d="M3 17h14M6 17V10M10 17V6M14 17V13" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  ap: `<rect x="3" y="3" width="14" height="10" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M6 17h8" stroke="currentColor" stroke-width="1.4"/>`,
  ar: `<path d="M14 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z" stroke="currentColor" stroke-width="1.4"/><path d="M7 10l2 2 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  milestones: `<path d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><rect x="9" y="3" width="6" height="3" rx="1" stroke="currentColor" stroke-width="1.4"/><path d="M8 10l1 1 2-2M8 14l1 1 2-2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  budget: `<circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.4"/><path d="M10 6v8M8 8h4M8 12h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  cashflow: `<path d="M17 10a7 7 0 01-7 7M3 10a7 7 0 017-7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M13 17l4-4M7 3l-4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  overhead: `<circle cx="6.5" cy="6.5" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="13.5" cy="13.5" r="2" stroke="currentColor" stroke-width="1.4"/><path d="M14.5 5.5l-9 9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  reports: `<path d="M14 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z" stroke="currentColor" stroke-width="1.4"/><path d="M7 6h6M7 10h6M7 14h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
};

function enterFinanceModule() {
  if (!_globalNavCache) {
    _globalNavCache = AppState.permissions;
  }
  AppState.currentPage = 'finance';
  buildFinanceSidebar();
  renderFinSubPage(_finActiveSubPage);
}

function exitFinanceModule() {
  if (_globalNavCache) {
    buildSidebar(_globalNavCache, AppState.accent || '#e8622a');
    AppState.permissions = _globalNavCache;
  }
  _globalNavCache = null;
  const targetHash = '#/';
  if (location.hash !== targetHash && location.hash !== '') {
    history.pushState(null, '', targetHash);
  }
  navigate(deptHome(AppState.department));
}

function buildFinanceSidebar() {
  const nav = document.querySelector('.sidebar-nav');
  if (!nav) return;

  document.body.dataset.dept = 'finance';
  const accent = '#f59e0b'; // Finance amber/orange

  // Group items
  const groups = {};
  FIN_SIDEBAR_NAV.forEach(item => {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  });

  nav.innerHTML = Object.entries(groups).map(([groupName, items]) => `
    <div class="nav-group">
      <span class="nav-group-label">${groupName}</span>
      ${items.map(item => {
        const isActive = item.page === _finActiveSubPage;
        return `
        <a class="nav-item${isActive ? ' active' : ''}"
           data-page="${item.page}"
           onclick="renderFinSubPage('${item.page}')"
           style="--item-accent:${accent}">
          <svg class="nav-icon" viewBox="0 0 20 20" fill="none">
            ${FIN_NAV_ICONS[item.page] || ''}
          </svg>
          <span>${item.label}</span>
        </a>`;
      }).join('')}
    </div>
  `).join('');
}

function renderFinSubPage(subPage) {
  _finActiveSubPage = subPage;

  // Persist sub-page in URL hash for deep-linking + back button
  const targetHash = '#/finance/' + subPage;
  if (location.hash !== targetHash) {
    history.pushState(null, '', targetHash);
  }

  // Update sidebar active state
  document.querySelectorAll('#sidebar .nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === subPage);
  });

  const content = document.getElementById('pageContent');
  if (!content) return;

  // Render outer shell if not already present
  if (!document.getElementById('finTabContent')) {
    content.innerHTML = `
      <div class="page-header">
        <div>
          <div class="page-title">Finance</div>
          <div class="page-subtitle">Job costing · Milestone billing · AR/AP ledger · Cash flow · Overhead absorption</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" onclick="renderFinSubPage(_finActiveSubPage)">
            <svg viewBox="0 0 15 15" fill="none" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:4px"><path d="M13 7.5A5.5 5.5 0 112.5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M2 2v3h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Refresh
          </button>
          <button class="btn btn-primary btn-sm" onclick="openNewInvoiceModal()">
            <svg viewBox="0 0 15 15" fill="none" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:4px"><path d="M3 4h9M3 7.5h6M3 11h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
            New invoice
          </button>
        </div>
      </div>

      <!-- Project selector -->
      <div class="proj-select-strip" id="finProjStrip"></div>

      <div id="finTabContent"></div>

      <!-- Modal -->
      <div id="finModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.78);z-index:200;backdrop-filter:blur(5px)" onclick="closeFinModal()">
        <div id="finModalContent" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:min(560px,94vw)" onclick="event.stopPropagation()"></div>
      </div>
    `;
    if (typeof renderFinProjStrip === 'function') {
      renderFinProjStrip();
    }
  }

  // Update FinData.activeTab so internal parts are consistent
  if (typeof FinData !== 'undefined') {
    FinData.activeTab = subPage;
  }

  const contentEl = document.getElementById('finTabContent');
  if (!contentEl) return;

  // Transition effect
  contentEl.classList.remove('page-transitioning');
  void contentEl.offsetWidth;
  contentEl.innerHTML = '';
  contentEl.classList.add('page-transitioning');

  // Breadcrumb update
  const labels = {
    overview:   'Executive Overview',
    jobcost:    'Job Costing',
    ap:         'Accounts Payable',
    ar:         'Accounts Receivable',
    milestones: 'Milestone Billing',
    budget:     'Budget Management',
    cashflow:   'Cash Flow',
    overhead:   'Overhead Absorption',
    reports:    'Reports',
  };
  document.getElementById('breadcrumb').textContent = `Finance › ${labels[subPage] || subPage}`;

  // Call the renderer from finance2.js / finance.js
  const fnMap = {
    overview:   'renderFinOverview',
    jobcost:    'renderFinJobCost',
    milestones: 'renderFinMilestones',
    ar:         'renderFinAR',
    ap:         'renderFinAP',
    cashflow:   'renderFinCashFlow',
    overhead:   'renderFinOverhead',
    budget:     'renderFinBudget',
    reports:    'renderFinReports',
  };
  const fnName = fnMap[subPage];
  if (typeof window[fnName] === 'function') {
    window[fnName]();
  } else {
    contentEl.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 24px;text-align:center;gap:20px;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-xl);border-style:dashed">
        <div style="font-size:48px;opacity:0.4">💰</div>
        <div>
          <div style="font-family:var(--font-display);font-size:18px;font-weight:700;color:var(--text-primary);margin-bottom:8px">${labels[subPage] || subPage}</div>
          <div style="font-size:13px;color:var(--text-secondary);max-width:400px;line-height:1.7">The ${labels[subPage] || subPage} module is currently being loaded.</div>
        </div>
      </div>`;
  }
}

/* ═══════════════════════════════════════════════════════════════════
   MARKETING & CRM MODULE — Dedicated Sidebar (Indigo accent)
   Pattern mirrors Production / Finance sidebar architecture
═══════════════════════════════════════════════════════════════════ */

let _mktActiveSubPage = 'overview';
let _preMktPage = 'dashboard';

const MKT_NAV_ICONS = {
  'overview':          `<rect x="3" y="3" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.4"/><rect x="11" y="3" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.4"/><rect x="3" y="11" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.4"/><rect x="11" y="11" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.4"/>`,
  'forecast':          `<path d="M3 15l4-5 4 3 3-6 3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 15h14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  'pipeline':          `<circle cx="10" cy="5" r="2.5" stroke="currentColor" stroke-width="1.4"/><circle cx="3" cy="14" r="2.5" stroke="currentColor" stroke-width="1.4"/><circle cx="17" cy="14" r="2.5" stroke="currentColor" stroke-width="1.4"/><path d="M10 7.5v3M10 10.5l-5 2M10 10.5l5 2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>`,
  'tenders':           `<rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M6 7h8M6 10h6M6 13h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  'clients':           `<circle cx="10" cy="7" r="3.5" stroke="currentColor" stroke-width="1.4"/><path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  'contacts':          `<circle cx="8" cy="7" r="3" stroke="currentColor" stroke-width="1.4"/><path d="M3 17c0-2.8 2.2-5 5-5h2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M14 12l4 4M18 12l-4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  'quote':             `<path d="M4 5h12M4 8.5h8M4 12h10M4 15.5h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.4"/>`,
  'boq':               `<path d="M12 3l4 4-4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 7h11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M4 12h7M4 15h5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  'prequalification':  `<path d="M10 2l2 4h4l-3.5 2.5 1.5 4.5L10 11l-4 2 1.5-4.5L4 6h4z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>`,
  'intelligence':      `<circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.4"/><path d="M10 6v4l2.5 2.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  'activity':          `<path d="M3 10h2l2-6 3 12 2-8 2 4h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  'overview':          `<rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.4"/><rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.4"/><rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.4"/><rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.4"/>`,
  'actions':           `<path d="M4 10l4 4 8-9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 16h11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" opacity="0.5"/>`,
  'calendar':          `<rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M3 8h14M7 4V2M13 4V2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><rect x="6" y="11" width="3" height="3" rx="0.5" fill="currentColor"/>`,
  'approvals':         `<circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.4"/><path d="M6.5 10l2.2 2.2L13.5 7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  'quotelog':          `<rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M6 6h8M6 9h8M6 12h5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="14" cy="14" r="1" fill="currentColor"/>`,
};

const MKT_SIDEBAR_NAV = [
  { page: 'overview',         label: 'Control Centre',       group: 'COMMAND' },
  { page: 'actions',          label: 'Action Queue',         group: 'COMMAND' },
  { page: 'forecast',         label: 'Revenue Forecast',     group: 'COMMAND' },
  { page: 'pipeline',         label: 'Pipeline',             group: 'CRM' },
  { page: 'clients',          label: 'Clients',              group: 'CRM' },
  { page: 'contacts',         label: 'Contacts',             group: 'CRM' },
  { page: 'calendar',         label: 'Bid Calendar',         group: 'TENDERS & BIDS' },
  { page: 'tenders',          label: 'Tender Tracker',       group: 'TENDERS & BIDS' },
  { page: 'prequalification', label: 'Pre-Qualification',    group: 'TENDERS & BIDS' },
  { page: 'intelligence',     label: 'Competitor Intel',     group: 'TENDERS & BIDS' },
  { page: 'quote',            label: 'Quote Builder',        group: 'PROPOSALS' },
  { page: 'quotelog',         label: 'Quote Log',            group: 'PROPOSALS' },
  { page: 'approvals',        label: 'Quote Approvals',      group: 'PROPOSALS' },
  { page: 'boq',              label: 'BOQ Ingestion',        group: 'PROPOSALS' },
  { page: 'activity',         label: 'Activity Log',         group: 'REPORTS' },
];

const MKT_ACCENT = '#6366f1';

function enterMarketingModule() {
  _preMktPage = AppState.currentPage !== 'marketing' ? AppState.currentPage : _preMktPage;
  if (!_globalNavCache) _globalNavCache = AppState.permissions;
  AppState.currentPage = 'marketing';
  document.body.dataset.dept = 'marketing';
  document.documentElement.style.setProperty('--dept-accent', MKT_ACCENT);

  // Update breadcrumb and badge
  const badge = document.getElementById('deptBadge');
  if (badge) { badge.textContent = 'Marketing & CRM'; badge.style.display = 'inline-flex'; }

  buildMarketingSidebar();
  renderMktSubPage(_mktActiveSubPage);
}

function exitMarketingModule() {
  if (_globalNavCache) {
    buildSidebar(_globalNavCache, AppState.accent || '#103B2E');
    AppState.permissions = _globalNavCache;
  }
  _globalNavCache = null;
  navigate(_preMktPage || 'dashboard');
}

function buildMarketingSidebar() {
  const nav = document.querySelector('.sidebar-nav');
  if (!nav) return;

  const groups = {};
  MKT_SIDEBAR_NAV.forEach(item => {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  });

  nav.innerHTML = Object.entries(groups).map(([groupName, items]) => `
    <div class="nav-group">
      <span class="nav-group-label">${groupName}</span>
      ${items.map(item => `
        <a class="nav-item${item.page === _mktActiveSubPage ? ' active' : ''}"
           data-page="${item.page}"
           data-tooltip="${item.label}"
           onclick="renderMktSubPage('${item.page}')"
           style="--item-accent:${MKT_ACCENT}">
          <svg class="nav-icon" viewBox="0 0 20 20" fill="none">
            ${MKT_NAV_ICONS[item.page] || ''}
          </svg>
          <span>${item.label}</span>
        </a>`).join('')}
    </div>
  `).join('');
}

function renderMktSubPage(subPage) {
  _mktActiveSubPage = subPage;

  // Update sidebar active state
  document.querySelectorAll('#sidebar .nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === subPage);
  });

  const content = document.getElementById('pageContent');
  if (!content) return;

  // Render page shell if not already present
  if (!document.getElementById('mktTabContent')) {
    content.innerHTML = `
      <div class="page-header" id="mktPageHeader">
        <div>
          <div class="page-title" id="mktPageTitle">Marketing & CRM</div>
          <div class="page-subtitle" id="mktPageSub">Pipeline · Quoting · Tenders · Clients · Intelligence</div>
        </div>
        <div class="page-actions" id="mktPageActions"></div>
      </div>
      <div id="mktTabContent"></div>
      <div id="crmModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.78);z-index:200;backdrop-filter:blur(5px)" onclick="closeCRMModal()">
        <div id="crmModalContent" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:min(580px,94vw);max-height:90vh;overflow-y:auto" onclick="event.stopPropagation()"></div>
      </div>`;
  }

  // Breadcrumb
  const labels = {
    overview:'Control Centre', actions:'Action Queue', forecast:'Revenue Forecast',
    pipeline:'Pipeline', clients:'Clients', contacts:'Contacts',
    calendar:'Bid Calendar', tenders:'Tender Tracker', prequalification:'Pre-Qualification',
    intelligence:'Competitor Intel', quote:'Quote Builder', quotelog:'Quote Log',
    approvals:'Quote Approvals', boq:'BOQ Ingestion', activity:'Activity Log',
  };
  document.getElementById('breadcrumb').textContent = `Marketing › ${labels[subPage] || subPage}`;

  // Transition
  const tabEl = document.getElementById('mktTabContent');
  if (tabEl) {
    tabEl.classList.remove('page-transitioning');
    void tabEl.offsetWidth;
    tabEl.innerHTML = '';
    tabEl.classList.add('page-transitioning');
  }

  // Update CRMData.activeTab for backward compat with existing renderers
  if (typeof CRMData !== 'undefined') CRMData.activeTab = subPage;

  // For existing CRM renderers that write to #crmTabContent, temporarily alias the element
  function _callCRM(fn) {
    const el = document.getElementById('mktTabContent');
    if (el) el.id = 'crmTabContent';
    try { if (typeof fn === 'function') fn(); } finally {
      const el2 = document.getElementById('crmTabContent');
      if (el2) el2.id = 'mktTabContent';
    }
  }

  // Dispatch to renderer
  const fnMap = {
    overview:        () => _callCRM(renderCRMOverview),
    actions:         renderMktActionQueue,
    forecast:        renderMktForecast,
    pipeline:        () => _callCRM(renderCRMPipeline),
    tenders:         () => _callCRM(renderCRMTenders),
    clients:         () => _callCRM(renderCRMClients),
    contacts:        renderMktContacts,
    calendar:        renderMktBidCalendar,
    quote:           () => _callCRM(renderCRMQuote),
    quotelog:        renderMktQuoteLog,
    approvals:       renderMktApprovals,
    boq:             () => _callCRM(renderCRMBOQ),
    prequalification:renderMktPreQual,
    intelligence:    renderMktIntelligence,
    activity:        () => _callCRM(renderCRMActivity),
  };

  const fn = fnMap[subPage];
  if (typeof fn === 'function') {
    fn();
  } else {
    document.getElementById('mktTabContent').innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 24px;text-align:center;gap:20px;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-xl);border-style:dashed">
        <div style="font-size:48px;opacity:0.4">📊</div>
        <div>
          <div style="font-family:var(--font-display);font-size:18px;font-weight:700;color:var(--text-primary);margin-bottom:8px">${labels[subPage] || subPage}</div>
          <div style="font-size:13px;color:var(--text-secondary)">Loading module…</div>
        </div>
      </div>`;
  }
}

/* ═══════════════════════════════════════════════════════════════════
   HR & WORKFORCE MODULE — Dedicated Sidebar (Rose accent)
   Pattern mirrors Production / QC / Finance / Store sidebar architecture
═══════════════════════════════════════════════════════════════════ */

let _hrActiveSubPage = 'control-centre';
let _preHRPage = 'dashboard';

const HR_ACCENT = '#f43f5e';

const HR_NAV_ICONS = {
  'control-centre': `<rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.4"/><rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.4"/><rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.4"/><rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.4"/>`,
  'workforce':      `<circle cx="8" cy="7" r="3" stroke="currentColor" stroke-width="1.4"/><path d="M3 17c0-2.8 2.2-5 5-5s5 2.8 5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="15" cy="8" r="2" stroke="currentColor" stroke-width="1.2"/><path d="M15 12c2 0 3.5 1 3.5 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>`,
  'attendance':     `<rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M3 8h14M7 4V2M13 4V2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M7 11l2 2 4-4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`,
  'leave':          `<path d="M10 3v14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M6 7c0-2.2 1.8-4 4-4s4 1.8 4 4c0 2-2 3-4 5-2-2-4-3-4-5z" stroke="currentColor" stroke-width="1.4"/><path d="M5 14h10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M6 17h8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>`,
  'schedule':       `<rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M3 8h14M7 4V2M13 4V2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  'onboarding':     `<path d="M10 2v16M6 6l4-4 4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 12h4M12 12h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  'skills':         `<path d="M3 17h14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><rect x="4" y="10" width="3" height="7" rx="0.5" stroke="currentColor" stroke-width="1.3"/><rect x="8.5" y="6" width="3" height="11" rx="0.5" stroke="currentColor" stroke-width="1.3"/><rect x="13" y="3" width="3" height="14" rx="0.5" stroke="currentColor" stroke-width="1.3"/>`,
  'certs':          `<rect x="4" y="2" width="12" height="16" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M10 8a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" stroke-width="1.3"/><path d="M7 11h6M7 14h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>`,
  'training':       `<path d="M2 9l8-5 8 5-8 5-8-5z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M18 9v5.5c0 1.5-3.6 3-8 3s-8-1.5-8-3V9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  'payroll':        `<rect x="3" y="5" width="14" height="11" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M3 9h14" stroke="currentColor" stroke-width="1.4"/><path d="M7 13h2M11 13h2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  'expenses':       `<path d="M14 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z" stroke="currentColor" stroke-width="1.4"/><path d="M10 7v6M7 10h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  'documents':      `<path d="M14 2H6a2 2 0 00-2 2v14a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z" stroke="currentColor" stroke-width="1.4"/><path d="M7 7h6M7 11h6M7 15h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  'analytics':      `<path d="M3 17l4-5 4 3 3-6 3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 17h14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  'utilisation':    `<circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.4"/><path d="M10 6v4l3 2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
};

const HR_SIDEBAR_NAV = [
  { page: 'control-centre', label: 'HR Control Centre',    group: 'OVERVIEW' },
  { page: 'workforce',      label: 'Workforce Directory',  group: 'OVERVIEW' },
  { page: 'attendance',     label: 'Attendance & Time',    group: 'PEOPLE OPS' },
  { page: 'leave',          label: 'Leave Management',     group: 'PEOPLE OPS' },
  { page: 'schedule',       label: 'Shift Schedule',       group: 'PEOPLE OPS' },
  { page: 'onboarding',     label: 'Onboarding',           group: 'PEOPLE OPS' },
  { page: 'skills',         label: 'Skills Matrix',        group: 'COMPETENCY' },
  { page: 'certs',          label: 'Certifications',       group: 'COMPETENCY' },
  { page: 'training',       label: 'Training Records',     group: 'COMPETENCY' },
  { page: 'payroll',        label: 'Payroll & Salary',     group: 'COMPENSATION' },
  { page: 'expenses',       label: 'Expense Claims',       group: 'COMPENSATION' },
  { page: 'documents',      label: 'Document Vault',       group: 'ADMIN' },
  { page: 'analytics',      label: 'HR Analytics',         group: 'ADMIN' },
  { page: 'utilisation',    label: 'Labour Utilisation',   group: 'ADMIN' },
  { page: 'welding-module', label: 'Welding / WPS',        group: 'COMPETENCY', onclick: 'enterWeldingModule("hr")' },
];

function enterHRModule() {
  _preHRPage = AppState.currentPage !== 'hr' ? AppState.currentPage : _preHRPage;
  if (!_globalNavCache) _globalNavCache = AppState.permissions;
  AppState.currentPage = 'hr';
  document.body.dataset.dept = 'hr';
  document.documentElement.style.setProperty('--dept-accent', HR_ACCENT);

  const badge = document.getElementById('deptBadge');
  if (badge) { badge.textContent = 'HR & WORKFORCE'; badge.style.display = 'inline-flex'; }

  buildHRSidebar();
  renderHRSubPage(_hrActiveSubPage);
}

function exitHRModule() {
  if (_globalNavCache) {
    buildSidebar(_globalNavCache, AppState.accent || '#103B2E');
    AppState.permissions = _globalNavCache;
  }
  _globalNavCache = null;
  const targetHash = '#/';
  if (location.hash !== targetHash && location.hash !== '') {
    history.pushState(null, '', targetHash);
  }
  navigate((_preHRPage && AppState.canAccessPage(_preHRPage))
    ? _preHRPage : deptHome(AppState.department));
}

function buildHRSidebar() {
  const nav = document.querySelector('.sidebar-nav');
  if (!nav) return;

  const expiredCerts = (typeof HRData !== 'undefined')
    ? HRData.employees.reduce((s,e) => s + e.certifications.filter(c=>c.status==='expired').length, 0) : 0;
  const pendingLeave = (typeof HRData !== 'undefined' && HRData.leaveRequests)
    ? HRData.leaveRequests.filter(r => r.status === 'pending').length : 0;

  const groups = {};
  HR_SIDEBAR_NAV.forEach(item => {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  });

  nav.innerHTML = Object.entries(groups).map(([groupName, items]) => `
    <div class="nav-group">
      <span class="nav-group-label">${groupName}</span>
      ${items.map(item => {
        const isActive = item.page === _hrActiveSubPage;
        let badge = '';
        if (item.page === 'certs' && expiredCerts > 0)
          badge = `<span class="nav-badge nav-badge-danger">${expiredCerts}</span>`;
        else if (item.page === 'leave' && pendingLeave > 0)
          badge = `<span class="nav-badge nav-badge-warn">${pendingLeave}</span>`;
        return `
        <a class="nav-item${isActive ? ' active' : ''}"
           data-page="${item.page}"
           data-tooltip="${item.label}"
           onclick="${item.onclick || `renderHRSubPage('${item.page}')`}"
           style="--item-accent:${HR_ACCENT}">
          <svg class="nav-icon" viewBox="0 0 20 20" fill="none">
            ${HR_NAV_ICONS[item.page] || `<rect x="4" y="2" width="12" height="16" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M7 7h6M7 11h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>`}
          </svg>
          <span>${item.label}</span>
          ${badge}
        </a>`;
      }).join('')}
    </div>
  `).join('');
}

function renderHRSubPage(subPage) {
  _hrActiveSubPage = subPage;

  // Persist in URL hash for deep-linking
  const targetHash = '#/hr/' + subPage;
  if (location.hash !== targetHash) {
    history.pushState(null, '', targetHash);
  }

  // Update sidebar active state
  document.querySelectorAll('#sidebar .nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === subPage);
  });

  // Breadcrumb
  const labels = {
    'control-centre': 'HR Control Centre',
    'workforce':      'Workforce Directory',
    'attendance':     'Attendance & Time',
    'leave':          'Leave Management',
    'schedule':       'Shift Schedule',
    'onboarding':     'Onboarding',
    'skills':         'Skills Matrix',
    'certs':          'Certifications',
    'training':       'Training Records',
    'payroll':        'Payroll & Salary',
    'expenses':       'Expense Claims',
    'documents':      'Document Vault',
    'analytics':      'HR Analytics',
    'utilisation':    'Labour Utilisation',
  };
  document.getElementById('breadcrumb').textContent = `HR › ${labels[subPage] || subPage}`;

  // Dept badge
  document.body.dataset.dept = 'hr';
  const badge = document.getElementById('deptBadge');
  if (badge) { badge.textContent = 'HR & WORKFORCE'; badge.style.display = 'inline-flex'; }

  // Page transition
  const content = document.getElementById('pageContent');
  content.classList.remove('page-transitioning');
  void content.offsetWidth;
  content.innerHTML = '';
  content.classList.add('page-transitioning');

  // Dispatch to renderer
  const renderers = {
    'control-centre': renderHRControlCentre,
    'workforce':      renderHRWorkforce,
    'attendance':     renderHRAttendance,
    'leave':          renderHRLeave,
    'schedule':       renderHRSchedule,
    'onboarding':     renderHROnboarding,
    'skills':         renderHRSkills,
    'certs':          renderHRCerts,
    'training':       renderHRTraining,
    'payroll':        renderHRPayroll,
    'expenses':       renderHRExpenses,
    'documents':      renderHRDocuments,
    'analytics':      renderHRAnalytics,
    'utilisation':    renderHRUtilisation,
  };

  const renderer = renderers[subPage];
  if (typeof renderer === 'function') {
    renderer();
  } else {
    content.innerHTML = `
      <div class="card" style="padding:40px;text-align:center">
        <div style="font-size:48px;margin-bottom:16px">👥</div>
        <div style="font-weight:600;font-size:18px">${labels[subPage] || subPage}</div>
        <div style="color:var(--text-muted);font-size:13px;margin-top:8px">This HR sub-page is currently being developed.</div>
      </div>`;
  }

  // S-16 animations
  content.querySelectorAll('.kpi-strip, .metric-grid, .bento-grid').forEach(s => s.classList.add('stagger-in'));
  if (window.S16) { S16.initCountUps(content); S16.triggerSparklines(content); S16.triggerChartLines(content); }

  // Mobile: auto-close sidebar
  if (window.innerWidth <= 768) document.body.classList.remove('sidebar-open');
}
