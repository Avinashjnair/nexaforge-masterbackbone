/* ============================================================
   NexaForge ERP — Login Page Handler
   ============================================================ */

'use strict';

function renderLogin() {
  document.getElementById('pageContent').innerHTML = '';
  document.getElementById('sidebar').style.display = 'none';
  document.getElementById('topbar').style.display  = 'none';

  const overlay = document.createElement('div');
  overlay.id = 'loginOverlay';
  overlay.style.cssText = `
    position:fixed;inset:0;display:flex;align-items:flex-start;justify-content:center;
    z-index:9999;overflow-y:auto;background:var(--bg-page);
  `;

  overlay.innerHTML = `
    <!-- Soft lavender ambient surfaces (no blur, V2 compliant) -->
    <div style="position:absolute;inset:0;overflow:hidden;pointer-events:none">
      <div style="
        position:absolute;top:-15%;right:-8%;width:520px;height:520px;border-radius:50%;
        background:radial-gradient(circle, rgba(139,131,196,0.18) 0%, rgba(232,230,240,0) 70%);
        animation:loginOrbFloat 14s ease-in-out infinite;
      "></div>
      <div style="
        position:absolute;bottom:-12%;left:-6%;width:440px;height:440px;border-radius:50%;
        background:radial-gradient(circle, rgba(16,59,46,0.08) 0%, rgba(232,230,240,0) 70%);
        animation:loginOrbFloat 18s ease-in-out infinite reverse;
      "></div>
      <div style="
        position:absolute;top:35%;left:55%;width:300px;height:300px;border-radius:50%;
        background:radial-gradient(circle, rgba(196,192,224,0.20) 0%, rgba(232,230,240,0) 70%);
        animation:loginOrbFloat 20s ease-in-out infinite 3s;
      "></div>
    </div>

    <div style="width:100%;max-width:420px;padding:40px 24px;position:relative;z-index:1;animation:loginCardIn 0.55s cubic-bezier(0.22,1,0.36,1) both">
      <!-- Logo -->
      <div style="text-align:center;margin-bottom:32px">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:60px;height:60px;border-radius:20px;background:var(--brand);box-shadow:var(--shadow-accent), -3px -3px 10px rgba(255,255,255,0.7);margin-bottom:18px">
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <rect x="2" y="2" width="11" height="11" rx="2.5" fill="rgba(255,255,255,0.95)"/>
            <rect x="15" y="2" width="11" height="11" rx="2.5" fill="rgba(255,255,255,0.55)"/>
            <rect x="2" y="15" width="11" height="11" rx="2.5" fill="rgba(255,255,255,0.55)"/>
            <rect x="15" y="15" width="11" height="11" rx="2.5" fill="rgba(255,255,255,0.95)"/>
          </svg>
        </div>
        <div style="font-family:var(--font-display);font-size:28px;font-weight:900;color:var(--text-primary);letter-spacing:-0.03em">
          NexaForge
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:6px;letter-spacing:2.5px;text-transform:uppercase;font-weight:600">
          Engineering ERP
        </div>
      </div>      <!-- Neumorphic card -->
      <div style="padding:34px;border-radius:var(--radius-2xl);background:var(--bg-card);box-shadow:var(--shadow-card)">
        <div id="loginCardHeader">
          <div id="loginTitle" style="font-size:19px;font-weight:700;color:var(--text-primary);margin-bottom:4px;font-family:var(--font-display);letter-spacing:-0.01em">Welcome back</div>
          <div id="loginSub" style="font-size:12.5px;color:var(--text-muted);margin-bottom:24px">Sign in to your manufacturing dashboard</div>
        </div>

        <div id="loginError" style="display:none;padding:11px 14px;background:var(--red-bg);border-radius:var(--radius-md);font-size:12px;color:var(--red);margin-bottom:16px;box-shadow:var(--shadow-inset)"></div>
        <div id="loginSuccess" style="display:none;padding:11px 14px;background:rgba(20,184,166,0.1);border-radius:var(--radius-md);font-size:12px;color:var(--brand);margin-bottom:16px;box-shadow:var(--shadow-inset)"></div>

        <!-- Screen 1: Login Form -->
        <div id="screenLogin">
          <form id="loginForm" onsubmit="handleLogin(event)">
            <div style="margin-bottom:16px">
              <label style="font-size:10.5px;font-weight:700;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;display:block;margin-bottom:8px">Email</label>
              <input
                type="email" id="loginEmail" required
                placeholder="you@nexaforge.com"
                class="nf-login-input"
              />
            </div>
            <div style="margin-bottom:22px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <label style="font-size:10.5px;font-weight:700;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase">Password</label>
                <a href="#" onclick="showAuthScreen('forgot');event.preventDefault();" style="font-size:10.5px;color:var(--brand);text-decoration:none;font-weight:600">Forgot password?</a>
              </div>
              <input
                type="password" id="loginPassword" required
                placeholder="••••••••"
                class="nf-login-input"
              />
            </div>
            <button type="submit" id="loginBtn" class="nf-login-primary">
              Sign in
            </button>
          </form>

          <div style="margin-top:22px;padding-top:18px;border-top:1px solid var(--border);text-align:center">
            <div style="font-size:11.5px;color:var(--text-muted);margin-bottom:12px;line-height:1.5">
              Use your assigned @nexaforge.com credentials,<br>or continue below without a server.
            </div>
            <button
              type="button"
              onclick="enterDemoMode()"
              class="nf-login-secondary"
            >
              Continue in Demo Mode (GM)
            </button>

            <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.1em;margin:18px 0 12px;font-weight:700">Quick Access Departments</div>
            <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px">
              <button type="button" onclick="quickAccess('production')" title="Production" class="quick-access-btn" data-c="#f97316"><span>PR</span></button>
              <button type="button" onclick="toggleQCRoles(event)" title="Quality Control" class="quick-access-btn" data-c="#14b8a6"><span>QC</span></button>
              <button type="button" onclick="quickAccess('procurement')" title="Procurement" class="quick-access-btn" data-c="#84cc16"><span>PC</span></button>
              <button type="button" onclick="quickAccess('store')" title="Store" class="quick-access-btn" data-c="#06b6d4"><span>ST</span></button>
              <button type="button" onclick="quickAccess('finance')" title="Finance" class="quick-access-btn" data-c="#f59e0b"><span>FN</span></button>
              <button type="button" onclick="quickAccess('marketing')" title="Marketing" class="quick-access-btn" data-c="#8b5cf6"><span>MK</span></button>
              <button type="button" onclick="quickAccess('hr')" title="HR" class="quick-access-btn" data-c="#f43f5e"><span>HR</span></button>
              <button type="button" onclick="quickAccess('welding')" title="Welding" class="quick-access-btn" data-c="#3b82f6"><span>WL</span></button>
              <button type="button" onclick="quickAccess('analytics')" title="Analytics" class="quick-access-btn" data-c="#6366f1"><span>AN</span></button>
              <button type="button" onclick="quickAccess('gm')" title="General Manager" class="quick-access-btn" data-c="#103B2E"><span>GM</span></button>
            </div>
            <div id="qcRoleSelect" style="display:none;margin-top:12px;padding:12px;background:var(--bg-subtle);border-radius:var(--radius-md);box-shadow:var(--shadow-inset);text-align:center">
              <div style="font-size:10px;color:var(--text-muted);font-weight:700;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">Select QC Account</div>
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
                <button type="button" onclick="quickAccessQC('qc_mgr')" class="nf-login-secondary" style="font-size:10px;padding:6px">QC Manager</button>
                <button type="button" onclick="quickAccessQC('qc_lead')" class="nf-login-secondary" style="font-size:10px;padding:6px">Lead QC</button>
                <button type="button" onclick="quickAccessQC('qc_field')" class="nf-login-secondary" style="font-size:10px;padding:6px">Field QC</button>
              </div>
            </div>
          </div>

        </div>

        <!-- Screen 2: MFA Code Form -->
        <div id="screenMfa" style="display:none">
          <form id="mfaForm" onsubmit="handleMfaVerify(event)">
            <div style="margin-bottom:20px">
              <label style="font-size:10.5px;font-weight:700;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;display:block;margin-bottom:8px">6-Digit Verification Code</label>
              <input
                type="text" id="mfaCode" required
                pattern="[0-9]*" inputmode="numeric" maxlength="6"
                placeholder="123456"
                class="nf-login-input"
                style="text-align:center;font-size:20px;letter-spacing:0.3em"
              />
            </div>
            <button type="submit" id="mfaBtn" class="nf-login-primary" style="margin-bottom:12px">
              Verify & Sign In
            </button>
            <button type="button" onclick="showAuthScreen('login')" class="nf-login-secondary">
              Cancel
            </button>
          </form>
        </div>

        <!-- Screen 3: Forgot Password Form -->
        <div id="screenForgot" style="display:none">
          <form id="forgotForm" onsubmit="handleForgot(event)">
            <div style="margin-bottom:20px">
              <label style="font-size:10.5px;font-weight:700;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;display:block;margin-bottom:8px">Registered Email</label>
              <input
                type="email" id="forgotEmail" required
                placeholder="you@nexaforge.com"
                class="nf-login-input"
              />
            </div>
            <button type="submit" id="forgotBtn" class="nf-login-primary" style="margin-bottom:12px">
              Send Reset Code
            </button>
            <button type="button" onclick="showAuthScreen('login')" class="nf-login-secondary">
              Back to Sign In
            </button>
          </form>
        </div>

        <!-- Screen 4: Reset Password Form -->
        <div id="screenReset" style="display:none">
          <form id="resetForm" onsubmit="handleReset(event)">
            <div style="margin-bottom:16px">
              <label style="font-size:10.5px;font-weight:700;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;display:block;margin-bottom:8px">Reset Token</label>
              <input
                type="text" id="resetToken" required
                placeholder="Paste code from email"
                class="nf-login-input"
              />
            </div>
            <div style="margin-bottom:20px">
              <label style="font-size:10.5px;font-weight:700;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;display:block;margin-bottom:8px">New Password</label>
              <input
                type="password" id="resetPassword" required
                placeholder="••••••••"
                class="nf-login-input"
              />
            </div>
            <button type="submit" id="resetBtn" class="nf-login-primary" style="margin-bottom:12px">
              Save New Password
            </button>
            <button type="button" onclick="showAuthScreen('login')" class="nf-login-secondary">
              Back to Sign In
            </button>
          </form>
        </div>
      </div>
      </div>

      <!-- Footer -->
      <div style="text-align:center;margin-top:22px;font-size:10.5px;color:var(--text-muted);letter-spacing:0.06em">
        Secured by NexaForge Auth · TLS 1.3
      </div>
    </div>

    <style>
      @keyframes loginOrbFloat {
        0%, 100% { transform: translate(0, 0) scale(1); }
        25% { transform: translate(22px, -28px) scale(1.05); }
        50% { transform: translate(-12px, 22px) scale(0.95); }
        75% { transform: translate(16px, 10px) scale(1.02); }
      }
      @keyframes loginCardIn {
        from { opacity: 0; transform: translateY(20px) scale(0.97); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }

      .nf-login-input {
        width:100%; padding:13px 16px;
        background:var(--bg-input); border:none;
        border-radius:var(--radius-md);
        color:var(--text-primary); font-size:13.5px; font-family:var(--font-body);
        box-sizing:border-box; outline:none;
        box-shadow:var(--shadow-inset);
        transition:box-shadow 0.25s ease;
      }
      .nf-login-input::placeholder { color:var(--text-hint); }
      .nf-login-input:focus {
        box-shadow:
          inset 2px 2px 5px rgba(180,175,210,0.25),
          inset -2px -2px 5px rgba(255,255,255,0.65),
          0 0 0 3px rgba(139,131,196,0.18);
      }

      .nf-login-primary {
        width:100%; padding:13px; font-size:13px; font-weight:700;
        font-family:var(--font-display); letter-spacing:0.02em;
        color:#fff; background:var(--brand);
        border:none; border-radius:var(--radius-md);
        cursor:pointer;
        box-shadow:var(--shadow-accent), -3px -3px 8px rgba(255,255,255,0.55);
        transition:transform 0.18s ease, box-shadow 0.25s ease, background 0.2s;
      }
      .nf-login-primary:hover:not(:disabled) {
        background:var(--brand-mid);
        transform:translateY(-1px);
        box-shadow:5px 5px 14px rgba(16,59,46,0.28), -4px -4px 10px rgba(255,255,255,0.65);
      }
      .nf-login-primary:active { transform:translateY(0); box-shadow:var(--shadow-inset); }
      .nf-login-primary:disabled { opacity:0.6; cursor:wait; }

      .nf-login-secondary {
        width:100%; padding:11px; font-size:12px; font-weight:600;
        font-family:var(--font-display);
        color:var(--text-secondary); background:var(--bg-card);
        border:none; border-radius:var(--radius-md);
        cursor:pointer;
        box-shadow:var(--shadow-sm);
        transition:transform 0.18s ease, box-shadow 0.25s ease, color 0.2s;
      }
      .nf-login-secondary:hover {
        color:var(--brand);
        transform:translateY(-1px);
        box-shadow:var(--shadow-card);
      }
      .nf-login-secondary:active { transform:translateY(0); box-shadow:var(--shadow-inset); }

      .quick-access-btn {
        width:100%; aspect-ratio:1;
        border-radius:var(--radius-md); border:none;
        background:var(--bg-card);
        display:flex; align-items:center; justify-content:center;
        cursor:pointer;
        box-shadow:var(--shadow-sm);
        color:var(--text-secondary);
        font-size:12.5px; font-weight:800; font-family:var(--font-display);
        letter-spacing:0.02em;
        transition:all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .quick-access-btn:hover {
        color: attr(data-c);
        transform: translateY(-2px);
        box-shadow: var(--shadow-card);
      }
      .quick-access-btn:active {
        transform: translateY(0);
        box-shadow: var(--shadow-inset);
      }
    </style>
  `;

  document.body.appendChild(overlay);
  // Apply per-button accent color (attr() in CSS color is unreliable, set inline)
  overlay.querySelectorAll('.quick-access-btn').forEach(btn => {
    const c = btn.getAttribute('data-c');
    btn.addEventListener('mouseenter', () => { btn.style.color = c; });
    btn.addEventListener('mouseleave', () => { btn.style.color = ''; });
  });
  document.getElementById('loginEmail').focus();
}

function enterDemoMode() {
  _bootDeptSession({ name: 'General Manager', role: 'gm', department: 'gm' }, true);
  showToast('Running in demo mode — all data is simulated', 'info', 5000);
}

const DEPT_METADATA = {
  gm:           { name: 'General Manager',   role: 'gm',      email: 'gm@nexaforge.com' },
  production:   { name: 'Production Mgr',    role: 'manager', email: 'production@nexaforge.com' },
  qc:           { name: 'QC Manager',        role: 'manager', email: 'qc@nexaforge.com' },
  qc_lead:      { name: 'Sarah Ahmed',       role: 'senior',  email: 'qc_lead@nexaforge.com', department: 'qc' },
  qc_inspector: { name: 'John Doe',          role: 'user',    email: 'qc_inspector@nexaforge.com', department: 'qc' },
  procurement:  { name: 'Procurement Mgr',   role: 'manager', email: 'procurement@nexaforge.com' },
  store:        { name: 'Store Manager',     role: 'manager', email: 'store@nexaforge.com' },
  finance:      { name: 'Finance Manager',   role: 'manager', email: 'finance@nexaforge.com' },
  marketing:    { name: 'Sales Manager',     role: 'manager', email: 'marketing@nexaforge.com' },
  hr:           { name: 'HR Manager',        role: 'manager', email: 'hr@nexaforge.com' },
  welding:      { name: 'Welding Engineer',  role: 'senior',  email: 'welding@nexaforge.com' },
  analytics:    { name: 'Data Architect',    role: 'admin',   email: 'analytics@nexaforge.com' }
};

function toggleQCRoles(event) {
  event.preventDefault();
  const el = document.getElementById('qcRoleSelect');
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function quickAccessQC(role) {
  const el = document.getElementById('qcRoleSelect');
  if (el) el.style.display = 'none'; // close it

  if (role === 'qc_mgr') {
    quickAccess('qc');
  } else if (role === 'qc_lead') {
    quickAccess('qc_lead');
  } else if (role === 'qc_field') {
    quickAccess('qc_inspector');
  }
}

function quickAccess(dept) {
  const meta = DEPT_METADATA[dept];
  if (!meta) return;

  const emailField = document.getElementById('loginEmail');
  const passField  = document.getElementById('loginPassword');

  if (emailField && passField) {
    emailField.value = meta.email;
    passField.value  = 'Password123!'; // Default seed password

    // Visual feedback
    emailField.style.borderColor = 'var(--brand)';
    setTimeout(() => emailField.style.borderColor = '', 1000);
  }

  // Attempt a real backend login with the seeded credentials. handleLogin falls
  // back to Demo Mode automatically if the server is unreachable, so quick
  // access still works offline — but demo is no longer the default path.
  handleLogin({ preventDefault() {} });
}
const DEPT_NAV = {
  gm: [
    { page: 'dashboard',   label: 'Dashboard',        group: 'Overview' },
    { page: 'projects',    label: 'Projects',          group: 'Overview', badge: '3' },
    { page: 'production',  label: 'Production',        group: 'Operations' },
    { page: 'quality',     label: 'Quality Control',   group: 'Operations' },
    { page: 'procurement', label: 'Procurement',       group: 'Operations' },
    { page: 'inventory',   label: 'Store & Inventory', group: 'Operations' },
    { page: 'marketing',   label: 'Marketing & CRM',   group: 'Business' },
    { page: 'finance',     label: 'Finance',           group: 'Business' },
    { page: 'hr',          label: 'HR & Workforce',    group: 'Business' },
    { page: 'analytics',   label: 'Analytics & KPIs',  group: 'Technical' },
    { page: 'documents',   label: 'Documents',         group: 'Technical' },
    { page: 'hse',         label: 'HSE & Compliance',  group: 'Technical' },
    { page: 'maintenance', label: 'Maintenance',      group: 'Technical' },
  ],
  production:  [
    { page: 'projects',   label: 'Projects',   group: 'Overview' },
    { page: 'production', label: 'Production', group: 'Operations' },
    { page: 'inventory',  label: 'Store',      group: 'Operations' },
    { page: 'analytics',  label: 'Analytics',  group: 'Technical' },
  ],
  qc: [
    { page: 'projects',   label: 'Projects',       group: 'Overview' },
    { page: 'quality',    label: 'Quality Control',group: 'Operations' },
    { page: 'analytics',  label: 'Analytics',      group: 'Technical' },
  ],
  marketing: [
    { page: 'marketing', label: 'Marketing & CRM',group: 'Operations' },
    { page: 'projects',  label: 'Projects',       group: 'Overview' },
  ],
  finance: [
    { page: 'projects',    label: 'Projects',            group: 'Overview' },
    { page: 'finance',     label: 'Finance',             group: 'Finance Ops' },
    { page: 'procurement', label: 'Procurement & AP',    group: 'Finance Ops' },
    { page: 'inventory',   label: 'Store & Inventory',   group: 'Finance Ops' },
    { page: 'analytics',   label: 'Reports & KPIs',      group: 'Reports' },
    { page: 'hr',          label: 'Payroll / HR',         group: 'Reports' },
  ],
  hr: [
    { page: 'hr',        label: 'HR & Workforce',group: 'Operations' },
    { page: 'analytics', label: 'Analytics',     group: 'Technical' },
  ],
  procurement: [
    { page: 'procurement', label: 'Procurement', group: 'Operations' },
    { page: 'inventory',   label: 'Store',       group: 'Operations' },
    { page: 'projects',    label: 'Projects',    group: 'Overview' },
  ],
  store: [
    { page: 'inventory', label: 'Store & Inventory', group: 'Operations' },
    { page: 'projects',  label: 'Projects',          group: 'Overview' },
  ],
  welding: [
    { page: 'welding',   label: 'Welding / WPS',group: 'Technical' },
    { page: 'quality',   label: 'Quality',     group: 'Operations' },
    { page: 'projects',  label: 'Projects',    group: 'Overview' },
  ],
  analytics: [
    { page: 'analytics', label: 'Analytics',   group: 'Operations' },
    { page: 'projects',  label: 'Projects',    group: 'Overview' },
  ],
};

// Department → the page that IS the module the user should land on at login.
// GM keeps the cross-department command centre (`dashboard`). Values are
// navigate() page keys (note qc→quality, store→inventory).
const DEPT_HOME = {
  gm:          'dashboard',
  production:  'production',
  qc:          'quality',
  finance:     'finance',
  marketing:   'marketing',
  hr:          'hr',
  procurement: 'procurement',
  store:       'inventory',
  welding:     'welding',
  analytics:   'analytics',
};
function deptHome(dept) {
  return DEPT_HOME[(dept || '').toLowerCase()] || 'dashboard';
}
window.deptHome = deptHome;
window.DEPT_HOME = DEPT_HOME;

function _bootDeptSession(user, demoMode = false) {
  // UAT-01: Purge previous session state before re-initializing
  if (typeof _purgeSessionState === 'function') _purgeSessionState();

  AppState.isDemoMode  = demoMode;
  AppState.currentUser = user;
  AppState.department  = user.department;

  document.getElementById('loginOverlay')?.remove();
  document.getElementById('sidebar').style.display = '';
  document.getElementById('topbar').style.display  = '';

  const userEl = document.getElementById('topbarUser');
  if (userEl) userEl.textContent = user.name;

  // Build sidebar with dept-restricted nav + per-dept accent (P0.6.2)
  const nav = DEPT_NAV[user.department] || DEPT_NAV.gm;
  const DEPT_ACCENTS = {
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
  const accent = DEPT_ACCENTS[user.department] || DEPT_ACCENTS.gm;
  AppState.permissions = nav;
  AppState.accent      = accent;
  document.documentElement.style.setProperty('--dept-accent', accent);
  if (typeof buildSidebar === 'function') buildSidebar(nav, accent);

  // Update user card in sidebar footer
  const avatarEl = document.querySelector('.user-avatar');
  const nameEl   = document.querySelector('.user-name');
  const roleEl   = document.querySelector('.user-role');
  if (avatarEl) avatarEl.textContent = user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  if (nameEl)   nameEl.textContent   = user.name;
  if (roleEl)   roleEl.textContent   = (user.role.length <= 2 ? user.role.toUpperCase() : user.role.charAt(0).toUpperCase() + user.role.slice(1)) + ' access';

  window.dispatchEvent(new CustomEvent('nf:auth:login'));
  // Land directly in the user's module (GM → command centre). See DEPT_HOME.
  navigate(deptHome(user.department));
  showToast(`Welcome, ${user.name}`, 'success', 3000);
}

let pendingMfaTicket = null;
let pendingMfaEmail = null;
let forgotEmailVal = '';

function showAuthScreen(screen) {
  const screens = ['screenLogin', 'screenMfa', 'screenForgot', 'screenReset'];
  screens.forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = (s === 'screen' + screen.charAt(0).toUpperCase() + screen.slice(1)) ? 'block' : 'none';
  });

  const errEl = document.getElementById('loginError');
  const succEl = document.getElementById('loginSuccess');
  if (errEl) errEl.style.display = 'none';
  if (succEl) succEl.style.display = 'none';

  const titleEl = document.getElementById('loginTitle');
  const subEl = document.getElementById('loginSub');

  if (screen === 'login') {
    titleEl.textContent = 'Welcome back';
    subEl.textContent = 'Sign in to your manufacturing dashboard';
  } else if (screen === 'mfa') {
    titleEl.textContent = 'Security Verification';
    subEl.textContent = 'Enter the 6-digit code from your authenticator app';
    setTimeout(() => {
      const codeInput = document.getElementById('mfaCode');
      if (codeInput) { codeInput.value = ''; codeInput.focus(); }
    }, 50);
  } else if (screen === 'forgot') {
    titleEl.textContent = 'Reset Password';
    subEl.textContent = 'Enter your registered email address';
    setTimeout(() => {
      const emailInput = document.getElementById('forgotEmail');
      if (emailInput) emailInput.focus();
    }, 50);
  } else if (screen === 'reset') {
    titleEl.textContent = 'Set New Password';
    subEl.textContent = 'Enter the reset token and choose a new password';
    setTimeout(() => {
      const tokenInput = document.getElementById('resetToken');
      if (tokenInput) tokenInput.focus();
    }, 50);
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  const btn      = document.getElementById('loginBtn');
  const errEl    = document.getElementById('loginError');

  btn.disabled    = true;
  btn.textContent = 'Signing in…';
  errEl.style.display = 'none';

  try {
    const data = await AuthAPI.login(email, password);
    if (data.two_factor_required) {
      pendingMfaTicket = data.ticket;
      pendingMfaEmail = email;
      showAuthScreen('mfa');
      btn.disabled = false;
      btn.textContent = 'Sign in';
      return;
    }
    _bootDeptSession(data.user, false);
  } catch (err) {
    // Check if it's a network error (server offline)
    const isNetworkError = !err.status && (
      err.message === 'Failed to fetch' ||
      err.message.toLowerCase().includes('fetch') ||
      err.message.toLowerCase().includes('network') ||
      err.message.toLowerCase().includes('failed to')
    );
    if (isNetworkError) {
      const matchedDept = Object.keys(DEPT_METADATA).find(k => DEPT_METADATA[k].email === email);
      if (matchedDept) {
        showToast('Server offline. Booting in Demo Mode.', 'warn', 4000);
        const meta = DEPT_METADATA[matchedDept];
        _bootDeptSession({ name: meta.name, role: meta.role, department: matchedDept, two_factor_enabled: false }, true);
        return;
      }
    }
    errEl.textContent   = err.message || 'Invalid credentials.';
    errEl.style.display = 'block';
    btn.disabled        = false;
    btn.textContent     = 'Sign in';
  }
}

async function handleMfaVerify(e) {
  e.preventDefault();
  const code = document.getElementById('mfaCode').value.trim();
  const btn = document.getElementById('mfaBtn');
  const errEl = document.getElementById('loginError');

  btn.disabled = true;
  btn.textContent = 'Verifying…';
  errEl.style.display = 'none';

  try {
    const data = await AuthAPI.verify2FA(pendingMfaTicket, code);
    _bootDeptSession(data.user, AppState.isDemoMode);
  } catch (err) {
    errEl.textContent = err.message || 'Invalid security code.';
    errEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Verify & Sign In';
  }
}

async function handleForgot(e) {
  e.preventDefault();
  const email = document.getElementById('forgotEmail').value.trim().toLowerCase();
  const btn = document.getElementById('forgotBtn');
  const errEl = document.getElementById('loginError');
  const succEl = document.getElementById('loginSuccess');

  btn.disabled = true;
  btn.textContent = 'Requesting…';
  errEl.style.display = 'none';
  succEl.style.display = 'none';

  try {
    const data = await AuthAPI.forgot(email);
    forgotEmailVal = email;
    
    let msg = data.message;
    if (data.dev_token) {
      msg += ` [DEV TOKEN: ${data.dev_token}]`;
      setTimeout(() => {
        const resetTokenInput = document.getElementById('resetToken');
        if (resetTokenInput) resetTokenInput.value = data.dev_token;
      }, 50);
    }
    
    showAuthScreen('reset');
    succEl.textContent = msg;
    succEl.style.display = 'block';
  } catch (err) {
    errEl.textContent = err.message || 'Request failed.';
    errEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Send Reset Code';
  }
}

async function handleReset(e) {
  e.preventDefault();
  const token = document.getElementById('resetToken').value.trim();
  const password = document.getElementById('resetPassword').value;
  const btn = document.getElementById('resetBtn');
  const errEl = document.getElementById('loginError');
  const succEl = document.getElementById('loginSuccess');

  btn.disabled = true;
  btn.textContent = 'Saving…';
  errEl.style.display = 'none';
  succEl.style.display = 'none';

  try {
    await AuthAPI.reset(forgotEmailVal, token, password);
    showAuthScreen('login');
    succEl.textContent = 'Password reset successfully! You can now log in.';
    succEl.style.display = 'block';
  } catch (err) {
    errEl.textContent = err.message || 'Reset failed.';
    errEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save New Password';
  }
}
