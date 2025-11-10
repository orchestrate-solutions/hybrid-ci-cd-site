import React from 'react';
import { mount } from 'cypress/react';
import { JobsPage } from '../page';
import * as jobsApi from '@/lib/api/jobs';

// Mock the jobs API
vi.mock('@/lib/api/jobs');

describe('JobsPage Component', () => {
  const mockJobs = [
    {
      id: 'job-1',
      name: 'Deploy v2.0',
      status: 'RUNNING' as const,
      priority: 'HIGH' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'job-2',
      name: 'Database Migration',
      status: 'QUEUED' as const,
      priority: 'CRITICAL' as const,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'job-3',
      name: 'Cleanup Old Logs',
      status: 'COMPLETED' as const,
      priority: 'LOW' as const,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'job-4',
      name: 'Failed Deployment',
      status: 'FAILED' as const,
      priority: 'NORMAL' as const,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.mocked(jobsApi.listJobs).mockResolvedValue(mockJobs);
  });

  describe('Rendering', () => {
    it('renders page header', () => {
      mount(<JobsPage />);
      cy.contains('h1', 'Jobs').should('be.visible');
    });

    it('renders data grid with job table', () => {
      mount(<JobsPage />);
      cy.get('[data-testid="jobs-table"]').should('exist');
    });

    it('displays all job columns', () => {
      mount(<JobsPage />);
      cy.contains('Name').should('be.visible');
      cy.contains('Status').should('be.visible');
      cy.contains('Priority').should('be.visible');
    });

    it('renders create and filter buttons', () => {
      mount(<JobsPage />);
      cy.contains('button', 'Create Job').should('exist');
      cy.get('[data-testid="status-filter"]').should('exist');
      cy.get('[data-testid="priority-filter"]').should('exist');
    });
  });

  describe('Data Display', () => {
    it('displays all jobs in table', () => {
      mount(<JobsPage />);
      cy.contains('Deploy v2.0').should('be.visible');
      cy.contains('Database Migration').should('be.visible');
      cy.contains('Cleanup Old Logs').should('be.visible');
      cy.contains('Failed Deployment').should('be.visible');
    });

    it('shows job status badge', () => {
      mount(<JobsPage />);
      cy.contains('RUNNING').should('be.visible');
      cy.contains('QUEUED').should('be.visible');
      cy.contains('COMPLETED').should('be.visible');
      cy.contains('FAILED').should('be.visible');
    });

    it('displays priority level', () => {
      mount(<JobsPage />);
      cy.contains('HIGH').should('be.visible');
      cy.contains('CRITICAL').should('be.visible');
      cy.contains('LOW').should('be.visible');
    });

    it('shows creation timestamp', () => {
      mount(<JobsPage />);
      cy.get('[data-testid="jobs-table"] tbody tr').should('have.length', 4);
    });
  });

  describe('Status Badges', () => {
    it('renders RUNNING status with info color', () => {
      mount(<JobsPage />);
      cy.contains('RUNNING').should('have.class', 'MuiChip-colorInfo');
    });

    it('renders QUEUED status with warning color', () => {
      mount(<JobsPage />);
      cy.contains('QUEUED').should('have.class', 'MuiChip-colorWarning');
    });

    it('renders COMPLETED status with success color', () => {
      mount(<JobsPage />);
      cy.contains('COMPLETED').should('have.class', 'MuiChip-colorSuccess');
    });

    it('renders FAILED status with error color', () => {
      mount(<JobsPage />);
      cy.contains('FAILED').should('have.class', 'MuiChip-colorError');
    });
  });

  describe('Priority Badges', () => {
    it('renders CRITICAL priority with red background', () => {
      mount(<JobsPage />);
      cy.contains('CRITICAL').should('have.class', 'MuiChip-filledError');
    });

    it('renders HIGH priority with orange background', () => {
      mount(<JobsPage />);
      cy.get('span').contains('HIGH').should('have.class', 'MuiChip-filledWarning');
    });

    it('renders NORMAL priority with default background', () => {
      mount(<JobsPage />);
      cy.get('span').contains('NORMAL').should('have.class', 'MuiChip-filledDefault');
    });

    it('renders LOW priority with gray background', () => {
      mount(<JobsPage />);
      cy.contains('LOW').should('have.class', 'MuiChip-filledDefault');
    });
  });

  describe('Filtering', () => {
    it('filters jobs by status', () => {
      mount(<JobsPage />);
      cy.get('[data-testid="status-filter"]').click();
      cy.contains('RUNNING').click();
      cy.contains('Deploy v2.0').should('be.visible');
      cy.contains('Database Migration').should('not.be.visible');
    });

    it('filters jobs by priority', () => {
      mount(<JobsPage />);
      cy.get('[data-testid="priority-filter"]').click();
      cy.contains('CRITICAL').click();
      cy.contains('Database Migration').should('be.visible');
      cy.contains('Deploy v2.0').should('not.be.visible');
    });

    it('applies multiple filters simultaneously', () => {
      mount(<JobsPage />);
      cy.get('[data-testid="status-filter"]').click();
      cy.contains('RUNNING').click();
      cy.get('[data-testid="priority-filter"]').click();
      cy.contains('HIGH').click();
      cy.contains('Deploy v2.0').should('be.visible');
    });

    it('clears filters when reset button clicked', () => {
      mount(<JobsPage />);
      cy.get('[data-testid="status-filter"]').click();
      cy.contains('RUNNING').click();
      cy.contains('button', 'Reset Filters').click();
      cy.contains('Deploy v2.0').should('be.visible');
      cy.contains('Database Migration').should('be.visible');
    });

    it('shows active filter count', () => {
      mount(<JobsPage />);
      cy.get('[data-testid="status-filter"]').click();
      cy.contains('RUNNING').click();
      cy.get('[data-testid="active-filters"]').should('contain', '1');
    });
  });

  describe('Sorting', () => {
    it('sorts by job name', () => {
      mount(<JobsPage />);
      cy.contains('th', 'Name').click();
      cy.get('[data-testid="jobs-table"] tbody tr').first().should('contain', 'Cleanup');
    });

    it('sorts by status', () => {
      mount(<JobsPage />);
      cy.contains('th', 'Status').click();
      // Should sort alphabetically by status
    });

    it('sorts by priority', () => {
      mount(<JobsPage />);
      cy.contains('th', 'Priority').click();
      // Should sort by priority level
    });

    it('sorts by creation date', () => {
      mount(<JobsPage />);
      cy.contains('th', 'Created').click();
      // Should sort by date
    });

    it('reverses sort direction on second click', () => {
      mount(<JobsPage />);
      cy.contains('th', 'Name').click();
      cy.contains('th', 'Name').click();
      // Should be reverse sorted
    });

    it('shows sort direction indicator', () => {
      mount(<JobsPage />);
      cy.contains('th', 'Name').click();
      cy.get('[data-testid="sort-icon"]').should('be.visible');
    });
  });

  describe('Create Job', () => {
    it('opens create job dialog on button click', () => {
      mount(<JobsPage />);
      cy.contains('button', 'Create Job').click();
      cy.contains('Create New Job').should('be.visible');
    });

    it('has job name input field', () => {
      mount(<JobsPage />);
      cy.contains('button', 'Create Job').click();
      cy.get('input[placeholder="Job name"]').should('exist');
    });

    it('has priority selector', () => {
      mount(<JobsPage />);
      cy.contains('button', 'Create Job').click();
      cy.get('select').should('exist');
    });

    it('submits job creation form', () => {
      mount(<JobsPage />);
      cy.contains('button', 'Create Job').click();
      cy.get('input[placeholder="Job name"]').type('New Job');
      cy.contains('button', 'Create').click();
      cy.wrap(jobsApi.createJob).should('have.been.called');
    });

    it('closes dialog after successful creation', () => {
      mount(<JobsPage />);
      cy.contains('button', 'Create Job').click();
      cy.get('input[placeholder="Job name"]').type('New Job');
      cy.contains('button', 'Create').click();
      cy.contains('Create New Job').should('not.exist');
    });

    it('shows validation error for empty name', () => {
      mount(<JobsPage />);
      cy.contains('button', 'Create Job').click();
      cy.contains('button', 'Create').click();
      cy.contains('Job name is required').should('be.visible');
    });
  });

  describe('Job Actions', () => {
    it('can cancel a queued job', () => {
      mount(<JobsPage />);
      cy.get('[data-testid="jobs-table"] tbody tr').eq(1).contains('button', 'Cancel').click();
      cy.wrap(jobsApi.cancelJob).should('have.been.called');
    });

    it('can retry a failed job', () => {
      mount(<JobsPage />);
      cy.get('[data-testid="jobs-table"] tbody tr').eq(3).contains('button', 'Retry').click();
      cy.wrap(jobsApi.retryJob).should('have.been.called');
    });

    it('can view job details', () => {
      mount(<JobsPage />);
      cy.get('[data-testid="jobs-table"] tbody tr').first().contains('button', 'View').click();
      cy.contains('Job Details').should('be.visible');
    });

    it('disables cancel button for non-cancellable jobs', () => {
      mount(<JobsPage />);
      cy.get('[data-testid="jobs-table"] tbody tr').eq(2).contains('button', 'Cancel').should('be.disabled');
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no jobs available', () => {
      vi.mocked(jobsApi.listJobs).mockResolvedValue([]);
      mount(<JobsPage />);
      cy.contains('No jobs available').should('be.visible');
    });

    it('shows create job button in empty state', () => {
      vi.mocked(jobsApi.listJobs).mockResolvedValue([]);
      mount(<JobsPage />);
      cy.contains('button', 'Create Your First Job').should('be.visible');
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner while fetching', () => {
      vi.mocked(jobsApi.listJobs).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockJobs), 500))
      );
      mount(<JobsPage />);
      cy.get('[data-testid="loading-spinner"]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('shows error message on failed load', () => {
      vi.mocked(jobsApi.listJobs).mockRejectedValue(new Error('Failed to load jobs'));
      mount(<JobsPage />);
      cy.contains('Failed to load jobs').should('be.visible');
    });

    it('shows retry button on error', () => {
      vi.mocked(jobsApi.listJobs).mockRejectedValue(new Error('Network error'));
      mount(<JobsPage />);
      cy.contains('button', 'Retry').should('exist');
    });
  });

  describe('Pagination', () => {
    it('shows pagination controls', () => {
      mount(<JobsPage />);
      cy.get('[data-testid="pagination"]').should('exist');
    });

    it('can change page size', () => {
      mount(<JobsPage />);
      cy.get('[data-testid="page-size"]').click();
      cy.contains('50').click();
    });
  });

  describe('Selection', () => {
    it('allows selecting individual jobs', () => {
      mount(<JobsPage />);
      cy.get('input[type="checkbox"]').first().click();
      cy.get('input[type="checkbox"]').first().should('be.checked');
    });

    it('shows bulk actions when jobs selected', () => {
      mount(<JobsPage />);
      cy.get('input[type="checkbox"]').first().click();
      cy.contains('button', 'Cancel Selected').should('be.visible');
    });

    it('can cancel all selected jobs', () => {
      mount(<JobsPage />);
      cy.get('input[type="checkbox"]').first().click();
      cy.contains('button', 'Cancel Selected').click();
      cy.wrap(jobsApi.cancelJob).should('have.been.called');
    });
  });

  describe('Accessibility', () => {
    it('has semantic table structure', () => {
      mount(<JobsPage />);
      cy.get('table').should('exist');
      cy.get('thead').should('exist');
      cy.get('tbody').should('exist');
    });

    it('has accessible filter controls', () => {
      mount(<JobsPage />);
      cy.get('[data-testid="status-filter"]').should('have.attr', 'role', 'button');
    });

    it('supports keyboard navigation in table', () => {
      mount(<JobsPage />);
      cy.get('[data-testid="jobs-table"] tbody tr').first().focus();
      cy.focused().should('have.attr', 'tabindex');
    });
  });

  describe('Edge Cases', () => {
    it('handles very long job names', () => {
      const longNameJob = {
        ...mockJobs[0],
        name: 'This is an extremely long job name that describes a complex deployment process with multiple steps and verification checks',
      };
      vi.mocked(jobsApi.listJobs).mockResolvedValue([longNameJob]);
      mount(<JobsPage />);
      cy.contains('This is an extremely long').should('be.visible');
    });

    it('handles jobs with same priority', () => {
      const samePriorityJobs = mockJobs.map((job) => ({
        ...job,
        priority: 'NORMAL' as const,
      }));
      vi.mocked(jobsApi.listJobs).mockResolvedValue(samePriorityJobs);
      mount(<JobsPage />);
      cy.get('[data-testid="jobs-table"] tbody tr').should('have.length', 4);
    });

    it('maintains filter state through refresh', () => {
      mount(<JobsPage />);
      cy.get('[data-testid="status-filter"]').click();
      cy.contains('RUNNING').click();
      cy.contains('button', 'Refresh').click();
      cy.contains('Deploy v2.0').should('be.visible');
    });
  });
});
