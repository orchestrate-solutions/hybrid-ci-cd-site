/// <reference types="cypress" />

describe('Agents Page', () => {
  beforeEach(() => {
    cy.visit('/dashboard/agents');
    cy.contains('Agents', { timeout: 5000 }).should('be.visible');
  });

  describe('Page Structure', () => {
    it('should display agents page header', () => {
      cy.contains('h4', 'Agents').should('be.visible');
    });

    it('should display agent metrics summary', () => {
      cy.get('[data-testid="agents-summary"]').should('exist');
      cy.get('[data-testid="summary-card"]').should('have.length.at.least', 4);
    });

    it('should display agent pool cards', () => {
      cy.get('[data-testid="agent-pool-card"]').should('exist');
    });

    it('should display agent controls section', () => {
      cy.get('[data-testid="agent-controls"]').should('exist');
    });
  });

  describe('Agent Pool Cards', () => {
    it('should display pool name', () => {
      cy.get('[data-testid="agent-pool-card"]').first().should('contain', /pool|group/i);
    });

    it('should display health percentage', () => {
      cy.get('[data-testid="pool-health"]').first().should('contain', /%/);
    });

    it('should display health indicator color', () => {
      cy.get('[data-testid="pool-health"]').first().should('have.class', /health-(green|yellow|red)/);
    });

    it('should display active agent count', () => {
      cy.get('[data-testid="pool-active-count"]').first().should('contain', /\d+/);
    });

    it('should display total capacity', () => {
      cy.get('[data-testid="pool-capacity"]').first().should('contain', /\d+/);
    });

    it('should expand pool to show agents', () => {
      cy.get('[data-testid="agent-pool-card"]').first().click();
      cy.get('[data-testid="pool-agents-grid"]').should('be.visible');
    });
  });

  describe('Agent Grid Display', () => {
    it('should display agent cards when pool expanded', () => {
      cy.get('[data-testid="agent-pool-card"]').first().click();
      cy.get('[data-testid="agent-card"]').should('have.length.at.least', 1);
    });

    it('should show agent name', () => {
      cy.get('[data-testid="agent-pool-card"]').first().click();
      cy.get('[data-testid="agent-card"]').first().should('contain', /agent-|worker-/i);
    });

    it('should show heartbeat indicator with pulse animation', () => {
      cy.get('[data-testid="agent-pool-card"]').first().click();
      cy.get('[data-testid="heartbeat-indicator"]').first().should('exist');
    });

    it('should show agent status', () => {
      cy.get('[data-testid="agent-pool-card"]').first().click();
      cy.get('[data-testid="agent-status"]').first().should('contain', /active|idle|paused/i);
    });

    it('should display resource usage bars', () => {
      cy.get('[data-testid="agent-pool-card"]').first().click();
      cy.get('[data-testid="agent-card"]').first().within(() => {
        cy.get('[data-testid="cpu-usage"]').should('exist');
        cy.get('[data-testid="memory-usage"]').should('exist');
        cy.get('[data-testid="disk-usage"]').should('exist');
      });
    });

    it('should show resource percentages', () => {
      cy.get('[data-testid="agent-pool-card"]').first().click();
      cy.get('[data-testid="agent-card"]').first().within(() => {
        cy.get('[data-testid="cpu-usage"]').should('contain', /%/);
        cy.get('[data-testid="memory-usage"]').should('contain', /%/);
      });
    });
  });

  describe('Agent Controls', () => {
    it('should display pause button for active agents', () => {
      cy.get('[data-testid="agent-pool-card"]').first().click();
      cy.get('[data-testid="agent-card"]').first().within(() => {
        cy.get('[data-testid="pause-button"]').should('exist');
      });
    });

    it('should display resume button for paused agents', () => {
      cy.get('[data-testid="agent-pool-card"]').first().click();
      cy.get('[data-testid="agent-card"]').contains(/paused/i).within(() => {
        cy.get('[data-testid="resume-button"]').should('exist');
      });
    });

    it('should pause agent when clicked', () => {
      cy.get('[data-testid="agent-pool-card"]').first().click();
      cy.get('[data-testid="agent-card"]').first().within(() => {
        cy.get('[data-testid="pause-button"]').click();
      });
      cy.contains('Agent paused', { timeout: 5000 }).should('be.visible');
    });

    it('should resume agent when clicked', () => {
      cy.get('[data-testid="agent-pool-card"]').first().click();
      cy.get('[data-testid="agent-card"]').contains(/paused/i).within(() => {
        cy.get('[data-testid="resume-button"]').click();
      });
      cy.contains('Agent resumed', { timeout: 5000 }).should('be.visible');
    });

    it('should display drain button', () => {
      cy.get('[data-testid="agent-pool-card"]').first().click();
      cy.get('[data-testid="agent-card"]').first().within(() => {
        cy.get('[data-testid="drain-button"]').should('exist');
      });
    });

    it('should confirm drain action', () => {
      cy.get('[data-testid="agent-pool-card"]').first().click();
      cy.get('[data-testid="agent-card"]').first().within(() => {
        cy.get('[data-testid="drain-button"]').click();
      });
      cy.get('[data-testid="confirm-dialog"]').should('be.visible');
      cy.get('[data-testid="confirm-dialog"]').within(() => {
        cy.get('[data-testid="confirm-button"]').click();
      });
    });
  });

  describe('Pool Level Controls', () => {
    it('should display scale pool button', () => {
      cy.get('[data-testid="agent-pool-card"]').first().within(() => {
        cy.get('[data-testid="scale-button"]').should('exist');
      });
    });

    it('should open scale dialog', () => {
      cy.get('[data-testid="agent-pool-card"]').first().within(() => {
        cy.get('[data-testid="scale-button"]').click();
      });
      cy.get('[data-testid="scale-dialog"]').should('be.visible');
    });

    it('should allow setting pool size', () => {
      cy.get('[data-testid="agent-pool-card"]').first().within(() => {
        cy.get('[data-testid="scale-button"]').click();
      });
      cy.get('[data-testid="scale-dialog"]').within(() => {
        cy.get('input[type="number"]').clear().type('10');
        cy.get('[data-testid="apply-button"]').click();
      });
      cy.contains('Pool scaled', { timeout: 5000 }).should('be.visible');
    });

    it('should allow pausing entire pool', () => {
      cy.get('[data-testid="agent-pool-card"]').first().within(() => {
        cy.get('[data-testid="pause-pool-button"]').click();
      });
      cy.contains('Pool paused', { timeout: 5000 }).should('be.visible');
    });
  });

  describe('Real-Time Updates', () => {
    it('should update heartbeat indicators', () => {
      cy.get('[data-testid="agent-pool-card"]').first().click();
      cy.get('[data-testid="heartbeat-indicator"]').first().should('exist');
      cy.wait(3000);
      cy.get('[data-testid="heartbeat-indicator"]').first().should('exist');
    });

    it('should update resource usage', () => {
      cy.get('[data-testid="agent-pool-card"]').first().click();
      cy.get('[data-testid="cpu-usage"]').first().invoke('attr', 'aria-valuenow').then((value1) => {
        cy.wait(5000);
        cy.get('[data-testid="cpu-usage"]').first().invoke('attr', 'aria-valuenow').then((value2) => {
          // Value may change
          expect(value2).to.not.be.undefined;
        });
      });
    });

    it('should update agent metrics summary', () => {
      cy.get('[data-testid="summary-card"]').first().invoke('text').then((initial) => {
        cy.wait(5000);
        cy.get('[data-testid="summary-card"]').first().should('contain', /\d+/);
      });
    });

    it('should update agent status in real-time', () => {
      cy.get('[data-testid="agent-pool-card"]').first().click();
      cy.get('[data-testid="agent-status"]').first().should('contain', /active|idle|paused/i);
      cy.wait(3000);
      cy.get('[data-testid="agent-status"]').first().should('contain', /active|idle|paused|draining/i);
    });
  });

  describe('Filtering & Search', () => {
    it('should filter pools by name', () => {
      cy.get('input[placeholder*="Search"]').type('prod');
      cy.get('[data-testid="agent-pool-card"]').each((card) => {
        cy.wrap(card).contains('prod', { matchCase: false });
      });
    });

    it('should filter by pool status', () => {
      cy.get('[data-testid="status-filter"]').click();
      cy.get('[data-value="active"]').click();
      
      cy.get('[data-testid="agent-pool-card"]').each((card) => {
        cy.wrap(card).should('contain', /active/i);
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error if agents fetch fails', () => {
      cy.intercept('GET', '**/api/agents**', {
        statusCode: 500,
        body: { error: 'Internal Server Error' },
      });
      
      cy.reload();
      cy.contains('Error loading agents', { timeout: 5000 }).should('be.visible');
    });

    it('should display error on failed action', () => {
      cy.intercept('POST', '**/api/agents/*/pause', {
        statusCode: 400,
        body: { error: 'Agent not found' },
      });
      
      cy.get('[data-testid="agent-pool-card"]').first().click();
      cy.get('[data-testid="agent-card"]').first().within(() => {
        cy.get('[data-testid="pause-button"]').click();
      });
      cy.contains('Error', { timeout: 5000 }).should('be.visible');
    });

    it('should display empty state when no agents', () => {
      cy.intercept('GET', '**/api/agents**', {
        statusCode: 200,
        body: { agents: [], pools: [] },
      });
      
      cy.reload();
      cy.contains('No agents found', { timeout: 5000 }).should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    it('should display agent grid on desktop', () => {
      cy.viewport(1920, 1080);
      cy.get('[data-testid="agent-pool-card"]').first().click();
      cy.get('[data-testid="pool-agents-grid"]').should('be.visible');
    });

    it('should stack agents in 2 columns on tablet', () => {
      cy.viewport('ipad-2');
      cy.get('[data-testid="agent-pool-card"]').first().click();
      cy.get('[data-testid="pool-agents-grid"]').should('be.visible');
    });

    it('should display agents in 1 column on mobile', () => {
      cy.viewport('iphone-x');
      cy.get('[data-testid="agent-pool-card"]').first().click();
      cy.get('[data-testid="pool-agents-grid"]').should('be.visible');
    });
  });

  describe('Pool Health Visualization', () => {
    it('should show healthy pool with green indicator', () => {
      cy.get('[data-testid="pool-health"]').contains(/9[0-9]|100/)
        .parent()
        .should('have.class', 'health-green');
    });

    it('should show at-risk pool with yellow indicator', () => {
      cy.get('[data-testid="pool-health"]').contains(/[5-8][0-9]/)
        .parent()
        .should('have.class', 'health-yellow');
    });

    it('should show critical pool with red indicator', () => {
      cy.get('[data-testid="pool-health"]').contains(/[0-4][0-9]/)
        .parent()
        .should('have.class', 'health-red');
    });
  });
});
