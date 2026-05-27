import { h, Fragment } from 'preact';
import { useState, useEffect, lazy, Suspense } from 'preact/compat';
import { login, logout } from './auth/api.js';

// Lazy-load remotes — bundles only fetched if user has dept access
const ProductionApp = lazy(() => import('production/ProductionApp'));

// Map department → allowed remote(s)
const DEPT_REMOTES = {
  production: ['production'],
  qc:         ['production'],  // QC can view production docs (approvals, archive)
};

// Nav groups: top-level sections within a module
const NAV = {
  production: [
    // ── Core production ──────────────────────────────────────
    { id: 'dashboard',     label: 'Dashboard',          icon: '⬛', group: 'Operations' },
    { id: 'projects',      label: 'Projects',            icon: '📋', group: 'Operations' },
    { id: 'orders',        label: 'Production Orders',   icon: '🏭', group: 'Operations' },
    { id: 'schedule',      label: 'Schedule',            icon: '📅', group: 'Operations' },
    { id: 'materials',     label: 'Material Requests',   icon: '📦', group: 'Operations' },
    { id: 'job-cards',     label: 'Job Cards',           icon: '🗂️', group: 'Operations' },
    { id: 'work-centers',  label: 'Work Centres',        icon: '🏗️', group: 'Operations' },
    { id: 'shop-floor',    label: 'Shop Floor Tracking', icon: '🔧', group: 'Operations' },
    { id: 'welding-log',   label: 'Welding Log',         icon: '🔥', group: 'Operations' },
    { id: 'pwht',          label: 'PWHT Management',     icon: '🌡️', group: 'Operations' },
    { id: 'hydro-test',    label: 'Hydrostatic Testing', icon: '💧', group: 'Operations' },
    { id: 'surface',       label: 'Surface Treatment',   icon: '🎨', group: 'Operations' },
    { id: 'dispatch',      label: 'Dispatch',            icon: '🚚', group: 'Operations' },
    // ── Document management (DocMgmt_V1) ─────────────────────
    { id: 'approvals',     label: 'Approval Workflows',  icon: '✅', group: 'Documents' },
    { id: 'archive',       label: 'Document Archive',    icon: '🗄️', group: 'Documents' },
  ],

  qc: [
    // ── Core QC ──────────────────────────────────────────────
    { id: 'qc-dashboard',  label: 'Dashboard',           icon: '⬛', group: 'Quality' },
    { id: 'incoming',      label: 'Incoming Inspection', icon: '🔍', group: 'Quality' },
    { id: 'in-process',    label: 'In-Process Inspection',icon: '👁️', group: 'Quality' },
    { id: 'nde',           label: 'NDE Management',      icon: '📡', group: 'Quality' },
    { id: 'welding',       label: 'Welding Management',  icon: '🔥', group: 'Quality' },
    { id: 'ncr',           label: 'NCR Management',      icon: '⚠️', group: 'Quality' },
    { id: 'test-reports',  label: 'Test Reports',        icon: '📊', group: 'Quality' },
    { id: 'databook',      label: 'Data Book Compiler',  icon: '📖', group: 'Quality' },
    // ── Document management (DocMgmt_V1) ─────────────────────
    { id: 'mdr',           label: 'Document Register (MDR)', icon: '📋', group: 'Documents' },
    { id: 'drawings',      label: 'Drawing Management',  icon: '📐', group: 'Documents' },
    { id: 'procedures',    label: 'Procedure Library',   icon: '📚', group: 'Documents' },
    { id: 'transmittals',  label: 'Transmittals',        icon: '📤', group: 'Documents' },
    // ── Reports ──────────────────────────────────────────────
    { id: 'qc-reports',    label: 'Reports',             icon: '📈', group: 'Reports' },
  ],
};

export function App() {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [loginState, setLoginState] = useState({ email: '', password: '', error: '', loading: false });

  async function handleLogin(e) {
    e.preventDefault();
    setLoginState(s => ({ ...s, error: '', loading: true }));
    try {
      const u = await login(loginState.email, loginState.password);
      setUser(u);
    } catch (err) {
      setLoginState(s => ({ ...s, error: err.message, loading: false }));
    }
  }

  async function handleLogout() {
    await logout();
    setUser(null);
    setActivePage('dashboard');
  }

  if (!user) return h(LoginScreen, { state: loginState, setState: setLoginState, onSubmit: handleLogin });

  const deptNav = NAV[user.department] ?? [];
  const canLoad = DEPT_REMOTES[user.department]?.includes('production') ?? false;

  return h('div', { class: 'shell' },
    h(Sidebar, { user, nav: deptNav, activePage, onNav: setActivePage, onLogout: handleLogout }),
    h('div', { class: 'main' },
      h(Topbar, { page: activePage, dept: user.department }),
      h('div', { class: 'content-area' },
        canLoad
          ? h(Suspense, { fallback: h(LoadingRemote, null) },
              h(ProductionApp, { page: activePage, user })
            )
          : h('div', { class: 'remote-error' }, '⚠ You do not have access to the Production module.')
      )
    )
  );
}

function LoginScreen({ state, setState, onSubmit }) {
  return h('div', { class: 'login-screen' },
    h('div', { class: 'login-card' },
      h('div', { class: 'login-logo' }, 'NexaForge'),
      h('p', { class: 'login-sub' }, 'Sign in to your workspace'),
      h('form', { onSubmit },
        h('div', { class: 'field' },
          h('label', null, 'Email'),
          h('input', {
            type: 'email',
            value: state.email,
            onInput: e => setState(s => ({ ...s, email: e.target.value })),
            placeholder: 'you@nexaforge.com',
            required: true,
          })
        ),
        h('div', { class: 'field' },
          h('label', null, 'Password'),
          h('input', {
            type: 'password',
            value: state.password,
            onInput: e => setState(s => ({ ...s, password: e.target.value })),
            placeholder: '••••••••',
            required: true,
          })
        ),
        state.error && h('p', { class: 'login-error' }, state.error),
        h('button', { class: 'btn-primary', type: 'submit', disabled: state.loading },
          state.loading ? 'Signing in…' : 'Sign in'
        )
      )
    )
  );
}

function Sidebar({ user, nav, activePage, onNav, onLogout }) {
  const initials = (user.name || user.email)
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  // Group nav items by their `group` field
  const groups = nav.reduce((acc, item) => {
    const g = item.group || 'Menu';
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {});

  return h('aside', { class: 'sidebar' },
    h('div', { class: 'sidebar-brand' },
      h('div', { class: 'brand-name' }, 'NexaForge'),
      h('div', { class: 'brand-dept' }, user.department)
    ),
    Object.entries(groups).map(([groupName, items]) =>
      h('nav', { key: groupName, class: 'nav-section' },
        h('div', { class: 'nav-label' }, groupName),
        items.map(item =>
          h('a', {
            key: item.id,
            class: `nav-item${activePage === item.id ? ' active' : ''}`,
            onClick: (e) => { e.preventDefault(); onNav(item.id); },
            href: '#',
          },
            h('span', { class: 'nav-icon' }, item.icon),
            item.label
          )
        )
      )
    ),
    h('div', { class: 'sidebar-footer' },
      h('div', { class: 'user-chip' },
        h('div', { class: 'user-avatar' }, initials),
        h('div', null,
          h('div', { class: 'user-name' }, user.name || user.email),
          h('div', { class: 'user-role' }, user.role)
        ),
        h('button', { class: 'logout-btn', onClick: onLogout, title: 'Sign out' }, '⏻')
      )
    )
  );
}

function Topbar({ page, dept }) {
  const labels = {
    // Production
    dashboard:     'Dashboard',
    projects:      'Projects',
    orders:        'Production Orders',
    schedule:      'Production Schedule',
    materials:     'Material Requests',
    'job-cards':   'Job Cards',
    'work-centers':'Work Centres',
    'shop-floor':  'Shop Floor Tracking',
    'welding-log': 'Welding Log',
    pwht:          'PWHT Management',
    'hydro-test':  'Hydrostatic Testing',
    surface:       'Surface Treatment',
    dispatch:      'Dispatch',
    // Production — Documents (DocMgmt_V1)
    approvals:     'Approval Workflows',
    archive:       'Document Archive',
    // QC
    'qc-dashboard':'QC Dashboard',
    incoming:      'Incoming Inspection',
    'in-process':  'In-Process Inspection',
    nde:           'NDE Management',
    welding:       'Welding Management',
    ncr:           'NCR Management',
    'test-reports':'Test Reports',
    databook:      'Data Book Compiler',
    // QC — Documents (DocMgmt_V1)
    mdr:           'Document Register (MDR)',
    drawings:      'Drawing Management',
    procedures:    'Procedure Library',
    transmittals:  'Transmittals',
    'qc-reports':  'QC Reports',
  };
  return h('div', { class: 'topbar' },
    h('span', { class: 'topbar-title' }, labels[page] ?? page),
    h('span', { class: 'topbar-badge' }, dept)
  );
}

function LoadingRemote() {
  return h('div', { class: 'remote-loading' },
    h('div', { class: 'spinner' }),
    'Loading module…'
  );
}
