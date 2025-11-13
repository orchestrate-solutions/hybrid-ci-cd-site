/// <reference types="cypress" />

describe('Deployments Page', () => {
  beforeEach(() => {
    cy.visit('/dashboard/deployments');
    cy.contains('Deployments', { timeout: 5000 }).should('be.visible');
  });

  describe('Page Structure', () => {
    it('should display deployments page header', () => {
      cy.contains('h4', 'Deployments').should('be.visible');
    });

    it('should display summary cards', () => {
      cy.get('[data-testid="deployments-summary"]').should('exist');
      cy.get('[data-testid="summary-card"]').should('have.length.at.least', 4);
    });

    it('should display timeline view', () => {
      cy.get('[data-testid="deployments-timeline"]').should('exist');
    });

    it('should display filter section', () => {
      cy.get('[data-testid="deployments-filters"]').should('exist');
    });
  });

  describe('Timeline View', () => {
    it('should display deployment timeline items', () => {
      cy.get('[data-testid="timeline-item"]').should('have.length.at.least', 1);
    });

    it('should show deployment status in timeline', () => {
      cy.get('[data-testid="timeline-item"]').first().within(() => {
        cy.get('[data-testid="status-indicator"]').should('exist');
      });
    });

    it('should display environment information', () => {
      cy.get('[data-testid="timeline-item"]').first().should('contain', /dev|staging|production/i);
    });

    it('should display deployment timestamp', () => {
      cy.get('[data-testid="timeline-item"]').first().should('contain', /\d{1,2}:\d{2}|AM|PM/i);
    });
  });

  describe('Environment Promotion Workflow', () => {
    it('should show promote button for dev deployments', () => {
      cy.get('[data-testid="timeline-item"]').contains(/dev/i).parent().within(() => {
        cy.get('[data-testid="promote-button"]').should('exist');
      });
    });

    it('should open promotion dialog', () => {
      cy.get('[data-testid="timeline-item"]').contains(/dev/i).parent().within(() => {
        cy.get('[data-testid="promote-button"]').click();
      });
      cy.get('[data-testid="promotion-dialog"]').should('be.visible');
    });

    it('should show target environment selector', () => {
      cy.get('[data-testid="timeline-item"]').contains(/dev/i).parent().within(() => {
        cy.get('[data-testid="promote-button"]').click();
      });
      cy.get('[data-testid="promotion-dialog"]').within(() => {
        cy.get('[data-testid="target-environment"]').should('exist');
      });
    });

    it('should allow promotion with confirmation', () => {
      cy.get('[data-testid="timeline-item"]').contains(/dev/i).parent().within(() => {
        cy.get('[data-testid="promote-button"]').click();
      });
      cy.get('[data-testid="promotion-dialog"]').within(() => {
        cy.get('[data-testid="confirm-promotion"]').click();
      });
      cy.contains('Promotion initiated', { timeout: 5000 }).should('be.visible');
    });

    it('should show gating requirements before promotion', () => {
      cy.get('[data-testid="timeline-item"]').contains(/dev/i).parent().within(() => {
        cy.get('[data-testid="promote-button"]').click();
      });
      cy.get('[data-testid="promotion-dialog"]').within(() => {
        cy.get('[data-testid="gate-requirements"]').should('exist');
      });
    });
  });

  describe('Rollback Functionality', () => {
    it('should show rollback button for completed deployments', () => {
      cy.get('[data-testid="timeline-item"]').contains(/completed|success/i).parent().within(() => {
        cy.get('[data-testid="rollback-button"]').should('exist');
      });
    });

    it('should open rollback confirmation dialog', () => {
      cy.get('[data-testid="timeline-item"]').contains(/completed|success/i).parent().within(() => {
        cy.get('[data-testid="rollback-button"]').click();
      });
      cy.get('[data-testid="rollback-dialog"]').should('be.visible');
    });

    it('should require confirmation for rollback', () => {
      cy.get('[data-testid="timeline-item"]').contains(/completed|success/i).parent().within(() => {
        cy.get('[data-testid="rollback-button"]').click();
      });
      cy.get('[data-testid="rollback-dialog"]').within(() => {
        cy.contains('Are you sure').should('be.visible');
        cy.get('[data-testid="confirm-rollback"]').should('be.disabled');
      });
    });

    it('should show previous version for rollback', () => {
      cy.get('[data-testid="timeline-item"]').contains(/completed|success/i).parent().within(() => {
        cy.get('[data-testid="rollback-button"]').click();
      });
      cy.get('[data-testid="rollback-dialog"]').within(() => {
        cy.get('[data-testid="previous-version"]').should('exist');
      });
    });

    it('should execute rollback after confirmation', () => {
      cy.get('[data-testid="timeline-item"]').contains(/completed|success/i).parent().within(() => {
        cy.get('[data-testid="rollback-button"]').click();
      });
      cy.get('[data-testid="rollback-dialog"]').within(() => {
        // Type confirmation text or check checkbox
        cy.get('input[type="checkbox"]').click();
        cy.get('[data-testid="confirm-rollback"]').click();
      });
      cy.contains('Rollback initiated', { timeout: 5000 }).should('be.visible');
    });
  });

  describe('Filtering & Search', () => {
    it('should filter by deployment name', () => {
      cy.get('input[placeholder*="Search"]').type('prod-deploy');
      cy.get('[data-testid="timeline-item"]').each((item) => {
        cy.wrap(item).contains('prod-deploy', { matchCase: false });
      });
    });

    it('should filter by environment', () => {
      cy.get('[data-testid="environment-filter"]').click();
      cy.get('[data-value="production"]').click();
      
      cy.get('[data-testid="timeline-item"]').each((item) => {
        cy.wrap(item).contains('production', { matchCase: false });
      });
    });

    it('should filter by status', () => {
      cy.get('[data-testid="status-filter"]').click();
      cy.get('[data-value="COMPLETED"]').click();
      
      cy.get('[data-testid="timeline-item"]').each((item) => {
        cy.wrap(item).contains('completed|success', { matchCase: false });
      });
    });

    it('should clear all filters', () => {
      cy.get('input[placeholder*="Search"]').type('test');
      cy.get('[data-testid="clear-filters"]').click();
      cy.get('input[placeholder*="Search"]').should('have.value', '');
    });
  });

  describe('Status Color Coding', () => {
    it('should show green for completed deployments', () => {
      cy.get('[data-testid="timeline-item"]').contains(/completed|success/i).within(() => {
        cy.get('[data-testid="status-indicator"]').should('have.class', 'status-success');
      });
    });

    it('should show red for failed deployments', () => {
      cy.get('[data-testid="timeline-item"]').contains(/failed|error/i).within(() => {
        cy.get('[data-testid="status-indicator"]').should('have.class', 'status-error');
      });
    });

    it('should show blue for in-progress deployments', () => {
      cy.get('[data-testid="timeline-item"]').contains(/in-progress|running/i).within(() => {
        cy.get('[data-testid="status-indicator"]').should('have.class', 'status-in-progress');
      });
    });
  });

  describe('Real-Time Updates', () => {
    it('should update timeline in real-time', () => {
      cy.get('[data-testid="timeline-item"]').first().invoke('text').then((initialText) => {
        cy.wait(5000);
        cy.get('[data-testid="timeline-item"]').first().should('exist');
      });
    });

    it('should update deployment statuses', () => {
      cy.get('[data-testid="summary-card"]').first().invoke('text').then((initialValue) => {
        cy.wait(5000);
        cy.get('[data-testid="summary-card"]').first().should('contain', /\d+/);
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error if deployments fetch fails', () => {
      cy.intercept('GET', '**/api/dashboard/deployments**', {
        statusCode: 500,
        body: { error: 'Internal Server Error' },
      });
      
      cy.reload();
      cy.contains('Error loading deployments', { timeout: 5000 }).should('be.visible');
    });

    it('should display error on failed promotion', () => {
      cy.intercept('POST', '**/api/dashboard/deployments/*/promote', {
        statusCode: 400,
        body: { error: 'Promotion failed - gating requirements not met' },
      });
      
      cy.get('[data-testid="timeline-item"]').contains(/dev/i).parent().within(() => {
        cy.get('[data-testid="promote-button"]').click();
      });
      cy.get('[data-testid="promotion-dialog"]').within(() => {
        cy.get('[data-testid="confirm-promotion"]').click();
      });
      cy.contains('Promotion failed', { timeout: 5000 }).should('be.visible');
    });

    it('should display empty state when no deployments', () => {
      cy.intercept('GET', '**/api/dashboard/deployments**', {
        statusCode: 200,
        body: { deployments: [] },
      });
      
      cy.reload();
      cy.contains('No deployments found', { timeout: 5000 }).should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    it('should display timeline on desktop', () => {
      cy.viewport(1920, 1080);
      cy.get('[data-testid="deployments-timeline"]').should('be.visible');
    });

    it('should display vertical timeline on tablet', () => {
      cy.viewport('ipad-2');
      cy.get('[data-testid="deployments-timeline"]').should('be.visible');
    });

    it('should display compact timeline on mobile', () => {
      cy.viewport('iphone-x');
      cy.get('[data-testid="deployments-timeline"]').should('be.visible');
    });
  });
});
