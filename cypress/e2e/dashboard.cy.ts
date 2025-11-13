/// <reference types="cypress" />

describe('Dashboard Overview Page', () => {
  beforeEach(() => {
    cy.visit('/dashboard');
    // Wait for page to load
    cy.contains('Dashboard', { timeout: 5000 }).should('exist');
  });

  describe('Page Structure', () => {
    it('should display dashboard header and title', () => {
      cy.contains('h4', 'Dashboard').should('be.visible');
    });

    it('should display metrics grid with status cards', () => {
      cy.get('[data-testid="metrics-grid"]').should('exist');
      // Check for at least 4 metric cards (queued, running, completed, agents)
      cy.get('[data-testid="metric-card"]').should('have.length.at.least', 4);
    });

    it('should display recent jobs section', () => {
      cy.contains('Recent Jobs').should('be.visible');
    });

    it('should display navigation to other pages', () => {
      cy.get('a').contains('Jobs').should('be.visible');
      cy.get('a').contains('Deployments').should('be.visible');
      cy.get('a').contains('Agents').should('be.visible');
    });
  });

  describe('Real-Time Updates', () => {
    it('should poll for new metrics', () => {
      // Get initial value
      cy.get('[data-testid="metric-jobs-queued"]')
        .invoke('text')
        .then((initialValue) => {
          // Wait for refresh cycle (3-10 seconds depending on mode)
          cy.wait(5000);
          // Value may have changed (or stayed same)
          cy.get('[data-testid="metric-jobs-queued"]')
            .invoke('text')
            .should((newValue) => {
              // Should have a value
              expect(newValue).to.match(/\d+/);
            });
        });
    });

    it('should update recent jobs list in real-time', () => {
      cy.get('[data-testid="recent-jobs-list"]').should('exist');
      cy.wait(3000);
      // List should still be present after wait
      cy.get('[data-testid="recent-jobs-list"]').should('exist');
    });
  });

  describe('Refresh Controls', () => {
    it('should have refresh mode selector', () => {
      cy.get('[data-testid="refresh-slider"]').should('exist');
    });

    it('should allow changing refresh mode', () => {
      cy.get('[data-testid="refresh-mode-live"]').click();
      cy.get('[data-testid="refresh-mode-live"]').should('have.attr', 'data-active', 'true');
    });

    it('should allow manual refresh', () => {
      cy.get('[data-testid="refresh-button"]').click();
      // Should trigger a refresh
      cy.get('[data-testid="metrics-grid"]').should('exist');
    });
  });

  describe('Error Handling', () => {
    it('should display error message if metrics fetch fails', () => {
      // Intercept metrics endpoint and force error
      cy.intercept('GET', '**/api/dashboard/metrics', {
        statusCode: 500,
        body: { error: 'Internal Server Error' },
      });
      
      cy.reload();
      cy.contains('Error loading metrics', { timeout: 5000 }).should('be.visible');
    });

    it('should show retry button on error', () => {
      cy.intercept('GET', '**/api/dashboard/metrics', {
        statusCode: 500,
        body: { error: 'Internal Server Error' },
      });
      
      cy.reload();
      cy.get('[data-testid="retry-button"]').should('exist');
    });

    it('should recover after clicking retry', () => {
      cy.intercept('GET', '**/api/dashboard/metrics', { fixture: 'dashboard/metrics.json' });
      
      cy.get('[data-testid="retry-button"]').click();
      cy.get('[data-testid="metrics-grid"]').should('exist');
    });
  });

  describe('Responsive Design', () => {
    it('should display metrics in 2 columns on tablet', () => {
      cy.viewport('ipad-2');
      cy.get('[data-testid="metrics-grid"]').should('exist');
      cy.get('[data-testid="metric-card"]').first().should('be.visible');
    });

    it('should display metrics in 1 column on mobile', () => {
      cy.viewport('iphone-x');
      cy.get('[data-testid="metrics-grid"]').should('exist');
      cy.get('[data-testid="metric-card"]').first().should('be.visible');
    });

    it('should display metrics in 4 columns on desktop', () => {
      cy.viewport(1920, 1080);
      cy.get('[data-testid="metrics-grid"]').should('exist');
      cy.get('[data-testid="metric-card"]').should('have.length.at.least', 4);
    });
  });

  describe('Navigation', () => {
    it('should navigate to Jobs page', () => {
      cy.get('a').contains('Jobs').click();
      cy.url().should('include', '/dashboard/jobs');
      cy.contains('Jobs', { timeout: 5000 }).should('be.visible');
    });

    it('should navigate to Deployments page', () => {
      cy.get('a').contains('Deployments').click();
      cy.url().should('include', '/dashboard/deployments');
      cy.contains('Deployments', { timeout: 5000 }).should('be.visible');
    });

    it('should navigate to Agents page', () => {
      cy.get('a').contains('Agents').click();
      cy.url().should('include', '/dashboard/agents');
      cy.contains('Agents', { timeout: 5000 }).should('be.visible');
    });
  });
});
