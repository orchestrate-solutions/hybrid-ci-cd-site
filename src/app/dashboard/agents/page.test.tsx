import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, beforeEach, vi, expect } from 'vitest';
import AgentsPage from './page';
import * as agentsApi from '@/lib/api/agents';

vi.mock('@/lib/api/agents', () => ({
  listAgents: vi.fn(),
  pauseAgent: vi.fn(),
  resumeAgent: vi.fn(),
}));

describe('AgentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header', async () => {
    vi.mocked(agentsApi.listAgents).mockResolvedValue({
      agents: [],
      total: 0,
      limit: 50,
      offset: 0,
    });
    render(<AgentsPage />);
    await waitFor(() => 
      expect(screen.getByRole('heading', { level: 4, name: /Agents/i })).toBeInTheDocument()
    );
  });

  it('displays table', async () => {
    vi.mocked(agentsApi.listAgents).mockResolvedValue({
      agents: [
        {
          id: 'agent-1',
          name: 'Build Agent',
          pool_id: 'pool-1',
          status: 'IDLE' as const,
          version: '1.5.2',
          cpu_cores: 4,
          memory_gb: 8,
          disk_gb: 250,
          current_job_id: null,
          last_heartbeat: '2025-11-10T10:00:00Z',
          created_at: '2025-10-15T08:00:00Z',
          updated_at: '2025-11-10T10:00:00Z',
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
    });
    render(<AgentsPage />);
    await waitFor(() => 
      expect(screen.getByTestId('agents-table')).toBeInTheDocument()
    );
  });

  it('shows empty state', async () => {
    vi.mocked(agentsApi.listAgents).mockResolvedValue({
      agents: [],
      total: 0,
      limit: 50,
      offset: 0,
    });
    render(<AgentsPage />);
    await waitFor(() => 
      expect(screen.getByText(/No agents found/i)).toBeInTheDocument()
    );
  });
});
