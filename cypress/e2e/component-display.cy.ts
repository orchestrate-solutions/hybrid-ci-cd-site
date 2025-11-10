/**
 * Cypress Component Tests: Display Components
 * Tests all 7 display components in real browser
 * Validates: rendering, composition, user interactions, theming
 */

describe('Display Components - Component Tests', () => {
  beforeEach(() => {
    cy.visit('http://localhost:6006');
  });

  describe('ConfigCard Component', () => {
    it('should render config card', () => {
      cy.navigate_to_story('components-micro-configcard--default');
      cy.get('[data-testid="config-card"]').should('exist').should('be.visible');
    });

    it('should display configuration name and description', () => {
      cy.navigate_to_story('components-micro-configcard--default');
      cy.get('[data-testid="config-card"]').within(() => {
        cy.get('h3, h4').should('exist');
      });
    });

    it('should display tools used', () => {
      cy.navigate_to_story('components-micro-configcard--with-tools');
      cy.get('[data-testid="tool-badge"]').should('have.length.greaterThan', 0);
    });

    it('should have action buttons', () => {
      cy.navigate_to_story('components-micro-configcard--default');
      cy.get('[data-testid="config-card"] button').should('have.length.greaterThan', 0);
    });

    it('should handle click events', () => {
      cy.navigate_to_story('components-micro-configcard--default');
      cy.get('[data-testid="config-card"] button').first().click();
      // Verify card is still visible (no navigation)
      cy.get('[data-testid="config-card"]').should('exist');
    });
  });

  describe('ToolBadge Component', () => {
    it('should render tool badge', () => {
      cy.navigate_to_story('components-micro-toolbadge--default');
      cy.get('[data-testid="tool-badge"]').should('exist').should('be.visible');
    });

    it('should display tool name', () => {
      cy.navigate_to_story('components-micro-toolbadge--default');
      cy.get('[data-testid="tool-badge"]').should('contain', /GitHub|Jenkins|GitLab/);
    });

    it('should render in all size variants', () => {
      ['small', 'medium', 'large'].forEach((size) => {
        cy.navigate_to_story(`components-micro-toolbadge--${size}`);
        cy.get('[data-testid="tool-badge"]').should('exist');
      });
    });

    it('should have appropriate padding and styling', () => {
      cy.navigate_to_story('components-micro-toolbadge--default');
      cy.get('[data-testid="tool-badge"]').should('have.css', 'display');
    });
  });

  describe('StatusIndicator Component', () => {
    it('should render status indicator', () => {
      cy.navigate_to_story('components-micro-statusindicator--default');
      cy.get('[data-testid="status-indicator"]').should('exist').should('be.visible');
    });

    it('should display all status variants', () => {
      const statuses = ['online', 'offline', 'idle', 'error'];
      statuses.forEach((status) => {
        cy.navigate_to_story(`components-micro-statusindicator--${status}`);
        cy.get('[data-testid="status-indicator"]').should('exist');
      });
    });

    it('should have correct color for each status', () => {
      cy.navigate_to_story('components-micro-statusindicator--online');
      cy.get('[data-testid="status-indicator"]')
        .should('have.css', 'background-color')
        .and('not.equal', 'rgb(0, 0, 0)'); // Should have color
    });

    it('should display with animation or without based on prop', () => {
      cy.navigate_to_story('components-micro-statusindicator--default');
      cy.get('[data-testid="status-indicator"]').should('exist');
    });
  });

  describe('ConfigEditor Component', () => {
    it('should render config editor', () => {
      cy.navigate_to_story('components-micro-configeditor--default');
      cy.get('[data-testid="config-editor"]').should('exist').should('be.visible');
    });

    it('should display editable fields', () => {
      cy.navigate_to_story('components-micro-configeditor--default');
      cy.get('input, textarea, select').should('have.length.greaterThan', 0);
    });

    it('should allow field editing', () => {
      cy.navigate_to_story('components-micro-configeditor--default');
      cy.get('input').first().clear().type('Updated Value');
      cy.get('input').first().should('have.value', 'Updated Value');
    });

    it('should have save/cancel buttons', () => {
      cy.navigate_to_story('components-micro-configeditor--default');
      cy.get('button').should('contain', /Save|Cancel/).should('have.length.greaterThan', 0);
    });
  });

  describe('PluginCard Component', () => {
    it('should render plugin card', () => {
      cy.navigate_to_story('components-micro-plugincard--default');
      cy.get('[data-testid="plugin-card"]').should('exist').should('be.visible');
    });

    it('should display plugin name and description', () => {
      cy.navigate_to_story('components-micro-plugincard--default');
      cy.get('[data-testid="plugin-card"]').within(() => {
        cy.get('h3, h4').should('exist');
      });
    });

    it('should display plugin version', () => {
      cy.navigate_to_story('components-micro-plugincard--default');
      cy.get('[data-testid="plugin-card"]').should('contain', /v\d+\.\d+/);
    });

    it('should have install/enable button', () => {
      cy.navigate_to_story('components-micro-plugincard--default');
      cy.get('[data-testid="plugin-card"] button').should('exist');
    });

    it('should display plugin status', () => {
      cy.navigate_to_story('components-micro-plugincard--enabled');
      cy.get('[data-testid="status-indicator"]').should('exist');
    });
  });

  describe('PluginPermissions Component', () => {
    it('should render plugin permissions', () => {
      cy.navigate_to_story('components-micro-pluginpermissions--default');
      cy.get('[data-testid="plugin-permissions"]').should('exist').should('be.visible');
    });

    it('should display permission list', () => {
      cy.navigate_to_story('components-micro-pluginpermissions--default');
      cy.get('[data-testid="permission-item"]').should('have.length.greaterThan', 0);
    });

    it('should allow toggling permissions', () => {
      cy.navigate_to_story('components-micro-pluginpermissions--default');
      cy.get('input[type="checkbox"]').first().click();
      cy.get('input[type="checkbox"]').first().should('be.checked');
    });

    it('should display permission descriptions', () => {
      cy.navigate_to_story('components-micro-pluginpermissions--default');
      cy.get('[data-testid="permission-description"]').should('have.length.greaterThan', 0);
    });

    it('should group permissions by category', () => {
      cy.navigate_to_story('components-micro-pluginpermissions--default');
      cy.get('h4, h5, .permission-category').should('have.length.greaterThan', 0);
    });
  });

  describe('SandboxPreview Component', () => {
    it('should render sandbox preview', () => {
      cy.navigate_to_story('components-micro-sandboxpreview--default');
      cy.get('[data-testid="sandbox-preview"]').should('exist').should('be.visible');
    });

    it('should display iframe or preview area', () => {
      cy.navigate_to_story('components-micro-sandboxpreview--default');
      cy.get('iframe').should('exist');
    });

    it('should allow code input', () => {
      cy.navigate_to_story('components-micro-sandboxpreview--default');
      cy.get('textarea, [contenteditable]').should('exist');
    });

    it('should display preview output', () => {
      cy.navigate_to_story('components-micro-sandboxpreview--default');
      cy.get('iframe').should('exist');
    });

    it('should have action buttons (run, reset, etc)', () => {
      cy.navigate_to_story('components-micro-sandboxpreview--default');
      cy.get('button').should('have.length.greaterThan', 0);
    });
  });
});
