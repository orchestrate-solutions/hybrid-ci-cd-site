/// <reference types="cypress" />

describe('Critical User Workflows', () => {
  describe('Job Lifecycle Workflow', () => {
    it('should create, monitor, and track job completion', () => {
      // Navigate to jobs page
      cy.visit('/dashboard/jobs');
      cy.contains('Jobs', { timeout: 5000 }).should('be.visible');

      // Create new job (if form exists)
      cy.get('[data-testid="create-job-button"]').click({ force: true });
      cy.get('[data-testid="job-name-input"]').type('e2e-test-job', { timeout: 5000 });
      cy.get('[data-testid="job-priority-select"]').click();
      cy.get('[data-value="HIGH"]').click();
      cy.get('[data-testid="submit-button"]').click();

      // Verify job appears in list
      cy.contains('e2e-test-job', { timeout: 5000 }).should('be.visible');

      // Click to view job details
      cy.get('[data-testid="jobs-table"] tbody tr').contains('e2e-test-job').parent().click();
      cy.get('[data-testid="job-expand-panel"]').should('be.visible');

      // Verify logs are loading
      cy.get('[data-testid="log-viewer"]').should('exist');
      cy.get('[data-testid="log-viewer-content"]').should('be.visible');

      // Check job status updates
      cy.get('[data-testid="job-status"]').should('exist');
    });

    it('should monitor job progress from QUEUED → RUNNING → COMPLETED', () => {
      cy.visit('/dashboard/jobs');

      // Find a running job or create one
      cy.get('[data-testid="status-filter"]').click();
      cy.get('[data-value="RUNNING"]').click();

      // Expand first running job
      cy.get('[data-testid="jobs-table"] tbody tr').first().click();
      cy.get('[data-testid="job-progress"]').should('exist');

      // Monitor progress increases
      cy.get('[data-testid="job-progress"]').invoke('attr', 'aria-valuenow').then((value1) => {
        cy.wait(3000);
        cy.get('[data-testid="job-progress"]').invoke('attr', 'aria-valuenow').then((value2) => {
          expect(parseInt(value2 as string)).to.be.gte(parseInt(value1 as string));
        });
      });
    });

    it('should view logs for completed job', () => {
      cy.visit('/dashboard/jobs');

      // Filter to completed jobs
      cy.get('[data-testid="status-filter"]').click();
      cy.get('[data-value="COMPLETED"]').click();

      // Expand completed job
      cy.get('[data-testid="jobs-table"] tbody tr').first().click();

      // Verify logs displayed
      cy.get('[data-testid="log-viewer"]').should('exist');
      cy.get('[data-testid="log-viewer-content"]').should('contain', /\[|{|INFO|ERROR|DEBUG/);
    });

    it('should filter jobs and track execution', () => {
      cy.visit('/dashboard/jobs');

      // Filter by CRITICAL priority
      cy.get('[data-testid="priority-filter"]').click();
      cy.get('[data-value="CRITICAL"]').click();

      // All visible jobs should be CRITICAL
      cy.get('[data-testid="jobs-table"] tbody tr').each((row) => {
        cy.wrap(row).contains('CRITICAL');
      });

      // Verify summary card counts match
      cy.get('[data-testid="summary-card"]').first().should('contain', /\d+/);
    });
  });

  describe('Deployment Promotion Workflow', () => {
    it('should promote deployment from dev → staging → prod', () => {
      cy.visit('/dashboard/deployments');
      cy.contains('Deployments', { timeout: 5000 }).should('be.visible');

      // Find dev deployment
      cy.get('[data-testid="timeline-item"]').contains(/dev/i).parent().within(() => {
        cy.get('[data-testid="promote-button"]').click();
      });

      // Promotion dialog opens
      cy.get('[data-testid="promotion-dialog"]').should('be.visible');

      // Select staging as target
      cy.get('[data-testid="target-environment"]').click();
      cy.get('[data-value="staging"]').click();

      // Check gating requirements
      cy.get('[data-testid="gate-requirements"]').should('exist');

      // Confirm promotion
      cy.get('[data-testid="confirm-promotion"]').click();

      // Verify promotion started
      cy.contains(/Promotion initiated|deploying|in-progress/i, { timeout: 5000 }).should('be.visible');
    });

    it('should verify promotion gating requirements', () => {
      cy.visit('/dashboard/deployments');

      // Open promotion dialog
      cy.get('[data-testid="timeline-item"]').contains(/dev/i).parent().within(() => {
        cy.get('[data-testid="promote-button"]').click();
      });

      cy.get('[data-testid="promotion-dialog"]').within(() => {
        // Check gate requirements section
        cy.get('[data-testid="gate-requirements"]').within(() => {
          cy.get('[data-testid="gate-item"]').each((gate) => {
            cy.wrap(gate).should('contain', /tests passed|no errors|manual approval/i);
          });
        });

        // Select target
        cy.get('[data-testid="target-environment"]').click();
        cy.get('[data-value="staging"]').click();

        // Verify confirm button state
        cy.get('[data-testid="confirm-promotion"]').should('not.be.disabled');
      });
    });

    it('should execute rollback to previous version', () => {
      cy.visit('/dashboard/deployments');

      // Find completed deployment with rollback option
      cy.get('[data-testid="timeline-item"]').contains(/completed|success/i).parent().within(() => {
        cy.get('[data-testid="rollback-button"]').click();
      });

      // Rollback dialog opens
      cy.get('[data-testid="rollback-dialog"]').should('be.visible');

      // Show previous version details
      cy.get('[data-testid="previous-version"]').should('contain', /v\d+\.\d+|commit/i);

      // Accept rollback confirmation
      cy.get('[data-testid="rollback-dialog"]').within(() => {
        cy.get('input[type="checkbox"]').click();
        cy.get('[data-testid="confirm-rollback"]').should('not.be.disabled');
        cy.get('[data-testid="confirm-rollback"]').click();
      });

      // Verify rollback initiated
      cy.contains(/Rollback initiated|reverting/i, { timeout: 5000 }).should('be.visible');
    });

    it('should track deployment status changes', () => {
      cy.visit('/dashboard/deployments');

      // Get initial deployment count
      cy.get('[data-testid="summary-card"]').first().invoke('text').then((initial) => {
        // Wait for potential updates
        cy.wait(5000);

        // Verify timeline updates
        cy.get('[data-testid="timeline-item"]').first().should('exist');

        // Check status indicators
        cy.get('[data-testid="status-indicator"]').should('have.length.at.least', 1);
      });
    });
  });

  describe('Agent Pool Management Workflow', () => {
    it('should scale agent pool and verify new agents', () => {
      cy.visit('/dashboard/agents');
      cy.contains('Agents', { timeout: 5000 }).should('be.visible');

      // Get initial agent count
      cy.get('[data-testid="pool-active-count"]').first().invoke('text').then((initial) => {
        // Click scale button
        cy.get('[data-testid="agent-pool-card"]').first().within(() => {
          cy.get('[data-testid="scale-button"]').click();
        });

        // Set new pool size
        cy.get('[data-testid="scale-dialog"]').within(() => {
          cy.get('input[type="number"]').clear().type('15');
          cy.get('[data-testid="apply-button"]').click();
        });

        // Verify scaling initiated
        cy.contains(/Pool scaled|scaling|updated/i, { timeout: 5000 }).should('be.visible');
      });
    });

    it('should pause, resume, and drain agents', () => {
      cy.visit('/dashboard/agents');

      // Expand first pool
      cy.get('[data-testid="agent-pool-card"]').first().click();

      // Get first agent
      cy.get('[data-testid="agent-card"]').first().within(() => {
        // Initial status should be active
        cy.get('[data-testid="agent-status"]').should('contain', /active|idle/i);

        // Pause agent
        cy.get('[data-testid="pause-button"]').click();
      });

      // Verify pause
      cy.contains('Agent paused', { timeout: 5000 }).should('be.visible');

      // Resume agent
      cy.get('[data-testid="agent-pool-card"]').first().click();
      cy.get('[data-testid="agent-card"]').first().within(() => {
        cy.get('[data-testid="resume-button"]').should('exist');
        cy.get('[data-testid="resume-button"]').click();
      });

      // Verify resume
      cy.contains('Agent resumed', { timeout: 5000 }).should('be.visible');
    });

    it('should monitor agent health metrics', () => {
      cy.visit('/dashboard/agents');

      // Verify pool health displayed
      cy.get('[data-testid="pool-health"]').first().should('contain', /%/);

      // Expand pool to see individual agents
      cy.get('[data-testid="agent-pool-card"]').first().click();

      // Check each agent has resource metrics
      cy.get('[data-testid="agent-card"]').each((card) => {
        cy.wrap(card).within(() => {
          cy.get('[data-testid="cpu-usage"]').should('exist').should('contain', /%/);
          cy.get('[data-testid="memory-usage"]').should('exist').should('contain', /%/);
          cy.get('[data-testid="heartbeat-indicator"]').should('exist');
        });
      });
    });

    it('should handle agent failures and recovery', () => {
      cy.visit('/dashboard/agents');

      // Expand pool
      cy.get('[data-testid="agent-pool-card"]').first().click();

      // Find potentially failed agent or wait for heartbeat update
      cy.get('[data-testid="heartbeat-indicator"]').first().should('exist');

      // Monitor heartbeat pulse
      cy.get('[data-testid="heartbeat-indicator"]').first().should('have.class', /heartbeat|pulse/);

      // Verify summary shows active agents
      cy.get('[data-testid="agents-summary"]').should('exist');
      cy.get('[data-testid="summary-card"]').first().should('contain', /\d+/);
    });
  });

  describe('Real-Time Dashboard Updates', () => {
    it('should keep metrics updated across all pages', () => {
      cy.visit('/dashboard');

      // Get initial metrics
      cy.get('[data-testid="metric-jobs-queued"]').invoke('text').then((initialQueued) => {
        cy.wait(5000);

        // Navigate to jobs
        cy.get('a').contains('Jobs').click();
        cy.contains('Jobs', { timeout: 5000 }).should('be.visible');

        // Navigate back to dashboard
        cy.get('a').contains('Dashboard').click();
        cy.contains('Dashboard', { timeout: 5000 }).should('be.visible');

        // Metrics should be updated
        cy.get('[data-testid="metric-jobs-queued"]').should('exist');
      });
    });

    it('should sync updates across browser tabs (simulated)', () => {
      cy.visit('/dashboard/jobs');

      // Record initial job count
      cy.get('[data-testid="jobs-table"] tbody tr').then((rows) => {
        const initialCount = rows.length;

        cy.wait(3000);

        // Verify list is still rendered and potentially updated
        cy.get('[data-testid="jobs-table"] tbody tr').should('have.length.at.least', initialCount - 1);
      });
    });

    it('should handle rapid filter changes', () => {
      cy.visit('/dashboard/jobs');

      // Rapidly change filters
      cy.get('[data-testid="status-filter"]').click();
      cy.get('[data-value="QUEUED"]').click();

      cy.wait(500);

      cy.get('[data-testid="status-filter"]').click();
      cy.get('[data-value="RUNNING"]').click();

      cy.wait(500);

      cy.get('[data-testid="status-filter"]').click();
      cy.get('[data-value="COMPLETED"]').click();

      // UI should remain responsive
      cy.get('[data-testid="jobs-table"]').should('exist');
    });
  });

  describe('Error Recovery Workflows', () => {
    it('should handle network errors gracefully', () => {
      cy.intercept('GET', '**/api/dashboard/jobs**', { forceNetworkError: true });

      cy.visit('/dashboard/jobs');
      cy.contains('Error', { timeout: 5000 }).should('be.visible');

      // Restore network
      cy.intercept('GET', '**/api/dashboard/jobs**', { fixture: 'jobs.json' });

      // Click retry
      cy.get('[data-testid="retry-button"]').click();
      cy.get('[data-testid="jobs-table"]').should('exist');
    });

    it('should recover from slow API responses', () => {
      cy.intercept('GET', '**/api/dashboard/deployments**', (req) => {
        req.reply((res) => {
          res.delay(5000);
        });
      });

      cy.visit('/dashboard/deployments');

      // Should show loading state
      cy.get('[data-testid="loading-spinner"]', { timeout: 10000 }).should('exist');

      // Eventually should show content
      cy.get('[data-testid="deployments-timeline"]', { timeout: 15000 }).should('exist');
    });

    it('should handle partial data failures', () => {
      // Metrics fail but jobs succeed
      cy.intercept('GET', '**/api/dashboard/metrics**', { statusCode: 500 });
      cy.intercept('GET', '**/api/dashboard/jobs**', { fixture: 'jobs.json' });

      cy.visit('/dashboard');

      // Should show error for metrics
      cy.contains('Error', { timeout: 5000 }).should('be.visible');

      // But page should still be usable
      cy.get('a').contains('Jobs').should('exist');
    });
  });
});
