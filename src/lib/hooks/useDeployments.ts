/**
 * useDeployments - Custom hook for deployments state management
 * 
 * Runs DeploymentsChain, provides deployments data with filtering/sorting/pagination
 * Returns: {deployments, loading, error, refetch}
 */

import { useMemo } from 'react';
import { useChain, UseChainResult } from './useChain';
import { DeploymentsChain } from '@/lib/chains/deployments';
import type { Deployment } from '@/lib/types/deployments';

export interface UseDeploymentsOptions {
  environment?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface UseDeploymentsResult extends UseChainResult<Deployment[]> {
  deployments: Deployment[];
}

/**
 * Hook for fetching and managing deployments
 */
export function useDeployments(options: UseDeploymentsOptions = {}): UseDeploymentsResult {
  const { environment, status, limit = 20, offset = 0 } = options;

  // Create chain instance (memoized)
  const deploymentsChain = useMemo(() => new DeploymentsChain(), []);

  // Prepare chain input
  const chainInput = useMemo(
    () => ({
      filters: {
        environment: environment || 'ALL',
        status: status || 'ALL',
      },
      pagination: {
        limit,
        offset,
      },
    }),
    [environment, status, limit, offset]
  );

  // Run chain
  const { data, loading, error, refetch } = useChain<Deployment[]>(
    deploymentsChain,
    chainInput,
    { autoRun: true, initialData: [] }
  );

  return {
    deployments: data || [],
    data: data || [],
    loading,
    error,
    refetch,
  };
}
