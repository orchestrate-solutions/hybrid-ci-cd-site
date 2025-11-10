/**
 * JobsPage Tests (RED Phase - Tests First)
 * 
 * All tests below are RED (failing) until JobsPage component is implemented.
 * This follows TDD: write tests first, watch them fail, then implement.
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import JobsPage from './page';
import * as jobsApi from '@/lib/api/jobs';

// Mock the jobs API
vi.mock('@/lib/api/jobs');

describe('JobsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Layout & Structure', () => {
    it('renders jobs page header', () => {
      vi.mocked(jobsApi.listJobs).mockResolvedValue({
        jobs: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      render(<JobsPage />);
      expect(screen.getByText(/Jobs/i)).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('renders jobs data grid/table', async () => {
      vi.mocked(jobsApi.listJobs).mockResolvedValue({
        jobs: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      render(<JobsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('jobs-table')).toBeInTheDocument();
      });
    });

    it('renders create job button', () => {
      vi.mocked(jobsApi.listJobs).mockResolvedValue({
        jobs: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      render(<JobsPage />);
      expect(screen.getByRole('button', { name: /Create Job/i })).toBeInTheDocument();
    });

    it('renders filter section', async () => {
      vi.mocked(jobsApi.listJobs).mockResolvedValue({
        jobs: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      render(<JobsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('jobs-filters')).toBeInTheDocument();
      });
    });

    it('has semantic HTML structure', () => {
      vi.mocked(jobsApi.listJobs).mockResolvedValue({
        jobs: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      const { container } = render(<JobsPage />);
      expect(container.querySelector('main')).toBeInTheDocument();
    });
  });

  describe('Data Loading & Display', () => {
    it('fetches jobs on mount', async () => {
      vi.mocked(jobsApi.listJobs).mockResolvedValue({
        jobs: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      render(<JobsPage />);

      await waitFor(() => {
        expect(jobsApi.listJobs).toHaveBeenCalled();
      });
    });

    it('displays jobs in table rows', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          name: 'Deploy v2.0',
          status: 'RUNNING' as const,
          created_at: '2025-11-10T10:00:00Z',
          priority: 'HIGH' as const,
        },
        {
          id: 'job-2',
          name: 'Rollback v1.9',
          status: 'COMPLETED' as const,
          created_at: '2025-11-10T09:00:00Z',
          priority: 'NORMAL' as const,
        },
      ];

      vi.mocked(jobsApi.listJobs).mockResolvedValue({
        jobs: mockJobs,
        total: 2,
        limit: 50,
        offset: 0,
      });

      render(<JobsPage />);

      await waitFor(() => {
        expect(screen.getByText('Deploy v2.0')).toBeInTheDocument();
        expect(screen.getByText('Rollback v1.9')).toBeInTheDocument();
      });
    });

    it('displays job status badges', async () => {
      vi.mocked(jobsApi.listJobs).mockResolvedValue({
        jobs: [
          {
            id: 'job-1',
            name: 'Deploy',
            status: 'RUNNING' as const,
            created_at: '2025-11-10T10:00:00Z',
            priority: 'HIGH' as const,
          },
        ],
        total: 1,
        limit: 50,
        offset: 0,
      });

      render(<JobsPage />);

      await waitFor(() => {
        expect(screen.getByText('RUNNING')).toBeInTheDocument();
      });
    });

    it('shows loading spinner while fetching', () => {
      vi.mocked(jobsApi.listJobs).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          jobs: [],
          total: 0,
          limit: 50,
          offset: 0,
        }), 100))
      );

      render(<JobsPage />);
      expect(screen.queryByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('has status filter dropdown', async () => {
      vi.mocked(jobsApi.listJobs).mockResolvedValue({
        jobs: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      render(<JobsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('filter-status')).toBeInTheDocument();
      });
    });

    it('has priority filter dropdown', async () => {
      vi.mocked(jobsApi.listJobs).mockResolvedValue({
        jobs: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      render(<JobsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('filter-priority')).toBeInTheDocument();
      });
    });

    it('filters jobs by status when filter changes', async () => {
      const user = userEvent.setup();
      vi.mocked(jobsApi.listJobs).mockResolvedValue({
        jobs: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      render(<JobsPage />);

      const statusFilter = await screen.findByTestId('filter-status');
      await user.click(statusFilter);
      await user.click(screen.getByRole('option', { name: /RUNNING/i }));

      await waitFor(() => {
        expect(jobsApi.listJobs).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'RUNNING' })
        );
      });
    });

    it('filters jobs by priority when filter changes', async () => {
      const user = userEvent.setup();
      vi.mocked(jobsApi.listJobs).mockResolvedValue({
        jobs: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      render(<JobsPage />);

      const priorityFilter = await screen.findByTestId('filter-priority');
      await user.click(priorityFilter);
      await user.click(screen.getByRole('option', { name: /HIGH/i }));

      await waitFor(() => {
        expect(jobsApi.listJobs).toHaveBeenCalledWith(
          expect.objectContaining({ priority: 'HIGH' })
        );
      });
    });

    it('resets filters when reset button clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(jobsApi.listJobs).mockResolvedValue({
        jobs: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      render(<JobsPage />);

      const resetButton = await screen.findByRole('button', { name: /Reset/i });
      await user.click(resetButton);

      await waitFor(() => {
        expect(jobsApi.listJobs).toHaveBeenCalledWith(
          expect.objectContaining({ status: undefined, priority: undefined })
        );
      });
    });
  });

  describe('Sorting', () => {
    it('sorts jobs by column when column header clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(jobsApi.listJobs).mockResolvedValue({
        jobs: [
          {
            id: 'job-1',
            name: 'Deploy',
            status: 'RUNNING' as const,
            created_at: '2025-11-10T10:00:00Z',
            priority: 'HIGH' as const,
          },
        ],
        total: 1,
        limit: 50,
        offset: 0,
      });

      render(<JobsPage />);

      const createdHeader = await screen.findByText(/Created/i);
      await user.click(createdHeader);

      await waitFor(() => {
        expect(jobsApi.listJobs).toHaveBeenCalledWith(
          expect.objectContaining({ sort_by: 'created_at', sort_order: 'asc' })
        );
      });
    });

    it('reverses sort order on second click', async () => {
      const user = userEvent.setup();
      vi.mocked(jobsApi.listJobs).mockResolvedValue({
        jobs: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      render(<JobsPage />);

      const createdHeader = await screen.findByText(/Created/i);
      await user.click(createdHeader);
      await user.click(createdHeader);

      await waitFor(() => {
        expect(jobsApi.listJobs).toHaveBeenLastCalledWith(
          expect.objectContaining({ sort_by: 'created_at', sort_order: 'desc' })
        );
      });
    });
  });

  describe('Pagination', () => {
    it('displays pagination controls', async () => {
      vi.mocked(jobsApi.listJobs).mockResolvedValue({
        jobs: Array.from({ length: 50 }, (_, i) => ({
          id: `job-${i}`,
          name: `Job ${i}`,
          status: 'COMPLETED' as const,
          created_at: '2025-11-10T10:00:00Z',
          priority: 'NORMAL' as const,
        })),
        total: 150,
        limit: 50,
        offset: 0,
      });

      render(<JobsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('pagination')).toBeInTheDocument();
      });
    });

    it('displays correct page info', async () => {
      vi.mocked(jobsApi.listJobs).mockResolvedValue({
        jobs: Array.from({ length: 50 }, (_, i) => ({
          id: `job-${i}`,
          name: `Job ${i}`,
          status: 'COMPLETED' as const,
          created_at: '2025-11-10T10:00:00Z',
          priority: 'NORMAL' as const,
        })),
        total: 150,
        limit: 50,
        offset: 0,
      });

      render(<JobsPage />);

      await waitFor(() => {
        expect(screen.getByText(/1.*50.*of.*150/i)).toBeInTheDocument();
      });
    });

    it('navigates to next page when next button clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(jobsApi.listJobs).mockResolvedValue({
        jobs: Array.from({ length: 50 }, (_, i) => ({
          id: `job-${i}`,
          name: `Job ${i}`,
          status: 'COMPLETED' as const,
          created_at: '2025-11-10T10:00:00Z',
          priority: 'NORMAL' as const,
        })),
        total: 150,
        limit: 50,
        offset: 0,
      });

      render(<JobsPage />);

      const nextButton = await screen.findByRole('button', { name: /Next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(jobsApi.listJobs).toHaveBeenCalledWith(
          expect.objectContaining({ offset: 50 })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error message on fetch failure', async () => {
      vi.mocked(jobsApi.listJobs).mockRejectedValue(
        new Error('Failed to fetch jobs')
      );

      render(<JobsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch|Error/i)).toBeInTheDocument();
      });
    });

    it('provides retry button on error', async () => {
      vi.mocked(jobsApi.listJobs).mockRejectedValue(
        new Error('Failed to fetch jobs')
      );

      render(<JobsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry|Try Again/i })).toBeInTheDocument();
      });
    });

    it('refetches jobs when retry button clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(jobsApi.listJobs)
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({
          jobs: [],
          total: 0,
          limit: 50,
          offset: 0,
        });

      render(<JobsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry|Try Again/i })).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /Retry|Try Again/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(jobsApi.listJobs).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Empty State', () => {
    it('shows empty state message when no jobs exist', async () => {
      vi.mocked(jobsApi.listJobs).mockResolvedValue({
        jobs: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      render(<JobsPage />);

      await waitFor(() => {
        expect(screen.getByText(/No jobs|No results/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', async () => {
      vi.mocked(jobsApi.listJobs).mockResolvedValue({
        jobs: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      const { container } = render(<JobsPage />);
      const h1 = container.querySelector('h1');
      expect(h1).toBeInTheDocument();
    });

    it('table has accessible headers', async () => {
      vi.mocked(jobsApi.listJobs).mockResolvedValue({
        jobs: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      render(<JobsPage />);

      await waitFor(() => {
        expect(screen.getByRole('columnheader', { name: /Name/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /Status/i })).toBeInTheDocument();
      });
    });
  });
});
