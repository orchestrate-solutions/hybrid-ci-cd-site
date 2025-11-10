// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/// <reference types="cypress" />

// Custom command example:
// Cypress.Commands.add('login', (email: string, password: string) => {
//   cy.visit('/login');
//   cy.get('[data-cy=email]').type(email);
//   cy.get('[data-cy=password]').type(password);
//   cy.get('[data-cy=submit]').click();
// });

// Add testing library commands
import '@testing-library/cypress/add-commands';

// Add real events plugin
import 'cypress-real-events';

declare global {
  namespace Cypress {
    interface Chainable {
      // Add custom command types here
    }
  }
}