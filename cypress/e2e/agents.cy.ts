/**
 * AgentsPage E2E Tests (Cypress)
 * 
 * User workflow tests for the agents page.
 */

describe('AgentsPage E2E Workflows', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/dashboard/agents');
  });

  describe('Navigation & Structure', () => {
    it('displays agents page header', () => {
      cy.contains('h1, h4', /Agents/i).should('be.visible');
    });

    it('displays agents table', () => {
      cy.get('[data-testid="agents-table"]').should('exist');
    });

    it('displays filter controls', () => {
      cy.get('[data-testid="agents-filters"]').should('be.visible');
    });
  });

  describe('Data Display', () => {
    it('displays agents in table', () => {
      cy.get('[data-testid="agents-table"] tbody tr').should('have.length.greaterThan', 0);
    });

    it('displays status badges', () => {
      cy.get('[data-testid="agents-table"] tbody tr:first').within(() => {
        cy.get('[data-testid*="status-badge"]').should('be.visible');
      });
    });
  });

  describe('Filtering', () => {
    it('filters by status', () => {
      cy.get('[data-testid="filter-status"]').click();
      cy.get('[role="option"]').contains(/RUNNING/i).click();
      cy.get('[data-testid="agents-table"] tbody tr').each((row) => {
        cy.wrap(row).should('contain', 'RUNNING');
      });
    });
  });

  describe('Pagination', () => {
    it('navigates pages', () => {
      cy.contains('button', /Next/i).click();
      cy.url().should('include', 'offset=50');
    });
  });

  describe('Error Handling', () => {
    it('shows error message on failure', () => {
      cy.intercept('/api/dashboard/agents*', { statusCode: 500 });
      cy.reload();
      cy.contains(/Error|Failed/i).should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('has keyboard navigation', () => {
      cy.get('[data-testid="agents-table"]').should('have.attr', 'role', 'table');
    });
  });
});
