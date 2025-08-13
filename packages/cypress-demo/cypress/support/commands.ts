/// <reference types="cypress" />

// Example custom commands for the demo
Cypress.Commands.add('loginAsUser', (username: string, password: string) => {
  cy.visit('/login');
  cy.get('[data-testid="input-username"]').type(username);
  cy.get('[data-testid="input-password"]').type(password);
  cy.get('[data-testid="button-login"]').click();
});

declare global {
  namespace Cypress {
    interface Chainable {
      loginAsUser(username: string, password: string): Chainable<void>;
    }
  }
}
