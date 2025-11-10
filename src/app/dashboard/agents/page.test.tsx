import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, beforeEach, vi, expect } from 'vitest';
import AgentsPage from './page';
import * as agentsApi from '@/lib/api/agents';

vi.mock('@/lib/api/agents', () => ({
  agentsApi: {
    listAgents: vi.fn(),
    pauseAgent: vi.fn(),
    resumeAgent: vi.fn(),
  },
}));

describe('AgentsPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders header', async () => {
    const mockListAgents = vi.mocked(agentsApi.listAgents);
    mockListAgents.mockResolvedValue({ agents: [], total: 0, limit: 50, offset: 0 });
    render(<AgentsPage />);
    await waitFor(() => expect(screen.getByText(/Agents/i)).toBeInTheDocument());
  });

  it('displays table', async () => {
    const mockListAgents = vi.mocked(agentsApi.listAgents);
    mockListAgents.mockResolvedValue({ agents: [], total: 0, limit: 50, offset: 0 });
    render(<AgentsPage />);
    await waitFor(() => expect(screen.getByTestId('agents-table')).toBeInTheDocument());
  });

  it('shows empty state', async () => {
    const mockListAgents = vi.mocked(agentsApi.listAgents);
    mockListAgents.mockResolvedValue({ agents: [], total: 0, limit: 50, offset: 0 });
    render(<AgentsPage />);
    await waitFor(() => expect(screen.getByText(/No agents/i)).toBeInTheDocument());
  });
});
