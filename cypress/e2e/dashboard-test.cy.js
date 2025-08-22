describe('Dashboard Test - Intentional Failure', () => {
  it('should fail dashboard navigation test', () => {
    // First login with valid credentials
    cy.visit('/');
    cy.wait(2000);
    
    // Check if we're on login page and login
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="input-username"]').length > 0) {
        cy.get('[data-testid="input-username"]').type('autoheal');
        cy.get('[data-testid="input-password"]').type('password123');
        cy.get('[data-testid="button-login"]').click();
        cy.wait(3000);
      }
    });
    
    // Now try to interact with dashboard elements that don't exist
    cy.get('[data-testid="filter-dropdown-menu"]', { timeout: 5000 }).click();
    cy.get('[data-testid="option-filter-critical"]', { timeout: 5000 }).click();
    
    // This should fail - non-existent navigation button
    cy.get('[data-testid="nav-button-analytics"]', { timeout: 5000 }).click();
  });
});