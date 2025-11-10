/**
 * Deployments Page Filter Integration Tests
 * Tests that filter changes properly trigger state updates and data refetches
 */

describe('Deployments Page - Filter Integration', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/dashboard/deployments');
  });

  describe('Status Filter', () => {
    it('changes filter state when status dropdown is clicked', () => {
      cy.get('[data-testid="filter-status"]').should('have.value', 'ALL');

      cy.get('[data-testid="filter-status"]').click();
      cy.contains('[role="option"]', 'Completed').click();

      cy.get('[data-testid="filter-status"]').should('have.value', 'COMPLETED');
    });

    it('triggers data refetch when status filter changes', () => {
      cy.intercept('GET', '/api/dashboard/deployments*', {
        statusCode: 200,
        body: {
          deployments: [
            {
              id: 'dep-1',
              name: 'v2.0 Deployment',
              status: 'COMPLETED',
              environment: 'PRODUCTION',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          total: 1,
        },
      }).as('getCompletedDeployments');

      cy.get('[data-testid="filter-status"]').click();
      cy.contains('[role="option"]', 'Completed').click();

      cy.wait('@getCompletedDeployments').then((interception) => {
        expect(interception.request.url).to.include('status=COMPLETED');
      });

      cy.get('[data-testid="deployments-table"]').should('contain', 'v2.0 Deployment');
    });

    it('returns to page 0 when filter changes', () => {
      // Go to page 2
      cy.get('button').contains('2').click({ force: true });

      // Apply filter (should reset to page 0)
      cy.get('[data-testid="filter-status"]').click();
      cy.contains('[role="option"]', 'Failed').click();

      // Verify back on page 0
      cy.get('[data-testid="pagination"]').should('contain', '1–');
    });
  });

  describe('Environment Filter', () => {
    it('changes filter state when environment dropdown is clicked', () => {
      cy.get('[data-testid="filter-environment"]').should('have.value', 'ALL');

      cy.get('[data-testid="filter-environment"]').click();
      cy.contains('[role="option"]', 'Production').click();

      cy.get('[data-testid="filter-environment"]').should('have.value', 'PRODUCTION');
    });

    it('triggers data refetch when environment filter changes', () => {
      cy.intercept('GET', '/api/dashboard/deployments*', {
        statusCode: 200,
        body: {
          deployments: [
            {
              id: 'dep-1',
              name: 'Prod Deployment',
              status: 'COMPLETED',
              environment: 'PRODUCTION',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          total: 1,
        },
      }).as('getProdDeployments');

      cy.get('[data-testid="filter-environment"]').click();
      cy.contains('[role="option"]', 'Production').click();

      cy.wait('@getProdDeployments').then((interception) => {
        expect(interception.request.url).to.include('environment=PRODUCTION');
      });

      cy.get('[data-testid="deployments-table"]').should('contain', 'Prod Deployment');
    });
  });

  describe('Multiple Filters', () => {
    it('applies both status and environment filters together', () => {
      cy.intercept('GET', '/api/dashboard/deployments*status=COMPLETED*environment=PRODUCTION*', {
        statusCode: 200,
        body: {
          deployments: [
            {
              id: 'dep-1',
              name: 'Production Complete',
              status: 'COMPLETED',
              environment: 'PRODUCTION',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          total: 1,
        },
      }).as('getFilteredDeployments');

      cy.get('[data-testid="filter-status"]').click();
      cy.contains('[role="option"]', 'Completed').click();

      cy.get('[data-testid="filter-environment"]').click();
      cy.contains('[role="option"]', 'Production').click();

      cy.wait('@getFilteredDeployments');
      cy.get('[data-testid="deployments-table"]').should('contain', 'Production Complete');
    });

    it('shows reset button only when filters are active', () => {
      // Initially no reset button visible
      cy.get('[data-testid="deployments-filters"]').should('not.contain', 'Reset');

      // Apply first filter
      cy.get('[data-testid="filter-status"]').click();
      cy.contains('[role="option"]', 'Failed').click();

      // Now reset button should appear
      cy.get('[data-testid="deployments-filters"]').should('contain', 'Reset');

      // Click reset
      cy.get('button').contains('Reset Filters').click();

      // Reset button disappears
      cy.get('[data-testid="deployments-filters"]').should('not.contain', 'Reset');
    });

    it('clears all filters when Reset button is clicked', () => {
      cy.get('[data-testid="filter-status"]').click();
      cy.contains('[role="option"]', 'Pending').click();

      cy.get('[data-testid="filter-environment"]').click();
      cy.contains('[role="option"]', 'Staging').click();

      cy.get('[data-testid="filter-status"]').should('have.value', 'PENDING');
      cy.get('[data-testid="filter-environment"]').should('have.value', 'STAGING');

      cy.get('button').contains('Reset Filters').click();

      cy.get('[data-testid="filter-status"]').should('have.value', 'ALL');
      cy.get('[data-testid="filter-environment"]').should('have.value', 'ALL');
    });
  });

  describe('Filter with Sorting', () => {
    it('applies filter and maintains sort order', () => {
      cy.intercept('GET', '/api/dashboard/deployments*status=COMPLETED*sort_by=created_at*', {
        statusCode: 200,
        body: {
          deployments: [
            {
              id: 'dep-1',
              name: 'Deployment 1',
              status: 'COMPLETED',
              environment: 'PRODUCTION',
              created_at: new Date(Date.now() - 86400000).toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 'dep-2',
              name: 'Deployment 2',
              status: 'COMPLETED',
              environment: 'STAGING',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          total: 2,
        },
      }).as('getFilteredAndSorted');

      // Apply filter
      cy.get('[data-testid="filter-status"]').click();
      cy.contains('[role="option"]', 'Completed').click();

      cy.wait('@getFilteredAndSorted').then((interception) => {
        expect(interception.request.url).to.include('status=COMPLETED');
        expect(interception.request.url).to.include('sort_by=created_at');
      });
    });
  });

  describe('Filter Error Handling', () => {
    it('shows error message when filter query fails', () => {
      cy.intercept('GET', '/api/dashboard/deployments*status=FAILED*', {
        statusCode: 500,
        body: { error: 'Server error' },
      }).as('failedQuery');

      cy.get('[data-testid="filter-status"]').click();
      cy.contains('[role="option"]', 'Failed').click();

      cy.wait('@failedQuery');

      cy.get('[role="alert"]').should('contain', 'error');
    });
  });

  describe('Pagination with Filters', () => {
    it('resets pagination when filter applied', () => {
      // Mock first page of filtered results
      cy.intercept('GET', '/api/dashboard/deployments*status=COMPLETED*offset=0*', {
        statusCode: 200,
        body: {
          deployments: [
            {
              id: 'dep-1',
              name: 'Deployment 1',
              status: 'COMPLETED',
              environment: 'PRODUCTION',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          total: 1,
        },
      }).as('getFilteredPage0');

      // Apply filter
      cy.get('[data-testid="filter-status"]').click();
      cy.contains('[role="option"]', 'Completed').click();

      // Verify we're on page 0 and got results
      cy.wait('@getFilteredPage0');
      cy.get('[data-testid="deployments-table"]').should('exist');
    });
  });
});
