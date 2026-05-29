/* ============================================================
   NexaForge ERP — API Client
   JWT-aware fetch wrapper with auto-refresh and 401 handling
   ============================================================ */

'use strict';

const API_BASE = window.NF_API_BASE || 'http://localhost:3000/api';

// ── Token management (access token in memory only) ─────────────
// Refresh token lives in an HttpOnly cookie set by the server — never readable by JS.
const Auth = (() => {
  let _accessToken = null;

  return {
    getAccess()        { return _accessToken; },
    setAccess(access)  { _accessToken = access; },
    clearTokens()      { _accessToken = null; },
    isLoggedIn()       { return !!_accessToken; },
    refresh()          { return _refreshAccessToken(); },
  };
})();

// ── Core fetch with auto-refresh ───────────────────────────────
let _refreshPromise = null;

async function _refreshAccessToken() {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = fetch(`${API_BASE.replace('/api', '')}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then(async (res) => {
      if (!res.ok) throw new Error('Refresh failed');
      const data = await res.json();
      Auth.setAccess(data.access_token);
      return data.access_token;
    })
    .catch((err) => {
      Auth.clearTokens();
      window.dispatchEvent(new CustomEvent('nf:auth:logout'));
      throw err;
    })
    .finally(() => { _refreshPromise = null; });

  return _refreshPromise;
}

async function apiFetch(path, options = {}, retry = true) {
  // Demo mode — serve minimal data for dashboard queries; reject everything else so
  // each module's Promise.allSettled gets 'rejected' and falls back to its local data store.
  if (typeof AppState !== 'undefined' && AppState.isDemoMode) {
    const method = (options.method || 'GET').toUpperCase();
    if (method === 'GET') {
      // Projects list
      if (path === '/projects' || path.startsWith('/projects?'))
        return AppState.projects || [];
      // Dashboard GM aggregate
      if (path === '/dashboard/gm')
        return {
          portfolio: { active_projects: 3, total_projects: 5, on_hold: 1, avg_progress: 50, overdue_count: 1, schedule_attainment: 81, total_backlog: 523500 },
          finance:   { ar_outstanding: 142000, revenue_this_quarter: 680000 },
          ncr:       { total_open: 4, critical_count: 1 },
          blocked_projects: [
            { project_no: 'P-2403', name: '304 Stainless Heat Exchanger', status: 'qc_hold', open_critical_ncrs: 1, due_date: '2025-07-01' }
          ],
          pending_approvals: { draft_invoices: 2, pending_mrs: 5 },
        };
      // NCR list
      if (path === '/ncr' || path.startsWith('/ncr?'))
        return [
          { id: 'n1', ncr_no: 'NCR-2401-001', title: 'MTC verification failed — batch HN-44821', severity: 'major', status: 'open', project_id: 'P-2403' },
          { id: 'n2', ncr_no: 'NCR-2401-002', title: 'Weld undercut — seam W-14', severity: 'minor', status: 'under_review', project_id: 'P-2401' },
        ];
      // All other GETs fall back to local data store
      throw new Error('demo-mode');
    }
    if (method === 'POST') return { id: `demo-${Date.now()}`, ...(options.body ? JSON.parse(options.body) : {}) };
    return null;
  }

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (Auth.getAccess()) {
    headers['Authorization'] = `Bearer ${Auth.getAccess()}`;
  }

  const res = await fetch(url, { ...options, headers, credentials: 'include' });

  // 401 → attempt token refresh once (browser sends HttpOnly cookie automatically), then retry
  if (res.status === 401 && retry) {
    try {
      await _refreshAccessToken();
      return apiFetch(path, options, false);
    } catch {
      window.dispatchEvent(new CustomEvent('nf:auth:logout'));
      throw new Error('Session expired — please log in again');
    }
  }

  if (res.status === 204) return null;

  // UAT-01: 403 — department isolation rejection
  if (res.status === 403) {
    const data403 = await res.json().catch(() => ({}));
    const msg = data403.error || 'Access restricted to your department';
    if (typeof showToast === 'function') showToast(msg, 'error', 5000);
    const err = new Error(msg);
    err.status = 403;
    err.data   = data403;
    throw err;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status  = res.status;
    err.data    = data;
    throw err;
  }

  return data;
}

// ── Convenience methods ────────────────────────────────────────
const api = {
  get:    (path, params)   => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(path + qs);
  },
  post:   (path, body)     => apiFetch(path, { method: 'POST',   body: JSON.stringify(body) }),
  patch:  (path, body)     => apiFetch(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  put:    (path, body)     => apiFetch(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: (path)           => apiFetch(path, { method: 'DELETE' }),

  // File upload (multipart)
  upload: (path, formData) => apiFetch(path, {
    method: 'POST',
    headers: Auth.getAccess() ? { Authorization: `Bearer ${Auth.getAccess()}` } : {},
    body: formData,
  }),
};

// ── Module-level API namespaces ────────────────────────────────
const ProjectsAPI = {
  list:        (params)         => api.get('/projects', params),
  get:         (id)             => api.get(`/projects/${id}`),
  create:      (body)           => api.post('/projects', body),
  setPhase:    (id, phase)      => api.patch(`/projects/${id}/phase`, { phase }),
  setStatus:   (id, status)     => api.patch(`/projects/${id}/status`, { status }),
  setProgress: (id, pct)        => api.patch(`/projects/${id}/progress`, { progress_pct: pct }),
  delete:      (id)             => api.delete(`/projects/${id}`),
};

const BomAPI = {
  tree:        (projectId)      => api.get(`/projects/${projectId}/bom`),
  mrp:         (projectId)      => api.get(`/projects/${projectId}/bom/mrp`),
  addRoot:     (projectId, body)=> api.post(`/projects/${projectId}/bom`, body),
  addChild:    (parentId, body) => api.post(`/bom-items/${parentId}/children`, body),
  update:      (id, body)       => api.patch(`/bom-items/${id}`, body),
  delete:      (id)             => api.delete(`/bom-items/${id}`),
};

const RoutingAPI = {
  list:        (projectId)      => api.get(`/projects/${projectId}/routing`),
  addStep:     (projectId, b)   => api.post(`/projects/${projectId}/routing`, b),
  setStatus:   (projectId, stepId, status, hours) =>
                                   api.patch(`/projects/${projectId}/routing/steps/${stepId}/status`, { status, actual_hours: hours }),
};

const QCAPI = {
  // ITP
  itp:            (projectId)               => api.get(`/projects/${projectId}/itp`),
  addItpStep:     (projectId, b)            => api.post(`/projects/${projectId}/itp`, b),
  signOff:        (projectId, stepId, body) => api.post(`/projects/${projectId}/itp/steps/${stepId}/signoff`, body),

  // Standard control plan templates
  cpTemplates:    (type)     => api.get('/control-plan/templates', type ? { type } : {}),
  addCpTemplate:  (body)     => api.post('/control-plan/templates', body),
  updateCpTemplate:(id, body)=> api.put(`/control-plan/templates/${id}`, body),
  deleteCpTemplate:(id)      => api.delete(`/control-plan/templates/${id}`),

  // Project control plan
  projectCP:      (pid)               => api.get(`/control-plan/projects/${pid}`),
  applyTemplate:  (pid)               => api.post(`/control-plan/projects/${pid}/apply-template`, {}),
  addCpItem:      (pid, body)         => api.post(`/control-plan/projects/${pid}`, body),
  updateCpItem:   (pid, itemId, body) => api.patch(`/control-plan/projects/${pid}/items/${itemId}`, body),
  deleteCpItem:   (pid, itemId)       => api.delete(`/control-plan/projects/${pid}/items/${itemId}`),

  // NCR
  ncrList:     (params)         => api.get('/ncr', params),
  ncrGet:      (id)             => api.get(`/ncr/${id}`),
  ncrCreate:   (body)           => api.post('/ncr', body),
  ncrStatus:   (id, status, comments) => api.patch(`/ncr/${id}/status`, { status, comments }),
  ncrComment:  (id, comment)    => api.post(`/ncr/${id}/comments`, { comment }),
  inspections: (params)         => api.get('/inspections', params),
  inspResult:  (id, result)     => api.post(`/inspections/${id}/result`, { result }),
  mrb:         (projectId)      => api.get(`/projects/${projectId}/weld-joints/mrb`),
  mrbPdf:      (projectId)      => `${API_BASE}/projects/${projectId}/mrb/pdf`,
};

const WeldingAPI = {
  wpsList:     (params)         => api.get('/wps', params),
  wpsGet:      (id)             => api.get(`/wps/${id}`),
  wpsCreate:   (body)           => api.post('/wps', body),
  wpsApprove:  (id)             => api.patch(`/wps/${id}/approve`, {}),
  pqrList:     ()               => api.get('/wps/pqr/all'),
  pqrCreate:   (body)           => api.post('/wps/pqr', body),
  wpqList:     (params)         => api.get('/wpq', params),
  wpqWelder:   (empId)          => api.get(`/wpq/welder/${empId}`),
  wpqCreate:   (body)           => api.post('/wpq', body),
  joints:      (projectId)      => api.get(`/projects/${projectId}/weld-joints`),
  addJoint:    (projectId, b)   => api.post(`/projects/${projectId}/weld-joints`, b),
  assignWelder:(projectId, jId, body) =>
                                   api.patch(`/projects/${projectId}/weld-joints/${jId}/welder`, body),
  ndeCreate:   (projectId, b)   => api.post(`/projects/${projectId}/weld-joints/nde`, b),
};

const CrmAPI = {
  clients:     (params)         => api.get('/clients', params),
  clientGet:   (id)             => api.get(`/clients/${id}`),
  clientCreate:(body)           => api.post('/clients', body),
  opps:        (params)         => api.get('/opportunities', params),
  oppGet:      (id)             => api.get(`/opportunities/${id}`),
  oppCreate:   (body)           => api.post('/opportunities', body),
  oppStage:    (id, stage)      => api.patch(`/opportunities/${id}/stage`, { stage }),
  oppWon:      (id, body)       => api.post(`/opportunities/${id}/won`, body),
  quoteCreate: (body)           => api.post('/quotes', body),
  quoteGet:    (id)             => api.get(`/quotes/${id}`),
  addLine:     (quoteId, body)  => api.post(`/quotes/${quoteId}/lines`, body),
  tenders:     ()               => api.get('/quotes/tenders/all'),
  logActivity: (body)           => api.post('/opportunities/activities', body),

  // ── S-19 CRM / Marketing persistence ──
  // Quote log + revision history
  quoteLog:         (params)     => api.get('/quote-log', params),
  quoteLogGet:      (id)         => api.get(`/quote-log/${id}`),
  quoteLogCreate:   (body)       => api.post('/quote-log', body),
  quoteLogUpdate:   (id, body)   => api.patch(`/quote-log/${id}`, body),
  quoteLogDelete:   (id)         => api.delete(`/quote-log/${id}`),
  quoteRevisions:   (id)         => api.get(`/quote-log/${id}/revisions`),
  addQuoteRevision: (id, body)   => api.post(`/quote-log/${id}/revisions`, body),

  // Quote approvals (margin-gated sign-off)
  approvals:        (params)     => api.get('/quote-approvals', params),
  approvalGet:      (id)         => api.get(`/quote-approvals/${id}`),
  approvalCreate:   (body)       => api.post('/quote-approvals', body),
  approvalDecide:   (id, status, reason) => api.patch(`/quote-approvals/${id}/decision`, { status, reason }),
  approvalDelete:   (id)         => api.delete(`/quote-approvals/${id}`),

  // CRM appointments
  appointments:      (params)    => api.get('/crm/appointments', params),
  appointmentCreate: (body)      => api.post('/crm/appointments', body),
  appointmentUpdate: (id, body)  => api.patch(`/crm/appointments/${id}`, body),
  appointmentDelete: (id)        => api.delete(`/crm/appointments/${id}`),

  // CRM contacts
  contacts:       (params)       => api.get('/crm/contacts', params),
  contactCreate:  (body)         => api.post('/crm/contacts', body),
  contactUpdate:  (id, body)     => api.patch(`/crm/contacts/${id}`, body),
  contactDelete:  (id)           => api.delete(`/crm/contacts/${id}`),

  // Pre-qualification registry
  prequals:       (params)       => api.get('/prequalifications', params),
  prequalCreate:  (body)         => api.post('/prequalifications', body),
  prequalUpdate:  (id, body)     => api.patch(`/prequalifications/${id}`, body),
  prequalDelete:  (id)           => api.delete(`/prequalifications/${id}`),

  // Competitor intel + bid outcomes
  competitors:      (params)     => api.get('/competitors', params),
  competitorCreate: (body)       => api.post('/competitors', body),
  competitorUpdate: (id, body)   => api.patch(`/competitors/${id}`, body),
  competitorDelete: (id)         => api.delete(`/competitors/${id}`),
  bidOutcomes:      (params)     => api.get('/competitors/bids/all', params),
  bidOutcomeCreate: (body)       => api.post('/competitors/bids', body),
  bidOutcomeUpdate: (id, body)   => api.patch(`/competitors/bids/${id}`, body),
  bidOutcomeDelete: (id)         => api.delete(`/competitors/bids/${id}`),
};

const FinanceAPI = {
  jobCost:     (projectId)      => api.get(`/finance/projects/${projectId}/job-cost`),
  addCostLine: (body)           => api.post('/finance/job-cost-lines', body),
  invoices:    (params)         => api.get('/finance/invoices', params),
  createInv:   (body)           => api.post('/finance/invoices', body),
  invStatus:   (id, body)       => api.patch(`/finance/invoices/${id}/status`, body),
  ap:          (params)         => api.get('/finance/accounts-payable', params),
  apPay:       (id)             => api.patch(`/finance/accounts-payable/${id}/pay`, {}),
  milestones:  (projectId)      => api.get(`/finance/projects/${projectId}/milestones`),
  cashFlow:    (months)         => api.get('/finance/cash-flow', { months }),
  invoicePdf:  (id)             => `${API_BASE}/invoices/${id}/pdf`,
  quotePdf:    (id)             => `${API_BASE}/quotes/${id}/pdf`,

  // Dashboard endpoints
  dashboardKpis: () => api.get('/finance/dashboard/kpis'),
  dashboardRevenueTrend: () => api.get('/finance/dashboard/revenue-trend'),
  dashboardBudgetVsActual: () => api.get('/finance/dashboard/budget-vs-actual'),
  dashboardActionItems: () => api.get('/finance/dashboard/action-items'),

  // Job costing endpoints
  jobCostingSummary: (projectId) => api.get(`/finance/job-costing/${projectId}/summary`),
  jobCostingLedger: (projectId, params) => api.get(`/finance/job-costing/${projectId}/ledger`, params),
  jobCostingVariance: (projectId) => api.get(`/finance/job-costing/${projectId}/variance`),
  jobCostingEarnedValue: (projectId) => api.get(`/finance/job-costing/${projectId}/earned-value`),
  jobCostingBenchmark: (params) => api.get('/finance/job-costing/benchmark', params),
  jobCostingReverse: (entryId, body) => api.post(`/finance/job-costing/entries/${entryId}/reverse`, body),

  // Accounts Payable endpoints
  payableInvoices: (params) => api.get('/finance/payable/invoices', params),
  createPayableInvoice: (body) => api.post('/finance/payable/invoices', body),
  payableInvoiceDetail: (id) => api.get(`/finance/payable/invoices/${id}`),
  verifyPayableInvoice: (id, body) => api.put(`/finance/payable/invoices/${id}/verify`, body),
  approvePayableInvoice: (id, body) => api.put(`/finance/payable/invoices/${id}/approve`, body),
  matchPayableInvoice: (id, body) => api.post(`/finance/payable/invoices/${id}/match`, body),
  payablePaymentSchedule: (params) => api.get('/finance/payable/payment-schedule', params),
  createPaymentBatch: (body) => api.post('/finance/payable/payment-batches', body),
  approvePaymentBatch: (id, body) => api.put(`/finance/payable/payment-batches/${id}/approve`, body),
  recordPayment: (body) => api.post('/finance/payable/payments', body),
  payableVendorLedger: (vendorId, params) => api.get(`/finance/payable/vendor-ledger/${vendorId}`, params),

  // Accounts Receivable endpoints
  receivableInvoices: (params) => api.get('/finance/receivable/invoices', params),
  createReceivableInvoice: (body) => api.post('/finance/receivable/invoices', body),
  receivableInvoiceDetail: (id) => api.get(`/finance/receivable/invoices/${id}`),
  approveReceivableInvoice: (id, body) => api.put(`/finance/receivable/invoices/${id}/approve`, body),
  sendReceivableInvoice: (id, body) => api.put(`/finance/receivable/invoices/${id}/send`, body),
  recordReceipt: (body) => api.post('/finance/receivable/receipts', body),
  receivableAging: (params) => api.get('/finance/receivable/aging', params),
  receivableClientLedger: (projectId, params) => api.get(`/finance/receivable/client-ledger/${projectId}`, params),

  // Milestone Billing endpoints
  billingMilestones: (projectId) => api.get(`/finance/billing/milestones/${projectId}`),
  createBillingMilestone: (projectId, body) => api.post(`/finance/billing/milestones/${projectId}`, body),
  updateBillingMilestone: (milestoneId, body) => api.put(`/finance/billing/milestones/${milestoneId}`, body),
  achieveBillingMilestone: (milestoneId, body) => api.put(`/finance/billing/milestones/${milestoneId}/achieve`, body),
  generateInvoiceFromMilestone: (milestoneId, body) => api.post(`/finance/billing/milestones/${milestoneId}/generate-invoice`, body),
  billingSummary: (projectId) => api.get(`/finance/billing/summary/${projectId}`),

  // Budget Management endpoints
  budgets: (params) => api.get('/finance/budget', params),
  budgetLatest: (projectId) => api.get(`/finance/budget/${projectId}/latest`),
  createBudget: (projectId, body) => api.post(`/finance/budget/${projectId}`, body),
  updateBudget: (budgetId, body) => api.put(`/finance/budget/${budgetId}`, body),
  submitBudget: (budgetId, body) => api.put(`/finance/budget/${budgetId}/submit`, body),
  approveBudget: (budgetId, body) => api.put(`/finance/budget/${budgetId}/approve`, body),
  importBomToBudget: (projectId, body) => api.post(`/finance/budget/${projectId}/import-bom`, body),
  budgetMonitoring: (projectId) => api.get(`/finance/budget/${projectId}/monitoring`),
  updateBudgetAlertConfig: (projectId, body) => api.put(`/finance/budget/${projectId}/alert-config`, body),
  budgetWhatIf: (projectId, body) => api.post(`/finance/budget/${projectId}/whatif`, body),

  // Reports endpoints
  reportProjectPnl: (projectId, params) => api.get(`/finance/reports/project-pnl/${projectId}`, params),
  reportProjectCostSummary: (projectId) => api.get(`/finance/reports/project-cost-summary/${projectId}`),
  reportMultiProjectComparison: (params) => api.get('/finance/reports/multi-project-comparison', params),
  reportPayableOutstanding: () => api.get('/finance/reports/payable-outstanding'),
  reportPayableAging: () => api.get('/finance/reports/payable-aging'),
  reportReceivableOutstanding: () => api.get('/finance/reports/receivable-outstanding'),
  reportReceivableAging: () => api.get('/finance/reports/receivable-aging'),
  reportCashFlow: (params) => api.get('/finance/reports/cash-flow', params),
  reportCashFlowForecast: (params) => api.get('/finance/reports/cash-flow-forecast', params),
  reportBgRegister: () => api.get('/finance/reports/bg-register'),
  reportGstSummary: (params) => api.get('/finance/reports/gst-summary', params),
  reportTdsSummary: (params) => api.get('/finance/reports/tds-summary', params),
  reportMonthlySummary: (params) => api.get('/finance/reports/monthly-summary', params),
  reportProfitabilityRanking: () => api.get('/finance/reports/profitability-ranking'),
  exportExcelReport: (reportType) => api.get(`/finance/reports/${reportType}/export-excel`),
  scheduleReport: (body) => api.post('/finance/reports/schedule', body)
};

const ProcurementAPI = {
  pos:         (params)         => api.get('/material-requests', params),   // MRs map to POs
  poStatus:    (id, status)     => api.patch(`/material-requests/${id}/status`, { status }),
};

const HrAPI = {
  employees:   (params)         => api.get('/employees', params),
  employeeGet: (id)             => api.get(`/employees/${id}`),
  addEmployee: (body)           => api.post('/employees', body),
  certs:       (empId)          => api.get(`/employees/${empId}/certs`),
  addCert:     (body)           => api.post('/hr-certs', body),
  renewCert:   (id, body)       => api.patch(`/hr-certs/${id}/renew`, body),
  training:    (params)         => api.get('/training', params),
  addTraining: (body)           => api.post('/training', body),
  completeTraining: (id, b)     => api.patch(`/training/${id}/complete`, b),
  utilisation: (params)         => api.get('/utilisation', params),

  // New features endpoints
  attendance:     (params)      => api.get('/hr/attendance', params),
  clockInOut:     (body)        => api.post('/hr/attendance/clock', body),
  leaveBalances:  ()            => api.get('/hr/leave/balances'),
  leaveRequests:  (params)      => api.get('/hr/leave/requests', params),
  applyLeave:     (body)        => api.post('/hr/leave/apply', body),
  approveLeave:   (id, body)    => api.patch(`/hr/leave/${id}/approve`, body),
  payroll:        (month)       => api.get(`/hr/payroll/${month}`),
  expenses:       (params)      => api.get('/hr/expenses', params),
  submitExpense:  (body)        => api.post('/hr/expenses', body),
  approveExpense: (id, body)    => api.patch(`/hr/expenses/${id}/approve`, body),
  documents:      (empId)       => api.get(`/hr/documents/${empId}`),
  onboarding:     ()            => api.get('/hr/onboarding'),
  analytics:      ()            => api.get('/hr/analytics'),
};

const WarehouseAPI = {
  stock:       (params)         => api.get('/inventory/items', params),
  movements:   (params)         => api.get('/inventory/movements', params),
};

const AnalyticsAPI = {
  kpis:        (params)         => api.get('/analytics/kpis', params),
};

const IiotAPI = {
  machines:    ()               => api.get('/machines'),
  telemetry:   (id, params)     => api.get(`/machines/${id}/telemetry`, params),
  heatLog:     (machId, jId)    => api.get(`/machines/${machId}/heat-log/${jId}`),
  alerts:      ()               => api.get('/iot/alerts'),
};

// ── Auth API ───────────────────────────────────────────────────
const AuthAPI = {
  login:      (email, password) => login(email, password),
  logout:     ()                => logout(),
  forgot:     (email)           => forgot(email),
  reset:      (email, token, newPassword) => reset(email, token, newPassword),
  verify2FA:  (ticket, code)    => verify2FA(ticket, code),
  setup2FA:   ()                => setup2FA(),
  enable2FA:  (secret, code)    => enable2FA(secret, code),
  disable2FA: (code)            => disable2FA(code),
};

// Fix: auth routes are at /auth, not /api/auth
async function login(email, password) {
  const baseUrl = API_BASE.replace('/api', '');
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Login failed');
  }
  const data = await res.json();
  if (data.access_token) {
    Auth.setAccess(data.access_token);
  }
  return data;
}

async function logout() {
  if (typeof AppState !== 'undefined' && AppState.isDemoMode) {
    Auth.clearTokens();
    return;
  }
  const baseUrl = API_BASE.replace('/api', '');
  try {
    await fetch(`${baseUrl}/auth/logout`, {
      method: 'DELETE',
      credentials: 'include',
      headers: Auth.getAccess() ? { Authorization: `Bearer ${Auth.getAccess()}` } : {},
    });
  } catch { /* silent */ }
  Auth.clearTokens();
}

async function forgot(email) {
  if (typeof AppState !== 'undefined' && AppState.isDemoMode) {
    return { message: "If that email exists in our system, we have sent a reset token.", dev_token: "demo-reset-token-123" };
  }
  const baseUrl = API_BASE.replace('/api', '');
  const res = await fetch(`${baseUrl}/auth/forgot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Request failed');
  }
  return res.json();
}

async function reset(email, token, newPassword) {
  if (typeof AppState !== 'undefined' && AppState.isDemoMode) {
    return { message: "Password reset successful" };
  }
  const baseUrl = API_BASE.replace('/api', '');
  const res = await fetch(`${baseUrl}/auth/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token, newPassword }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Reset failed');
  }
  return res.json();
}

async function verify2FA(ticket, code) {
  if (typeof AppState !== 'undefined' && AppState.isDemoMode) {
    if (code === '123456' || code === '000000') {
      const user = AppState.currentUser || { id: '10000000-0000-0000-0000-000000000001', email: 'gm@nexaforge.com', role: 'gm', name: 'General Manager', department: 'gm' };
      Auth.setAccess('demo-access-token');
      return {
        access_token: 'demo-access-token',
        user: user
      };
    } else {
      throw new Error('Invalid 2FA code');
    }
  }
  const baseUrl = API_BASE.replace('/api', '');
  const res = await fetch(`${baseUrl}/auth/2fa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticket, code }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '2FA Verification failed');
  }
  const data = await res.json();
  Auth.setAccess(data.access_token);
  return data;
}

async function setup2FA() {
  if (typeof AppState !== 'undefined' && AppState.isDemoMode) {
    return { secret: "JBSWY3DPEHPK3PXP", qr_code_setup_uri: "otpauth://totp/NexaForge:demo@nexaforge.com?secret=JBSWY3DPEHPK3PXP&issuer=NexaForge" };
  }
  const baseUrl = API_BASE.replace('/api', '');
  return apiFetch(`${baseUrl}/auth/2fa/setup`, { method: 'POST' });
}

async function enable2FA(secret, code) {
  if (typeof AppState !== 'undefined' && AppState.isDemoMode) {
    if (code === '123456' || code === '000000') {
      if (AppState.currentUser) {
        AppState.currentUser.two_factor_enabled = true;
      }
      return { success: true, message: "Two-factor authentication enabled successfully" };
    } else {
      throw new Error('Invalid 2FA verification code');
    }
  }
  const baseUrl = API_BASE.replace('/api', '');
  return apiFetch(`${baseUrl}/auth/2fa/enable`, {
    method: 'POST',
    body: JSON.stringify({ secret, code })
  });
}

async function disable2FA(code) {
  if (typeof AppState !== 'undefined' && AppState.isDemoMode) {
    if (code === '123456' || code === '000000') {
      if (AppState.currentUser) {
        AppState.currentUser.two_factor_enabled = false;
      }
      return { success: true, message: "Two-factor authentication disabled successfully" };
    } else {
      throw new Error('Invalid 2FA verification code');
    }
  }
  const baseUrl = API_BASE.replace('/api', '');
  return apiFetch(`${baseUrl}/auth/2fa/disable`, {
    method: 'POST',
    body: JSON.stringify({ code })
  });
}
