/**
 * useChain Hook - Base hook for running CodeUChain chains in React components
 * Handles loading, error states, and data caching
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { FilterOptions, SortOptions } from './types';

export interface UseChainState<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  refetch: (filters?: FilterOptions, sort?: SortOptions) => Promise<void>;
}

/**
 * Generic hook for running chains
 * @param chainExecutor - Async function that executes the chain (e.g., chain.execute())
 * @param initialFilters - Initial filter options
 * @param initialSort - Initial sort options
 */
export function useChain<T>(
  chainExecutor: (filters?: FilterOptions, sort?: SortOptions) => Promise<T[]>,
  initialFilters?: FilterOptions,
  initialSort?: SortOptions
): UseChainState<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<FilterOptions | undefined>(initialFilters);
  const [sort, setSort] = useState<SortOptions | undefined>(initialSort);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Execute chain
  const execute = useCallback(async (newFilters?: FilterOptions, newSort?: SortOptions) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const result = await chainExecutor(newFilters, newSort);
      // Check if request was aborted
      if (!abortControllerRef.current.signal.aborted) {
        setData(result);
      }
    } catch (err) {
      if (!abortControllerRef.current.signal.aborted) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        setData([]);
      }
    } finally {
      setLoading(false);
    }
  }, [chainExecutor]);

  // Run on mount or when filters/sort change
  useEffect(() => {
    execute(filters, sort);
  }, [execute, filters, sort]);

  // Refetch with new filters/sort
  const refetch = useCallback(
    async (newFilters?: FilterOptions, newSort?: SortOptions) => {
      if (newFilters !== undefined) setFilters(newFilters);
      if (newSort !== undefined) setSort(newSort);
      await execute(newFilters ?? filters, newSort ?? sort);
    },
    [execute, filters, sort]
  );

  return {
    data,
    loading,
    error,
    refetch,
  };
}

/**
 * useJobs Hook - Fetch and manage jobs
 */
export function useJobs(initialFilters?: FilterOptions, initialSort?: SortOptions) {
  const { JobsChain } = require('./jobs');
  const chain = new JobsChain();

  return useChain(
    (filters, sort) => chain.execute(filters, sort),
    initialFilters,
    initialSort
  );
}

/**
 * useDeployments Hook - Fetch and manage deployments
 */
export function useDeployments(initialFilters?: FilterOptions, initialSort?: SortOptions) {
  const { DeploymentsChain } = require('./deployments');
  const chain = new DeploymentsChain();

  return useChain(
    (filters, sort) => chain.execute(filters, sort),
    initialFilters,
    initialSort
  );
}

/**
 * useAgents Hook - Fetch and manage agents
 */
export function useAgents(initialFilters?: FilterOptions, initialSort?: SortOptions) {
  const { AgentsChain } = require('./agents');
  const chain = new AgentsChain();

  return useChain(
    (filters, sort) => chain.execute(filters, sort),
    initialFilters,
    initialSort
  );
}
