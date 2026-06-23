'use strict';

/**
 * E2E — Quote to project: CRM opportunity → quote → won → project created
 */

const API = Cypress.env('apiUrl');
let accessToken;
let clientId;
let opportunityId;
let quoteId;

describe('Quote-to-project pipeline', () => {
  before(() => {
    cy.request('POST', `${API}/auth/login`, {
      email:    Cypress.env('gmEmail'),
      password: Cypress.env('gmPassword'),
    }).then(({ body }) => {
      accessToken = body.access_token;
    });
  });

  // ── 1. Create client ────────────────────────────────────────────
  it('creates a CRM client', () => {
    cy.request({
      method:  'POST',
      url:     `${API}/api/clients`,
      headers: { Authorization: `Bearer ${accessToken}` },
      body: {
        name:     `E2E Client ${Date.now()}`,
        industry: 'Oil & Gas',
        country:  'UAE',
        tier:     'A',
      },
    }).then(({ status, body }) => {
      expect(status).to.eq(201);
      expect(body).to.have.property('id');
      clientId = body.id;
    });
  });

  // ── 2. Create opportunity ───────────────────────────────────────
  it('creates an opportunity against the client', () => {
    cy.request({
      method:  'POST',
      url:     `${API}/api/opportunities`,
      headers: { Authorization: `Bearer ${accessToken}` },
      body: {
        client_id:      clientId,
        title:          'Pressure Vessel Supply E2E',
        stage:          'prospect',
        value:          180000,
        probability_pct: 60,
        expected_close: '2026-09-30',
      },
    }).then(({ status, body }) => {
      expect(status).to.eq(201);
      expect(body).to.have.property('id');
      opportunityId = body.id;
    });
  });

  // ── 3. Create quote from opportunity ───────────────────────────
  it('creates a quote linked to the opportunity', () => {
    cy.request({
      method:  'POST',
      url:     `${API}/api/quotes`,
      headers: { Authorization: `Bearer ${accessToken}` },
      body: {
        opportunity_id: opportunityId,
        title:          'Q-E2E-001 Pressure Vessel',
        total_amount:   180000,
        valid_until:    '2026-07-31',
        notes:          'E2E test quote',
      },
    }).then(({ status, body }) => {
      expect(status).to.eq(201);
      expect(body).to.have.property('id');
      quoteId = body.id;
    });
  });

  // ── 4. Move opportunity to won ──────────────────────────────────
  it('advances opportunity stage to "won"', () => {
    cy.request({
      method:  'PATCH',
      url:     `${API}/api/opportunities/${opportunityId}`,
      headers: { Authorization: `Bearer ${accessToken}` },
      body:    { stage: 'won' },
    }).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body.stage).to.eq('won');
    });
  });

  // ── 5. Verify opportunity is retrievable and marked won ─────────
  it('opportunity detail reflects won stage', () => {
    cy.request({
      method:  'GET',
      url:     `${API}/api/opportunities/${opportunityId}`,
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body.stage).to.eq('won');
      expect(body.client_id).to.eq(clientId);
    });
  });

  // ── 6. Create project from won opportunity ──────────────────────
  it('creates a project linked to the won opportunity', () => {
    cy.request({
      method:  'POST',
      url:     `${API}/api/projects`,
      headers: { Authorization: `Bearer ${accessToken}` },
      body: {
        project_no:     `P-CRM-${Date.now()}`,
        name:           'Pressure Vessel Supply E2E Project',
        contract_value: 180000,
        client_name:    'E2E Client',
        opportunity_id: opportunityId,
      },
    }).then(({ status, body }) => {
      expect(status).to.eq(201);
      expect(body.opportunity_id).to.eq(opportunityId);
    });
  });
});
