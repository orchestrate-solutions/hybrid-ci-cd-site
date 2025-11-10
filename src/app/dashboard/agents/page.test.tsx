/**
 * AgentsPage Tests (RED Phase)
 * 
 * All tests written BEFORE implementation.
 * These tests are intentionally failing to drive implementation via TDD.
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, beforeEach, vi, expect } from 'vitest';
import AgentsPage from './page';
import * as agentsApi from '@/lib/api/agents';

// Mock the API module
vi.mock('@/lib/api/agents');

// Mock router
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    pathname: '/dashboard/agents',
    query: {},
    asPath: '/dashboard/agents',
  }),
}));

describe('AgentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Layout & Structure', () => {
    it('renders agents page header', () => {
      vi.mocked(agentsApi.listAgents).mockResolvedValue({
        agents: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      render(<AgentsPage />);
      expect(screen.getByText(/Agents/i)).toBeInTheDocument();
    });

    it('renders agents list/table', async () => {
      vi.mocked(agentsApi.listAgents).mockResolvedValue({
        agents: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      render(<AgentsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('agents-table')).toBeInTheDocument();
      });
    });

    it('renders filter section', async () => {
      vi.mocked(agentsApi.listAgents).mockResolvedValue({
        agents: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      render(<AgentsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('agents-filters')).toBeInTheDocument();
      });
    });
  });

  describe('Data Loading & Display', () => {
    it('fetches agents on mount', async () => {
      vi.mocked(agentsApi.listAgents).mockResolvedValue({
        agents: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      render(<AgentsPage />);

      await waitFor(() => {
        expect(agentsApi.listAgents).toHaveBeenCalledWith(
          expect.objectContaining({ limit: 50, offset: 0 })
        );
      });
    });

    it('displays agents in table', async () => {
      vi.mocked(agentsApi.listAgents).mockResolvedValue({
        agents: [
          {
            id: 'agent-1',
            name: 'Agent 1',
            pool_id: 'pool-1',
            status: 'IDLE',
            version: '1.0.0',
            cpu_cores: 4,
            memory_gb: 8,
            disk_gb: 100,
            current_job_id: null,
            last_heartbeat: '2025-11-10T10:00:00Z',
            created_at: '2025-11-10T10:00:00Z',
            updated_at: '2025-11-10T10:00:00Z',
          },
        ],
        total: 1,
        limit: 50,
        offset: 0,
      });

      render(<AgentsPage />);

      await waitFor(() => {
        expect(screen.getByText('Agent 1')).toBeInTheDocument();
      });
    });

    it('displays agent status badges', async () => {
      vi.mocked(agentsApi.listAgents).mockResolvedValue({
        agents: [
          {
            id: 'agent-1',
            name: 'Agent 1',
            pool_id: 'pool-1',
            status: 'RUNNING',
            version: '1.0.0',
            cpu_cores: 4,
            memory_gb: 8,
            disk_gb: 100,
            current_job_id: 'job-1',
            last_heartbeat: '2025-11-10T10:00:00Z',
            created_at: '2025-11-10T10:00:00Z',
            updated_at: '2025-11-10T10:00:00Z',
          },
        ],
        total: 1,
        limit: 50,
        offset: 0,
      });

      render(<AgentsPage />);

      await waitFor(() => {
        expect(screen.getByText('RUNNING')).toBeInTheDocument();
      });
    });

    it('shows loading spinner while fetching', async () => {
      vi.mocked(agentsApi.listAgents).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  agents: [],
                  total: 0,
                  limit: 50,
                  offset: 0,
                }),
              100
            )
          )
      );

      render(<AgentsPage />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('has status filter dropdown', async () => {
      vi.mocked(agentsApi.listAgents).mockResolvedValue({
        agents: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      render(<AgentsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('filter-status')).toBeInTheDocument();
      });
    });

    it('filters by status', async () => {
      const user = userEvent.setup();
      vi.mocked(agentsApi.listAgents).mockResolvedValue({
        agents: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      render(<AgentsPage />);

      const statusFilter = await screen.findByTestId('filter-status');
      await user.click(statusFilter);

      const runningOption = await screen.findByRole('option', { name: /RUNNING/i });
      await user.click(runningOption);

      await waitFor(() => {
        expect(agentsApi.listAgents).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'RUNNING' })
        );
      });
    });
  });

  describe('Pagination', () => {
    it('displays pagination controls', async () => {
      vi.mocked(agentsApi.listAgents).mockResolvedValue({
        agents: Array.from({ length: 50 }, (_, i) => ({
          id: `agent-${i}`,
          name: `Agent ${i}`,
          pool_id: 'pool-1',
          status: 'IDLE' as const,
          version: '1.0.0',
          cpu_cores: 4,
          memory_gb: 8,
          disk_gb: 100,
          current_job_id: null,
          last_heartbeat: '2025-11-10T10:00:00Z',
          created_at: '2025-11-10T10:00:00Z',
          updated_at: '2025-11-10T10:00:00Z',
        })),
        total: 150,
        limit: 50,
        offset: 0,
      });

      render(<AgentsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('pagination')).toBeInTheDocument();
      });
    });

    it('navigates to next page', async () => {
      const user = userEvent.setup();
      vi.mocked(agentsApi.listAgents).mockResolvedValue({
        agents: Array.from({ length: 50 }, (_, i) => ({
          id: `agent-${i}`,
          name: `Agent ${i}`,
          pool_id: 'pool-1',
          status: 'IDLE' as const,
          version: '1.0.0',
          cpu_cores: 4,
          memory_gb: 8,
          disk_gb: 100,
          current_job_id: null,
          last_heartbeat: '2025-11-10T10:00:00Z',
          created_at: '2025-11-10T10:00:00Z',
          updated_at: '2025-11-10T10:00:00Z',
        })),
        total: 150,
        limit: 50,
        offset: 0,
      });

      render(<AgentsPage />);

      const nextButton = await screen.findByRole('button', { name: /Next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(agentsApi.listAgents).toHaveBeenCalledWith(
          expect.objectContaining({ offset: 50 })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error message on fetch failure', async () => {
      vi.mocked(agentsApi.listAgents).mockRejectedValue(new Error('Failed to fetch agents'));

      render(<AgentsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Error|Failed/i)).toBeInTheDocument();
      });
    });

    it('provides retry button on error', async () => {
      vi.mocked(agentsApi.listAgents).mockRejectedValue(new Error('Failed to fetch agents'));

      render(<AgentsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
      });
    });

    it('refetches agents when retry clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(agentsApi.listAgents)
        .mockRejectedValueOnce(new Error('Failed to fetch agents'))
        .mockResolvedValueOnce({
          agents: [],
          total: 0,
          limit: 50,
          offset: 0,
        });

      render(<AgentsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /Retry/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(agentsApi.listAgents).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no agents', async () => {
      vi.mocked(agentsApi.listAgents).mockResolvedValue({
        agents: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      render(<AgentsPage />);

      await waitFor(() => {
        expect(screen.getByText(/No agents|No results/i)).toBeInTheDocument();
      });
    });
  });

  describe('Agent Actions', () => {
    it('can pause agent', async () => {
      const user = userEvent.setup();
      vi.mocked(agentsApi.listAgents).mockResolvedValue({
        agents: [
          {
            id: 'agent-1',
            name: 'Agent 1',
            pool_id: 'pool-1',
            status: 'IDLE',
            version: '1.0.0',
            cpu_cores: 4,
            memory_gb: 8,
            disk_gb: 100,
            current_job_id: null,
            last_heartbeat: '2025-11-10T10:00:00Z',
            created_at: '2025-11-10T10:00:00Z',
            updated_at: '2025-11-10T10:00:00Z',
          },
        ],
        total: 1,
        limit: 50,
        offset: 0,
      });
      vi.mocked(agentsApi.pauseAgent).mockResolvedValue({
        id: 'agent-1',
        name: 'Agent 1',
        pool_id: 'pool-1',
        status: 'PAUSED',
        version: '1.0.0',
        cpu_cores: 4,
        memory_gb: 8,
        disk_gb: 100,
        current_job_id: null,
        last_heartbeat: '2025-11-10T10:00:00Z',
        created_at: '2025-11-10T10:00:00Z',
        updated_at: '2025-11-10T10:00:00Z',
      });

      render(<AgentsPage />);

      const pauseButton = await screen.findByRole('button', { name: /Pause/i });
      await user.click(pauseButton);

      await waitFor(() => {
        expect(agentsApi.pauseAgent).toHaveBeenCalledWith('agent-1');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', async () => {
      vi.mocked(agentsApi.listAgents).mockResolvedValue({
        agents: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      render(<AgentsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Agents/i)).toBeInTheDocument();
      });
    });
  });
});
