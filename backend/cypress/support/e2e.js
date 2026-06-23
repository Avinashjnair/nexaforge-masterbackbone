'use strict';

// Suppress uncaught exceptions from the SPA that don't affect test flows
Cypress.on('uncaught:exception', () => false);

// ── API login helper — sets localStorage token for direct API calls ──
Cypress.Commands.add('apiLogin', (email, password) => {
  cy.request('POST', `${Cypress.env('apiUrl')}/auth/login`, { email, password })
    .then(({ body }) => {
      window.localStorage.setItem('nf_access_token', body.accessToken);
      return body;
    });
});

// ── UI login through the login form ──────────────────────────────────
Cypress.Commands.add('uiLogin', (email, password) => {
  cy.visit('/');
  cy.get('#loginEmail').type(email);
  cy.get('#loginPassword').type(password);
  cy.get('#loginBtn').click();
  cy.get('#sidebar', { timeout: 10000 }).should('be.visible');
});
