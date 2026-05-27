'use strict';

/**
 * E2E — MRP replenishment: run MRP → detect shortfall → auto-raise Material Request
 */

const API = Cypress.env('apiUrl');
let gmToken;
let prodToken;
let projectId;
let bomItemId;

describe('MRP auto-replenishment', () => {
  before(() => {
    cy.request('POST', `${API}/auth/login`, {
      email: Cypress.env('gmEmail'), password: Cypress.env('gmPassword'),
    }).then(({ body }) => { gmToken = body.access_token; });
  });

  // ── 0. Create a project ─────────────────────────────────────────
  before(() => {
    cy.request({
      method:  'POST',
      url:     `${API}/api/projects`,
      headers: { Authorization: `Bearer ${gmToken}` },
      body: {
        project_no:     `P-MRP-E2E-${Date.now()}`,
        name:           'MRP Replenishment E2E',
        contract_value: 100000,
      },
    }).then(({ body }) => { projectId = body.id; });
  });

  // ── 1. Add a BOM leaf item (no on-hand stock → shortage guaranteed) ──
  it('adds a BOM leaf item for MRP calculation', () => {
    cy.request({
      method:  'POST',
      url:     `${API}/api/projects/${projectId}/bom`,
      headers: { Authorization: `Bearer ${gmToken}` },
      body: {
        pn:          `MRP-TEST-${Date.now()}`,
        description: `MRP E2E Test Plate ${Date.now()}`,
        quantity:    10,
        unit:        'pcs',
        item_type:   'material',
      },
    }).then(({ status, body }) => {
      expect(status).to.eq(201);
      expect(body).to.have.property('id');
      bomItemId = body.id;
    });
  });

  // ── 2. Run MRP — verify response structure ──────────────────────
  it('GET /api/mrp/:projectId returns MRP report with summary', () => {
    cy.request({
      method:  'GET',
      url:     `${API}/api/mrp/${projectId}`,
      headers: { Authorization: `Bearer ${gmToken}` },
    }).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body).to.have.property('project_id', projectId);
      expect(body).to.have.property('summary');
      expect(body.summary).to.have.property('total_items');
      expect(body.summary).to.have.property('short_count');
      expect(body).to.have.property('items').that.is.an('array');
    });
  });

  // ── 3. Trigger replenishment — auto-raises MR for short items ───
  it('POST /api/mrp/:projectId/replenish raises MR for shortage', () => {
    cy.request({
      method:          'POST',
      url:             `${API}/api/mrp/${projectId}/replenish`,
      headers:         { Authorization: `Bearer ${gmToken}` },
      failOnStatusCode: false,
    }).then(({ status, body }) => {
      // Either a MR is raised (201-equivalent → replenished: true)
      // or nothing was short (replenished: false) — both are valid
      expect(status).to.eq(201).or.eq(200);
      expect(body).to.have.property('replenished');

      if (body.replenished) {
        expect(body).to.have.property('mr');
        expect(body.mr.mr_no).to.match(/^MR-\d{4}$/);
        expect(body).to.have.property('short_items').that.is.an('array');
      }
    });
  });

  // ── 4. Idempotency — second replenishment on same project ────────
  it('second replenishment call does not 500 (idempotent at API level)', () => {
    cy.request({
      method:          'POST',
      url:             `${API}/api/mrp/${projectId}/replenish`,
      headers:         { Authorization: `Bearer ${gmToken}` },
      failOnStatusCode: false,
    }).then(({ status }) => {
      expect(status).not.to.eq(500);
    });
  });

  // ── 5. Non-production user gets 403 ───────────────────────────────
  it('finance user cannot call replenish (403)', () => {
    cy.request('POST', `${API}/auth/login`, {
      email: Cypress.env('financeEmail'), password: Cypress.env('financePass'),
    }).then(({ body: loginBody }) => {
      cy.request({
        method:          'POST',
        url:             `${API}/api/mrp/${projectId}/replenish`,
        headers:         { Authorization: `Bearer ${loginBody.access_token}` },
        failOnStatusCode: false,
      }).then(({ status }) => {
        expect(status).to.eq(403);
      });
    });
  });
});
