/**
 * useJobs - Custom hook for jobs state management
 * 
 * Runs JobsChain, provides jobs data with filtering/sorting/pagination
 * Returns: {jobs, loading, error, refetch}
 */

import { useMemo } from 'react';
import { useChain, UseChainResult } from './useChain';
import { JobsChain } from '@/lib/chains/jobs';
import type { Job } from '@/lib/types/jobs';

export interface UseJobsOptions {
  status?: string;
  priority?: string;
  limit?: number;
  offset?: number;
  search?: string;
}

export interface UseJobsResult extends UseChainResult<Job[]> {
  jobs: Job[];
}

/**
 * Hook for fetching and managing jobs
 */
export function useJobs(options: UseJobsOptions = {}): UseJobsResult {
  const { status, priority, limit = 20, offset = 0, search } = options;

  // Create chain instance (would be memoized in production)
  const jobsChain = useMemo(() => new JobsChain(), []);

  // Prepare chain input with filters
  const chainInput = useMemo(
    () => ({
      filters: {
        status: status || 'ALL',
        priority: priority || 'ALL',
      },
      pagination: {
        limit,
        offset,
      },
      search: search || '',
    }),
    [status, priority, limit, offset, search]
  );

  // Run chain
  const { data, loading, error, refetch } = useChain<Job[]>(
    jobsChain,
    chainInput,
    { autoRun: true, initialData: [] }
  );

  return {
    jobs: data || [],
    data: data || [],
    loading,
    error,
    refetch,
  };
}
