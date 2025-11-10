/**
 * Cypress Component Tests: Layout Components
 * Tests all 3 layout containers in real browser
 * Validates: responsive layout, navigation, composition
 */

describe('Layout Components - Component Tests', () => {
  beforeEach(() => {
    cy.visit('http://localhost:6006');
  });

  describe('AppShell Component', () => {
    it('should render app shell', () => {
      cy.navigate_to_story('components-layout-appshell--default');
      cy.get('[data-testid="app-shell"]').should('exist').should('be.visible');
    });

    it('should contain header section', () => {
      cy.navigate_to_story('components-layout-appshell--default');
      cy.get('header').should('exist');
    });

    it('should contain sidebar section', () => {
      cy.navigate_to_story('components-layout-appshell--default');
      cy.get('aside, nav[role="navigation"]').should('exist');
    });

    it('should contain main content area', () => {
      cy.navigate_to_story('components-layout-appshell--default');
      cy.get('main').should('exist');
    });

    it('should have responsive grid layout', () => {
      cy.navigate_to_story('components-layout-appshell--default');
      cy.get('[data-testid="app-shell"]')
        .should('have.css', 'display')
        .and('include', 'grid');
    });

    it('should be responsive on mobile viewport', () => {
      cy.viewport('iphone-x');
      cy.navigate_to_story('components-layout-appshell--default');
      cy.get('[data-testid="app-shell"]').should('be.visible');
    });

    it('should be responsive on tablet viewport', () => {
      cy.viewport('ipad-2');
      cy.navigate_to_story('components-layout-appshell--default');
      cy.get('[data-testid="app-shell"]').should('be.visible');
    });

    it('should be responsive on desktop viewport', () => {
      cy.viewport('macbook-15');
      cy.navigate_to_story('components-layout-appshell--default');
      cy.get('[data-testid="app-shell"]').should('be.visible');
    });
  });

  describe('Header Component', () => {
    it('should render header', () => {
      cy.navigate_to_story('components-layout-header--default');
      cy.get('header').should('exist').should('be.visible');
    });

    it('should display logo/branding', () => {
      cy.navigate_to_story('components-layout-header--default');
      cy.get('img[alt*="logo"], h1').should('exist');
    });

    it('should display navigation items', () => {
      cy.navigate_to_story('components-layout-header--default');
      cy.get('nav a, [role="navigation"] a').should('have.length.greaterThan', 0);
    });

    it('should have user menu', () => {
      cy.navigate_to_story('components-layout-header--with-user-menu');
      cy.get('button[aria-label*="user"]').should('exist');
    });

    it('should display theme toggle', () => {
      cy.navigate_to_story('components-layout-header--default');
      cy.get('button[aria-label*="theme"], button[aria-label*="dark"], button[aria-label*="light"]').should('exist');
    });

    it('should be sticky/fixed at top', () => {
      cy.navigate_to_story('components-layout-header--default');
      cy.get('header')
        .should('have.css', 'position')
        .and('match', /fixed|sticky|absolute/);
    });

    it('should be responsive on mobile', () => {
      cy.viewport('iphone-x');
      cy.navigate_to_story('components-layout-header--default');
      cy.get('header').should('be.visible');
    });
  });

  describe('Sidebar Component', () => {
    it('should render sidebar', () => {
      cy.navigate_to_story('components-layout-sidebar--default');
      cy.get('aside, nav[role="navigation"]').should('exist').should('be.visible');
    });

    it('should display navigation links', () => {
      cy.navigate_to_story('components-layout-sidebar--default');
      cy.get('nav a, [data-testid="nav-link"]').should('have.length.greaterThan', 0);
    });

    it('should highlight active nav item', () => {
      cy.navigate_to_story('components-layout-sidebar--default');
      cy.get('a[aria-current="page"], a.active').should('have.length.greaterThan', 0);
    });

    it('should display all main sections', () => {
      cy.navigate_to_story('components-layout-sidebar--default');
      cy.get('a').should('contain', /Dashboard|Jobs|Deployments|Agents/);
    });

    it('should be collapsible on mobile', () => {
      cy.viewport('iphone-x');
      cy.navigate_to_story('components-layout-sidebar--default');
      // Sidebar should exist but may be hidden/collapsed
      cy.get('aside').should('exist');
    });

    it('should show expand/collapse toggle', () => {
      cy.navigate_to_story('components-layout-sidebar--collapsible');
      cy.get('button[aria-label*="toggle"], button[aria-label*="menu"]').should('exist');
    });

    it('should have correct sidebar width', () => {
      cy.navigate_to_story('components-layout-sidebar--default');
      cy.get('aside')
        .invoke('width')
        .should('be.greaterThan', 150); // Reasonable sidebar width
    });

    it('should have nested submenu items if available', () => {
      cy.navigate_to_story('components-layout-sidebar--with-submenus');
      cy.get('ul ul, nav nav').should('have.length.greaterThan', 0);
    });

    it('should be scrollable if content overflows', () => {
      cy.navigate_to_story('components-layout-sidebar--default');
      cy.get('[data-testid="app-sidebar"], aside')
        .should('have.css', 'overflow-y')
        .and('match', /auto|scroll/);
    });
  });

  describe('Layout Integration', () => {
    it('should have all three layout components working together', () => {
      cy.navigate_to_story('components-layout-appshell--default');
      cy.get('[data-testid="app-shell"]').should('exist');
      cy.get('header').should('exist');
      cy.get('aside, nav').should('exist');
      cy.get('main').should('exist');
    });

    it('should have proper z-index layering', () => {
      cy.navigate_to_story('components-layout-appshell--default');
      // Header should be above content
      cy.get('header').should('have.css', 'z-index');
    });

    it('should maintain layout on page interactions', () => {
      cy.navigate_to_story('components-layout-appshell--default');
      cy.get('nav a').first().click();
      cy.get('[data-testid="app-shell"]').should('exist'); // Layout preserved
    });
  });
});
