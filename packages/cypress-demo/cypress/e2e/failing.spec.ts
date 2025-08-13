describe('Intentionally Failing Test for AutoHeal Demo', () => {
  beforeEach(() => {
    // Create a simple test page
    cy.visit('data:text/html,<html><body><div><button class="old-login-btn" data-testid="login-submit-btn">Log In</button></div></body></html>');
  });

  it('should demonstrate selector healing - brittle selector', () => {
    // This selector will fail intentionally to trigger AutoHeal
    cy.get('.login-btn-submit').should('be.visible').click();
    
    // The correct selector would be:
    // cy.get('[data-testid="login-submit-btn"]').should('be.visible').click();
  });

  it('should demonstrate navigation failure', () => {
    cy.visit('data:text/html,<html><body><nav><ul><li><a href="#" data-testid="nav-dashboard">Dashboard</a></li></ul></nav></body></html>');
    
    // This will fail - wrong nth-child
    cy.get('#sidebar-nav .menu-item:nth-child(3)').click();
    
    // The correct selector would be:
    // cy.get('[data-testid="nav-dashboard"]').click();
  });

  it('should demonstrate form input failure', () => {
    cy.visit('data:text/html,<html><body><form><input type="text" data-testid="search-input" placeholder="Search products..."/></form></body></html>');
    
    // This will fail - old placeholder-based selector
    cy.get('input[placeholder="Search for items..."]').type('test query');
    
    // The correct selector would be:
    // cy.get('[data-testid="search-input"]').type('test query');
  });
});

describe('Fixed Test Using Selector Map', () => {
  it('should use the selector map for stable selectors', () => {
    cy.visit('data:text/html,<html><body><button data-testid="login-submit-btn">Log In</button></body></html>');
    
    // Using the custom command that loads from selector map
    cy.sel('home.loginButton').should('be.visible').click();
  });
});
