describe('Login Test - Intentional Failure', () => {
  it('should fail login test to capture screenshot', () => {
    // Visit the application
    cy.visit('/');
    
    // Wait for the page to load
    cy.wait(2000);
    
    // Try to find elements that don't exist to trigger failures
    cy.get('[data-testid="username-input"]', { timeout: 5000 }).type('testuser');
    cy.get('[data-testid="password-input"]', { timeout: 5000 }).type('password123');
    
    // This should fail because the selector doesn't exist
    cy.get('[data-testid="login-submit-button"]', { timeout: 5000 }).click();
  });
});