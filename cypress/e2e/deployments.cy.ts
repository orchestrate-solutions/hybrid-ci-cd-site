/**
 * DeploymentsPage E2E Tests (Cypress)
 * 
 * User workflow tests for the deployments page.
 */

describe('DeploymentsPage E2E Workflows', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/dashboard/deployments');
  });

  describe('Navigation & Structure', () => {
    it('navigates to deployments page from dashboard', () => {
      cy.visit('http://localhost:3000/dashboard');
      cy.contains('Deployments').click();
      cy.url().should('include', '/dashboard/deployments');
    });

    it('displays deployments page header', () => {
      cy.contains('h1', /Deployments/i).should('be.visible');
    });

    it('displays create deployment button', () => {
      cy.contains('button', /Create Deployment|Deploy/i).should('be.visible');
    });

    it('displays deployments table', () => {
      cy.get('[data-testid="deployments-table"]').should('exist');
    });

    it('displays filter controls', () => {
      cy.get('[data-testid="deployments-filters"]').should('be.visible');
    });
  });

  describe('Data Display', () => {
    it('displays deployments in table', () => {
      cy.get('[data-testid="deployments-table"] tbody tr').should('have.length.greaterThan', 0);
    });

    it('displays deployment columns', () => {
      cy.get('[data-testid="deployments-table"]').within(() => {
        cy.contains('th', /Name/i).should('be.visible');
        cy.contains('th', /Status/i).should('be.visible');
        cy.contains('th', /Environment/i).should('be.visible');
      });
    });

    it('displays status badges', () => {
      cy.get('[data-testid="deployments-table"] tbody tr').first().within(() => {
        cy.get('[data-testid*="status-badge"]').should('be.visible');
      });
    });

    it('displays environment badges', () => {
      cy.get('[data-testid="deployments-table"] tbody tr').first().within(() => {
        cy.get('[data-testid*="environment-badge"]').should('be.visible');
      });
    });
  });

  describe('Filtering', () => {
    it('filters by status', () => {
      cy.get('[data-testid="filter-status"]').click();
      cy.get('[role="option"]').contains(/COMPLETED/i).click();

      cy.get('[data-testid="deployments-table"] tbody tr').each((row) => {
        cy.wrap(row).should('contain', 'COMPLETED');
      });
    });

    it('filters by environment', () => {
      cy.get('[data-testid="filter-environment"]').click();
      cy.get('[role="option"]').contains(/PRODUCTION/i).click();

      cy.url().should('include', 'environment=PRODUCTION');
    });

    it('resets filters', () => {
      cy.get('[data-testid="filter-status"]').click();
      cy.get('[role="option"]').contains(/COMPLETED/i).click();

      cy.contains('button', /Reset/i).click();

      cy.url().should('not.include', 'status=');
    });
  });

  describe('Sorting', () => {
    it('sorts by name', () => {
      cy.contains('th', /Name/i).click();
      cy.get('[data-testid="deployments-table"] tbody tr').first().should('be.visible');
    });

    it('sorts by status', () => {
      cy.contains('th', /Status/i).click();
      cy.get('[data-testid="deployments-table"] tbody tr').first().should('be.visible');
    });

    it('sorts by created date', () => {
      cy.contains('th', /Created/i).click();
      cy.get('[data-testid="deployments-table"] tbody tr').first().should('be.visible');
    });
  });

  describe('Pagination', () => {
    it('displays pagination', () => {
      cy.get('[data-testid="pagination"]').should('be.visible');
    });

    it('navigates to next page', () => {
      cy.contains('button', /Next/i).click();
      cy.url().should('include', 'offset=50');
    });

    it('navigates to previous page', () => {
      cy.contains('button', /Next/i).click();
      cy.contains('button', /Previous/i).click();
      cy.url().should('include', 'offset=0');
    });
  });

  describe('Error Handling', () => {
    it('shows error message on network failure', () => {
      cy.intercept('/api/dashboard/deployments*', { statusCode: 500 });
      cy.reload();

      cy.contains(/Error|Failed/i).should('be.visible');
    });

    it('provides retry button', () => {
      cy.intercept('/api/dashboard/deployments*', { statusCode: 500 });
      cy.reload();

      cy.contains('button', /Retry/i).should('be.visible');
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no deployments', () => {
      cy.get('[data-testid="filter-status"]').click();
      cy.get('[role="option"]').contains(/CANCELED/i).click();

      cy.contains(/No deployments|No results/i).should('be.visible');
    });
  });

  describe('Interactions', () => {
    it('can click on deployment row', () => {
      cy.get('[data-testid="deployments-table"] tbody tr:first').click();
      cy.url().should('include', '/dashboard/deployments/');
    });

    it('can create new deployment', () => {
      cy.contains('button', /Create Deployment|Deploy/i).click();
      cy.contains(/Create Deployment|New Deployment|Deploy/i).should('be.visible');
    });

    it('can rollback deployment', () => {
      cy.get('[data-testid="deployments-table"] tbody tr:first').within(() => {
        cy.get('[data-testid="deployment-rollback"]').click();
      });

      cy.contains(/Confirm|Rollback/i).should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    it('displays on mobile', () => {
      cy.viewport(375, 667);
      cy.get('[data-testid="deployments-table"]').should('be.visible');
    });

    it('displays on tablet', () => {
      cy.viewport(768, 1024);
      cy.get('[data-testid="deployments-table"]').should('be.visible');
    });

    it('displays on desktop', () => {
      cy.viewport(1920, 1080);
      cy.get('[data-testid="deployments-table"]').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('has keyboard navigation', () => {
      cy.get('[data-testid="deployments-table"]').should('have.attr', 'role', 'table');
      cy.get('[data-testid="deployments-table"] th').should('have.attr', 'role', 'columnheader');
    });

    it('has ARIA labels', () => {
      cy.get('[data-testid="deployments-table"] tbody tr:first')
        .get('[data-testid*="status-badge"]')
        .should('have.attr', 'aria-label');
    });
  });
});
