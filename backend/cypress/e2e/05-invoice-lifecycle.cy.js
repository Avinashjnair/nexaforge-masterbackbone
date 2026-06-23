'use strict';

/**
 * E2E — Invoice lifecycle: milestone triggered → invoice created → marked paid
 */

const API = Cypress.env('apiUrl');
let gmToken;
let projectId;
let milestoneId;
let invoiceId;

describe('Invoice lifecycle', () => {
  before(() => {
    cy.request('POST', `${API}/auth/login`, {
      email: Cypress.env('gmEmail'), password: Cypress.env('gmPassword'),
    }).then(({ body }) => { gmToken = body.access_token; });
  });

  // ── 0. Create project ───────────────────────────────────────────
  before(() => {
    cy.request({
      method:  'POST',
      url:     `${API}/api/projects`,
      headers: { Authorization: `Bearer ${gmToken}` },
      body: {
        project_no:     `P-INV-E2E-${Date.now()}`,
        name:           'Invoice E2E Project',
        contract_value: 500000,
        client_name:    'ADNOC Finance E2E',
      },
    }).then(({ body }) => { projectId = body.id; });
  });

  // ── 1. Add a project milestone ──────────────────────────────────
  it('creates a payment milestone on the project', () => {
    cy.request({
      method:  'POST',
      url:     `${API}/api/projects/${projectId}/milestones`,
      headers: { Authorization: `Bearer ${gmToken}` },
      body: {
        name:          'Mobilisation Payment — 30%',
        amount:        150000,
        due_date:      '2026-07-15',
        description:   'Payment due on mobilisation',
      },
    }).then(({ status, body }) => {
      expect(status).to.eq(201);
      expect(body).to.have.property('id');
      expect(body.status).to.eq('pending');
      milestoneId = body.id;
    });
  });

  // ── 2. Create invoice from milestone ───────────────────────────
  it('creates an invoice linked to the milestone', () => {
    cy.request({
      method:  'POST',
      url:     `${API}/api/finance/invoices`,
      headers: { Authorization: `Bearer ${gmToken}` },
      body: {
        project_id:   projectId,
        milestone_id: milestoneId,
        amount:       150000,
        tax_amount:   7500,
        issue_date:   '2026-07-15',
        due_date:     '2026-08-14',
        currency:     'USD',
      },
    }).then(({ status, body }) => {
      expect(status).to.eq(201);
      expect(body).to.have.property('id');
      expect(body.invoice_no).to.match(/^INV-\d{5}$/);
      expect(body.status).to.eq('draft');
      expect(body.milestone_id).to.eq(milestoneId);
      invoiceId = body.id;
    });
  });

  // ── 3. Milestone is marked invoiced ────────────────────────────
  it('milestone status updates to "invoiced" after invoice creation', () => {
    cy.request({
      method:  'GET',
      url:     `${API}/api/projects/${projectId}/milestones/${milestoneId}`,
      headers: { Authorization: `Bearer ${gmToken}` },
    }).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body.status).to.eq('invoiced');
    });
  });

  // ── 4. Send invoice ─────────────────────────────────────────────
  it('updates invoice status to "sent"', () => {
    cy.request({
      method:  'PATCH',
      url:     `${API}/api/finance/invoices/${invoiceId}/status`,
      headers: { Authorization: `Bearer ${gmToken}` },
      body:    { status: 'sent' },
    }).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body.status).to.eq('sent');
    });
  });

  // ── 5. Mark invoice paid ────────────────────────────────────────
  it('marks invoice as paid with paid_amount and paid_date', () => {
    cy.request({
      method:  'PATCH',
      url:     `${API}/api/finance/invoices/${invoiceId}/status`,
      headers: { Authorization: `Bearer ${gmToken}` },
      body: {
        status:      'paid',
        paid_amount: 157500,
        paid_date:   '2026-08-10',
      },
    }).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body.status).to.eq('paid');
      expect(body.paid_amount).to.eq(157500);
    });
  });

  // ── 6. Invoice appears in AR ledger ────────────────────────────
  it('paid invoice appears in GET /api/finance/invoices', () => {
    cy.request({
      method:  'GET',
      url:     `${API}/api/finance/invoices?status=paid`,
      headers: { Authorization: `Bearer ${gmToken}` },
    }).then(({ status, body }) => {
      expect(status).to.eq(200);
      const invoices = body.data || body;
      const found = invoices.find(i => i.id === invoiceId);
      expect(found).to.exist;
      expect(found.status).to.eq('paid');
    });
  });

  // ── 7. Job cost summary reflects invoice ───────────────────────
  it('job cost summary is retrievable for the project', () => {
    cy.request({
      method:  'GET',
      url:     `${API}/api/finance/projects/${projectId}/job-cost`,
      headers: { Authorization: `Bearer ${gmToken}` },
    }).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body).to.have.property('contract_value');
      expect(body).to.have.property('totals');
    });
  });
});
