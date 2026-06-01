const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
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
  'qc@nexaforge.com':          { name: 'QC Manager',        role: 'manager', dept: 'qc' },
  'qc_lead@nexaforge.com':     { name: 'Sarah Ahmed',       role: 'senior',  dept: 'qc' },
  'qc_inspector@nexaforge.com':{ name: 'John Doe',          role: 'user',    dept: 'qc' },
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
      { page: 'projects',   label: 'Projects',   group: 'Overview' },
      { page: 'production', label: 'Production', group: 'Operations' },
      { page: 'inventory',  label: 'Store',      group: 'Operations' },
      { page: 'welding',    label: 'Welding',    group: 'Technical' },
      { page: 'analytics',  label: 'Analytics',  group: 'Technical' },
    ],
    qc: [
      { page: 'projects',   label: 'Projects',       group: 'Overview' },
      { page: 'quality',    label: 'Quality Control',group: 'Operations' },
      { page: 'welding',    label: 'Welding / WPS',  group: 'Technical' },
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
      { page: 'welding',   label: 'Welding / WPS', group: 'Technical' },
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

let MOCK_INVOICES = [
  { id:'INV-2401-01', project_id:'P-2401', client_name:'ADNOC',    description:'Advance payment — 20%',           amount:56800, status:'paid',    issue_date:'2025-01-28', due_date:'2025-02-01' },
  { id:'INV-2401-02', project_id:'P-2401', client_name:'ADNOC',    description:'Material milestone — 15%',        amount:42600, status:'paid',    issue_date:'2025-03-12', due_date:'2025-03-15' },
  { id:'INV-2401-03', project_id:'P-2401', client_name:'ADNOC',    description:'Shell fabrication 50% milestone', amount:71000, status:'due',     issue_date:'2025-05-01', due_date:'2025-05-10' },
  { id:'INV-2402-01', project_id:'P-2402', client_name:'Petrofac', description:'Advance payment — 20%',           amount:19500, status:'paid',    issue_date:'2025-02-28', due_date:'2025-03-01' },
  { id:'INV-2402-02', project_id:'P-2402', client_name:'Petrofac', description:'Material milestone — 20%',        amount:19500, status:'overdue', issue_date:'2025-04-20', due_date:'2025-04-30' },
  { id:'INV-2403-01', project_id:'P-2403', client_name:'ENOC',     description:'Advance payment — 20%',           amount:28400, status:'paid',    issue_date:'2025-01-10', due_date:'2025-01-15' },
  { id:'INV-2403-02', project_id:'P-2403', client_name:'ENOC',     description:'Tube bundle assembly — 30%',      amount:42600, status:'paid',    issue_date:'2025-03-18', due_date:'2025-03-20' },
];

let MOCK_AP = [
  { id:'ap-1', po_ref:'PO-2401-018', vendor:'Outokumpu',     description:'316L plate — shell balance',  amount:38400, due_date:'2025-05-15', status:'due',     project_id:'P-2401' },
  { id:'ap-2', po_ref:'PO-2403-009', vendor:'Rolled Alloys', description:'Replacement tube sheet (NCR)',amount: 9200, due_date:'2025-05-30', status:'pending', project_id:'P-2403' },
  { id:'ap-3', po_ref:'PO-2401-019', vendor:'NDT Services',  description:'RT & UT inspection P-2401',   amount: 8600, due_date:'2025-05-20', status:'due',     project_id:'P-2401' },
  { id:'ap-4', po_ref:'PO-2402-004', vendor:'Sandvik',       description:'SA-240 304 plates (unpaid)',  amount:22000, due_date:'2025-06-10', status:'pending', project_id:'P-2402' },
  { id:'ap-5', po_ref:'PO-2401-015', vendor:'Lincoln Elec.', description:'Consumables Q2',              amount: 2840, due_date:'2025-04-30', status:'overdue', project_id:'P-2401' },
  { id:'ap-6', po_ref:'PO-2401-016', vendor:'SGS Inspection',description:'PMI lab testing P-2401',      amount: 1840, due_date:'2025-04-20', status:'paid',    project_id:'P-2401' },
];

let MOCK_MILESTONES = {
  'P-2401': [
    { id:'MS-01', project_id:'P-2401', name:'Contract signing & advance payment', billing_pct:20, billing_amount:56800, status:'invoiced', target_date:'2025-02-01', invoice_id:'INV-2401-01', stage_complete:100, cert_received:true },
    { id:'MS-02', project_id:'P-2401', name:'Material delivery confirmation',       billing_pct:15, billing_amount:42600, status:'invoiced', target_date:'2025-03-15', invoice_id:'INV-2401-02', stage_complete:100, cert_received:true },
    { id:'MS-03', project_id:'P-2401', name:'Shell fabrication complete (50%)',      billing_pct:25, billing_amount:71000, status:'due',      target_date:'2025-05-10', invoice_id:'INV-2401-03', stage_complete:80, cert_received:false },
    { id:'MS-04', project_id:'P-2401', name:'Assembly & nozzle installation',        billing_pct:20, billing_amount:56800, status:'pending',  target_date:'2025-06-30', invoice_id:null, stage_complete:20, cert_received:false },
    { id:'MS-05', project_id:'P-2401', name:'QC completion & hydrostatic test',      billing_pct:10, billing_amount:28400, status:'pending',  target_date:'2025-07-30', invoice_id:null, stage_complete:0, cert_received:false },
    { id:'MS-06', project_id:'P-2401', name:'Final inspection, dispatch & handover', billing_pct:10, billing_amount:28400, status:'pending',  target_date:'2025-08-15', invoice_id:null, stage_complete:0, cert_received:false },
  ],
  'P-2402': [
    { id:'MS-10', project_id:'P-2402', name:'Contract signing advance',        billing_pct:20, billing_amount:19500, status:'invoiced', target_date:'2025-03-01', invoice_id:'INV-2402-01', stage_complete:100, cert_received:true },
    { id:'MS-11', project_id:'P-2402', name:'Material procurement confirmation',billing_pct:20, billing_amount:19500, status:'overdue', target_date:'2025-04-30', invoice_id:'INV-2402-02', stage_complete:100, cert_received:false },
    { id:'MS-12', project_id:'P-2402', name:'50% fabrication milestone',        billing_pct:30, billing_amount:29250, status:'pending', target_date:'2025-07-15', invoice_id:null, stage_complete:30, cert_received:false },
    { id:'MS-13', project_id:'P-2402', name:'Final test & dispatch',            billing_pct:30, billing_amount:29250, status:'pending', target_date:'2025-10-15', invoice_id:null, stage_complete:0, cert_received:false },
  ],
  'P-2403': [
    { id:'MS-20', project_id:'P-2403', name:'Contract advance',              billing_pct:20, billing_amount:28400, status:'invoiced', target_date:'2025-01-15', invoice_id:'INV-2403-01', stage_complete:100, cert_received:true },
    { id:'MS-21', project_id:'P-2403', name:'Tube bundle assembly complete', billing_pct:30, billing_amount:42600, status:'invoiced', target_date:'2025-03-20', invoice_id:'INV-2403-02', stage_complete:100, cert_received:true },
    { id:'MS-22', project_id:'P-2403', name:'QC clearance & welding complete',billing_pct:30, billing_amount:42600, status:'pending', target_date:'2025-06-01', invoice_id:null, stage_complete:50, cert_received:false },
    { id:'MS-23', project_id:'P-2403', name:'Dispatch & handover',            billing_pct:20, billing_amount:28400, status:'pending', target_date:'2025-07-01', invoice_id:null, stage_complete:0, cert_received:false },
  ],
};

let MOCK_JOB_COST = {
  'P-2401': { contract_value: 284000, lines: [
    { id: 'l1', cost_type:'material',    description:'316L SS plate (shell & roof)',    budgeted_amount:68400, actual_amount:71200, committed_amount:0 },
    { id: 'l2', cost_type:'material',    description:'Nozzle package & flanges',        budgeted_amount:14800, actual_amount:13650, committed_amount:1200 },
    { id: 'l3', cost_type:'labour',      description:'Welding (GTAW/SMAW)',             budgeted_amount:22400, actual_amount:14800, committed_amount:9600 },
    { id: 'l4', cost_type:'labour',      description:'Fitting & rolling labour',        budgeted_amount:16800, actual_amount:12200, committed_amount:4400 },
    { id: 'l5', cost_type:'subcontract', description:'NDT — RT & UT (external)',        budgeted_amount:12400, actual_amount:8600,  committed_amount:3800 },
    { id: 'l6', cost_type:'overhead',    description:'Overhead allocation (28%)',       budgeted_amount:52000, actual_amount:38000, committed_amount:14000 },
  ]},
  'P-2402': { contract_value: 97500, lines: [
    { id: 'l10', cost_type:'material',    description:'SA-240 304 plate',               budgeted_amount:22000, actual_amount:0,     committed_amount:22000 },
    { id: 'l11', cost_type:'material',    description:'2:1 Ellipsoidal heads',           budgeted_amount:8400,  actual_amount:0,     committed_amount:5600 },
    { id: 'l12', cost_type:'labour',      description:'Fabrication labour',              budgeted_amount:18000, actual_amount:3200,  committed_amount:14800 },
  ] },
  'P-2403': { contract_value: 142000, lines: [
    { id: 'l20', cost_type:'material',    description:'304 SS tube bundle (420m)',       budgeted_amount:28000, actual_amount:28000, committed_amount:0 },
    { id: 'l21', cost_type:'material',    description:'Replacement tube sheet (pending)',budgeted_amount:0,     actual_amount:9200,  committed_amount:0 },
  ] },
};

let MOCK_LEDGER_ENTRIES = [
  { id: 'ent-1', project_id: 'P-2401', category: 'material', description: '316L SS plate issue', reference_type: 'material_issue', reference_id: 'MI-8491', quantity: 5.2, unit_rate: 13000, total_amount: 67600, posting_date: '2025-03-10', is_reversed: false },
  { id: 'ent-2', project_id: 'P-2401', category: 'labour', description: 'Welding hours — K. Suresh', reference_type: 'timesheet', reference_id: 'TS-941', quantity: 40, unit_rate: 350, total_amount: 14000, posting_date: '2025-04-12', is_reversed: false },
  { id: 'ent-3', project_id: 'P-2401', category: 'subcontract', description: 'NDE RT services', reference_type: 'po_grn', reference_id: 'GRN-491', quantity: 1, unit_rate: 8600, total_amount: 8600, posting_date: '2025-04-15', is_reversed: false },
];

let MOCK_BUDGETS = {
  'P-2401': {
    id: 'bud-1',
    projectId: 'P-2401',
    status: 'approved',
    approvedBy: 'A. Sharma (Finance Manager)',
    approvedDate: '2025-01-12',
    marginTarget: 18,
    revisions: [
      { rev:'B0', date:'2025-01-08', reason:'Initial estimate', totalCost:244600, margin:39400 },
      { rev:'B1', date:'2025-03-02', reason:'NCR tube sheet replacement', totalCost:248200, margin:35800 },
    ],
    lines: [
      { category:'Materials',          estimate:97000, approved:97000, committed:85060, actual:71200, alert:false },
      { category:'Labour',             estimate:56000, approved:56000, committed:23000, actual:33800, alert:false },
      { category:'Sub-contractors',    estimate:19400, approved:19400, committed:12400, actual:8600,  alert:false },
      { category:'Consumables',        estimate:8200,  approved:8200,  committed:8290,  actual:6890,  alert:true  },
      { category:'Freight & logistics',estimate:4800,  approved:4800,  committed:2400,  actual:1800,  alert:false },
      { category:'Overhead (28%)',     estimate:52000, approved:52000, committed:52000, actual:38000, alert:false },
    ]
  },
  'P-2402': {
    id: 'bud-2',
    projectId: 'P-2402',
    status: 'approved',
    approvedBy: 'A. Sharma (Finance Manager)',
    approvedDate: '2025-02-20',
    marginTarget: 15,
    revisions: [{ rev:'B0', date:'2025-02-18', reason:'Initial estimate', totalCost:82800, margin:14700 }],
    lines: [
      { category:'Materials',          estimate:35200, approved:35200, committed:22000, actual:4600,  alert:false },
      { category:'Labour',             estimate:25200, approved:25200, committed:18000, actual:5000,  alert:false },
      { category:'Sub-contractors',    estimate:0,     approved:0,     committed:0,     actual:0,     alert:false },
      { category:'Consumables',        estimate:2400,  approved:2400,  committed:800,   actual:400,   alert:false },
      { category:'Freight & logistics',estimate:1800,  approved:1800,  committed:600,   actual:0,     alert:false },
      { category:'Overhead (28%)',     estimate:18200, approved:18200, committed:8000,  actual:3800,  alert:false },
    ]
  },
};

let MOCK_BANK_GUARANTEES = [
  { ref:'BG-2401-01', project:'P-2401', client:'ADNOC',    type:'Performance',    amount:28400,  issued:'2025-01-20', expiry:'2025-12-31', bank:'Emirates NBD', status:'active'   },
  { ref:'BG-2401-02', project:'P-2401', client:'ADNOC',    type:'Advance Payment',amount:56800,  issued:'2025-01-20', expiry:'2025-09-30', bank:'Emirates NBD', status:'released' },
  { ref:'BG-2402-01', project:'P-2402', client:'Petrofac', type:'Performance',    amount:9750,   issued:'2025-02-15', expiry:'2026-02-14', bank:'ADCB',         status:'active'   },
  { ref:'BG-2403-01', project:'P-2403', client:'ENOC',     type:'Advance Payment',amount:28400,  issued:'2025-01-10', expiry:'2025-08-31', bank:'Emirates NBD', status:'expiring' },
  { ref:'BG-2403-02', project:'P-2403', client:'ENOC',     type:'Performance',    amount:28400,  issued:'2025-01-10', expiry:'2026-01-09', bank:'Emirates NBD', status:'active'   },
];

let MOCK_PAYMENT_BATCHES = [];
let MOCK_RECEIPTS = [];

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

// Additional V1 Finance routes
app.get('/api/finance/dashboard/kpis', (req, res) => {
  res.json({
    monthlyRevenue: 90500,
    outstandingReceivables: 110500,
    outstandingPayables: 72840,
    cashFlow30d: 17660,
    avgProjectMargin: 17
  });
});

app.get('/api/finance/dashboard/revenue-trend', (req, res) => {
  res.json([
    { month: 'Jan', revenue: 85200 },
    { month: 'Feb', revenue: 62100 },
    { month: 'Mar', revenue: 42600 },
    { month: 'Apr', revenue: 0 },
    { month: 'May', revenue: 90500 },
    { month: 'Jun', revenue: 56800 },
    { month: 'Jul', revenue: 80000 },
  ]);
});

app.get('/api/finance/dashboard/budget-vs-actual', (req, res) => {
  res.json([
    { projectId: 'P-2401', budget: 244600, actual: 182340 },
    { projectId: 'P-2402', budget: 82800, actual: 13400 },
    { projectId: 'P-2403', budget: 114800, actual: 114800 },
  ]);
});

app.get('/api/finance/dashboard/action-items', (req, res) => {
  const pendingApprovals = MOCK_AP.filter(a => a.status === 'pending').map(a => ({ id: a.id, ref: a.po_ref, name: `${a.vendor} — ${a.description}`, amount: a.amount }));
  const overdueReceivables = MOCK_INVOICES.filter(i => i.status === 'overdue').map(i => ({ ref: i.id, client: i.client_name, amount: i.amount, due: i.due_date }));
  const expiringBgs = MOCK_BANK_GUARANTEES.filter(bg => bg.status === 'active' || bg.status === 'expiring').map(bg => ({ ref: bg.ref, client: bg.client, amount: bg.amount, expiry: bg.expiry }));
  res.json({ pendingApprovals, overdueReceivables, expiringBgs, budgetAlerts: ['P-2401: Consumables exceeds 80%'] });
});

app.get('/api/finance/job-costing/:projectId/summary', (req, res) => {
  const pid = req.params.projectId;
  const job = MOCK_JOB_COST[pid] || { contract_value: 0, lines: [] };
  const budgeted = job.lines.reduce((s,l) => s + l.budgeted_amount, 0);
  const actual = job.lines.reduce((s,l) => s + l.actual_amount, 0);
  const committed = job.lines.reduce((s,l) => s + l.committed_amount, 0);
  res.json({
    projectId: pid,
    contractValue: job.contract_value,
    budgeted,
    actual,
    committed,
    variance: budgeted - (actual + committed),
    margin: job.contract_value - (actual + committed),
    marginPct: job.contract_value > 0 ? Math.round((job.contract_value - (actual + committed)) / job.contract_value * 100) : 0,
    categories: job.lines
  });
});

app.get('/api/finance/job-costing/:projectId/ledger', (req, res) => {
  const pid = req.params.projectId;
  const ledger = MOCK_LEDGER_ENTRIES.filter(e => e.project_id === pid);
  res.json(ledger);
});

app.post('/api/finance/job-costing/entries/:id/reverse', (req, res) => {
  const entry = MOCK_LEDGER_ENTRIES.find(e => e.id === req.params.id);
  if (!entry) return res.status(404).json({ error: 'Entry not found' });
  entry.is_reversed = true;
  // Push a reversal entry
  MOCK_LEDGER_ENTRIES.push({
    id: `rev-${Date.now()}`,
    project_id: entry.project_id,
    category: entry.category,
    description: `REVERSAL: ${entry.description} — ${req.body.reason || 'Correction'}`,
    reference_type: 'reversal',
    reference_id: entry.id,
    quantity: -entry.quantity,
    unit_rate: entry.unit_rate,
    total_amount: -entry.total_amount,
    posting_date: new Date().toISOString().split('T')[0],
    is_reversed: false
  });
  res.json({ success: true, entry });
});

app.get('/api/finance/job-costing/:projectId/variance', (req, res) => {
  const pid = req.params.projectId;
  const job = MOCK_JOB_COST[pid] || { contract_value: 0, lines: [] };
  const categories = job.lines.map(l => ({
    category: l.cost_type,
    description: l.description,
    budgeted: l.budgeted_amount,
    actual: l.actual_amount,
    variance: l.budgeted_amount - l.actual_amount,
    variancePct: l.budgeted_amount > 0 ? Math.round((l.budgeted_amount - l.actual_amount) / l.budgeted_amount * 100) : 0,
    status: (l.actual_amount > l.budgeted_amount) ? 'red' : (l.actual_amount / l.budgeted_amount >= 0.8) ? 'amber' : 'green'
  }));
  res.json(categories);
});

app.get('/api/finance/job-costing/:projectId/earned-value', (req, res) => {
  res.json({
    ev: 180000,
    pv: 190000,
    ac: 182340,
    cpi: 0.99,
    spi: 0.95,
    cv: -2340,
    sv: -10000,
    eac: 247070,
    etc: 64730
  });
});

app.get('/api/finance/job-costing/benchmark', (req, res) => {
  res.json({
    vesselType: req.query.vesselType || 'Storage Tank',
    avgCostPerTon: 85000,
    avgCostPerWeldingInch: 450,
    similarProjects: [
      { id: 'P-2204', name: 'Carbon Steel Tank 40K', cost: 238000 },
      { id: 'P-2311', name: '316L Tank 30K', cost: 194000 }
    ]
  });
});

app.get('/api/finance/payable/invoices', (req, res) => {
  res.json(MOCK_AP);
});

app.post('/api/finance/payable/invoices', (req, res) => {
  const invoice = {
    id: `ap-${Date.now()}`,
    po_ref: req.body.po_ref || 'PO-2026-001',
    vendor: req.body.vendor || 'Unknown Vendor',
    description: req.body.description || 'Materials',
    amount: Number(req.body.amount) || 0,
    due_date: req.body.due_date || new Date().toISOString().split('T')[0],
    status: 'pending',
    project_id: req.body.project_id || 'P-2401'
  };
  MOCK_AP.push(invoice);
  res.status(201).json(invoice);
});

app.get('/api/finance/payable/invoices/:id', (req, res) => {
  const inv = MOCK_AP.find(i => i.id === req.params.id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });
  res.json(inv);
});

app.put('/api/finance/payable/invoices/:id/verify', (req, res) => {
  const inv = MOCK_AP.find(i => i.id === req.params.id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });
  inv.status = 'verified';
  res.json(inv);
});

app.put('/api/finance/payable/invoices/:id/approve', (req, res) => {
  const inv = MOCK_AP.find(i => i.id === req.params.id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });
  inv.status = 'due'; // approved means ready for payment / due
  res.json(inv);
});

app.post('/api/finance/payable/invoices/:id/match', (req, res) => {
  const inv = MOCK_AP.find(i => i.id === req.params.id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });
  res.json({
    matched: true,
    poDetails: { qty: 10, rate: 3840 },
    grnDetails: { qty: 10, status: 'verified' },
    invoiceDetails: { qty: 10, rate: 3840 }
  });
});

app.get('/api/finance/payable/payment-schedule', (req, res) => {
  res.json(MOCK_AP.filter(a => a.status !== 'paid'));
});

app.post('/api/finance/payable/payment-batches', (req, res) => {
  const batch = {
    id: `batch-${Date.now()}`,
    invoices: req.body.invoiceIds || [],
    totalAmount: req.body.totalAmount || 0,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  MOCK_PAYMENT_BATCHES.push(batch);
  res.status(201).json(batch);
});

app.put('/api/finance/payable/payment-batches/:id/approve', (req, res) => {
  const batch = MOCK_PAYMENT_BATCHES.find(b => b.id === req.params.id);
  if (!batch) return res.status(404).json({ error: 'Batch not found' });
  batch.status = 'approved';
  // Mark all invoices inside it as paid
  batch.invoices.forEach(invId => {
    const inv = MOCK_AP.find(a => a.id === invId);
    if (inv) inv.status = 'paid';
  });
  res.json(batch);
});

app.post('/api/finance/payable/payments', (req, res) => {
  const payment = { id: `pmt-${Date.now()}`, ...req.body, date: new Date().toISOString() };
  if (req.body.invoiceId) {
    const inv = MOCK_AP.find(a => a.id === req.body.invoiceId);
    if (inv) inv.status = 'paid';
  }
  res.json(payment);
});

app.get('/api/finance/payable/vendor-ledger/:vendorId', (req, res) => {
  res.json(MOCK_AP.filter(a => a.vendor === req.params.vendorId));
});

app.get('/api/finance/receivable/invoices', (req, res) => {
  res.json(MOCK_INVOICES);
});

app.post('/api/finance/receivable/invoices', (req, res) => {
  const invoice = {
    id: `INV-${Date.now()}`,
    project_id: req.body.project_id || 'P-2401',
    client_name: req.body.client_name || 'Client',
    description: req.body.description || 'Milestone payment',
    amount: Number(req.body.amount) || 0,
    status: 'draft',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: req.body.due_date || new Date().toISOString().split('T')[0]
  };
  MOCK_INVOICES.push(invoice);
  res.status(201).json(invoice);
});

app.get('/api/finance/receivable/invoices/:id', (req, res) => {
  const inv = MOCK_INVOICES.find(i => i.id === req.params.id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });
  res.json(inv);
});

app.put('/api/finance/receivable/invoices/:id/approve', (req, res) => {
  const inv = MOCK_INVOICES.find(i => i.id === req.params.id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });
  inv.status = 'due';
  res.json(inv);
});

app.put('/api/finance/receivable/invoices/:id/send', (req, res) => {
  const inv = MOCK_INVOICES.find(i => i.id === req.params.id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });
  inv.status = 'due'; // marked as sent, status is active
  res.json(inv);
});

app.post('/api/finance/receivable/receipts', (req, res) => {
  const receipt = { id: `rcpt-${Date.now()}`, ...req.body, date: new Date().toISOString() };
  MOCK_RECEIPTS.push(receipt);
  if (req.body.invoiceId) {
    const inv = MOCK_INVOICES.find(i => i.id === req.body.invoiceId);
    if (inv) {
      inv.status = 'paid';
    }
  }
  res.json(receipt);
});

app.get('/api/finance/receivable/aging', (req, res) => {
  res.json({
    current: 56800 + 42600 + 19500 + 28400 + 42600,
    d30: 19500,
    d60: 71000,
    d90plus: 0
  });
});

app.get('/api/finance/receivable/client-ledger/:projectId', (req, res) => {
  res.json(MOCK_INVOICES.filter(i => i.project_id === req.params.projectId));
});

app.get('/api/finance/billing/milestones/:projectId', (req, res) => {
  res.json(MOCK_MILESTONES[req.params.projectId] || []);
});

app.post('/api/finance/billing/milestones/:projectId', (req, res) => {
  const ms = {
    id: `MS-${Date.now()}`,
    project_id: req.params.projectId,
    name: req.body.name,
    billing_pct: Number(req.body.billing_pct),
    billing_amount: Number(req.body.billing_amount),
    status: 'pending',
    target_date: req.body.target_date || new Date().toISOString().split('T')[0]
  };
  if (!MOCK_MILESTONES[req.params.projectId]) MOCK_MILESTONES[req.params.projectId] = [];
  MOCK_MILESTONES[req.params.projectId].push(ms);
  res.status(201).json(ms);
});

app.put('/api/finance/billing/milestones/:id', (req, res) => {
  let found = null;
  Object.keys(MOCK_MILESTONES).forEach(pid => {
    const ms = MOCK_MILESTONES[pid].find(m => m.id === req.params.id);
    if (ms) {
      Object.assign(ms, req.body);
      found = ms;
    }
  });
  if (!found) return res.status(404).json({ error: 'Milestone not found' });
  res.json(found);
});

app.put('/api/finance/billing/milestones/:id/achieve', (req, res) => {
  let found = null;
  Object.keys(MOCK_MILESTONES).forEach(pid => {
    const ms = MOCK_MILESTONES[pid].find(m => m.id === req.params.id);
    if (ms) {
      ms.status = 'due';
      ms.achieved_at = new Date().toISOString();
      found = ms;
    }
  });
  if (!found) return res.status(404).json({ error: 'Milestone not found' });
  res.json(found);
});

app.post('/api/finance/billing/milestones/:id/generate-invoice', (req, res) => {
  let found = null;
  Object.keys(MOCK_MILESTONES).forEach(pid => {
    const ms = MOCK_MILESTONES[pid].find(m => m.id === req.params.id);
    if (ms) {
      ms.status = 'invoiced';
      ms.invoice_id = `INV-${Date.now()}`;
      found = ms;
      MOCK_INVOICES.push({
        id: ms.invoice_id,
        project_id: ms.project_id,
        client_name: 'ADNOC',
        description: ms.name,
        amount: ms.billing_amount,
        status: 'due',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
      });
    }
  });
  if (!found) return res.status(404).json({ error: 'Milestone not found' });
  res.json(found);
});

app.get('/api/finance/billing/summary/:projectId', (req, res) => {
  const pid = req.params.projectId;
  const mss = MOCK_MILESTONES[pid] || [];
  const contract = pid === 'P-2401' ? 284000 : pid === 'P-2402' ? 97500 : 142000;
  const invoiced = mss.filter(m => m.status === 'invoiced' || m.status === 'paid').reduce((s,m) => s + m.billing_amount, 0);
  res.json({
    contractValue: contract,
    billedToDate: invoiced,
    balanceToBill: contract - invoiced,
    received: invoiced * 0.85,
    outstanding: invoiced * 0.15
  });
});

app.get('/api/finance/budget', (req, res) => {
  res.json(Object.values(MOCK_BUDGETS));
});

app.get('/api/finance/budget/:projectId/latest', (req, res) => {
  res.json(MOCK_BUDGETS[req.params.projectId] || null);
});

app.post('/api/finance/budget/:projectId', (req, res) => {
  const budget = {
    id: `bud-${Date.now()}`,
    status: 'draft',
    projectId: req.params.projectId,
    marginTarget: Number(req.body.marginTarget) || 15,
    revisions: [{ rev: 'B0', date: new Date().toISOString().split('T')[0], reason: 'Initial setup', totalCost: 100000, margin: 15000 }],
    lines: req.body.lines || []
  };
  MOCK_BUDGETS[req.params.projectId] = budget;
  res.status(201).json(budget);
});

app.put('/api/finance/budget/:budgetId', (req, res) => {
  let found = null;
  Object.keys(MOCK_BUDGETS).forEach(pid => {
    if (MOCK_BUDGETS[pid].id === req.params.budgetId) {
      Object.assign(MOCK_BUDGETS[pid], req.body);
      found = MOCK_BUDGETS[pid];
    }
  });
  if (!found) return res.status(404).json({ error: 'Budget not found' });
  res.json(found);
});

app.put('/api/finance/budget/:budgetId/submit', (req, res) => {
  let found = null;
  Object.keys(MOCK_BUDGETS).forEach(pid => {
    if (MOCK_BUDGETS[pid].id === req.params.budgetId) {
      MOCK_BUDGETS[pid].status = 'pending';
      found = MOCK_BUDGETS[pid];
    }
  });
  if (!found) return res.status(404).json({ error: 'Budget not found' });
  res.json(found);
});

app.put('/api/finance/budget/:budgetId/approve', (req, res) => {
  let found = null;
  Object.keys(MOCK_BUDGETS).forEach(pid => {
    if (MOCK_BUDGETS[pid].id === req.params.budgetId) {
      MOCK_BUDGETS[pid].status = 'approved';
      MOCK_BUDGETS[pid].approvedBy = 'Finance Manager';
      MOCK_BUDGETS[pid].approvedDate = new Date().toISOString().split('T')[0];
      found = MOCK_BUDGETS[pid];
    }
  });
  if (!found) return res.status(404).json({ error: 'Budget not found' });
  res.json(found);
});

app.post('/api/finance/budget/:projectId/import-bom', (req, res) => {
  const pid = req.params.projectId;
  const budget = MOCK_BUDGETS[pid];
  if (!budget) return res.status(404).json({ error: 'Budget not found' });
  // Add imported lines
  budget.lines.push(
    { category: 'Materials', estimate: 85000, approved: 85000, committed: 0, actual: 0 },
    { category: 'Labour', estimate: 45000, approved: 45000, committed: 0, actual: 0 }
  );
  res.json(budget);
});

app.get('/api/finance/budget/:projectId/monitoring', (req, res) => {
  res.json({
    status: 'green',
    spendRate: 1200,
    forecastOverrun: 0
  });
});

app.put('/api/finance/budget/:projectId/alert-config', (req, res) => {
  res.json({ success: true, threshold: req.body.threshold });
});

app.post('/api/finance/budget/:projectId/whatif', (req, res) => {
  res.json({ success: true, projectedMargin: 18 });
});

// Reports endpoints stubs
app.get('/api/finance/reports/*', (req, res) => {
  res.json({ success: true, data: [] });
});

// ── HR API mock endpoints ───────────────────────────────────
app.get('/api/hr/attendance', (req, res) => {
  res.json([
    { empId:'E-001', date:'2025-05-05', clockIn:'06:02', clockOut:'14:35', status:'present', hoursWorked:8.55, overtime:0.55, location:'Shop Floor' },
    { empId:'E-002', date:'2025-05-05', clockIn:'05:58', clockOut:'14:45', status:'present', hoursWorked:8.78, overtime:0.78, location:'Shop Floor' },
    { empId:'E-003', date:'2025-05-05', clockIn:'06:10', clockOut:'14:20', status:'present', hoursWorked:8.17, overtime:0.17, location:'Bay 3' },
    { empId:'E-004', date:'2025-05-05', clockIn:'07:00', clockOut:'15:30', status:'present', hoursWorked:8.5, overtime:0.5, location:'QC Lab' }
  ]);
});

app.post('/api/hr/attendance/clock', (req, res) => {
  res.json({ success: true, record: req.body });
});

app.get('/api/hr/leave/balances', (req, res) => {
  res.json([
    { empId:'E-001', annual:30, annualUsed:8,  sick:15, sickUsed:2, emergency:5, emergencyUsed:0, unpaid:0 },
    { empId:'E-002', annual:30, annualUsed:4,  sick:15, sickUsed:0, emergency:5, emergencyUsed:1, unpaid:0 }
  ]);
});

app.get('/api/hr/leave/requests', (req, res) => {
  res.json([
    { id:'LR-001', empId:'E-003', type:'annual', from:'2025-05-12', to:'2025-05-14', days:3, status:'pending', reason:'Family event in India', appliedOn:'2025-05-01', approvedBy:null }
  ]);
});

app.post('/api/hr/leave/apply', (req, res) => {
  res.json({ success: true, request: req.body });
});

app.patch('/api/hr/leave/:id/approve', (req, res) => {
  res.json({ success: true, id: req.params.id, status: req.body.status });
});

app.get('/api/hr/payroll/:month', (req, res) => {
  res.json([
    { empId:'E-001', month: req.params.month, basicSalary:8500, housingAllowance:2500, transportAllowance:800, overtime:450, deductions:0, netPay:12250, status:'paid', payDate:'2025-04-28' }
  ]);
});

let MOCK_EXPENSE_REPORTS = [
  {
    id: 'EXP-REP-001',
    empId: 'E-006',
    title: 'April 2025 Travel & Client Site Visits',
    month: 'April 2025',
    status: 'approved',
    submittedOn: '2025-04-28',
    approvedBy: 'GM',
    totalAmount: 1470,
    currency: 'AED',
    lines: [
      {
        date: '2025-04-25',
        refNo: 'TAX-8841',
        category: 'Travel',
        reason: 'Site visit travel to Abu Dhabi',
        customerInvolved: 'ADNOC',
        amount: 850,
        description: 'Taxi fares and tolls'
      },
      {
        date: '2025-04-25',
        refNo: 'DIN-4481',
        category: 'Entertainment',
        reason: 'Client dinner discussion',
        customerInvolved: 'ADNOC',
        amount: 620,
        description: 'Dinner at Al Nafoura restaurant'
      }
    ]
  }
];

app.get('/api/hr/expenses', (req, res) => {
  res.json(MOCK_EXPENSE_REPORTS);
});

app.post('/api/hr/expenses', (req, res) => {
  const newReport = {
    id: `EXP-REP-${Date.now()}`,
    status: 'pending',
    submittedOn: new Date().toISOString().split('T')[0],
    approvedBy: null,
    totalAmount: req.body.lines ? req.body.lines.reduce((s, l) => s + (Number(l.amount) || 0), 0) : 0,
    currency: 'AED',
    ...req.body
  };
  MOCK_EXPENSE_REPORTS.unshift(newReport);
  res.status(201).json({ success: true, report: newReport });
});

app.patch('/api/hr/expenses/:id/approve', (req, res) => {
  const report = MOCK_EXPENSE_REPORTS.find(r => r.id === req.params.id);
  if (report) {
    report.status = req.body.status || 'approved';
    report.approvedBy = report.status === 'approved' ? 'Sanjay Mathews' : null;
  }
  res.json({ success: true, id: req.params.id, status: req.body.status });
});

app.get('/api/hr/documents/:empId', (req, res) => {
  res.json([
    { id:'DOC-001', empId: req.params.empId, type:'passport', name:'Passport Copy', uploaded:'2024-01-15', expiry:'2028-06-20', status:'valid' }
  ]);
});

app.get('/api/hr/onboarding', (req, res) => {
  res.json([
    { empId:'E-008', startDate:'2021-09-01', status:'complete', steps:[] }
  ]);
});

app.get('/api/hr/analytics', (req, res) => {
  res.json({
    complianceRate: 92,
    skillCoverage: 88,
    turnoverRate: 4.2
  });
});

// ── Quality Control API mock data ──────────────────────────────
const getAuthenticatedUser = (req) => {
  const cookies = getCookies(req);
  let email = cookies.mock_logged_in;

  if (!email && req.headers.authorization) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      email = decoded.sub;
    } catch (e) {
      // ignore
    }
  }
  return email ? USERS[email] : null;
};

const requireRole = (minRole) => {
  return (req, res, next) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const roleLevels = { 'user': 0, 'senior': 1, 'manager': 2, 'gm': 3 };
    const userLvl = roleLevels[user.role] || 0;
    const minLvl = roleLevels[minRole] || 0;
    if (userLvl < minLvl) {
      return res.status(403).json({ error: `Forbidden: Requires at least ${minRole} access` });
    }
    req.currentUser = user;
    next();
  };
};

let MOCK_ITP = {
  'P-2401': [
    { id: 'step-1.1', seq:'1.1', activity:'Incoming material inspection — shell plates',          ref:'IR-001',              parameters:'Thickness ±0.3mm, flatness Class N; no laminations',                    responsible:'QC Inspector', internal:'H', customer:'R', tpi:'H', status:'done',    inspector:'F. Nair',   date:'2025-03-10', result:'Pass',  remarks:'' },
    { id: 'step-1.2', seq:'1.2', activity:'Mill test certificate (MTC) verification',             ref:'MTC-316L-HN44810',    parameters:'Chemical comp & mech props per ASTM A240; heat traceability',             responsible:'QC Inspector', internal:'H', customer:'R', tpi:'H', status:'done',    inspector:'F. Nair',   date:'2025-03-10', result:'Pass',  remarks:'Verified. Meets UNS S31600' },
    { id: 'step-2.1', seq:'2.1', activity:'Dimensional check — plate cutting & marking',          ref:'IR-002',              parameters:'Plate dims per DWG-SH-001; ±1mm; markings legible',                      responsible:'QC Inspector', internal:'P', customer:null, tpi:'R', status:'done',    inspector:'A. Thomas', date:'2025-03-18', result:'Pass',  remarks:'' },
    { id: 'step-3.1', seq:'3.1', activity:'Shell rolling — roundness tolerance ±2mm',             ref:'IR-003',              parameters:'Out-of-roundness ≤1% dia (max 25mm) per API 650 §5.6.5',                responsible:'QC Inspector', internal:'W', customer:null, tpi:'W', status:'done',    inspector:'A. Thomas', date:'2025-04-02', result:'Pass',  remarks:'' },
    { id: 'step-4.1', seq:'4.1', activity:'Fit-up check — longitudinal seam pre-weld',            ref:'IR-004',              parameters:'Mismatch ≤3mm; gap 2–4mm; tack welds per WPS',                          responsible:'QC Inspector', internal:'W', customer:'W',  tpi:'H', status:'active',  inspector:'F. Nair',   date:null,         result:null,    remarks:'' },
    { id: 'step-4.2', seq:'4.2', activity:'Visual examination — longitudinal seam (post-weld)',   ref:null,                  parameters:'No cracks, porosity, undercut ≤0.4mm per API 650 §7.3.4',               responsible:'QC Inspector', internal:'P', customer:'R',  tpi:'W', status:'pending', inspector:null,        date:null,         result:null,    remarks:'' },
    { id: 'step-4.3', seq:'4.3', activity:'Radiographic testing (RT) — longitudinal seam',        ref:null,                  parameters:'Film density 2.0–4.0; IQI ≤2%; 100% seam coverage',                    responsible:'NDT Contractor',internal:'H', customer:'W',  tpi:'H', status:'pending', inspector:null,        date:null,         result:null,    remarks:'' },
    { id: 'step-5.1', seq:'5.1', activity:'Fit-up check — circumferential seam pre-weld',         ref:null,                  parameters:'Mismatch ≤3mm; peaking ≤3mm per API 650 §7.3',                         responsible:'QC Inspector', internal:'W', customer:'W',  tpi:'H', status:'pending', inspector:null,        date:null,         result:null,    remarks:'' },
    { id: 'step-5.2', seq:'5.2', activity:'RT — circumferential seam',                             ref:null,                  parameters:'Same acceptance criteria as longitudinal seam',                         responsible:'NDT Contractor',internal:'H', customer:'W',  tpi:'H', status:'pending', inspector:null,        date:null,         result:null,    remarks:'' },
    { id: 'step-6.1', seq:'6.1', activity:'Nozzle orientation & dimensional check',                ref:null,                  parameters:'Orientation ±5mm; projection ±3mm; flange face level ±1mm',            responsible:'QC Inspector', internal:'W', customer:'R',  tpi:'W', status:'active',  inspector:'A. Thomas', date:null,         result:null,    remarks:'' },
    { id: 'step-7.1', seq:'7.1', activity:'Final assembly visual + dimensional inspection',        ref:null,                  parameters:'All dims per GA drawing; plumb ≤30mm/10m height',                      responsible:'QC Inspector', internal:'H', customer:'H',  tpi:'H', status:'pending', inspector:null,        date:null,         result:null,    remarks:'' },
    { id: 'step-8.1', seq:'8.1', activity:'Hydrostatic pressure test — 1.5× MAWP (1.35 bar)',    ref:null,                  parameters:'24 hr water fill; no leaks; no settlement per API 650 §7.3.6',          responsible:'QC Manager',   internal:'H', customer:'H',  tpi:'H', status:'pending', inspector:null,        date:null,         result:null,    remarks:'' },
    { id: 'step-9.1', seq:'9.1', activity:'Final dimensional, marking & painting inspection',     ref:null,                  parameters:'DFT ±10%; holiday test pass; nameplate correct; MDR complete',           responsible:'QC Manager',   internal:'H', customer:'H',  tpi:'H', status:'pending', inspector:null,        date:null,         result:null,    remarks:'' },
    { id: 'step-9.2', seq:'9.2', activity:'Client witness — pre-dispatch review',                 ref:null,                  parameters:'Visual walkdown + MDR review + sign-off',                               responsible:'QC Manager',   internal:'H', customer:'H',  tpi:'H', status:'pending', inspector:null,        date:null,         result:null,    remarks:'' },
  ],
  'P-2402': [
    { id: 'step-2-1.1', seq:'1.1', activity:'Incoming plate inspection — SA-240 CS',                ref:null,                  parameters:'MTC, visual, dimensional per ASME II / SA-240',                        responsible:'QC Inspector', internal:'H', customer:'R', tpi:'H', status:'pending', inspector:null, date:null, result:null, remarks:'' },
    { id: 'step-2-2.1', seq:'2.1', activity:'WPS/PQR documentation review',                         ref:null,                  parameters:'All WPS qualified; PQR test results meet ASME IX; welder certs current', responsible:'QC Manager',  internal:'H', customer:'R', tpi:'H', status:'pending', inspector:null, date:null, result:null, remarks:'' },
    { id: 'step-2-3.1', seq:'3.1', activity:'Shell course longitudinal seam fit-up',                ref:null,                  parameters:'Mismatch ≤¼T (max 3mm); gap 2–4mm; per ASME VIII UW-35',               responsible:'QC Inspector', internal:'W', customer:'W', tpi:'H', status:'pending', inspector:null, date:null, result:null, remarks:'' },
    { id: 'step-2-4.1', seq:'4.1', activity:'Visual examination — all Cat A/B welds (post-weld)',   ref:null,                  parameters:'No cracks; undercut ≤0.8mm; weld profile per ASME VIII UW-35',          responsible:'QC Inspector', internal:'P', customer:'R', tpi:'W', status:'pending', inspector:null, date:null, result:null, remarks:'' },
    { id: 'step-2-5.1', seq:'5.1', activity:'PWHT time-temperature chart review',                   ref:null,                  parameters:'Peak temp ±14°C; hold time per ASME VIII UW-40 Table',                  responsible:'QC Inspector', internal:'H', customer:'R', tpi:'H', status:'pending', inspector:null, date:null, result:null, remarks:'' },
    { id: 'step-2-6.1', seq:'6.1', activity:'Radiographic examination (RT) — all seams',           ref:null,                  parameters:'Film density 2.0–4.0 H&D; IQI ≤2%; per ASME VIII UW-51',               responsible:'NDT Contractor',internal:'H', customer:'W', tpi:'H', status:'pending', inspector:null, date:null, result:null, remarks:'' },
    { id: 'step-2-7.1', seq:'7.1', activity:'Hydrostatic pressure test',                             ref:null,                  parameters:'1.3 × MAWP × stress ratio; 30 min hold per ASME VIII UG-99',           responsible:'QC Manager',   internal:'H', customer:'H', tpi:'H', status:'pending', inspector:null, date:null, result:null, remarks:'' },
    { id: 'step-2-8.1', seq:'8.1', activity:'ASME nameplate (U-stamp) verification',                ref:null,                  parameters:'All required fields stamped; NB# assigned; AI signature',               responsible:'AI (Auth. Inspector)', internal:'H', customer:'H', tpi:'H', status:'pending', inspector:null, date:null, result:null, remarks:'' },
  ],
  'P-2403': [
    { id: 'step-3-1.1', seq:'1.1', activity:'Shell material incoming inspection',                   ref:'IR-020',              parameters:'MTC; OD ±1mm, WT ±10%; no laminations',                               responsible:'QC Inspector', internal:'H', customer:'R', tpi:'H', status:'done',    inspector:'F. Nair',   date:'2025-02-10', result:'Pass', remarks:'' },
    { id: 'step-3-1.2', seq:'1.2', activity:'Tube material incoming inspection',                    ref:'IR-020B',             parameters:'MTC; OD ±0.1mm, WT ±10%; eddy current cert verified',                  responsible:'QC Inspector', internal:'H', customer:'R', tpi:'H', status:'done',    inspector:'F. Nair',   date:'2025-02-10', result:'Pass', remarks:'' },
    { id: 'step-3-1.3', seq:'1.3', activity:'Tube sheet incoming — MTC verification',               ref:'NCR-031',             parameters:'Chemical comp (Mo ≥2.10%); dimensions per drawing — BLOCKED',           responsible:'QC Inspector', internal:'H', customer:'R', tpi:'H', status:'blocked', inspector:'F. Nair',   date:'2025-04-01', result:'Fail', remarks:'NCR-031 raised. Mo content 2.08% fails spec. Return to vendor.' },
    { id: 'step-3-2.1', seq:'2.1', activity:'Tube bundle assembly — baffle & spacing check',        ref:'IR-021',              parameters:'Baffle spacing ±3mm; tube protrusion 3–6mm; no bow',                   responsible:'QC Inspector', internal:'W', customer:'R', tpi:'W', status:'done',    inspector:'A. Thomas', date:'2025-03-01', result:'Pass', remarks:'' },
    { id: 'step-3-3.1', seq:'3.1', activity:'Tube-to-tubesheet rolling expansion',                  ref:null,                  parameters:'Expansion depth 100% groove; pull-out test ≥ spec — PENDING TUBE SHEET', responsible:'QC Inspector',internal:'H', customer:'W', tpi:'H', status:'pending', inspector:null,        date:null,         result:null,   remarks:'' },
    { id: 'step-3-4.1', seq:'4.1', activity:'Hydrostatic test — shell side & tube side',            ref:null,                  parameters:'1.3 × MAWP each side; 30 min hold; no leaks per ASME VIII UG-99',    responsible:'QC Manager',   internal:'H', customer:'H', tpi:'H', status:'pending', inspector:null,        date:null,         result:null,   remarks:'' },
    { id: 'step-3-5.1', seq:'5.1', activity:'Final dimensional inspection & pre-dispatch review',   ref:null,                  parameters:'Shell OD ±1mm; nozzle orientation ±5mm; MDR complete',                 responsible:'QC Manager',   internal:'H', customer:'H', tpi:'H', status:'pending', inspector:null,        date:null,         result:null,   remarks:'' },
  ]
};

let MOCK_NCRS = [
  {
    id: 'NCR-031', project: 'P-2403', severity: 'critical', status: 'open',
    title: 'MTC failure — tube sheet batch HN-44821',
    desc: 'Chemical composition analysis from external lab (SGS) shows Mo content 2.08% against spec minimum 2.10%. Batch HN-44821 fails API 650 Annex A requirements.',
    raised: '2025-04-01', raisedBy: 'F. Nair',
    area: 'Incoming inspection', drawing: 'DWG-HX-001-A', weldJoint: null,
    disposition: 'Return to vendor',
    workflow: ['raised','review','disposition','closed'],
    currentStep: 1,
    attachments: ['SGS-Lab-Report-HN44821.pdf','NCR-031-Photos.zip'],
    comments: [
      { by: 'F. Nair', time: '01 Apr 09:14', text: 'NCR raised. SGS report uploaded. Awaiting QC Manager disposition.' },
      { by: 'QC Manager', time: '01 Apr 14:30', text: 'Reviewed. Disposition: Return to Vendor. Procurement notified.' },
    ]
  },
  {
    id: 'NCR-030', project: 'P-2401', severity: 'major', status: 'review',
    title: 'Weld undercut — longitudinal seam WJ-04',
    desc: 'Visual inspection reveals undercut >0.4mm depth on weld joint WJ-04 (Shell course 3). Exceeds API 650 allowable limit of 0.4mm. Requires grinding and weld repair.',
    raised: '2025-03-28', raisedBy: 'A. Thomas',
    area: 'Weld inspection', drawing: 'DWG-SH-001-A', weldJoint: 'WJ-04',
    disposition: 'Rework — grind & repair weld',
    workflow: ['raised','review','disposition','closed'],
    currentStep: 1,
    attachments: ['NCR-030-VisualReport.pdf'],
    comments: [
      { by: 'A. Thomas', time: '28 Mar 11:05', text: 'Undercut found during visual. Marked with blue chalk. Photo attached.' },
    ]
  },
  {
    id: 'NCR-029', project: 'P-2401', severity: 'minor', status: 'closed',
    title: 'Plate edge prep — excessive bevel angle on plate PLT-07',
    desc: 'Bevel angle measured at 37° against specified 35°±1°. Minor deviation. Accepted with engineering concession.',
    raised: '2025-03-15', raisedBy: 'F. Nair',
    area: 'Fit-up inspection', drawing: 'DWG-SH-001-A', weldJoint: null,
    disposition: 'Accept as-is — engineering concession EC-2025-004',
    workflow: ['raised','review','disposition','closed'],
    currentStep: 3,
    attachments: ['EC-2025-004.pdf'],
    comments: [
      { by: 'F. Nair', time: '15 Mar 14:00', text: 'Minor deviation. Engineering concession requested.' },
      { by: 'Eng. Manager', time: '16 Mar 09:30', text: 'Concession EC-2025-004 approved. Accept as-is.' },
      { by: 'QC Manager', time: '16 Mar 10:15', text: 'NCR closed. Concession filed in MRB.' },
    ]
  },
  {
    id: 'NCR-028', project: 'P-2402', severity: 'major', status: 'open',
    title: 'Material shortage — SA-240 304 plates not received',
    desc: 'SA-240 Grade 304 plates (12mm, heat no. pending) not received by required date 2025-07-01. Project at risk of schedule delay.',
    raised: '2025-04-20', raisedBy: 'Store Manager',
    area: 'Incoming', drawing: null, weldJoint: null,
    disposition: null,
    workflow: ['raised','review','disposition','closed'],
    currentStep: 0,
    attachments: [],
    comments: [
      { by: 'Store Mgr', time: '20 Apr 08:00', text: 'Material not delivered by PO due date. Procurement escalated.' },
    ]
  }
];

let MOCK_INSPECTIONS = [
  {
    id: 'INSP-089', project: 'P-2402', status: 'pending',
    item: 'Dish ends — 2:1 ellipsoidal SA-240 304',
    lot: 'GRN-089 / Lot DH-2204', supplier: 'Endress+Hauser',
    received: '2025-04-28', qty: '6 EA',
    checks: [
      { label: 'Dimensional check',          done: false },
      { label: 'MTC verification (chem)',     done: false },
      { label: 'MTC verification (mech)',     done: false },
      { label: 'Visual surface inspection',   done: false },
      { label: 'Hardness test (HRC)',         done: false },
    ]
  },
  {
    id: 'INSP-088', project: 'P-2401', status: 'pass',
    item: 'Shell plates 316L 12mm — bottom course',
    lot: 'GRN-086 / Heat HN-44810', supplier: 'Outokumpu',
    received: '2025-03-10', qty: '4 SHT',
    checks: [
      { label: 'Dimensional check',          done: true },
      { label: 'MTC verification (chem)',     done: true },
      { label: 'MTC verification (mech)',     done: true },
      { label: 'Visual surface inspection',   done: true },
      { label: 'External lab (PMI)',          done: true },
    ]
  },
  {
    id: 'INSP-087', project: 'P-2403', status: 'fail',
    item: 'Tube sheet — 316L TS-01',
    lot: 'GRN-085 / Heat HN-44821', supplier: 'Rolled Alloys',
    received: '2025-04-01', qty: '2 EA',
    checks: [
      { label: 'Dimensional check',          done: true },
      { label: 'MTC verification (chem)',     done: true },
      { label: 'External lab analysis (Mo)', done: true },
      { label: 'MTC verification (mech)',     done: false },
      { label: 'Final clearance',            done: false },
    ]
  }
];

let MOCK_CP_TEMPLATES = [
  { id: 'TPL-01', name: 'ASME Vessel ITP Template', type: 'Vessel', revision: 'R1', items: ['Plate Check', 'Shell Rolling Visual', 'Seam Fit-up', 'PWHT Chart Review', 'RT NDT', 'Hydrostatic Test'] },
  { id: 'TPL-02', name: 'API Storage Tank Template', type: 'Tank', revision: 'R2', items: ['Foundation Survey', 'Bottom Plate Layout', 'Shell Course Align', 'Vacuum Box Test', 'Hydro fill test'] }
];

let MOCK_CONTROL_PLANS = {
  'P-2401': [
    { id: 'cp-1', activity: 'WMT weld map verification', frequency: '100% joints', method: 'Review drawing vs physical shell', qc_record: 'WIR-2401-01' },
    { id: 'cp-2', activity: 'DFT coating check', frequency: 'Spot check per course', method: 'DFT Gauge', qc_record: 'DFT-2401-A' }
  ]
};

// ── Quality Control API routes ─────────────────────────────────
app.get('/api/projects/:projectId/itp', (req, res) => {
  res.json(MOCK_ITP[req.params.projectId] || []);
});

app.post('/api/projects/:projectId/itp', requireRole('senior'), (req, res) => {
  const pid = req.params.projectId;
  const step = {
    id: `step-${pid}-${Date.now()}`,
    status: 'pending',
    ...req.body
  };
  if (!MOCK_ITP[pid]) MOCK_ITP[pid] = [];
  MOCK_ITP[pid].push(step);
  res.status(201).json(step);
});

app.post('/api/projects/:projectId/itp/steps/:stepId/signoff', requireRole('senior'), (req, res) => {
  const { projectId, stepId } = req.params;
  const steps = MOCK_ITP[projectId] || [];
  const step = steps.find(s => s.id === stepId);
  if (!step) return res.status(404).json({ error: 'Step not found' });

  // Enforce Manager role for QC Manager responsible steps
  const isManagerStep = step.responsible && step.responsible.toLowerCase().includes('manager');
  if (isManagerStep && req.currentUser.role !== 'manager' && req.currentUser.role !== 'gm') {
    return res.status(403).json({ error: 'Forbidden: This step requires QC Manager approval' });
  }

  const { result, party, comments } = req.body;
  step.status = result === 'rejected' ? 'blocked' : 'done';
  step.result = result === 'rejected' ? 'Fail' : 'Pass';
  step.inspector = req.currentUser.name;
  step.date = new Date().toISOString().split('T')[0];
  step.remarks = comments || '';
  res.json(step);
});

app.get('/api/control-plan/templates', (req, res) => {
  res.json(MOCK_CP_TEMPLATES);
});

app.post('/api/control-plan/templates', requireRole('manager'), (req, res) => {
  const tpl = { id: `TPL-${Date.now()}`, ...req.body };
  MOCK_CP_TEMPLATES.push(tpl);
  res.status(201).json(tpl);
});

app.put('/api/control-plan/templates/:id', requireRole('manager'), (req, res) => {
  const tpl = MOCK_CP_TEMPLATES.find(t => t.id === req.params.id);
  if (!tpl) return res.status(404).json({ error: 'Template not found' });
  Object.assign(tpl, req.body);
  res.json(tpl);
});

app.delete('/api/control-plan/templates/:id', requireRole('manager'), (req, res) => {
  const idx = MOCK_CP_TEMPLATES.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Template not found' });
  MOCK_CP_TEMPLATES.splice(idx, 1);
  res.json({ success: true });
});

app.get('/api/control-plan/projects/:pid', (req, res) => {
  res.json({ items: MOCK_CONTROL_PLANS[req.params.pid] || [] });
});

app.post('/api/control-plan/projects/:pid/apply-template', requireRole('senior'), (req, res) => {
  const pid = req.params.pid;
  MOCK_CONTROL_PLANS[pid] = [
    { id: `cp-${pid}-1`, activity: 'Visual Weld Inspection', frequency: '100% joints', method: 'Visual VT', qc_record: 'WIR-VT-01' },
    { id: `cp-${pid}-2`, activity: 'Radiographic NDT check', frequency: 'Spot check (10%)', method: 'RT Film density', qc_record: 'WIR-RT-01' },
    { id: `cp-${pid}-3`, activity: 'Hydrostatic pressure verify', frequency: 'Once per vessel', method: 'Pressure gauge log', qc_record: 'HTR-01' }
  ];
  res.json({ success: true, items: MOCK_CONTROL_PLANS[pid] });
});

app.post('/api/control-plan/projects/:pid', requireRole('senior'), (req, res) => {
  const pid = req.params.pid;
  const item = { id: `cp-${pid}-${Date.now()}`, ...req.body };
  if (!MOCK_CONTROL_PLANS[pid]) MOCK_CONTROL_PLANS[pid] = [];
  MOCK_CONTROL_PLANS[pid].push(item);
  res.status(201).json(item);
});

app.patch('/api/control-plan/projects/:pid/items/:itemId', requireRole('senior'), (req, res) => {
  const { pid, itemId } = req.params;
  const item = (MOCK_CONTROL_PLANS[pid] || []).find(i => i.id === itemId);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  Object.assign(item, req.body);
  res.json(item);
});

app.delete('/api/control-plan/projects/:pid/items/:itemId', requireRole('senior'), (req, res) => {
  const { pid, itemId } = req.params;
  const list = MOCK_CONTROL_PLANS[pid] || [];
  const idx = list.findIndex(i => i.id === itemId);
  if (idx === -1) return res.status(404).json({ error: 'Item not found' });
  list.splice(idx, 1);
  res.json({ success: true });
});

app.get('/api/ncr', (req, res) => {
  res.json(MOCK_NCRS);
});

app.post('/api/ncr', requireRole('user'), (req, res) => {
  const ncr = {
    id: `NCR-${String(MOCK_NCRS.length + 28).padStart(3, '0')}`,
    status: 'open',
    raised: new Date().toISOString().split('T')[0],
    raisedBy: req.currentUser.name,
    comments: [],
    workflow: ['raised','review','disposition','closed'],
    currentStep: 0,
    attachments: [],
    ...req.body
  };
  MOCK_NCRS.unshift(ncr);
  res.status(201).json(ncr);
});

app.patch('/api/ncr/:id/status', requireRole('senior'), (req, res) => {
  const ncr = MOCK_NCRS.find(n => n.id === req.params.id);
  if (!ncr) return res.status(404).json({ error: 'NCR not found' });
  ncr.status = req.body.status;
  if (req.body.comments) {
    ncr.comments.push({ by: req.currentUser.name, time: new Date().toLocaleTimeString().slice(0, 5), text: req.body.comments });
  }
  res.json(ncr);
});

app.patch('/api/ncr/:id/disposition', requireRole('manager'), (req, res) => {
  const ncr = MOCK_NCRS.find(n => n.id === req.params.id);
  if (!ncr) return res.status(404).json({ error: 'NCR not found' });
  ncr.disposition = req.body.disposition;
  ncr.status = req.body.status || 'closed';
  if (req.body.comments) {
    ncr.comments.push({ by: req.currentUser.name, time: new Date().toLocaleTimeString().slice(0, 5), text: `Disposition set: ${req.body.disposition}. Comments: ${req.body.comments}` });
  }
  res.json(ncr);
});

app.post('/api/ncr/:id/comments', requireRole('user'), (req, res) => {
  const ncr = MOCK_NCRS.find(n => n.id === req.params.id);
  if (!ncr) return res.status(404).json({ error: 'NCR not found' });
  const comment = {
    by: req.currentUser.name,
    time: new Date().toLocaleTimeString().slice(0, 5),
    text: req.body.comment
  };
  if (!ncr.comments) ncr.comments = [];
  ncr.comments.push(comment);
  res.status(201).json(comment);
});

app.get('/api/inspections', (req, res) => {
  res.json(MOCK_INSPECTIONS);
});

app.post('/api/inspections/:id/result', requireRole('senior'), (req, res) => {
  const insp = MOCK_INSPECTIONS.find(i => i.id === req.params.id);
  if (!insp) return res.status(404).json({ error: 'Inspection not found' });
  insp.status = req.body.result; // 'pass' or 'fail'
  res.json(insp);
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


