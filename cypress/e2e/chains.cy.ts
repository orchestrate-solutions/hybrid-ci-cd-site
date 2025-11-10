/**
 * Cypress Tests for CodeUChain Components
 * Tests: JobsChain, DeploymentsChain, AgentsChain state management
 */

describe('CodeUChain Components E2E', () => {
  describe('JobsChain', () => {
    it('should render JobsChain demo', () => {
      cy.get('[data-testid="jobs-chain-demo"]').should('exist');
    });

    it('should display jobs table', () => {
      cy.get('[data-testid="jobs-table"]').should('exist');
      cy.get('table').should('have.length.greaterThan', 0);
    });

    it('should filter jobs by status', () => {
      cy.get('[data-testid="status-filter"]').click();
      cy.get('[role="option"]').first().click();
      cy.get('table tbody tr').should('have.length.greaterThan', 0);
    });

    it('should filter jobs by priority', () => {
      cy.get('[data-testid="priority-filter"]').click();
      cy.get('[role="option"]').contains('High').click();
      cy.get('table tbody tr').each(($row) => {
        cy.wrap($row).should('contain', /HIGH|High/);
      });
    });

    it('should search jobs by name', () => {
      cy.get('[data-testid="search-input"]').type('Deploy');
      cy.get('table tbody tr').should('have.length.greaterThan', 0);
    });

    it('should sort jobs by field', () => {
      cy.get('[data-testid="sort-field"]').click();
      cy.get('[role="option"]').contains('Name').click();
      cy.get('[data-testid="sort-direction"]').click();
      cy.get('[role="option"]').contains('Ascending').click();
      cy.get('table tbody tr').should('have.length.greaterThan', 0);
    });

    it('should handle multiple filters simultaneously', () => {
      cy.get('[data-testid="status-filter"]').click();
      cy.get('[role="option"]').contains('Running').click();
      cy.get('[data-testid="priority-filter"]').click();
      cy.get('[role="option"]').contains('Critical').click();
      cy.get('[data-testid="search-input"]').type('Deploy');
      cy.get('table tbody tr').should('have.length.greaterThan', 0);
    });

    it('should display job details in table', () => {
      cy.get('table thead th').should('contain', 'Name');
      cy.get('table thead th').should('contain', 'Status');
      cy.get('table thead th').should('contain', 'Priority');
    });

    it('should show loading state', () => {
      cy.get('[data-testid="loading-spinner"]', { timeout: 5000 }).should('not.exist');
      cy.get('table').should('exist');
    });

    it('should display count of results', () => {
      cy.get('[data-testid="result-count"]').should('contain', /[0-9]+ job/);
    });
  });

  describe('DeploymentsChain', () => {
    it('should render deployments list', () => {
      cy.get('[data-testid="deployments-list"]').should('exist');
    });

    it('should filter deployments by status', () => {
      cy.get('[data-testid="deployment-status-filter"]').should('exist');
    });

    it('should filter deployments by region', () => {
      cy.get('[data-testid="deployment-region-filter"]').should('exist');
    });

    it('should search deployments', () => {
      cy.get('[data-testid="deployment-search"]').should('exist');
      cy.get('[data-testid="deployment-search"]').type('Frontend');
      cy.get('[data-testid="deployment-item"]').should('have.length.greaterThan', 0);
    });

    it('should display deployment details', () => {
      cy.get('[data-testid="deployment-item"]').should('have.length.greaterThan', 0);
      cy.get('[data-testid="deployment-item"]').first().should('contain', /In Progress|Completed|Failed/);
    });
  });

  describe('AgentsChain', () => {
    it('should render agents pool', () => {
      cy.get('[data-testid="agents-pool"]').should('exist');
    });

    it('should display agent cards', () => {
      cy.get('[data-testid="agent-card"]').should('have.length.greaterThan', 0);
    });

    it('should filter agents by status', () => {
      cy.get('[data-testid="agent-status-filter"]').should('exist');
      cy.get('[data-testid="agent-status-filter"]').click();
      cy.get('[role="option"]').first().click();
    });

    it('should search agents by name', () => {
      cy.get('[data-testid="agent-search"]').type('Agent');
      cy.get('[data-testid="agent-card"]').should('have.length.greaterThan', 0);
    });

    it('should display agent status indicator', () => {
      cy.get('[data-testid="agent-status-indicator"]').should('have.length.greaterThan', 0);
    });

    it('should show agent capacity', () => {
      cy.get('[data-testid="agent-capacity"]').should('have.length.greaterThan', 0);
    });
  });

  describe('Chain State Updates', () => {
    it('should update results when filters change', () => {
      cy.get('[data-testid="jobs-table"] tbody tr').then(($rows1) => {
        const initialCount = $rows1.length;
        cy.get('[data-testid="status-filter"]').click();
        cy.get('[role="option"]').contains('Running').click();
        cy.get('[data-testid="jobs-table"] tbody tr').then(($rows2) => {
          expect($rows2.length).to.be.lessThanOrEqual(initialCount);
        });
      });
    });

    it('should reset filters', () => {
      cy.get('[data-testid="status-filter"]').click();
      cy.get('[role="option"]').contains('Running').click();
      cy.get('[data-testid="reset-filters"]').click();
      cy.get('[data-testid="status-filter"]').should('contain', 'All');
    });

    it('should show empty state when no results', () => {
      cy.get('[data-testid="search-input"]').type('nonexistentjobname123');
      cy.get('[data-testid="no-results"]', { timeout: 5000 }).should('exist');
    });
  });
});
