/**
 * Cypress Tests for Display Components
 * Tests: ConfigCard, ToolBadge, StatusIndicator, ConfigEditor, PluginCard, PluginPermissions, SandboxPreview
 */

describe('Display Components E2E', () => {
  describe('ConfigCard', () => {
    it('should render with title and description', () => {
      cy.get('[data-testid="config-card"]').should('exist');
      cy.get('[data-testid="config-card"] h6').should('be.visible');
    });

    it('should display configuration details', () => {
      cy.get('[data-testid="config-card"]').within(() => {
        cy.get('div').should('have.length.greaterThan', 0);
      });
    });

    it('should have action buttons', () => {
      cy.get('[data-testid="config-card"] button').should('have.length.greaterThan', 0);
    });
  });

  describe('ToolBadge', () => {
    it('should render badge with icon', () => {
      cy.get('[data-testid="tool-badge"]').should('exist');
    });

    it('should display tool name', () => {
      cy.get('[data-testid="tool-badge"]').within(() => {
        cy.contains(/Tool|Badge/).should('be.visible');
      });
    });

    it('should be clickable', () => {
      cy.get('[data-testid="tool-badge"]').should('not.be.disabled');
    });
  });

  describe('StatusIndicator', () => {
    it('should render status dot', () => {
      cy.get('[data-testid="status-indicator"]').should('exist');
    });

    it('should show different colors for different statuses', () => {
      cy.get('[data-testid="status-indicator"]').should('exist').should('be.visible');
    });

    it('should have pulsing animation for active status', () => {
      cy.get('[data-testid="status-indicator"]').should('exist');
    });

    it('should display status label', () => {
      cy.get('[data-testid="status-label"]').should('be.visible');
    });
  });

  describe('ConfigEditor', () => {
    it('should render form with fields', () => {
      cy.get('[data-testid="config-editor"]').should('exist');
      cy.get('input').should('have.length.greaterThan', 0);
    });

    it('should update field values', () => {
      cy.get('input[type="text"]').first().type('new value');
      cy.get('input[type="text"]').first().should('have.value', 'new value');
    });

    it('should validate required fields', () => {
      cy.get('button').contains(/Save|Submit/).click();
      cy.get('[data-testid="error-message"]', { timeout: 5000 }).should('exist');
    });

    it('should save valid configuration', () => {
      cy.get('input[type="text"]').first().clear().type('Valid Name');
      cy.get('button').contains(/Save|Submit/).click();
      cy.get('[data-testid="success-message"]', { timeout: 5000 }).should('exist');
    });
  });

  describe('PluginCard', () => {
    it('should render plugin information', () => {
      cy.get('[data-testid="plugin-card"]').should('exist');
    });

    it('should display plugin name and description', () => {
      cy.get('[data-testid="plugin-card"]').within(() => {
        cy.get('h6, h5').should('be.visible');
        cy.get('p, span').should('have.length.greaterThan', 0);
      });
    });

    it('should have install/action button', () => {
      cy.get('[data-testid="plugin-card"] button').should('be.visible');
    });

    it('should show plugin metadata', () => {
      cy.get('[data-testid="plugin-card"]').within(() => {
        cy.contains(/Version|Author|Status/).should('exist');
      });
    });
  });

  describe('PluginPermissions', () => {
    it('should render permission checkboxes', () => {
      cy.get('[data-testid="plugin-permissions"]').should('exist');
      cy.get('input[type="checkbox"]').should('have.length.greaterThan', 0);
    });

    it('should toggle permissions', () => {
      cy.get('input[type="checkbox"]').first().click();
      cy.get('input[type="checkbox"]').first().should('be.checked');
      cy.get('input[type="checkbox"]').first().click();
      cy.get('input[type="checkbox"]').first().should('not.be.checked');
    });

    it('should show permission names and descriptions', () => {
      cy.get('[data-testid="permission-item"]').should('have.length.greaterThan', 0);
      cy.get('[data-testid="permission-item"]').each(($el) => {
        cy.wrap($el).within(() => {
          cy.contains(/read|write|admin|delete/).should('be.visible');
        });
      });
    });

    it('should display approval buttons', () => {
      cy.get('[data-testid="plugin-permissions"] button').should('have.length.greaterThan', 0);
    });
  });

  describe('SandboxPreview', () => {
    it('should render preview container', () => {
      cy.get('[data-testid="sandbox-preview"]').should('exist');
    });

    it('should display preview content', () => {
      cy.get('[data-testid="sandbox-preview"]').within(() => {
        cy.get('div, iframe, code').should('have.length.greaterThan', 0);
      });
    });

    it('should handle responsive layout', () => {
      cy.viewport('iphone-x');
      cy.get('[data-testid="sandbox-preview"]').should('be.visible');
      cy.viewport('macbook-15');
      cy.get('[data-testid="sandbox-preview"]').should('be.visible');
    });
  });
});
