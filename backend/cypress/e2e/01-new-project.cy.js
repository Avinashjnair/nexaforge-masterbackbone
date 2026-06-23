'use strict';

/**
 * E2E — New project lifecycle: create → procurement → QC → dispatch
 */

const API = Cypress.env('apiUrl');
let accessToken;
let projectId;
const projectNo = `P-E2E-${Date.now()}`;

describe('New project lifecycle', () => {
  before(() => {
    cy.request('POST', `${API}/auth/login`, {
      email:    Cypress.env('gmEmail'),
      password: Cypress.env('gmPassword'),
    }).then(({ body }) => {
      accessToken = body.access_token;
    });
  });

  // ── 1. Create project ───────────────────────────────────────────
  it('creates a new project via POST /api/projects', () => {
    cy.request({
      method:  'POST',
      url:     `${API}/api/projects`,
      headers: { Authorization: `Bearer ${accessToken}` },
      body: {
        project_no:     projectNo,
        name:           'E2E Test Tank',
        contract_value: 250000,
        client_name:    'ADNOC E2E',
        start_date:     '2026-06-01',
        end_date:       '2026-12-31',
      },
    }).then(({ status, body }) => {
      expect(status).to.eq(201);
      expect(body).to.have.property('id');
      expect(body.project_no).to.eq(projectNo);
      expect(body.status).to.eq('planning');
      projectId = body.id;
    });
  });

  // ── 2. Advance to planning phase ────────────────────────────────
  it('advances project phase to engineering', () => {
    cy.request({
      method:  'PATCH',
      url:     `${API}/api/projects/${projectId}/phase`,
      headers: { Authorization: `Bearer ${accessToken}` },
      body:    { phase: 2 },
    }).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body.phase).to.eq(2);
    });
  });

  // ── 3. Add a BOM item ───────────────────────────────────────────
  it('adds a BOM root item', () => {
    cy.request({
      method:  'POST',
      url:     `${API}/api/projects/${projectId}/bom`,
      headers: { Authorization: `Bearer ${accessToken}` },
      body: {
        pn:          'SA-TANK-001',
        description: 'Pressure Vessel Assembly',
        quantity:    1,
        unit:        'ea',
        item_type:   'assembly',
      },
    }).then(({ status, body }) => {
      expect(status).to.eq(201);
      expect(body).to.have.property('id');
    });
  });

  // ── 4. Verify project appears in list ──────────────────────────
  it('project appears in GET /api/projects list', () => {
    cy.request({
      method:  'GET',
      url:     `${API}/api/projects`,
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then(({ status, body }) => {
      expect(status).to.eq(200);
      const projects = body.data || body;
      const found = projects.find(p => p.project_no === projectNo);
      expect(found).to.exist;
    });
  });

  // ── 5. Retrieve project detail ──────────────────────────────────
  it('retrieves project detail with correct fields', () => {
    cy.request({
      method:  'GET',
      url:     `${API}/api/projects/${projectId}`,
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body.id).to.eq(projectId);
      expect(body.contract_value).to.eq(250000);
    });
  });
});
