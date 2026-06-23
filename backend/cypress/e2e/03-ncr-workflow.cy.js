'use strict';

/**
 * E2E — NCR full lifecycle: raise → under_review → rework → under_review → accepted → closed
 * State machine enforced: open → under_review → rework → under_review → accepted → closed
 */

const API = Cypress.env('apiUrl');
let gmToken;
let seniorToken;
let projectId;
let ncrId;

describe('NCR full lifecycle', () => {
  before(() => {
    cy.request('POST', `${API}/auth/login`, {
      email: Cypress.env('gmEmail'), password: Cypress.env('gmPassword'),
    }).then(({ body }) => { gmToken = body.access_token; });

    cy.request('POST', `${API}/auth/login`, {
      email: Cypress.env('seniorEmail'), password: Cypress.env('seniorPass'),
    }).then(({ body }) => { seniorToken = body.access_token; });
  });

  // ── 0. Create a project to raise NCR against ───────────────────
  before(() => {
    cy.request({
      method:  'POST',
      url:     `${API}/api/projects`,
      headers: { Authorization: `Bearer ${gmToken}` },
      body: {
        project_no:     `P-NCR-E2E-${Date.now()}`,
        name:           'NCR E2E Project',
        contract_value: 50000,
      },
    }).then(({ body }) => { projectId = body.id; });
  });

  // ── 1. Raise NCR (any authenticated user) ──────────────────────
  it('raises NCR with status "open"', () => {
    cy.request({
      method:  'POST',
      url:     `${API}/api/ncr`,
      headers: { Authorization: `Bearer ${seniorToken}` },
      body: {
        project_id:  projectId,
        title:       'Weld crack detected on nozzle N-4',
        description: 'Visual inspection found linear indication on root pass',
        severity:    'major',
      },
    }).then(({ status, body }) => {
      expect(status).to.eq(201);
      expect(body.status).to.eq('open');
      expect(body.ncr_no).to.match(/^NCR-\d{4}$/);
      ncrId = body.id;
    });
  });

  // ── 2. Move to under_review ─────────────────────────────────────
  it('transitions NCR to "under_review"', () => {
    cy.request({
      method:  'PATCH',
      url:     `${API}/api/ncr/${ncrId}/status`,
      headers: { Authorization: `Bearer ${seniorToken}` },
      body:    { status: 'under_review', comments: 'QC engineer assigned' },
    }).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body.status).to.eq('under_review');
    });
  });

  // ── 3. Send to rework ──────────────────────────────────────────
  it('transitions NCR to "rework"', () => {
    cy.request({
      method:  'PATCH',
      url:     `${API}/api/ncr/${ncrId}/status`,
      headers: { Authorization: `Bearer ${gmToken}` },
      body:    { status: 'rework', comments: 'Grind and re-weld required' },
    }).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body.status).to.eq('rework');
    });
  });

  // ── 4. Re-inspect — back to under_review ───────────────────────
  it('re-inspection: transitions NCR back to "under_review"', () => {
    cy.request({
      method:  'PATCH',
      url:     `${API}/api/ncr/${ncrId}/status`,
      headers: { Authorization: `Bearer ${seniorToken}` },
      body:    { status: 'under_review', comments: 'Rework complete, re-inspecting' },
    }).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body.status).to.eq('under_review');
    });
  });

  // ── 5. Accept after re-inspection ─────────────────────────────
  it('accepts NCR after re-inspection', () => {
    cy.request({
      method:  'PATCH',
      url:     `${API}/api/ncr/${ncrId}/status`,
      headers: { Authorization: `Bearer ${gmToken}` },
      body:    { status: 'accepted', comments: 'Re-welded joint NDE accepted' },
    }).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body.status).to.eq('accepted');
    });
  });

  // ── 6. Close NCR — terminal state ─────────────────────────────
  it('closes NCR — terminal state', () => {
    cy.request({
      method:  'PATCH',
      url:     `${API}/api/ncr/${ncrId}/status`,
      headers: { Authorization: `Bearer ${gmToken}` },
      body:    { status: 'closed', comments: 'NCR closed — NDE accepted, records filed' },
    }).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body.status).to.eq('closed');
    });
  });

  // ── 7. Reject further transitions on closed NCR (state machine) ─
  it('rejects any transition from closed state (422)', () => {
    cy.request({
      method:          'PATCH',
      url:             `${API}/api/ncr/${ncrId}/status`,
      headers:         { Authorization: `Bearer ${gmToken}` },
      body:            { status: 'open' },
      failOnStatusCode: false,
    }).then(({ status }) => {
      expect(status).to.eq(422);
    });
  });

  // ── 8. Full NCR record is retrievable with activity log ────────
  it('retrieves full NCR detail with activity log', () => {
    cy.request({
      method:  'GET',
      url:     `${API}/api/ncr/${ncrId}`,
      headers: { Authorization: `Bearer ${seniorToken}` },
    }).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body.status).to.eq('closed');
      expect(body.activity_log).to.be.an('array').with.length.greaterThan(0);
    });
  });
});
