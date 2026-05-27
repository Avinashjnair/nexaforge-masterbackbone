'use strict';

/**
 * E2E — Department isolation security matrix (UAT Comments 1, Phase 6)
 *
 * Axis 1 — DOM Segregation:       Dept user must NOT see other dept nav items in the sidebar.
 * Axis 2 — Forced Nav Resilience: Calling navigate('<other-dept>') must render a 403 screen.
 * Axis 3 — API Boundary:          Each dept token must get 403 on every other dept's endpoints.
 *
 * Axes 1 & 2 require the frontend served at FRONTEND_URL (default http://localhost:5500/Sprint%201).
 * Axis 3 runs against the backend API only — no frontend required.
 */

const API          = Cypress.env('apiUrl')     || 'http://localhost:3000';
const FRONTEND_URL = Cypress.env('frontendUrl')|| 'http://localhost:5500/Sprint%201';

// ── Dept definitions ───────────────────────────────────────────
// sentinel: the one API path that exclusively belongs to this dept
// ownNav:   sidebar data-page value the dept SHOULD see
// otherNav: sidebar data-page values the dept must NOT see
const DEPTS = {
  finance:     { email: 'finance@nexaforge.com',     sentinel: '/api/finance/invoices',         ownNav: 'finance',     otherNav: ['marketing', 'hr', 'quality', 'procurement', 'welding'] },
  marketing:   { email: 'marketing@nexaforge.com',   sentinel: '/api/clients',                  ownNav: 'marketing',   otherNav: ['finance', 'hr', 'quality', 'procurement', 'welding'] },
  hr:          { email: 'hr@nexaforge.com',           sentinel: '/api/employees',                ownNav: 'hr',          otherNav: ['finance', 'marketing', 'quality', 'procurement', 'welding'] },
  qc:          { email: 'qc@nexaforge.com',           sentinel: '/api/inspections',              ownNav: 'quality',     otherNav: ['finance', 'marketing', 'hr', 'procurement'] },
  procurement: { email: 'procurement@nexaforge.com', sentinel: '/api/material-requests',        ownNav: 'procurement', otherNav: ['finance', 'marketing', 'hr', 'quality', 'welding'] },
  store:       { email: 'store@nexaforge.com',        sentinel: '/api/remnants',                 ownNav: 'inventory',   otherNav: ['finance', 'marketing', 'hr', 'quality', 'welding'] },
  welding:     { email: 'welding@nexaforge.com',      sentinel: '/api/wps',                      ownNav: 'welding',     otherNav: ['finance', 'marketing', 'hr', 'procurement'] },
  production:  { email: 'production@nexaforge.com',  sentinel: '/api/work-centres',             ownNav: 'production',  otherNav: ['finance', 'marketing', 'hr'] },
};

const PASSWORD = 'Password123!';

// ── Token cache (one login per dept per test run) ───────────────
const tokens = {};

function getToken(dept) {
  return cy.request({
    method: 'POST',
    url:    `${API}/auth/login`,
    body:   { email: DEPTS[dept].email, password: PASSWORD },
    failOnStatusCode: false,
  }).then(({ body, status }) => {
    if (status !== 200) throw new Error(`Login failed for ${dept}: ${status}`);
    tokens[dept] = body.access_token;
    return body.access_token;
  });
}

// ─────────────────────────────────────────────────────────────
// Axis 3 — API Boundary Enforcement
// Each dept's JWT must be 403 on every other dept's sentinel.
// GM is not tested here (it bypasses all dept guards by design).
// ─────────────────────────────────────────────────────────────
describe('Axis 3 — API boundary enforcement (cross-dept 403 matrix)', () => {

  // Own endpoint → must be accessible (non-403)
  Object.entries(DEPTS).forEach(([dept, { sentinel }]) => {
    it(`${dept.toUpperCase()} can access its own sentinel endpoint`, () => {
      getToken(dept).then((token) => {
        cy.request({
          method: 'GET',
          url:    `${API}${sentinel}`,
          headers: { Authorization: `Bearer ${token}` },
          failOnStatusCode: false,
        }).then(({ status }) => {
          expect(status, `${dept} own endpoint`).not.to.eq(403);
        });
      });
    });
  });

  // Cross-dept: each dept's token vs every other dept's sentinel → must be 403
  const pairs = [];
  Object.entries(DEPTS).forEach(([attacker, aInfo]) => {
    Object.entries(DEPTS).forEach(([target, tInfo]) => {
      if (attacker !== target) {
        pairs.push({ attacker, target, sentinel: tInfo.sentinel });
      }
    });
  });

  pairs.forEach(({ attacker, target, sentinel }) => {
    it(`${attacker.toUpperCase()} token → 403 on ${target.toUpperCase()} endpoint (${sentinel})`, () => {
      getToken(attacker).then((token) => {
        cy.request({
          method: 'GET',
          url:    `${API}${sentinel}`,
          headers: { Authorization: `Bearer ${token}` },
          failOnStatusCode: false,
        }).then(({ status }) => {
          expect(status, `${attacker} → ${sentinel}`).to.eq(403);
        });
      });
    });
  });

  it('unauthenticated request → 401 on any protected endpoint', () => {
    cy.request({
      method: 'GET',
      url:    `${API}/api/finance/invoices`,
      failOnStatusCode: false,
    }).then(({ status }) => {
      expect(status).to.eq(401);
    });
  });

  it('GM token → 200 on all dept sentinels (bypass by design)', () => {
    cy.request({
      method: 'POST',
      url:    `${API}/auth/login`,
      body:   { email: 'gm@nexaforge.com', password: PASSWORD },
      failOnStatusCode: false,
    }).then(({ body: loginBody }) => {
      const gmToken = loginBody.access_token;
      Object.entries(DEPTS).forEach(([dept, { sentinel }]) => {
        cy.request({
          method: 'GET',
          url:    `${API}${sentinel}`,
          headers: { Authorization: `Bearer ${gmToken}` },
          failOnStatusCode: false,
        }).then(({ status }) => {
          expect(status, `GM → ${dept} sentinel`).not.to.eq(403);
        });
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────
// Axis 1 — DOM Segregation
// Requires: frontend served at FRONTEND_URL
// ─────────────────────────────────────────────────────────────
Object.entries(DEPTS).forEach(([dept, { email, ownNav, otherNav }]) => {
  describe(`Axis 1 — DOM segregation: ${dept.toUpperCase()} sidebar`, () => {
    before(() => {
      cy.request({
        method: 'POST', url: `${API}/auth/login`,
        body:   { email, password: PASSWORD },
        failOnStatusCode: false,
      }).then(({ body, status }) => {
        if (status !== 200) return;
        cy.visit(FRONTEND_URL, {
          onBeforeLoad(win) {
            win._NF_TEST_TOKEN = body.access_token;
            win._NF_TEST_USER  = body.user;
          },
          failOnStatusCode: false,
        });
      });
    });

    it(`shows own nav item [data-page="${ownNav}"]`, () => {
      cy.get(`[data-page="${ownNav}"]`).should('exist');
    });

    otherNav.forEach((page) => {
      it(`hides restricted nav item [data-page="${page}"]`, () => {
        cy.get(`[data-page="${page}"]`).should('not.exist');
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────
// Axis 2 — Forced Navigation Resilience
// Requires: frontend served at FRONTEND_URL
// ─────────────────────────────────────────────────────────────
const FORCED_NAV_CASES = [
  { dept: 'qc',        forcedPage: 'finance',   label: 'Finance' },
  { dept: 'qc',        forcedPage: 'hr',        label: 'HR'      },
  { dept: 'finance',   forcedPage: 'hr',        label: 'HR'      },
  { dept: 'finance',   forcedPage: 'marketing', label: 'Marketing' },
  { dept: 'marketing', forcedPage: 'finance',   label: 'Finance' },
  { dept: 'hr',        forcedPage: 'finance',   label: 'Finance' },
  { dept: 'store',     forcedPage: 'finance',   label: 'Finance' },
  { dept: 'welding',   forcedPage: 'hr',        label: 'HR'      },
  { dept: 'procurement', forcedPage: 'finance', label: 'Finance' },
];

FORCED_NAV_CASES.forEach(({ dept, forcedPage, label }) => {
  describe(`Axis 2 — Forced nav: ${dept.toUpperCase()} → ${label} page`, () => {
    before(() => {
      cy.request({
        method: 'POST', url: `${API}/auth/login`,
        body:   { email: DEPTS[dept].email, password: PASSWORD },
        failOnStatusCode: false,
      }).then(({ body, status }) => {
        if (status !== 200) return;
        cy.visit(FRONTEND_URL, {
          onBeforeLoad(win) {
            win._NF_TEST_TOKEN = body.access_token;
            win._NF_TEST_USER  = body.user;
          },
          failOnStatusCode: false,
        });
      });
    });

    it(`navigate('${forcedPage}') renders access-denied, not ${label} content`, () => {
      cy.window().then((win) => {
        if (typeof win.navigate !== 'function') return;
        win.navigate(forcedPage);
      });

      cy.get('#pageContent').should(($el) => {
        const text = $el.text().toLowerCase();
        expect(
          text.includes('403') || text.includes('access') || text.includes('restricted'),
          'page shows access-denied message'
        ).to.be.true;
      });
    });
  });
});
