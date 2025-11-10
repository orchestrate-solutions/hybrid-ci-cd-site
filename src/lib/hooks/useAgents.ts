/**
 * useAgents - Custom hook for agents state management
 * 
 * Runs AgentsChain, provides agents data with filtering/pagination
 * Returns: {agents, loading, error, refetch}
 */

import { useMemo } from 'react';
import { useChain, UseChainResult } from './useChain';
import { AgentsChain } from '@/lib/chains/agents';
import type { Agent } from '@/lib/types/agents';

export interface UseAgentsOptions {
  status?: string;
  limit?: number;
  offset?: number;
}

export interface UseAgentsResult extends UseChainResult<Agent[]> {
  agents: Agent[];
}

/**
 * Hook for fetching and managing agents
 */
export function useAgents(options: UseAgentsOptions = {}): UseAgentsResult {
  const { status, limit = 20, offset = 0 } = options;

  // Create chain instance (memoized)
  const agentsChain = useMemo(() => new AgentsChain(), []);

  // Prepare chain input
  const chainInput = useMemo(
    () => ({
      filters: {
        status: status || 'ALL',
      },
      pagination: {
        limit,
        offset,
      },
    }),
    [status, limit, offset]
  );

  // Run chain
  const { data, loading, error, refetch } = useChain<Agent[]>(
    agentsChain,
    chainInput,
    { autoRun: true, initialData: [] }
  );

  return {
    agents: data || [],
    data: data || [],
    loading,
    error,
    refetch,
  };
}
