const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5500', 'http://127.0.0.1:5500'], credentials: true }));
app.use(express.json());

const JWT_SECRET = 'mock-secret-for-dev';

const getCookies = (req) => {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return {};
  return Object.fromEntries(cookieHeader.split(';').map(c => {
    const parts = c.trim().split('=');
    return [parts[0], parts.slice(1).join('=')];
  }));
};

const USERS = {
  'gm@nexaforge.com':          { name: 'General Manager',   role: 'gm',      dept: 'gm' },
  'production@nexaforge.com':  { name: 'Production Mgr',    role: 'manager', dept: 'production' },
  'qc@nexaforge.com':          { name: 'QC Manager',        role: 'senior',  dept: 'qc' },
  'procurement@nexaforge.com': { name: 'Procurement Mgr',   role: 'manager', dept: 'procurement' },
  'store@nexaforge.com':       { name: 'Store Manager',     role: 'manager', dept: 'store' },
  'finance@nexaforge.com':     { name: 'Finance Manager',   role: 'manager', dept: 'finance' },
  'marketing@nexaforge.com':   { name: 'Sales Manager',     role: 'manager', dept: 'marketing' },
  'hr@nexaforge.com':          { name: 'HR Manager',        role: 'manager', dept: 'hr' },
  'welding@nexaforge.com':     { name: 'Welding Engineer',  role: 'senior',  dept: 'welding' },
  'analytics@nexaforge.com':   { name: 'Data Architect',    role: 'admin',   dept: 'analytics' }
};

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = USERS[email];
  
  if (user && password === 'Password123!') {
    const token = jwt.sign({ sub: email, role: user.role, department: user.dept }, JWT_SECRET);
    res.setHeader('Set-Cookie', `mock_logged_in=${email}; Path=/; HttpOnly; SameSite=Lax`);
    res.json({
      access_token: token,
      user: { name: user.name, role: user.role, department: user.dept, email }
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials (Mock Server)' });
  }
});

// Refresh token endpoint
app.post('/auth/refresh', (req, res) => {
  const cookies = getCookies(req);
  const email = cookies.mock_logged_in;
  if (!email || !USERS[email]) {
    return res.status(401).json({ error: 'Session expired (Mock Server)' });
  }
  const user = USERS[email];
  const token = jwt.sign({ sub: email, role: user.role, department: user.dept }, JWT_SECRET);
  res.json({
    access_token: token,
    user: { name: user.name, role: user.role, department: user.dept, email }
  });
});

// Logout endpoint (both DELETE and POST to support both frontends)
app.delete('/auth/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'mock_logged_in=; Path=/; HttpOnly; Max-Age=0');
  res.json({ success: true });
});

app.post('/auth/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'mock_logged_in=; Path=/; HttpOnly; Max-Age=0');
  res.json({ success: true });
});

// Password recovery endpoints
app.post('/auth/forgot', (req, res) => {
  res.json({ message: "If that email exists in our system, we have sent a reset token." });
});

app.post('/auth/reset', (req, res) => {
  res.json({ message: "Password reset successful" });
});

// 2FA endpoints
app.post('/auth/2fa', (req, res) => {
  const token = jwt.sign({ sub: 'gm@nexaforge.com', role: 'gm', department: 'gm' }, JWT_SECRET);
  res.json({
    access_token: token,
    user: { name: 'General Manager', role: 'gm', department: 'gm', email: 'gm@nexaforge.com' }
  });
});

// Permissions and User Metadata for Sidebar
app.get('/api/me/permissions', (req, res) => {
  const cookies = getCookies(req);
  let email = cookies.mock_logged_in;

  if (!email && req.headers.authorization) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      email = decoded.sub;
    } catch (e) {
      // Ignore token verification errors
    }
  }

  const user = email ? USERS[email] : null;
  const dept = user ? user.dept : 'gm';

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
      { page: 'welding',     label: 'Welding / WPS',     group: 'Technical' },
      { page: 'analytics',   label: 'Analytics & KPIs',  group: 'Technical' },
      { page: 'documents',   label: 'Documents',         group: 'Technical' },
      { page: 'hse',         label: 'HSE & Compliance',  group: 'Technical' },
      { page: 'maintenance', label: 'Maintenance',      group: 'Technical' },
    ],
    production:  [
      { page: 'dashboard',  label: 'Dashboard',  group: 'Overview' },
      { page: 'projects',   label: 'Projects',   group: 'Overview' },
      { page: 'production', label: 'Production', group: 'Operations' },
      { page: 'inventory',  label: 'Store',      group: 'Operations' },
      { page: 'welding',    label: 'Welding',    group: 'Technical' },
      { page: 'analytics',  label: 'Analytics',  group: 'Technical' },
    ],
    qc: [
      { page: 'dashboard',  label: 'Dashboard',      group: 'Overview' },
      { page: 'projects',   label: 'Projects',       group: 'Overview' },
      { page: 'quality',    label: 'Quality Control',group: 'Operations' },
      { page: 'welding',    label: 'Welding / WPS',  group: 'Technical' },
      { page: 'analytics',  label: 'Analytics',      group: 'Technical' },
    ],
    marketing: [
      { page: 'dashboard', label: 'Dashboard',      group: 'Overview' },
      { page: 'marketing', label: 'Marketing & CRM',group: 'Operations' },
      { page: 'projects',  label: 'Projects',       group: 'Overview' },
    ],
    finance: [
      { page: 'dashboard',   label: 'Finance Home',       group: 'Overview' },
      { page: 'projects',    label: 'Projects',            group: 'Overview' },
      { page: 'finance',     label: 'Finance',             group: 'Finance Ops' },
      { page: 'procurement', label: 'Procurement & AP',    group: 'Finance Ops' },
      { page: 'inventory',   label: 'Store & Inventory',   group: 'Finance Ops' },
      { page: 'analytics',   label: 'Reports & KPIs',      group: 'Reports' },
      { page: 'hr',          label: 'Payroll / HR',         group: 'Reports' },
    ],
    hr: [
      { page: 'dashboard', label: 'Dashboard',    group: 'Overview' },
      { page: 'hr',        label: 'HR & Workforce',group: 'Operations' },
      { page: 'welding',   label: 'Welding / WPS', group: 'Technical' },
      { page: 'analytics', label: 'Analytics',     group: 'Technical' },
    ],
    procurement: [
      { page: 'dashboard',   label: 'Dashboard',   group: 'Overview' },
      { page: 'procurement', label: 'Procurement', group: 'Operations' },
      { page: 'inventory',   label: 'Store',       group: 'Operations' },
      { page: 'projects',    label: 'Projects',    group: 'Overview' },
    ],
    store: [
      { page: 'dashboard', label: 'Dashboard',        group: 'Overview' },
      { page: 'inventory', label: 'Store & Inventory', group: 'Operations' },
      { page: 'projects',  label: 'Projects',          group: 'Overview' },
    ],
    welding: [
      { page: 'dashboard', label: 'Dashboard',   group: 'Overview' },
      { page: 'welding',   label: 'Welding / WPS',group: 'Technical' },
      { page: 'quality',   label: 'Quality',     group: 'Operations' },
      { page: 'projects',  label: 'Projects',    group: 'Overview' },
    ],
    analytics: [
      { page: 'dashboard', label: 'Dashboard',   group: 'Overview' },
      { page: 'analytics', label: 'Analytics',   group: 'Operations' },
      { page: 'projects',  label: 'Projects',    group: 'Overview' },
    ],
  };

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

  res.json({
    department: dept,
    accent: DEPT_ACCENTS[dept] || '#103B2E',
    nav: DEPT_NAV[dept] || DEPT_NAV.gm
  });
});

// ── Finance API mock data ─────────────────────────────────────

const MOCK_INVOICES = [
  { id:'INV-2401-01', project_id:'P-2401', client_name:'ADNOC',    description:'Advance payment — 20%',           amount:56800, status:'paid',    issue_date:'2025-01-28', due_date:'2025-02-01' },
  { id:'INV-2401-02', project_id:'P-2401', client_name:'ADNOC',    description:'Material milestone — 15%',        amount:42600, status:'paid',    issue_date:'2025-03-12', due_date:'2025-03-15' },
  { id:'INV-2401-03', project_id:'P-2401', client_name:'ADNOC',    description:'Shell fabrication 50% milestone', amount:71000, status:'due',     issue_date:'2025-05-01', due_date:'2025-05-10' },
  { id:'INV-2402-01', project_id:'P-2402', client_name:'Petrofac', description:'Advance payment — 20%',           amount:19500, status:'paid',    issue_date:'2025-02-28', due_date:'2025-03-01' },
  { id:'INV-2402-02', project_id:'P-2402', client_name:'Petrofac', description:'Material milestone — 20%',        amount:19500, status:'overdue', issue_date:'2025-04-20', due_date:'2025-04-30' },
  { id:'INV-2403-01', project_id:'P-2403', client_name:'ENOC',     description:'Advance payment — 20%',           amount:28400, status:'paid',    issue_date:'2025-01-10', due_date:'2025-01-15' },
  { id:'INV-2403-02', project_id:'P-2403', client_name:'ENOC',     description:'Tube bundle assembly — 30%',      amount:42600, status:'paid',    issue_date:'2025-03-18', due_date:'2025-03-20' },
];

const MOCK_AP = [
  { id:'ap-1', po_ref:'PO-2401-018', vendor:'Outokumpu',     description:'316L plate — shell balance',  amount:38400, due_date:'2025-05-15', status:'due',     project_id:'P-2401' },
  { id:'ap-2', po_ref:'PO-2403-009', vendor:'Rolled Alloys', description:'Replacement tube sheet (NCR)',amount: 9200, due_date:'2025-05-30', status:'pending', project_id:'P-2403' },
  { id:'ap-3', po_ref:'PO-2401-019', vendor:'NDT Services',  description:'RT & UT inspection P-2401',   amount: 8600, due_date:'2025-05-20', status:'due',     project_id:'P-2401' },
  { id:'ap-4', po_ref:'PO-2402-004', vendor:'Sandvik',       description:'SA-240 304 plates (unpaid)',  amount:22000, due_date:'2025-06-10', status:'pending', project_id:'P-2402' },
  { id:'ap-5', po_ref:'PO-2401-015', vendor:'Lincoln Elec.', description:'Consumables Q2',              amount: 2840, due_date:'2025-04-30', status:'overdue', project_id:'P-2401' },
  { id:'ap-6', po_ref:'PO-2401-016', vendor:'SGS Inspection',description:'PMI lab testing P-2401',      amount: 1840, due_date:'2025-04-20', status:'paid',    project_id:'P-2401' },
];

const MOCK_MILESTONES = {
  'P-2401': [
    { id:'MS-01', project_id:'P-2401', name:'Contract signing & advance payment', billing_pct:20, billing_amount:56800, status:'invoiced', target_date:'2025-02-01', invoice_id:'INV-2401-01' },
    { id:'MS-02', project_id:'P-2401', name:'Material delivery confirmation',       billing_pct:15, billing_amount:42600, status:'invoiced', target_date:'2025-03-15', invoice_id:'INV-2401-02' },
    { id:'MS-03', project_id:'P-2401', name:'Shell fabrication complete (50%)',      billing_pct:25, billing_amount:71000, status:'due',      target_date:'2025-05-10', invoice_id:'INV-2401-03' },
    { id:'MS-04', project_id:'P-2401', name:'Assembly & nozzle installation',        billing_pct:20, billing_amount:56800, status:'pending',  target_date:'2025-06-30', invoice_id:null },
    { id:'MS-05', project_id:'P-2401', name:'QC completion & hydrostatic test',      billing_pct:10, billing_amount:28400, status:'pending',  target_date:'2025-07-30', invoice_id:null },
    { id:'MS-06', project_id:'P-2401', name:'Final inspection, dispatch & handover', billing_pct:10, billing_amount:28400, status:'pending',  target_date:'2025-08-15', invoice_id:null },
  ],
  'P-2402': [
    { id:'MS-10', project_id:'P-2402', name:'Contract signing advance',        billing_pct:20, billing_amount:19500, status:'invoiced', target_date:'2025-03-01', invoice_id:'INV-2402-01' },
    { id:'MS-11', project_id:'P-2402', name:'Material procurement confirmation',billing_pct:20, billing_amount:19500, status:'overdue', target_date:'2025-04-30', invoice_id:'INV-2402-02' },
    { id:'MS-12', project_id:'P-2402', name:'50% fabrication milestone',        billing_pct:30, billing_amount:29250, status:'pending', target_date:'2025-07-15', invoice_id:null },
    { id:'MS-13', project_id:'P-2402', name:'Final test & dispatch',            billing_pct:30, billing_amount:29250, status:'pending', target_date:'2025-10-15', invoice_id:null },
  ],
  'P-2403': [
    { id:'MS-20', project_id:'P-2403', name:'Contract advance',              billing_pct:20, billing_amount:28400, status:'invoiced', target_date:'2025-01-15', invoice_id:'INV-2403-01' },
    { id:'MS-21', project_id:'P-2403', name:'Tube bundle assembly complete', billing_pct:30, billing_amount:42600, status:'invoiced', target_date:'2025-03-20', invoice_id:'INV-2403-02' },
    { id:'MS-22', project_id:'P-2403', name:'QC clearance & welding complete',billing_pct:30, billing_amount:42600, status:'pending', target_date:'2025-06-01', invoice_id:null },
    { id:'MS-23', project_id:'P-2403', name:'Dispatch & handover',            billing_pct:20, billing_amount:28400, status:'pending', target_date:'2025-07-01', invoice_id:null },
  ],
};

const MOCK_JOB_COST = {
  'P-2401': { contract_value: 284000, lines: [
    { cost_type:'material',    description:'316L SS plate (shell & roof)',    budgeted_amount:68400, actual_amount:71200 },
    { cost_type:'material',    description:'Nozzle package & flanges',        budgeted_amount:14800, actual_amount:13650 },
    { cost_type:'labour',      description:'Welding (GTAW/SMAW)',             budgeted_amount:22400, actual_amount:14800 },
    { cost_type:'labour',      description:'Fitting & rolling labour',        budgeted_amount:16800, actual_amount:12200 },
    { cost_type:'subcontract', description:'NDT — RT & UT (external)',        budgeted_amount:12400, actual_amount:8600  },
    { cost_type:'overhead',    description:'Overhead allocation (28%)',       budgeted_amount:52000, actual_amount:38000 },
  ]},
  'P-2402': { contract_value: 97500, lines: [] },
  'P-2403': { contract_value: 142000, lines: [] },
};

// Finance routes
app.get('/api/finance/projects/:id/job-cost', (req, res) => {
  res.json(MOCK_JOB_COST[req.params.id] || { contract_value: 0, lines: [] });
});

app.get('/api/finance/invoices', (req, res) => {
  const { status, project_id } = req.query;
  let invoices = MOCK_INVOICES;
  if (status)     invoices = invoices.filter(i => i.status === status);
  if (project_id) invoices = invoices.filter(i => i.project_id === project_id);
  res.json({ invoices });
});

app.post('/api/finance/invoices', (req, res) => {
  const inv = { id: `INV-${Date.now()}`, status: 'draft', ...req.body };
  MOCK_INVOICES.push(inv);
  res.status(201).json(inv);
});

app.patch('/api/finance/invoices/:id/status', (req, res) => {
  const inv = MOCK_INVOICES.find(i => i.id === req.params.id);
  if (!inv) return res.status(404).json({ error: 'Not found' });
  Object.assign(inv, req.body);
  res.json(inv);
});

app.get('/api/finance/accounts-payable', (req, res) => {
  const { status, project_id } = req.query;
  let ap = MOCK_AP;
  if (status)     ap = ap.filter(i => i.status === status);
  if (project_id) ap = ap.filter(i => i.project_id === project_id);
  res.json(ap);
});

app.patch('/api/finance/accounts-payable/:id/pay', (req, res) => {
  const ap = MOCK_AP.find(i => i.id === req.params.id);
  if (!ap) return res.status(404).json({ error: 'Not found' });
  ap.status = 'paid';
  ap.paid_date = new Date().toISOString();
  res.json(ap);
});

app.get('/api/finance/projects/:id/milestones', (req, res) => {
  res.json(MOCK_MILESTONES[req.params.id] || []);
});

app.post('/api/finance/projects/:id/milestones', (req, res) => {
  const ms = { id: `MS-${Date.now()}`, project_id: req.params.id, status: 'pending', ...req.body };
  if (!MOCK_MILESTONES[req.params.id]) MOCK_MILESTONES[req.params.id] = [];
  MOCK_MILESTONES[req.params.id].push(ms);
  res.status(201).json(ms);
});

app.get('/api/finance/cash-flow', (req, res) => {
  res.json([
    { month:'2025-01', ar_invoiced:85200, ar_collected:85200, ap_paid:24000, net_cash:61200 },
    { month:'2025-02', ar_invoiced:62100, ar_collected:62100, ap_paid:41000, net_cash:21100 },
    { month:'2025-03', ar_invoiced:42600, ar_collected:42600, ap_paid:58000, net_cash:-15400 },
    { month:'2025-04', ar_invoiced:0,     ar_collected:0,     ap_paid:47000, net_cash:-47000 },
    { month:'2025-05', ar_invoiced:90500, ar_collected:71000, ap_paid:54000, net_cash:17000  },
  ]);
});

// Fallback for all other /api routes to avoid 404s breaking the frontend
app.get('/api/*', (req, res) => {
  res.json([]);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[MOCK SERVER] Running on port ${PORT}`);
  console.log(`[MOCK SERVER] Finance API: /api/finance/* ready`);
  console.log(`[MOCK SERVER] Use any pre-seeded email with 'Password123!'`);
});

