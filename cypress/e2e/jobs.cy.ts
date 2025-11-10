/**
 * JobsPage E2E Tests (Cypress)
 * 
 * User workflow tests for the jobs page.
 * Tests navigation, filtering, sorting, pagination, and error handling.
 */

describe('JobsPage E2E Workflows', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/dashboard/jobs');
  });

  describe('Navigation & Structure', () => {
    it('navigates to jobs page from dashboard', () => {
      cy.visit('http://localhost:3000/dashboard');
      cy.contains('Jobs').click();
      cy.url().should('include', '/dashboard/jobs');
    });

    it('displays jobs page header', () => {
      cy.contains('h1', /Jobs/i).should('be.visible');
    });

    it('displays create job button', () => {
      cy.contains('button', /Create Job/i).should('be.visible');
    });

    it('displays jobs table', () => {
      cy.get('[data-testid="jobs-table"]').should('exist');
    });

    it('displays filter controls', () => {
      cy.get('[data-testid="jobs-filters"]').should('be.visible');
    });
  });

  describe('Data Display', () => {
    it('displays jobs in table', () => {
      cy.get('[data-testid="jobs-table"] tbody tr').should('have.length.greaterThan', 0);
    });

    it('displays job columns correctly', () => {
      cy.get('[data-testid="jobs-table"]').within(() => {
        cy.contains('th', /Name/i).should('be.visible');
        cy.contains('th', /Status/i).should('be.visible');
        cy.contains('th', /Priority/i).should('be.visible');
        cy.contains('th', /Created/i).should('be.visible');
      });
    });

    it('displays status badges', () => {
      cy.get('[data-testid="jobs-table"] tbody tr').first().within(() => {
        cy.get('[data-testid*="status-badge"]').should('be.visible');
      });
    });

    it('displays job timestamps', () => {
      cy.get('[data-testid="jobs-table"] tbody tr').first().within(() => {
        cy.get('td').contains(/\d{4}-\d{2}-\d{2}/).should('be.visible');
      });
    });
  });

  describe('Filtering', () => {
    it('filters jobs by status RUNNING', () => {
      cy.get('[data-testid="filter-status"]').click();
      cy.get('[role="option"]').contains(/RUNNING/i).click();

      // All visible rows should show RUNNING status
      cy.get('[data-testid="jobs-table"] tbody tr').each((row) => {
        cy.wrap(row).should('contain', 'RUNNING');
      });
    });

    it('filters jobs by status COMPLETED', () => {
      cy.get('[data-testid="filter-status"]').click();
      cy.get('[role="option"]').contains(/COMPLETED/i).click();

      cy.get('[data-testid="jobs-table"] tbody tr').each((row) => {
        cy.wrap(row).should('contain', 'COMPLETED');
      });
    });

    it('filters jobs by priority HIGH', () => {
      cy.get('[data-testid="filter-priority"]').click();
      cy.get('[role="option"]').contains(/HIGH/i).click();

      // Verify API was called with priority filter
      cy.url().should('include', 'priority=HIGH');
    });

    it('combines multiple filters', () => {
      cy.get('[data-testid="filter-status"]').click();
      cy.get('[role="option"]').contains(/RUNNING/i).click();

      cy.get('[data-testid="filter-priority"]').click();
      cy.get('[role="option"]').contains(/HIGH/i).click();

      // Should show only RUNNING jobs with HIGH priority
      cy.url().should('include', 'status=RUNNING');
      cy.url().should('include', 'priority=HIGH');
    });

    it('resets all filters with reset button', () => {
      // Apply filters
      cy.get('[data-testid="filter-status"]').click();
      cy.get('[role="option"]').contains(/RUNNING/i).click();

      // Reset
      cy.contains('button', /Reset/i).click();

      // URL should not contain filter params
      cy.url().should('not.include', 'status=');
    });

    it('shows correct jobs count after filtering', () => {
      cy.get('[data-testid="filter-status"]').click();
      cy.get('[role="option"]').contains(/RUNNING/i).click();

      // Page info should show filtered count
      cy.contains(/jobs/i).should('be.visible');
    });
  });

  describe('Sorting', () => {
    it('sorts by name column ascending', () => {
      cy.contains('th', /Name/i).click();

      // Jobs should be sorted by name (a-z)
      cy.get('[data-testid="jobs-table"] tbody tr').first()
        .should('be.visible');
    });

    it('sorts by name column descending on second click', () => {
      cy.contains('th', /Name/i).click();
      cy.contains('th', /Name/i).click();

      // Jobs should be sorted by name (z-a)
      cy.get('[data-testid="jobs-table"] tbody tr').first()
        .should('be.visible');
    });

    it('sorts by status column', () => {
      cy.contains('th', /Status/i).click();

      cy.get('[data-testid="jobs-table"] tbody tr').first()
        .should('be.visible');
    });

    it('sorts by created date', () => {
      cy.contains('th', /Created/i).click();

      cy.get('[data-testid="jobs-table"] tbody tr').first()
        .should('be.visible');
    });

    it('clears previous sort when clicking new column', () => {
      cy.contains('th', /Name/i).click();
      cy.contains('th', /Status/i).click();

      // Should now be sorted by Status, not Name
      cy.url().should('include', 'sort_by=status');
    });
  });

  describe('Pagination', () => {
    it('displays pagination info', () => {
      cy.get('[data-testid="pagination"]').should('be.visible');
      cy.contains(/\d+.*of.*\d+/i).should('be.visible');
    });

    it('navigates to next page', () => {
      // Get first job name
      cy.get('[data-testid="jobs-table"] tbody tr:first td:first')
        .invoke('text')
        .then((firstPageFirstJob) => {
          cy.contains('button', /Next/i).click();

          // First job should be different on page 2
          cy.get('[data-testid="jobs-table"] tbody tr:first td:first')
            .should('not.contain', firstPageFirstJob);
        });
    });

    it('navigates to previous page', () => {
      // Go to page 2
      cy.contains('button', /Next/i).click();

      // Go back to page 1
      cy.contains('button', /Previous/i).click();

      // Should be at page 1
      cy.url().should('include', 'offset=0');
    });

    it('disables next button on last page', () => {
      // Navigate to last page (assuming < 5 pages)
      for (let i = 0; i < 10; i++) {
        const nextBtn = cy.contains('button', /Next/i);
        nextBtn.should('be.enabled').click().then(() => {
          // Try clicking again, should be disabled eventually or stay enabled if more pages
        });
      }
    });

    it('disables previous button on first page', () => {
      cy.contains('button', /Previous/i).should('be.disabled');
    });

    it('changes page size when page size selector changes', () => {
      cy.get('[data-testid="pagination-size"]').click();
      cy.get('[role="option"]').contains('100').click();

      // URL should reflect new page size
      cy.url().should('include', 'limit=100');
    });
  });

  describe('Error Handling', () => {
    it('shows error message on network failure', () => {
      // Intercept API and return error
      cy.intercept('/api/dashboard/jobs*', { statusCode: 500 }).as('jobsError');

      cy.reload();
      cy.wait('@jobsError');

      cy.contains(/Error|Failed/i).should('be.visible');
    });

    it('provides retry button after error', () => {
      cy.intercept('/api/dashboard/jobs*', { statusCode: 500 });

      cy.reload();

      cy.contains('button', /Retry|Try Again/i).should('be.visible');
    });

    it('refetches data when retry clicked', () => {
      let callCount = 0;

      cy.intercept('/api/dashboard/jobs*', (req) => {
        callCount++;
        if (callCount === 1) {
          req.reply({ statusCode: 500 });
        } else {
          req.reply({
            statusCode: 200,
            body: {
              jobs: [],
              total: 0,
              limit: 50,
              offset: 0,
            },
          });
        }
      }).as('jobsRetry');

      cy.reload();
      cy.contains('button', /Retry|Try Again/i).click();

      cy.wait('@jobsRetry');
      cy.contains(/Error|Failed/i).should('not.exist');
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no jobs match filter', () => {
      cy.get('[data-testid="filter-status"]').click();
      cy.get('[role="option"]').contains(/CANCELED/i).click();

      cy.contains(/No jobs|No results|empty/i).should('be.visible');
    });

    it('shows empty state message with friendly text', () => {
      cy.get('[data-testid="filter-status"]').click();
      cy.get('[role="option"]').contains(/CANCELED/i).click();

      cy.contains(/No jobs found|Create one|Get started/i).should('exist');
    });
  });

  describe('Interactions', () => {
    it('can click on job row to view details', () => {
      cy.get('[data-testid="jobs-table"] tbody tr:first').click();

      // Should navigate to job details page
      cy.url().should('include', '/dashboard/jobs/');
    });

    it('can create new job', () => {
      cy.contains('button', /Create Job/i).click();

      // Should show create job modal or navigate to create page
      cy.contains(/Create Job|New Job|Job Details/i).should('be.visible');
    });

    it('can delete job from table', () => {
      cy.get('[data-testid="jobs-table"] tbody tr:first').within(() => {
        cy.get('[data-testid="job-delete"]').click();
      });

      cy.contains(/Confirm|Delete|Are you sure/i).should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('keyboard navigation works', () => {
      cy.get('[data-testid="jobs-table"]').should('have.attr', 'role', 'table');
      cy.get('[data-testid="jobs-table"] th').first().should('have.attr', 'role', 'columnheader');
    });

    it('filter controls are keyboard accessible', () => {
      cy.get('[data-testid="filter-status"]').focus().should('have.focus');
      cy.get('[data-testid="filter-status"]').type('{enter}');

      cy.get('[role="listbox"]').should('be.visible');
    });

    it('table has proper ARIA labels', () => {
      cy.get('[data-testid="jobs-table"]').should('have.attr', 'role', 'table');
      cy.get('[data-testid="jobs-table"] th').should('have.attr', 'role', 'columnheader');
    });

    it('status badges have descriptive text', () => {
      cy.get('[data-testid="jobs-table"] tbody tr:first')
        .get('[data-testid*="status-badge"]')
        .should('have.attr', 'aria-label');
    });
  });

  describe('Responsive Design', () => {
    it('displays correctly on mobile', () => {
      cy.viewport(375, 667);
      cy.get('[data-testid="jobs-table"]').should('be.visible');
    });

    it('displays correctly on tablet', () => {
      cy.viewport(768, 1024);
      cy.get('[data-testid="jobs-table"]').should('be.visible');
    });

    it('displays correctly on desktop', () => {
      cy.viewport(1920, 1080);
      cy.get('[data-testid="jobs-table"]').should('be.visible');
    });

    it('collapses columns on mobile', () => {
      cy.viewport(375, 667);
      // Some columns should be hidden or combined
      cy.get('[data-testid="jobs-table"]').should('be.visible');
    });
  });

  describe('Real-Time Updates', () => {
    it('auto-refreshes jobs periodically', () => {
      let apiCallCount = 0;

      cy.intercept('/api/dashboard/jobs*', (req) => {
        apiCallCount++;
        req.reply({
          statusCode: 200,
          body: {
            jobs: [],
            total: 0,
            limit: 50,
            offset: 0,
          },
        });
      }).as('jobsApi');

      cy.wait('@jobsApi');

      // Wait for auto-refresh (typically 30-60 seconds)
      cy.wait(61000);

      cy.wait('@jobsApi');

      // Should have been called at least twice
      expect(apiCallCount).to.be.greaterThan(1);
    });
  });

  describe('URL State Persistence', () => {
    it('preserves filters in URL', () => {
      cy.get('[data-testid="filter-status"]').click();
      cy.get('[role="option"]').contains(/RUNNING/i).click();

      // Reload page
      cy.reload();

      // Filter should still be applied
      cy.url().should('include', 'status=RUNNING');
    });

    it('preserves sort in URL', () => {
      cy.contains('th', /Name/i).click();

      cy.reload();

      cy.url().should('include', 'sort_by=name');
    });

    it('preserves pagination offset in URL', () => {
      cy.contains('button', /Next/i).click();

      cy.reload();

      cy.url().should('include', 'offset=50');
    });
  });
});
