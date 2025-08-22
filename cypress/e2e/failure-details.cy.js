describe('Failure Details Test - Intentional Failure', () => {
  it('should fail when accessing failure details', () => {
    // Login first
    cy.visit('/');
    cy.wait(2000);
    
    // Login if needed
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="input-username"]').length > 0) {
        cy.get('[data-testid="input-username"]').type('autoheal');
        cy.get('[data-testid="input-password"]').type('password123');
        cy.get('[data-testid="button-login"]').click();
        cy.wait(3000);
      }
    });
    
    // Try to click on a failure row
    cy.get('[data-testid="failure-row"]').first().click();
    
    // These selectors don't exist and should fail
    cy.get('[data-testid="suggestion-approve-all"]', { timeout: 5000 }).click();
    cy.get('[data-testid="modal-confirm-approval"]', { timeout: 5000 }).click();
    cy.get('[data-testid="success-notification"]', { timeout: 5000 }).should('be.visible');
  });
});