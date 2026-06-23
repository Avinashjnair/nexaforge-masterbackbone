'use strict';

const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    env: {
      apiUrl:       'http://localhost:3000',
      frontendUrl:  'http://localhost:5500/Sprint%201',
      gmEmail:      'gm@nexaforge.com',
      gmPassword:   'Password123!',
      managerEmail: 'pm@nexaforge.com',
      managerPass:  'Password123!',
      seniorEmail:  'qc@nexaforge.com',
      seniorPass:   'Password123!',
      qcEmail:      'qc@nexaforge.com',
      qcPassword:   'Password123!',
      financeEmail: 'finance@nexaforge.com',
      financePass:  'Password123!',
      hrEmail:      'hr@nexaforge.com',
      hrPass:       'Password123!',
    },
  },
});
