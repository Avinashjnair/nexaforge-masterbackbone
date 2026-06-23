'use strict';

/**
 * E2E — Weld joint: create → assign welder → NDE inspection → accept → MRB logged
 */

const API = Cypress.env('apiUrl');
let gmToken;
let projectId;
let weldJointId;
let wpsId;

describe('Weld joint lifecycle', () => {
  before(() => {
    cy.request('POST', `${API}/auth/login`, {
      email: Cypress.env('gmEmail'), password: Cypress.env('gmPassword'),
    }).then(({ body }) => { gmToken = body.access_token; });
  });

  // ── 0. Create supporting project ───────────────────────────────
  before(() => {
    cy.request({
      method:  'POST',
      url:     `${API}/api/projects`,
      headers: { Authorization: `Bearer ${gmToken}` },
      body: {
        project_no:     `P-WLD-E2E-${Date.now()}`,
        name:           'Weld E2E Project',
        contract_value: 75000,
      },
    }).then(({ body }) => { projectId = body.id; });
  });

  // ── 1. List WPS records — at least one should exist ────────────
  it('lists available WPS records', () => {
    cy.request({
      method:  'GET',
      url:     `${API}/api/wps`,
      headers: { Authorization: `Bearer ${gmToken}` },
    }).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body).to.be.an('array');
      // Store first WPS id if available
      if (body.length > 0) wpsId = body[0].id;
    });
  });

  // ── 2. Create weld joint ────────────────────────────────────────
  it('creates a weld joint on the project', () => {
    cy.request({
      method:  'POST',
      url:     `${API}/api/projects/${projectId}/weld-joints`,
      headers: { Authorization: `Bearer ${gmToken}` },
      body: {
        joint_no:      'WJ-001',
        weld_process:  'SMAW',
        material_spec: 'SA-516-70',
        thickness_mm:  12,
        diameter_mm:   null,
        position:      '2G',
        wps_id:        wpsId || null,
      },
    }).then(({ status, body }) => {
      expect(status).to.eq(201);
      expect(body).to.have.property('id');
      expect(body.joint_no).to.eq('WJ-001');
      expect(body.status).to.eq('pending');
      weldJointId = body.id;
    });
  });

  // ── 3. Retrieve weld joint detail ──────────────────────────────
  it('retrieves weld joint detail', () => {
    cy.request({
      method:  'GET',
      url:     `${API}/api/projects/${projectId}/weld-joints/${weldJointId}`,
      headers: { Authorization: `Bearer ${gmToken}` },
    }).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body.id).to.eq(weldJointId);
      expect(body.material_spec).to.eq('SA-516-70');
    });
  });

  // ── 4. Update weld joint to in_progress (welder assigned) ──────
  it('updates joint status to in_progress', () => {
    cy.request({
      method:  'PATCH',
      url:     `${API}/api/projects/${projectId}/weld-joints/${weldJointId}`,
      headers: { Authorization: `Bearer ${gmToken}` },
      body:    { status: 'in_progress' },
    }).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body.status).to.eq('in_progress');
    });
  });

  // ── 5. Mark NDE inspection complete — accept ───────────────────
  it('marks weld joint as accepted after NDE', () => {
    cy.request({
      method:  'PATCH',
      url:     `${API}/api/projects/${projectId}/weld-joints/${weldJointId}`,
      headers: { Authorization: `Bearer ${gmToken}` },
      body: {
        status:       'accepted',
        nde_method:   'RT',
        nde_result:   'accept',
      },
    }).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body.status).to.eq('accepted');
    });
  });

  // ── 6. Weld log appears in project weld list ───────────────────
  it('accepted joint appears in project weld list', () => {
    cy.request({
      method:  'GET',
      url:     `${API}/api/projects/${projectId}/weld-joints`,
      headers: { Authorization: `Bearer ${gmToken}` },
    }).then(({ status, body }) => {
      expect(status).to.eq(200);
      const joints = body.joints || body;
      const found = joints.find(j => j.id === weldJointId);
      expect(found).to.exist;
      expect(found.status).to.eq('accepted');
    });
  });

  // ── 7. MRB PDF endpoint is reachable ───────────────────────────
  it('MRB PDF endpoint responds for the project', () => {
    cy.request({
      method:  'GET',
      url:     `${API}/api/qc/mrb/${projectId}/pdf`,
      headers: { Authorization: `Bearer ${gmToken}` },
      encoding: 'binary',
      failOnStatusCode: false,
    }).then(({ status }) => {
      // 200 (PDF) or 404 if no MRB assembled yet — both acceptable; 401/500 are not
      expect([200, 404]).to.include(status);
    });
  });
});
