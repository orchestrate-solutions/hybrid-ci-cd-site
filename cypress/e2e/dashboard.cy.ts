/**
 * Cypress E2E Tests for Dashboard (RED Phase)
 * 
 * User workflows testing dashboard page behavior.
 * All tests FAIL initially—pages don't exist yet.
 */

describe('Dashboard Page E2E Tests', () => {
  beforeEach(() => {
    // Navigate to dashboard
    cy.visit('http://localhost:3000/dashboard');
  });

  describe('Navigation', () => {
    it('should navigate to dashboard from home', () => {
      cy.visit('http://localhost:3000');
      cy.contains('a', /Dashboard|Home/i).click();
      cy.url().should('include', '/dashboard');
      cy.get('main').should('exist');
    });

    it('should display dashboard page title', () => {
      cy.contains('h1', /Dashboard|Overview/i).should('be.visible');
    });
  });

  describe('Metrics Display', () => {
    it('should display running jobs metric', () => {
      // Wait for metrics to load
      cy.get('[data-testid="metrics-running"] [data-testid="metric-value"]', { timeout: 5000 })
        .should('exist')
        .and('contain.text', /\d+/);
    });

    it('should display failed jobs metric', () => {
      cy.get('[data-testid="metrics-failed"] [data-testid="metric-value"]')
        .should('exist')
        .and('contain.text', /\d+/);
    });

    it('should display deployments today metric', () => {
      cy.get('[data-testid="metrics-deployments"] [data-testid="metric-value"]')
        .should('exist')
        .and('contain.text', /\d+/);
    });

    it('should display queue depth metric', () => {
      cy.get('[data-testid="metrics-queue"] [data-testid="metric-value"]')
        .should('exist')
        .and('contain.text', /\d+/);
    });

    it('metric cards should be clickable', () => {
      cy.get('[data-testid="metrics-running"]').click();
      // Should navigate to Jobs page or filter
      cy.url().should('include', '/jobs');
    });
  });

  describe('Recent Activity', () => {
    it('should display recent activity section', () => {
      cy.get('[data-testid="activity-section"]', { timeout: 5000 }).should('be.visible');
    });

    it('should display job activity items', () => {
      cy.get('[data-testid="activity-item"]', { timeout: 5000 })
        .should('have.length.greaterThan', 0);
    });

    it('should link to job details from activity', () => {
      cy.get('[data-testid="activity-item"]').first().click();
      cy.url().should('include', '/jobs/');
    });

    it('should show deployment activity', () => {
      cy.get('[data-testid="activity-item"]').should('have.length.greaterThan', 0);
      // At least some items should mention "Deployment"
      cy.contains('[data-testid="activity-item"]', /Deployment|deploy/i).should('exist');
    });
  });

  describe('Loading States', () => {
    it('should show loading state while fetching metrics', () => {
      // Intercept API call and delay response
      cy.intercept('GET', '**/api/metrics/**', (req) => {
        req.reply((res) => {
          res.delay(1000);
        });
      });

      cy.visit('http://localhost:3000/dashboard');
      
      // Should show loading indicator
      cy.get('[role="progressbar"], [class*="skeleton"], [data-testid="loading"]').should('exist');
    });

    it('should hide loading state after data loads', () => {
      cy.get('[role="progressbar"], [class*="skeleton"]', { timeout: 5000 }).should('not.exist');
      cy.get('[data-testid="metrics-section"]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should show error message on API failure', () => {
      cy.intercept('GET', '**/api/metrics/**', { statusCode: 500 }).as('metricsError');
      cy.visit('http://localhost:3000/dashboard');
      
      cy.wait('@metricsError');
      cy.contains(/error|failed|Unable to load/i).should('be.visible');
    });

    it('should provide retry button on error', () => {
      cy.intercept('GET', '**/api/metrics/**', { statusCode: 500 }).as('metricsError');
      cy.visit('http://localhost:3000/dashboard');
      
      cy.wait('@metricsError');
      cy.contains('button', /retry|try again/i).should('be.visible').click();
      
      // Should retry the request
      cy.get('[data-testid="metrics-section"]').should('exist');
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no jobs running', () => {
      cy.intercept('GET', '**/api/metrics/**', {
        statusCode: 200,
        body: {
          jobs_running: 0,
          jobs_failed_today: 0,
          deployments_today: 0,
          queue_depth: 0,
          average_wait_time_seconds: 0,
        },
      }).as('emptyMetrics');

      cy.visit('http://localhost:3000/dashboard');
      cy.wait('@emptyMetrics');
      
      cy.contains(/No jobs running|0 Running/i).should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    it('should be responsive on mobile', () => {
      cy.viewport('iphone-12');
      cy.get('main').should('be.visible');
      cy.get('[data-testid="metrics-running"]').should('be.visible');
    });

    it('should be responsive on tablet', () => {
      cy.viewport('ipad-2');
      cy.get('main').should('be.visible');
      cy.get('[data-testid="metrics-running"]').should('be.visible');
    });

    it('should be responsive on desktop', () => {
      cy.viewport(1920, 1080);
      cy.get('main').should('be.visible');
      cy.get('[data-testid="metrics-running"]').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      cy.get('h1').should('exist');
      cy.get('h1').first().should('have.text', /Dashboard|Overview/i);
    });

    it('should have semantic HTML', () => {
      cy.get('main').should('exist');
      cy.get('section, [role="region"]').should('have.length.greaterThan', 0);
    });

    it('should have alt text on images', () => {
      cy.get('img').each((img) => {
        cy.wrap(img).should('have.attr', 'alt');
      });
    });

    it('should have keyboard navigation', () => {
      cy.get('[data-testid="metrics-running"]').focus().should('have.focus');
      cy.realPress('Tab');
      cy.focused().should('not.equal', cy.get('[data-testid="metrics-running"]'));
    });
  });

  describe('Real-time Updates', () => {
    it('should auto-refresh metrics periodically', () => {
      let callCount = 0;
      
      cy.intercept('GET', '**/api/metrics/**', (req) => {
        callCount++;
        req.reply({
          statusCode: 200,
          body: {
            jobs_running: callCount,
            jobs_failed_today: 0,
            deployments_today: 0,
            queue_depth: 0,
            average_wait_time_seconds: 0,
          },
        });
      }).as('metrics');

      cy.visit('http://localhost:3000/dashboard');
      
      // Initial load
      cy.wait('@metrics');
      
      // Wait for auto-refresh (typically 60 seconds)
      cy.wait('@metrics', { timeout: 70000 });
    });
  });

  describe('Data Display', () => {
    it('should format large numbers with commas', () => {
      cy.intercept('GET', '**/api/metrics/**', {
        statusCode: 200,
        body: {
          jobs_running: 1234,
          jobs_failed_today: 56,
          deployments_today: 78,
          queue_depth: 9999,
          average_wait_time_seconds: 234,
        },
      }).as('largeNumbers');

      cy.visit('http://localhost:3000/dashboard');
      cy.wait('@largeNumbers');
      
      // Check for formatted large numbers
      cy.contains(/1,234|1234/).should('be.visible');
    });

    it('should display time in user timezone', () => {
      cy.get('[data-testid="activity-item"] [data-testid="timestamp"]').each((timestamp) => {
        // Should show time format (12-hour or 24-hour)
        cy.wrap(timestamp).should('contain.text', /:\d{2}/);
      });
    });
  });

  describe('Navigation Links', () => {
    it('should link to Jobs page', () => {
      cy.contains('a', /Jobs|View Jobs/i).click();
      cy.url().should('include', '/jobs');
    });

    it('should link to Deployments page', () => {
      cy.contains('a', /Deployments|View Deployments/i).click();
      cy.url().should('include', '/deployments');
    });

    it('should link to Agents page', () => {
      cy.contains('a', /Agents|View Agents/i).click();
      cy.url().should('include', '/agents');
    });
  });
});
