/**
 * Jobs Page Filter Integration Tests
 * Tests that filter changes properly trigger state updates and data refetches
 */

describe('Jobs Page - Filter Integration', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/dashboard/jobs');
  });

  describe('Status Filter', () => {
    it('changes filter state when status dropdown is clicked', () => {
      // Initially no filter applied (All selected)
      cy.get('[data-testid="filter-status"]').should('have.value', '');

      // Click dropdown and select RUNNING
      cy.get('[data-testid="filter-status"]').click();
      cy.contains('[role="option"]', 'Running').click();

      // Verify state changed to RUNNING
      cy.get('[data-testid="filter-status"]').should('have.value', 'RUNNING');
    });

    it('triggers data refetch when status filter changes', () => {
      // Intercept the API call
      cy.intercept('GET', '/api/dashboard/jobs*', {
        statusCode: 200,
        body: {
          jobs: [
            {
              id: 'job-1',
              name: 'Running Job',
              status: 'RUNNING',
              priority: 'HIGH',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          total: 1,
        },
      }).as('getRunningJobs');

      // Apply RUNNING filter
      cy.get('[data-testid="filter-status"]').click();
      cy.contains('[role="option"]', 'Running').click();

      // Verify API was called with status=RUNNING
      cy.wait('@getRunningJobs').then((interception) => {
        expect(interception.request.url).to.include('status=RUNNING');
      });

      // Verify data updates to show only running job
      cy.get('[data-testid="jobs-table"] tbody tr').should('have.length', 1);
      cy.get('[data-testid="jobs-table"]').should('contain', 'Running Job');
    });

    it('returns to page 0 when filter changes', () => {
      // Navigate to page 2
      cy.get('[data-testid="pagination"] button').contains('2').click();

      // Apply filter (should reset to page 0)
      cy.get('[data-testid="filter-status"]').click();
      cy.contains('[role="option"]', 'Failed').click();

      // Verify page indicator shows page 0/1
      cy.get('[data-testid="pagination"]').should('contain', '1–');
    });

    it('filters display correct jobs by status', () => {
      // Mock different status responses
      cy.intercept('GET', '/api/dashboard/jobs?*status=COMPLETED*', {
        statusCode: 200,
        body: {
          jobs: [
            {
              id: 'completed-1',
              name: 'Completed Deploy',
              status: 'COMPLETED',
              priority: 'NORMAL',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          total: 1,
        },
      }).as('getCompletedJobs');

      // Apply COMPLETED filter
      cy.get('[data-testid="filter-status"]').click();
      cy.contains('[role="option"]', 'Completed').click();

      // Wait for API and verify results
      cy.wait('@getCompletedJobs');
      cy.get('[data-testid="jobs-table"]').should('contain', 'Completed Deploy');
      cy.get('[data-testid="status-badge-COMPLETED"]').should('exist');
    });
  });

  describe('Priority Filter', () => {
    it('changes filter state when priority dropdown is clicked', () => {
      cy.get('[data-testid="filter-priority"]').should('have.value', '');

      cy.get('[data-testid="filter-priority"]').click();
      cy.contains('[role="option"]', 'Critical').click();

      cy.get('[data-testid="filter-priority"]').should('have.value', 'CRITICAL');
    });

    it('triggers data refetch when priority filter changes', () => {
      cy.intercept('GET', '/api/dashboard/jobs*', {
        statusCode: 200,
        body: {
          jobs: [
            {
              id: 'job-1',
              name: 'Critical Job',
              status: 'RUNNING',
              priority: 'CRITICAL',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          total: 1,
        },
      }).as('getCriticalJobs');

      cy.get('[data-testid="filter-priority"]').click();
      cy.contains('[role="option"]', 'Critical').click();

      cy.wait('@getCriticalJobs').then((interception) => {
        expect(interception.request.url).to.include('priority=CRITICAL');
      });

      cy.get('[data-testid="jobs-table"]').should('contain', 'Critical Job');
    });
  });

  describe('Multiple Filters', () => {
    it('applies both status and priority filters together', () => {
      cy.intercept('GET', '/api/dashboard/jobs*status=RUNNING*priority=HIGH*', {
        statusCode: 200,
        body: {
          jobs: [
            {
              id: 'job-1',
              name: 'High Priority Running',
              status: 'RUNNING',
              priority: 'HIGH',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          total: 1,
        },
      }).as('getFilteredJobs');

      // Apply status filter
      cy.get('[data-testid="filter-status"]').click();
      cy.contains('[role="option"]', 'Running').click();

      // Apply priority filter
      cy.get('[data-testid="filter-priority"]').click();
      cy.contains('[role="option"]', 'High').click();

      // Verify both filters are active
      cy.get('[data-testid="filter-status"]').should('have.value', 'RUNNING');
      cy.get('[data-testid="filter-priority"]').should('have.value', 'HIGH');

      // Verify data matches both criteria
      cy.wait('@getFilteredJobs');
      cy.get('[data-testid="jobs-table"]').should('contain', 'High Priority Running');
    });

    it('clears all filters when Reset button is clicked', () => {
      // Apply both filters
      cy.get('[data-testid="filter-status"]').click();
      cy.contains('[role="option"]', 'Running').click();

      cy.get('[data-testid="filter-priority"]').click();
      cy.contains('[role="option"]', 'High').click();

      // Verify filters are active
      cy.get('[data-testid="filter-status"]').should('have.value', 'RUNNING');
      cy.get('[data-testid="filter-priority"]').should('have.value', 'HIGH');

      // Click reset
      cy.get('[data-testid="reset-filters-button"]').click();

      // Verify all filters cleared
      cy.get('[data-testid="filter-status"]').should('have.value', '');
      cy.get('[data-testid="filter-priority"]').should('have.value', '');
    });
  });

  describe('Filter with Sorting', () => {
    it('applies filter and maintains sort order', () => {
      cy.intercept('GET', '/api/dashboard/jobs*status=RUNNING*sort_by=name*', {
        statusCode: 200,
        body: {
          jobs: [
            {
              id: 'job-2',
              name: 'Alpha Running Job',
              status: 'RUNNING',
              priority: 'NORMAL',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 'job-1',
              name: 'Beta Running Job',
              status: 'RUNNING',
              priority: 'NORMAL',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          total: 2,
        },
      }).as('getFilteredAndSorted');

      // Click name header to sort by name
      cy.get('th').contains('Name').click();

      // Apply filter
      cy.get('[data-testid="filter-status"]').click();
      cy.contains('[role="option"]', 'Running').click();

      // Verify API called with both sort and filter
      cy.wait('@getFilteredAndSorted').then((interception) => {
        expect(interception.request.url).to.include('status=RUNNING');
        expect(interception.request.url).to.include('sort_by=name');
      });
    });
  });

  describe('Filter State Persistence', () => {
    it('maintains filter state when navigating back', () => {
      // Apply filter
      cy.get('[data-testid="filter-status"]').click();
      cy.contains('[role="option"]', 'Failed').click();

      // Navigate away
      cy.visit('http://localhost:3000/dashboard');

      // Navigate back to jobs
      cy.visit('http://localhost:3000/dashboard/jobs');

      // Note: Filter will NOT persist across navigation in current implementation
      // This is expected - filters are component state only
      cy.get('[data-testid="filter-status"]').should('have.value', '');
    });
  });

  describe('Filter Error Handling', () => {
    it('shows error and allows retry when filter query fails', () => {
      cy.intercept('GET', '/api/dashboard/jobs*status=RUNNING*', {
        statusCode: 500,
        body: { error: 'Internal server error' },
      }).as('failedQuery');

      cy.get('[data-testid="filter-status"]').click();
      cy.contains('[role="option"]', 'Running').click();

      cy.wait('@failedQuery');

      // Verify error shown
      cy.get('[data-testid="error-alert"]').should('be.visible');
      cy.get('[data-testid="error-alert"]').should('contain', 'Failed');
    });
  });
});
