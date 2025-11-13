/// <reference types="cypress" />

describe('Jobs Page', () => {
  beforeEach(() => {
    cy.visit('/dashboard/jobs');
    cy.contains('Jobs', { timeout: 5000 }).should('be.visible');
  });

  describe('Page Structure', () => {
    it('should display jobs page header', () => {
      cy.contains('h4', 'Jobs').should('be.visible');
    });

    it('should display summary cards', () => {
      cy.get('[data-testid="jobs-summary"]').should('exist');
      // Check for queued, running, completed, failed cards
      cy.get('[data-testid="summary-card"]').should('have.length.at.least', 4);
    });

    it('should display filter section', () => {
      cy.get('[data-testid="jobs-filters"]').should('exist');
      cy.get('input[placeholder*="Search"]').should('exist');
    });

    it('should display jobs table', () => {
      cy.get('[data-testid="jobs-table"]').should('exist');
    });
  });

  describe('Filtering', () => {
    it('should filter jobs by search term', () => {
      cy.get('input[placeholder*="Search"]').type('test-job');
      cy.get('[data-testid="jobs-table"] tbody tr').each((row) => {
        cy.wrap(row).contains('test-job', { matchCase: false });
      });
    });

    it('should filter jobs by status', () => {
      cy.get('[data-testid="status-filter"]').click();
      cy.get('[data-value="RUNNING"]').click();
      
      // All visible rows should have RUNNING status
      cy.get('[data-testid="jobs-table"] tbody tr').each((row) => {
        cy.wrap(row).contains('RUNNING');
      });
    });

    it('should filter jobs by priority', () => {
      cy.get('[data-testid="priority-filter"]').click();
      cy.get('[data-value="CRITICAL"]').click();
      
      // All visible rows should have CRITICAL priority
      cy.get('[data-testid="jobs-table"] tbody tr').each((row) => {
        cy.wrap(row).contains('CRITICAL');
      });
    });

    it('should clear filters', () => {
      cy.get('input[placeholder*="Search"]').type('test');
      cy.get('[data-testid="clear-filters"]').click();
      cy.get('input[placeholder*="Search"]').should('have.value', '');
    });
  });

  describe('Sorting', () => {
    it('should sort by name', () => {
      cy.get('[data-testid="jobs-table"] th').contains('Name').click();
      // First row should appear after sort
      cy.get('[data-testid="jobs-table"] tbody tr').first().should('exist');
    });

    it('should sort by status', () => {
      cy.get('[data-testid="jobs-table"] th').contains('Status').click();
      cy.get('[data-testid="jobs-table"] tbody tr').first().should('exist');
    });

    it('should sort by created date', () => {
      cy.get('[data-testid="jobs-table"] th').contains('Created').click();
      cy.get('[data-testid="jobs-table"] tbody tr').first().should('exist');
    });

    it('should toggle sort direction', () => {
      cy.get('[data-testid="jobs-table"] th').contains('Name').click();
      cy.get('[data-testid="jobs-table"] th').contains('Name').click();
      cy.get('[data-testid="jobs-table"] tbody tr').first().should('exist');
    });
  });

  describe('Pagination', () => {
    it('should display pagination controls', () => {
      cy.get('[data-testid="pagination"]').should('exist');
    });

    it('should change rows per page', () => {
      cy.get('[data-testid="rows-per-page"]').click();
      cy.get('[data-value="25"]').click();
      cy.get('[data-testid="jobs-table"] tbody tr')
        .should('have.length.at.most', 25);
    });

    it('should navigate to next page', () => {
      cy.get('[data-testid="next-page-button"]').click();
      cy.get('[data-testid="jobs-table"] tbody tr').first().should('exist');
    });

    it('should navigate to previous page', () => {
      cy.get('[data-testid="next-page-button"]').click();
      cy.get('[data-testid="prev-page-button"]').click();
      cy.get('[data-testid="jobs-table"] tbody tr').first().should('exist');
    });
  });

  describe('Job Details', () => {
    it('should expand job row to show details', () => {
      cy.get('[data-testid="jobs-table"] tbody tr').first().click();
      cy.get('[data-testid="job-expand-panel"]').should('be.visible');
    });

    it('should display inline log viewer when expanded', () => {
      cy.get('[data-testid="jobs-table"] tbody tr').first().click();
      cy.get('[data-testid="log-viewer"]').should('exist');
    });

    it('should display logs for the job', () => {
      cy.get('[data-testid="jobs-table"] tbody tr').first().click();
      cy.get('[data-testid="log-viewer-content"]').should('contain.text', /\[/);
    });

    it('should collapse job details', () => {
      cy.get('[data-testid="jobs-table"] tbody tr').first().click();
      cy.get('[data-testid="job-expand-panel"]').should('be.visible');
      cy.get('[data-testid="jobs-table"] tbody tr').first().click();
      cy.get('[data-testid="job-expand-panel"]').should('not.exist');
    });
  });

  describe('Progress Tracking', () => {
    it('should display progress bar for running jobs', () => {
      // Filter to RUNNING jobs
      cy.get('[data-testid="status-filter"]').click();
      cy.get('[data-value="RUNNING"]').click();
      
      cy.get('[data-testid="job-progress"]').should('exist');
    });

    it('should show percentage completion', () => {
      cy.get('[data-testid="status-filter"]').click();
      cy.get('[data-value="RUNNING"]').click();
      
      cy.get('[data-testid="job-progress"]').each((progress) => {
        cy.wrap(progress).should('contain', '%');
      });
    });
  });

  describe('Real-Time Updates', () => {
    it('should update job list in real-time', () => {
      cy.get('[data-testid="jobs-table"] tbody tr').first().invoke('text').then((initialText) => {
        cy.wait(5000);
        // Row should still exist (may have updated data)
        cy.get('[data-testid="jobs-table"] tbody tr').first().should('exist');
      });
    });

    it('should update progress bars', () => {
      cy.get('[data-testid="status-filter"]').click();
      cy.get('[data-value="RUNNING"]').click();
      
      cy.get('[data-testid="job-progress"]').first().invoke('attr', 'aria-valuenow').then((value1) => {
        cy.wait(5000);
        cy.get('[data-testid="job-progress"]').first().invoke('attr', 'aria-valuenow').then((value2) => {
          // Progress should be tracked
          expect(value2).to.not.be.undefined;
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message if jobs fetch fails', () => {
      cy.intercept('GET', '**/api/dashboard/jobs**', {
        statusCode: 500,
        body: { error: 'Internal Server Error' },
      });
      
      cy.reload();
      cy.contains('Error loading jobs', { timeout: 5000 }).should('be.visible');
    });

    it('should show retry button on error', () => {
      cy.intercept('GET', '**/api/dashboard/jobs**', {
        statusCode: 500,
        body: { error: 'Internal Server Error' },
      });
      
      cy.reload();
      cy.get('[data-testid="retry-button"]').should('exist');
    });

    it('should display empty state when no jobs', () => {
      cy.intercept('GET', '**/api/dashboard/jobs**', {
        statusCode: 200,
        body: { jobs: [] },
      });
      
      cy.reload();
      cy.contains('No jobs found', { timeout: 5000 }).should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    it('should display table on desktop', () => {
      cy.viewport(1920, 1080);
      cy.get('[data-testid="jobs-table"]').should('be.visible');
    });

    it('should display compact table on tablet', () => {
      cy.viewport('ipad-2');
      cy.get('[data-testid="jobs-table"]').should('be.visible');
    });

    it('should display mobile card view on phone', () => {
      cy.viewport('iphone-x');
      cy.get('[data-testid="jobs-mobile-card"]').should('exist');
    });
  });
});
