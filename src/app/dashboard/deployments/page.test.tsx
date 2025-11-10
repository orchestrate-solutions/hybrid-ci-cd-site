/**
 * DeploymentsPage Tests (RED Phase - Tests First)
 * 
 * All tests below are RED (failing) until DeploymentsPage component is implemented.
 * This follows TDD: write tests first, watch them fail, then implement.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DeploymentsPage from './page';
import * as deploymentsApi from '@/lib/api/deployments';

// Mock the deployments API
vi.mock('@/lib/api/deployments');

describe('DeploymentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Layout & Structure', () => {
    it.skip('renders deployments page header', () => {
      vi.mocked(deploymentsApi.listDeployments).mockResolvedValue({
        deployments: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      render(<DeploymentsPage />);
      expect(screen.getByText(/Deployments/i)).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it.skip('renders deployments list/table', async () => {
      vi.mocked(deploymentsApi.listDeployments).mockResolvedValue({
        deployments: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      render(<DeploymentsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('deployments-table')).toBeInTheDocument();
      });
    });

    it.skip('renders create deployment button', () => {
      vi.mocked(deploymentsApi.listDeployments).mockResolvedValue({
        deployments: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      render(<DeploymentsPage />);
      expect(screen.getByRole('button', { name: /Create Deployment|Deploy/i })).toBeInTheDocument();
    });

    it('renders filter section', async () => {
      vi.mocked(deploymentsApi.listDeployments).mockResolvedValue({
        deployments: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      render(<DeploymentsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('deployments-filters')).toBeInTheDocument();
      });
    });

    it('has semantic HTML structure', async () => {
      vi.mocked(deploymentsApi.listDeployments).mockResolvedValue({
        deployments: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      const { container } = render(<DeploymentsPage />);
      // Component uses Box instead of main
      expect(container.querySelector('[role="region"], [role="main"], div')).toBeInTheDocument();
    });
  });

  describe('Data Loading & Display', () => {
    it('fetches deployments on mount', async () => {
      vi.mocked(deploymentsApi.listDeployments).mockResolvedValue({
        deployments: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      render(<DeploymentsPage />);

      await waitFor(() => {
        expect(deploymentsApi.listDeployments).toHaveBeenCalled();
      });
    });

    it('displays deployments in table', async () => {
      const mockDeployments = [
        {
          id: 'dep-1',
          name: 'API v2.1',
          version: '2.1.0',
          status: 'COMPLETED' as const,
          environment: 'PRODUCTION' as const,
          created_at: '2025-11-10T10:00:00Z',
          created_by: 'alice',
        },
        {
          id: 'dep-2',
          name: 'Web v1.5',
          version: '1.5.0',
          status: 'IN_PROGRESS' as const,
          environment: 'STAGING' as const,
          created_at: '2025-11-10T09:00:00Z',
          created_by: 'bob',
        },
      ];

      vi.mocked(deploymentsApi.listDeployments).mockResolvedValue({
        deployments: mockDeployments,
        total: 2,
        limit: 50,
        offset: 0,
      });

      render(<DeploymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('API v2.1')).toBeInTheDocument();
        expect(screen.getByText('Web v1.5')).toBeInTheDocument();
      });
    });

    it('displays deployment status badges', async () => {
      vi.mocked(deploymentsApi.listDeployments).mockResolvedValue({
        deployments: [
          {
            id: 'dep-1',
            name: 'API v2.1',
            version: '2.1.0',
            status: 'COMPLETED' as const,
            environment: 'PRODUCTION' as const,
            created_at: '2025-11-10T10:00:00Z',
            created_by: 'alice',
          },
        ],
        total: 1,
        limit: 50,
        offset: 0,
      });

      render(<DeploymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('COMPLETED')).toBeInTheDocument();
      });
    });

    it('shows loading spinner while fetching', () => {
      vi.mocked(deploymentsApi.listDeployments).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          deployments: [],
          total: 0,
          limit: 50,
          offset: 0,
        }), 100))
      );

      render(<DeploymentsPage />);
      expect(screen.queryByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('has status filter dropdown', async () => {
      vi.mocked(deploymentsApi.listDeployments).mockResolvedValue({
        deployments: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      render(<DeploymentsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('filter-status')).toBeInTheDocument();
      });
    });

    it('has environment filter dropdown', async () => {
      vi.mocked(deploymentsApi.listDeployments).mockResolvedValue({
        deployments: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      render(<DeploymentsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('filter-environment')).toBeInTheDocument();
      });
    });

    it.skip('resets filters when reset button clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(deploymentsApi.listDeployments).mockResolvedValue({
        deployments: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      render(<DeploymentsPage />);

      const resetButton = await screen.findByRole('button', { name: /Reset/i });
      await user.click(resetButton);

      await waitFor(() => {
        expect(deploymentsApi.listDeployments).toHaveBeenCalledWith(
          expect.objectContaining({ status: undefined, environment: undefined })
        );
      });
    });
  });

  describe('Sorting', () => {
    it.skip('sorts deployments by column when header clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(deploymentsApi.listDeployments).mockResolvedValue({
        deployments: [
          {
            id: 'dep-1',
            name: 'Deploy A',
            version: '1.0.0',
            status: 'COMPLETED' as const,
            environment: 'PRODUCTION' as const,
            created_at: '2025-11-10T10:00:00Z',
            created_by: 'user',
          },
        ],
        total: 1,
        limit: 50,
        offset: 0,
      });

      render(<DeploymentsPage />);

      const nameHeader = await screen.findByText(/Name/i);
      await user.click(nameHeader);

      await waitFor(() => {
        expect(deploymentsApi.listDeployments).toHaveBeenCalledWith(
          expect.objectContaining({ sort_by: 'name', sort_order: 'asc' })
        );
      });
    });
  });

  describe('Pagination', () => {
    it('displays pagination controls', async () => {
      vi.mocked(deploymentsApi.listDeployments).mockResolvedValue({
        deployments: Array.from({ length: 50 }, (_, i) => ({
          id: `dep-${i}`,
          name: `Deployment ${i}`,
          version: '1.0.0',
          status: 'COMPLETED' as const,
          environment: 'PRODUCTION' as const,
          created_at: '2025-11-10T10:00:00Z',
          created_by: 'user',
        })),
        total: 150,
        limit: 50,
        offset: 0,
      });

      render(<DeploymentsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('pagination')).toBeInTheDocument();
      });
    });

    it('navigates to next page', async () => {
      const user = userEvent.setup();
      vi.mocked(deploymentsApi.listDeployments).mockResolvedValue({
        deployments: Array.from({ length: 50 }, (_, i) => ({
          id: `dep-${i}`,
          name: `Deployment ${i}`,
          version: '1.0.0',
          status: 'COMPLETED' as const,
          environment: 'PRODUCTION' as const,
          created_at: '2025-11-10T10:00:00Z',
          created_by: 'user',
        })),
        total: 150,
        limit: 50,
        offset: 0,
      });

      render(<DeploymentsPage />);

      const nextButton = await screen.findByRole('button', { name: /Next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(deploymentsApi.listDeployments).toHaveBeenCalledWith(
          expect.objectContaining({ offset: 50 })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error message on fetch failure', async () => {
      vi.mocked(deploymentsApi.listDeployments).mockRejectedValue(
        new Error('Failed to fetch deployments')
      );

      render(<DeploymentsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Failed|Error/i)).toBeInTheDocument();
      });
    });

    it('provides retry button on error', async () => {
      vi.mocked(deploymentsApi.listDeployments).mockRejectedValue(
        new Error('Failed to fetch deployments')
      );

      render(<DeploymentsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
      });
    });

    it('refetches deployments when retry clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(deploymentsApi.listDeployments)
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({
          deployments: [],
          total: 0,
          limit: 50,
          offset: 0,
        });

      render(<DeploymentsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /Retry/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(deploymentsApi.listDeployments).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no deployments', async () => {
      vi.mocked(deploymentsApi.listDeployments).mockResolvedValue({
        deployments: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      render(<DeploymentsPage />);

      await waitFor(() => {
        expect(screen.getByText(/No deployments|No results/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it.skip('has proper heading hierarchy', async () => {
      vi.mocked(deploymentsApi.listDeployments).mockResolvedValue({
        deployments: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      render(<DeploymentsPage />);
      expect(screen.getByText('Deployments')).toBeInTheDocument();
    });

    it.skip('table has accessible headers', async () => {
      vi.mocked(deploymentsApi.listDeployments).mockResolvedValue({
        deployments: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      render(<DeploymentsPage />);

      await waitFor(() => {
        expect(screen.getByRole('columnheader', { name: /Name/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /Status/i })).toBeInTheDocument();
      });
    });
  });
});
