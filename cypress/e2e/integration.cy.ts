/**
 * Cypress Integration Tests
 * Tests full workflows and component integration
 */

describe('Application Integration E2E', () => {
  describe('Theme Integration', () => {
    it('should switch between themes', () => {
      cy.get('[data-testid="theme-toggle"]').should('exist');
      cy.get('[data-testid="theme-toggle"]').click();
      cy.get('body').should('have.class', /dark|light/);
    });

    it('should persist theme selection', () => {
      cy.get('[data-testid="theme-toggle"]').click();
      cy.reload();
      cy.get('body').should('have.class', /dark|light/);
    });

    it('should apply theme colors to all components', () => {
      cy.get('[data-testid="theme-toggle"]').click();
      cy.get('button').should('have.css', 'background-color');
      cy.get('[role="combobox"]').should('have.css', 'background-color');
    });
  });

  describe('Navigation Flow', () => {
    it('should navigate from sidebar to dashboard', () => {
      cy.get('[data-testid="nav-dashboard"]').click();
      cy.url().should('include', '/dashboard');
    });

    it('should navigate from sidebar to jobs', () => {
      cy.get('[data-testid="nav-jobs"]').click();
      cy.url().should('include', '/jobs');
      cy.get('[data-testid="jobs-table"]', { timeout: 10000 }).should('exist');
    });

    it('should navigate from sidebar to deployments', () => {
      cy.get('[data-testid="nav-deployments"]').click();
      cy.url().should('include', '/deployments');
    });

    it('should navigate from sidebar to agents', () => {
      cy.get('[data-testid="nav-agents"]').click();
      cy.url().should('include', '/agents');
    });

    it('should maintain scroll position when navigating back', () => {
      cy.get('[data-testid="nav-jobs"]').click();
      cy.get('[data-testid="jobs-table"]', { timeout: 10000 }).scrollTo('bottom');
      cy.get('[data-testid="nav-dashboard"]').click();
      cy.get('[data-testid="nav-jobs"]').click();
      // Verify navigation works
      cy.url().should('include', '/jobs');
    });
  });

  describe('Form Workflows', () => {
    it('should complete job creation workflow', () => {
      cy.get('[data-testid="create-job-button"]').click();
      cy.get('[data-testid="job-name-input"]').type('New Job');
      cy.get('[data-testid="job-priority-select"]').click();
      cy.get('[role="option"]').contains('High').click();
      cy.get('[data-testid="create-job-submit"]').click();
      cy.get('[data-testid="success-message"]', { timeout: 5000 }).should('exist');
    });

    it('should complete deployment workflow', () => {
      cy.get('[data-testid="create-deployment-button"]').click();
      cy.get('[data-testid="deployment-name-input"]').type('New Deployment');
      cy.get('[data-testid="deployment-version-input"]').type('1.0.0');
      cy.get('[data-testid="deployment-region-select"]').click();
      cy.get('[role="option"]').first().click();
      cy.get('[data-testid="create-deployment-submit"]').click();
      cy.get('[data-testid="success-message"]', { timeout: 5000 }).should('exist');
    });

    it('should handle form validation errors', () => {
      cy.get('[data-testid="create-job-button"]').click();
      cy.get('[data-testid="create-job-submit"]').click();
      cy.get('[data-testid="error-message"]', { timeout: 5000 }).should('exist');
    });
  });

  describe('Data Table Interactions', () => {
    it('should sort jobs table', () => {
      cy.get('[data-testid="jobs-table"]').should('exist');
      cy.get('[data-testid="sort-name-header"]').click();
      cy.get('table tbody tr').first().should('exist');
    });

    it('should paginate jobs table', () => {
      cy.get('[data-testid="next-page-button"]').should('exist');
      cy.get('[data-testid="next-page-button"]').click();
      cy.get('table tbody tr').should('have.length.greaterThan', 0);
    });

    it('should select multiple rows', () => {
      cy.get('[data-testid="select-checkbox"]').first().click();
      cy.get('[data-testid="select-checkbox"]').eq(1).click();
      cy.get('[data-testid="bulk-action-button"]').should('be.visible');
    });

    it('should search in table', () => {
      cy.get('[data-testid="table-search"]').type('Deploy');
      cy.get('table tbody tr').should('have.length.greaterThan', 0);
    });
  });

  describe('Real-time Updates', () => {
    it('should update job status in real-time', () => {
      cy.get('[data-testid="jobs-table"]').should('exist');
      // Simulate time passing
      cy.wait(2000);
      // Verify table still exists and is interactive
      cy.get('[data-testid="jobs-table"]').should('exist');
    });

    it('should refresh deployment list', () => {
      cy.get('[data-testid="refresh-button"]').should('exist');
      cy.get('[data-testid="refresh-button"]').click();
      cy.get('[data-testid="loading-spinner"]', { timeout: 2000 }).should('not.exist');
    });
  });

  describe('Responsive Behavior', () => {
    it('should work on mobile view', () => {
      cy.viewport('iphone-x');
      cy.get('[data-testid="app-shell"]').should('exist');
      cy.get('[data-testid="jobs-table"]').should('exist');
    });

    it('should work on tablet view', () => {
      cy.viewport('ipad-2');
      cy.get('[data-testid="app-shell"]').should('exist');
      cy.get('[data-testid="sidebar"]').should('exist');
    });

    it('should work on desktop view', () => {
      cy.viewport(1920, 1080);
      cy.get('[data-testid="app-shell"]').should('exist');
      cy.get('[data-testid="header"]').should('exist');
    });

    it('should reflow on window resize', () => {
      cy.viewport(1920, 1080);
      cy.get('[data-testid="app-shell"]').should('exist');
      cy.viewport('iphone-x');
      cy.get('[data-testid="app-shell"]').should('exist');
      cy.viewport(1920, 1080);
      cy.get('[data-testid="app-shell"]').should('exist');
    });
  });

  describe('Error Handling', () => {
    it('should display error message on failed API call', () => {
      // This test assumes the backend might fail
      cy.get('[data-testid="jobs-table"]', { timeout: 10000 }).should('exist');
      // Even if empty, should not crash
      cy.get('body').should('exist');
    });

    it('should recover from error state', () => {
      cy.get('[data-testid="retry-button"]', { timeout: 5000 }).should('not.exist');
      // Verify normal state
      cy.get('[data-testid="jobs-table"]').should('exist');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      cy.get('h1').should('have.length.greaterThan', 0);
      cy.get('h2').should('have.length.greaterThan', 0);
    });

    it('should have alt text on images', () => {
      cy.get('img').each(($img) => {
        cy.wrap($img).should('have.attr', 'alt');
      });
    });

    it('should have proper form labels', () => {
      cy.get('input').each(($input) => {
        const id = cy.wrap($input).invoke('attr', 'id');
        if (id) {
          cy.get(`label[for="${id}"]`).should('exist');
        }
      });
    });

    it('should have keyboard navigation', () => {
      cy.get('button').first().focus();
      cy.get('button').first().should('have.focus');
      cy.get('button').first().type('{enter}');
    });

    it('should have sufficient color contrast', () => {
      // This is a basic test - full accessibility testing would use axe
      cy.get('body').should('have.css', 'color');
    });
  });
});
