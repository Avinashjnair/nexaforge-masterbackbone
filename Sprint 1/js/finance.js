/* ============================================================
   NexaForge ERP — Finance Module
   Covers: Job costing (P&L per project) · Cost variance
           Milestone billing tracker · Accounts Receivable (AR)
           Accounts Payable (AP) · Cash flow · Overhead absorption
           Executive financial dashboard
   ============================================================ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   FINANCE DATA STORE
───────────────────────────────────────────────────────────── */
const FinData = {
  activeTab: 'overview',
  selectedProject: 'P-2401',
  jobCostSubTab: 'summary',
  apSubTab: 'register',
  arSubTab: 'register',
  budgetSubTab: 'list',

  /* ── Job costing per project ── */
  jobCost: {
    'P-2401': {
      contractValue: 284000,
      categories: [
        {
          name: 'Materials',
          lines: [
            { desc: '316L SS plate (shell & roof)',  budget: 68400, actual: 71200, committed: 0 },
            { desc: 'Nozzle package & flanges',       budget: 14800, actual: 13650, committed: 1200 },
            { desc: 'Welding consumables & gases',    budget: 8200,  actual: 6890,  committed: 1400 },
            { desc: 'Miscellaneous materials',        budget: 5600,  actual: 4320,  committed: 0 },
          ]
        },
        {
          name: 'Labour',
          lines: [
            { desc: 'Welding (GTAW/SMAW) — K. Suresh', budget: 22400, actual: 14800, committed: 9600 },
            { desc: 'Fitting & rolling labour',          budget: 16800, actual: 12200, committed: 4400 },
            { desc: 'QC inspection labour',              budget: 9600,  actual: 6800,  committed: 2800 },
            { desc: 'Painting & surface treatment',      budget: 7200,  actual: 0,     committed: 7200 },
          ]
        },
        {
          name: 'Sub-contractors',
          lines: [
            { desc: 'NDT — RT & UT (external)',       budget: 12400, actual: 8600,  committed: 3800 },
            { desc: 'PWHT (not required — saved)',     budget: 4200,  actual: 0,     committed: 0 },
            { desc: 'Hydrostatic test rig',            budget: 2800,  actual: 0,     committed: 2800 },
          ]
        },
        {
          name: 'Engineering & overhead',
          lines: [
            { desc: 'Engineering & detailing',         budget: 18000, actual: 12600, committed: 5400 },
            { desc: 'Project management',              budget: 12000, actual: 8400,  committed: 3600 },
            { desc: 'Overhead allocation (28%)',       budget: 52000, actual: 38000, committed: 14000 },
          ]
        },
      ]
    },
    'P-2402': {
      contractValue: 97500,
      categories: [
        {
          name: 'Materials',
          lines: [
            { desc: 'SA-240 304 plate',                budget: 22000, actual: 0,     committed: 22000 },
            { desc: '2:1 Ellipsoidal heads',            budget: 8400,  actual: 0,     committed: 5600 },
            { desc: 'Flanges & fittings SA-105',        budget: 4800,  actual: 4600,  committed: 0 },
          ]
        },
        {
          name: 'Labour',
          lines: [
            { desc: 'Fabrication labour',               budget: 18000, actual: 3200,  committed: 14800 },
            { desc: 'QC & NDT labour',                  budget: 7200,  actual: 1800,  committed: 5400 },
          ]
        },
        {
          name: 'Engineering & overhead',
          lines: [
            { desc: 'Engineering',                      budget: 8800,  actual: 4200,  committed: 4600 },
            { desc: 'Overhead allocation (28%)',        budget: 18200, actual: 3800,  committed: 14400 },
          ]
        },
      ]
    },
    'P-2403': {
      contractValue: 142000,
      categories: [
        {
          name: 'Materials',
          lines: [
            { desc: '304 SS tube bundle (420m)',        budget: 28000, actual: 28000, committed: 0 },
            { desc: 'Shell body & channel heads',       budget: 18000, actual: 18000, committed: 0 },
            { desc: 'Tube sheet 316L (under NCR)',       budget: 9200,  actual: 9200,  committed: 0 },
            { desc: 'Replacement tube sheet (pending)', budget: 0,     actual: 9200,  committed: 0 },
          ]
        },
        {
          name: 'Labour',
          lines: [
            { desc: 'Tube bundle assembly',             budget: 14400, actual: 14400, committed: 0 },
            { desc: 'Welding — blocked (NCR hold)',     budget: 19200, actual: 0,     committed: 19200 },
            { desc: 'QC & NDT',                         budget: 8400,  actual: 6200,  committed: 2200 },
          ]
        },
        {
          name: 'Engineering & overhead',
          lines: [
            { desc: 'Engineering',                      budget: 11200, actual: 8400,  committed: 2800 },
            { desc: 'Overhead allocation (28%)',        budget: 26800, actual: 20600, committed: 6200 },
          ]
        },
      ]
    }
  },

  /* ── Milestone billing per project ── */
  milestones: {
    'P-2401': [
      { id:'MS-01', name:'Contract signing & advance payment',    pct:20, amount:56800, status:'invoiced', invoiceRef:'INV-2401-01', dueDate:'2025-02-01', paidDate:'2025-02-05' },
      { id:'MS-02', name:'Material delivery confirmation',        pct:15, amount:42600, status:'invoiced', invoiceRef:'INV-2401-02', dueDate:'2025-03-15', paidDate:'2025-03-20' },
      { id:'MS-03', name:'Shell fabrication complete (50%)',      pct:25, amount:71000, status:'due',      invoiceRef:'INV-2401-03', dueDate:'2025-05-10', paidDate:null },
      { id:'MS-04', name:'Assembly & nozzle installation',        pct:20, amount:56800, status:'pending',  invoiceRef:null,          dueDate:'2025-06-30', paidDate:null },
      { id:'MS-05', name:'QC completion & hydrostatic test',     pct:10, amount:28400, status:'pending',  invoiceRef:null,          dueDate:'2025-07-30', paidDate:null },
      { id:'MS-06', name:'Final inspection, dispatch & handover', pct:10, amount:28400, status:'pending',  invoiceRef:null,          dueDate:'2025-08-15', paidDate:null },
    ],
    'P-2402': [
      { id:'MS-10', name:'Contract signing advance',              pct:20, amount:19500, status:'invoiced', invoiceRef:'INV-2402-01', dueDate:'2025-03-01', paidDate:'2025-03-08' },
      { id:'MS-11', name:'Material procurement confirmation',     pct:20, amount:19500, status:'overdue',  invoiceRef:'INV-2402-02', dueDate:'2025-04-30', paidDate:null },
      { id:'MS-12', name:'50% fabrication milestone',            pct:30, amount:29250, status:'pending',  invoiceRef:null,          dueDate:'2025-07-15', paidDate:null },
      { id:'MS-13', name:'Final test & dispatch',                pct:30, amount:29250, status:'pending',  invoiceRef:null,          dueDate:'2025-10-15', paidDate:null },
    ],
    'P-2403': [
      { id:'MS-20', name:'Contract advance',                     pct:20, amount:28400, status:'invoiced', invoiceRef:'INV-2403-01', dueDate:'2025-01-15', paidDate:'2025-01-20' },
      { id:'MS-21', name:'Tube bundle assembly complete',        pct:30, amount:42600, status:'invoiced', invoiceRef:'INV-2403-02', dueDate:'2025-03-20', paidDate:'2025-03-28' },
      { id:'MS-22', name:'QC clearance & welding complete',      pct:30, amount:42600, status:'pending',  invoiceRef:null,          dueDate:'2025-06-01', paidDate:null },
      { id:'MS-23', name:'Dispatch & handover',                  pct:20, amount:28400, status:'pending',  invoiceRef:null,          dueDate:'2025-07-01', paidDate:null },
    ]
  },

  /* ── Accounts Receivable ── */
  ar: [
    { ref:'INV-2401-01', project:'P-2401', client:'ADNOC',   desc:'Advance payment — 20%',            amount:56800, issued:'2025-01-28', due:'2025-02-01', status:'paid',    dso:3 },
    { ref:'INV-2401-02', project:'P-2401', client:'ADNOC',   desc:'Material milestone — 15%',         amount:42600, issued:'2025-03-12', due:'2025-03-15', status:'paid',    dso:8 },
    { ref:'INV-2401-03', project:'P-2401', client:'ADNOC',   desc:'Shell fabrication 50% milestone',  amount:71000, issued:'2025-05-01', due:'2025-05-10', status:'due',     dso:null },
    { ref:'INV-2402-01', project:'P-2402', client:'Petrofac',desc:'Advance payment — 20%',            amount:19500, issued:'2025-02-28', due:'2025-03-01', status:'paid',    dso:7 },
    { ref:'INV-2402-02', project:'P-2402', client:'Petrofac',desc:'Material milestone — 20%',         amount:19500, issued:'2025-04-20', due:'2025-04-30', status:'overdue', dso:null },
    { ref:'INV-2403-01', project:'P-2403', client:'ENOC',    desc:'Advance payment — 20%',            amount:28400, issued:'2025-01-10', due:'2025-01-15', status:'paid',    dso:10 },
    { ref:'INV-2403-02', project:'P-2403', client:'ENOC',    desc:'Tube bundle assembly — 30%',       amount:42600, issued:'2025-03-18', due:'2025-03-20', status:'paid',    dso:10 },
    { ref:'INV-2401-04', project:'P-2401', client:'ADNOC',   desc:'Assembly milestone — 20% (draft)', amount:56800, issued:null,         due:'2025-06-30', status:'draft',   dso:null },
  ],

  /* ── Accounts Payable ── */
  ap: [
    { ref:'PO-2401-018', vendor:'Outokumpu',     desc:'316L plate — shell balance',    amount:38400, due:'2025-05-15', status:'due',     project:'P-2401' },
    { ref:'PO-2403-009', vendor:'Rolled Alloys', desc:'Replacement tube sheet (NCR)',   amount: 9200, due:'2025-05-30', status:'pending', project:'P-2403' },
    { ref:'PO-2401-019', vendor:'NDT Services',  desc:'RT & UT inspection P-2401',      amount: 8600, due:'2025-05-20', status:'due',     project:'P-2401' },
    { ref:'PO-2402-004', vendor:'Sandvik',       desc:'SA-240 304 plates (unpaid)',     amount:22000, due:'2025-06-10', status:'pending', project:'P-2402' },
    { ref:'PO-2401-015', vendor:'Lincoln Elec.', desc:'Consumables Q2',                amount: 2840, due:'2025-04-30', status:'overdue', project:'P-2401' },
    { ref:'PO-2401-016', vendor:'SGS Inspection',desc:'PMI lab testing P-2401',         amount: 1840, due:'2025-04-20', status:'paid',    project:'P-2401' },
    { ref:'PO-2402-003', vendor:'Boltun/ITW',    desc:'Flanges SA-105 P-2402',          amount: 4600, due:'2025-04-25', status:'paid',    project:'P-2402' },
  ],

  /* ── Cash flow (monthly USD) ── */
  cashFlow: [
    { month:'Jan', inflow:56800+28400, outflow:24000, label:'Jan' },
    { month:'Feb', inflow:42600+19500, outflow:41000, label:'Feb' },
    { month:'Mar', inflow:42600,       outflow:58000, label:'Mar' },
    { month:'Apr', inflow:0,           outflow:47000, label:'Apr' },
    { month:'May', inflow:71000+19500, outflow:54000, label:'May' },
    { month:'Jun', inflow:56800,       outflow:38000, label:'Jun' },
    { month:'Jul', inflow:28400+29250+42600, outflow:42000, label:'Jul' },
    { month:'Aug', inflow:28400,       outflow:28000, label:'Aug' },
  ],

  /* ── Overhead categories ── */
  overhead: [
    { name:'Facility rent & utilities',   budget:28000, actual:27400 },
    { name:'Equipment depreciation',      budget:18000, actual:18000 },
    { name:'Management salaries',         budget:62000, actual:64200 },
    { name:'Insurance & bonds',           budget:12000, actual:11800 },
    { name:'IT systems & software',       budget: 8400, actual: 8200 },
    { name:'Marketing & BD',              budget: 9600, actual: 7800 },
    { name:'Miscellaneous / contingency', budget: 6000, actual: 4600 },
  ],

  /* ── Budget management per project ── */
  budgets: {
    'P-2401': {
      status: 'approved',
      approvedBy: 'A. Sharma (Finance Manager)',
      approvedDate: '2025-01-12',
      marginTarget: 18,
      revisions: [
        { rev:'B0', date:'2025-01-08', reason:'Initial estimate', totalCost:244600, margin:39400 },
        { rev:'B1', date:'2025-03-02', reason:'NCR tube sheet replacement', totalCost:248200, margin:35800 },
        { rev:'B2', date:'2025-04-15', reason:'CO-003 variation — extra nozzle', totalCost:251400, margin:32600 },
      ],
      lines: [
        { category:'Materials',          estimate:97000, approved:97000, committed:85060, actual:71200, alert:false },
        { category:'Labour',             estimate:56000, approved:56000, committed:23000, actual:33800, alert:false },
        { category:'Sub-contractors',    estimate:19400, approved:19400, committed:12400, actual:8600,  alert:false },
        { category:'Consumables',        estimate:8200,  approved:8200,  committed:8290,  actual:6890,  alert:true  },
        { category:'Freight & logistics',estimate:4800,  approved:4800,  committed:2400,  actual:1800,  alert:false },
        { category:'Overhead (28%)',     estimate:52000, approved:52000, committed:52000, actual:38000, alert:false },
      ],
    },
    'P-2402': {
      status: 'approved',
      approvedBy: 'A. Sharma (Finance Manager)',
      approvedDate: '2025-02-20',
      marginTarget: 15,
      revisions: [
        { rev:'B0', date:'2025-02-18', reason:'Initial estimate', totalCost:82800, margin:14700 },
      ],
      lines: [
        { category:'Materials',          estimate:35200, approved:35200, committed:22000, actual:4600,  alert:false },
        { category:'Labour',             estimate:25200, approved:25200, committed:18000, actual:5000,  alert:false },
        { category:'Sub-contractors',    estimate:0,     approved:0,     committed:0,     actual:0,     alert:false },
        { category:'Consumables',        estimate:2400,  approved:2400,  committed:800,   actual:400,   alert:false },
        { category:'Freight & logistics',estimate:1800,  approved:1800,  committed:600,   actual:0,     alert:false },
        { category:'Overhead (28%)',     estimate:18200, approved:18200, committed:8000,  actual:3800,  alert:false },
      ],
    },
    'P-2403': {
      status: 'pending',
      approvedBy: null,
      approvedDate: null,
      marginTarget: 20,
      revisions: [
        { rev:'B0', date:'2025-01-05', reason:'Initial estimate', totalCost:114800, margin:27200 },
        { rev:'B1', date:'2025-04-10', reason:'NCR — replacement tube sheet $9.2K overrun', totalCost:124000, margin:18000 },
      ],
      lines: [
        { category:'Materials',          estimate:55200, approved:55200, committed:55200, actual:55200, alert:true  },
        { category:'Labour',             estimate:42000, approved:42000, committed:42000, actual:20600, alert:false },
        { category:'Sub-contractors',    estimate:0,     approved:0,     committed:0,     actual:0,     alert:false },
        { category:'Consumables',        estimate:1800,  approved:1800,  committed:1200,  actual:900,   alert:false },
        { category:'Freight & logistics',estimate:2200,  approved:2200,  committed:1100,  actual:800,   alert:false },
        { category:'Overhead (28%)',     estimate:26800, approved:26800, committed:26800, actual:20600, alert:false },
      ],
    },
  },

  /* ── Bank guarantee register ── */
  bankGuarantees: [
    { ref:'BG-2401-01', project:'P-2401', client:'ADNOC',    type:'Performance',    amount:28400,  issued:'2025-01-20', expiry:'2025-12-31', bank:'Emirates NBD', status:'active'   },
    { ref:'BG-2401-02', project:'P-2401', client:'ADNOC',    type:'Advance Payment',amount:56800,  issued:'2025-01-20', expiry:'2025-09-30', bank:'Emirates NBD', status:'released' },
    { ref:'BG-2402-01', project:'P-2402', client:'Petrofac', type:'Performance',    amount:9750,   issued:'2025-02-15', expiry:'2026-02-14', bank:'ADCB',         status:'active'   },
    { ref:'BG-2403-01', project:'P-2403', client:'ENOC',     type:'Advance Payment',amount:28400,  issued:'2025-01-10', expiry:'2025-08-31', bank:'Emirates NBD', status:'expiring' },
    { ref:'BG-2403-02', project:'P-2403', client:'ENOC',     type:'Performance',    amount:28400,  issued:'2025-01-10', expiry:'2026-01-09', bank:'Emirates NBD', status:'active'   },
  ],

  /* ── Reports active report ── */
  activeReport: 'pnl',
};

/* ─────────────────────────────────────────────────────────────
   FINANCE HELPERS
───────────────────────────────────────────────────────────── */
function finFmt(n, sign = false) {
  if (n === null || n === undefined) return '—';
  const abs = Math.abs(n);
  let str;
  if (abs >= 1000000) str = '$' + (abs/1000000).toFixed(2) + 'M';
  else if (abs >= 1000) str = '$' + (abs/1000).toFixed(1) + 'K';
  else str = '$' + abs.toFixed(0);
  if (sign && n !== 0) str = (n > 0 ? '+' : '−') + str;
  else if (n < 0) str = '−' + str;
  return str;
}
function finDaysLeft(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}
function invStatusBadge(status) {
  const map = {
    paid:    ['badge-green',  'Paid'],
    due:     ['badge-amber',  'Due'],
    overdue: ['badge-red',    'Overdue'],
    draft:   ['badge-muted',  'Draft'],
    pending: ['badge-muted',  'Pending'],
  };
  const [cls, lbl] = map[status] || ['badge-muted', status];
  return `<span class="badge ${cls}" style="font-size:10px">${lbl}</span>`;
}
function calcJobTotals(pid) {
  const job = FinData.jobCost[pid];
  if (!job) return null;
  let budget = 0, actual = 0, committed = 0;
  job.categories.forEach(cat => cat.lines.forEach(l => {
    budget    += l.budget;
    actual    += l.actual;
    committed += l.committed;
  }));
  const forecast = actual + committed;
  const variance = budget - forecast;
  const margin   = job.contractValue - forecast;
  const marginPct= Math.round((margin / job.contractValue) * 100);
  return { id: pid, budget, actual, committed, forecast, variance, margin, marginPct, contractValue: job.contractValue };
}

/* ─────────────────────────────────────────────────────────────
   MAIN RENDERER
───────────────────────────────────────────────────────────── */
async function renderFinance() {
  const content = document.getElementById('pageContent');
  if (!content) return;

  // Load live data for fallback cache
  try {
    const pid = FinData.selectedProject;
    const [invoicesRes, milestonesRes, apRes] = await Promise.allSettled([
      FinanceAPI.invoices({ limit: 100 }),
      FinanceAPI.milestones(pid),
      FinanceAPI.payableInvoices()
    ]);

    if (apRes.status === 'fulfilled') {
      FinData.ap = apRes.value || [];
    }

    if (invoicesRes.status === 'fulfilled') {
      const rawInvoices = invoicesRes.value.invoices || invoicesRes.value || [];
      FinData.ar = rawInvoices.map(inv => ({
        ref: inv.id,
        project: inv.project_id || '—',
        client: inv.client_name || '—',
        desc: inv.description || '—',
        amount: inv.amount || 0,
        issued: inv.created_at || new Date(),
        due: inv.due_date || new Date(),
        status: inv.status,
        dso: inv.status === 'paid' ? 10 : null
      }));
    }

    if (milestonesRes.status === 'fulfilled') {
      const rawMilestones = milestonesRes.value.milestones || milestonesRes.value || [];
      FinData.milestones[pid] = rawMilestones.map(ms => ({
        id: ms.id,
        name: ms.name,
        pct: ms.percentage || ms.billing_pct || 0,
        amount: ms.amount || ms.billing_amount || 0,
        status: ms.status === 'completed' ? 'paid' : ms.status === 'invoiced' ? 'invoiced' : 'due',
        invoiceRef: ms.invoice_id || '—',
        dueDate: ms.due_date || ms.target_date || new Date(),
        paidDate: ms.status === 'completed' ? (ms.updated_at || new Date()) : null
      }));
    }
  } catch (err) {
    console.error('Failed to pre-fetch finance data', err);
  }

  enterFinanceModule();
}

function renderFinProjStrip() {
  const colours = { active:'var(--green)', planning:'var(--blue)', 'qc-hold':'var(--amber)' };
  const stripEl = document.getElementById('finProjStrip');
  if (!stripEl) return;
  stripEl.innerHTML = AppState.projects.map(p => {
    const t = calcJobTotals(p.id);
    const varColor = t && t.variance >= 0 ? 'var(--green)' : 'var(--red)';
    return `
    <div class="proj-chip ${p.id === FinData.selectedProject ? 'selected' : ''}" onclick="selectFinProject('${p.id}')">
      <span class="proj-chip-dot" style="background:${colours[p.status]||'var(--text-muted)'}"></span>
      <span style="font-family:var(--font-mono);font-size:11px">${p.id}</span>
      <span style="color:var(--text-muted)">·</span>
      <span style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.name.split('—')[0].trim()}</span>
      ${t ? `<span style="font-size:10px;font-weight:600;color:${varColor}">${t.variance >= 0 ? '+' : ''}${finFmt(t.variance)}</span>` : ''}
    </div>`;
  }).join('');
}

function selectFinProject(id) {
  FinData.selectedProject = id;
  renderFinProjStrip();
  if (typeof renderFinSubPage === 'function') {
    renderFinSubPage(_finActiveSubPage);
  }
}

function switchFinTab(tab) {
  if (typeof renderFinSubPage === 'function') {
    renderFinSubPage(tab);
  }
}

function closeFinModal() { document.getElementById('finModal').style.display = 'none'; }
function openFinModal(html) {
  document.getElementById('finModalContent').innerHTML = html;
  document.getElementById('finModal').style.display = 'block';
}
