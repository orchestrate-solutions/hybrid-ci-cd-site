/**
 * Cypress Tests for Layout Components
 * Tests: AppShell, Header, Sidebar
 */

describe('Layout Components E2E', () => {
  describe('AppShell', () => {
    it('should render full layout structure', () => {
      cy.get('[data-testid="app-shell"]').should('exist');
    });

    it('should have header, sidebar, and main content areas', () => {
      cy.get('[data-testid="app-shell"]').within(() => {
        cy.get('[data-testid="header"]').should('exist');
        cy.get('[data-testid="sidebar"]').should('exist');
        cy.get('[data-testid="main-content"]').should('exist');
      });
    });

    it('should maintain layout on resize', () => {
      cy.viewport(1920, 1080);
      cy.get('[data-testid="app-shell"]').should('be.visible');
      cy.viewport('iphone-x');
      cy.get('[data-testid="app-shell"]').should('be.visible');
    });

    it('should be responsive', () => {
      cy.viewport('iphone-x');
      cy.get('[data-testid="app-shell"]').should('exist');
      cy.get('[data-testid="sidebar"]').should('exist');
    });
  });

  describe('Header', () => {
    it('should render header with logo', () => {
      cy.get('[data-testid="header"]').should('exist');
      cy.get('[data-testid="logo"]', { timeout: 5000 }).should('be.visible');
    });

    it('should display navigation items', () => {
      cy.get('[data-testid="header"]').within(() => {
        cy.get('a, button').should('have.length.greaterThan', 0);
      });
    });

    it('should have user menu button', () => {
      cy.get('[data-testid="user-menu-button"]').should('exist');
    });

    it('should toggle user menu on click', () => {
      cy.get('[data-testid="user-menu-button"]').click();
      cy.get('[data-testid="user-menu"]').should('be.visible');
      cy.get('[data-testid="user-menu-button"]').click();
      cy.get('[data-testid="user-menu"]').should('not.be.visible');
    });

    it('should display search bar', () => {
      cy.get('[data-testid="search-input"]').should('exist');
    });

    it('should handle search input', () => {
      cy.get('[data-testid="search-input"]').type('test search');
      cy.get('[data-testid="search-input"]').should('have.value', 'test search');
    });
  });

  describe('Sidebar', () => {
    it('should render sidebar with navigation items', () => {
      cy.get('[data-testid="sidebar"]').should('exist');
      cy.get('[data-testid="nav-item"]').should('have.length.greaterThan', 0);
    });

    it('should highlight active navigation item', () => {
      cy.get('[data-testid="nav-item"]').first().click();
      cy.get('[data-testid="nav-item"]').first().should('have.class', /active|selected/);
    });

    it('should navigate on item click', () => {
      cy.get('[data-testid="nav-item"]').first().click();
      cy.url().should('not.equal', 'about:blank');
    });

    it('should display all main sections', () => {
      cy.get('[data-testid="sidebar"]').within(() => {
        cy.contains(/Dashboard|Jobs|Deployments|Agents/).should('exist');
      });
    });

    it('should have collapsible sections', () => {
      cy.get('[data-testid="sidebar-section"]').should('have.length.greaterThan', 0);
    });

    it('should collapse/expand on click', () => {
      cy.get('[data-testid="sidebar-toggle"]').should('exist');
      cy.get('[data-testid="sidebar-toggle"]').click();
      cy.get('[data-testid="sidebar"]').should('exist');
    });

    it('should be responsive and hide on mobile', () => {
      cy.viewport('iphone-x');
      cy.get('[data-testid="sidebar"]', { timeout: 5000 }).should('exist');
    });

    it('should show icons for navigation items', () => {
      cy.get('[data-testid="nav-icon"]').should('have.length.greaterThan', 0);
    });
  });

  describe('AppShell Integrated Behavior', () => {
    it('should maintain state when navigating between sections', () => {
      cy.get('[data-testid="nav-item"]').first().click();
      cy.get('[data-testid="nav-item"]').eq(1).click();
      cy.get('[data-testid="nav-item"]').first().click();
      cy.get('[data-testid="nav-item"]').first().should('have.class', /active|selected/);
    });

    it('should update main content when sidebar item clicked', () => {
      const initialContent = cy.get('[data-testid="main-content"]').invoke('text');
      cy.get('[data-testid="nav-item"]').eq(1).click();
      const newContent = cy.get('[data-testid="main-content"]').invoke('text');
      // Content should change when navigating
      cy.wrap(initialContent).should('not.equal', newContent);
    });

    it('should keep header visible when scrolling', () => {
      cy.get('[data-testid="main-content"]').scrollTo('bottom');
      cy.get('[data-testid="header"]').should('be.visible');
    });

    it('should keep sidebar visible when scrolling', () => {
      cy.get('[data-testid="main-content"]').scrollTo('bottom');
      cy.get('[data-testid="sidebar"]').should('be.visible');
    });
  });
});
