/**
 * useDashboard - Master hook for dashboard state management
 * 
 * Orchestrates jobs, agents, and deployments chains
 * Provides unified dashboard data interface
 * Returns: {jobs, agents, deployments, metrics, loading, error, refetch}
 */

import { useMemo } from 'react';
import { useChain, UseChainResult } from './useChain';
import { DashboardChain } from '@/lib/chains/dashboard';
import type { Job } from '@/lib/types/jobs';
import type { Agent } from '@/lib/types/agents';
import type { Deployment } from '@/lib/types/deployments';

export interface DashboardMetrics {
  totalJobs: number;
  runningJobs: number;
  failedJobs: number;
  totalAgents: number;
  activeAgents: number;
  totalDeployments: number;
  activeDeployments: number;
}

export interface DashboardData {
  jobs: Job[];
  agents: Agent[];
  deployments: Deployment[];
  metrics: DashboardMetrics;
}

export interface UseDashboardResult extends UseChainResult<DashboardData> {
  jobs: Job[];
  agents: Agent[];
  deployments: Deployment[];
  metrics: DashboardMetrics;
}

/**
 * Hook for fetching and managing complete dashboard state
 */
export function useDashboard(): UseDashboardResult {
  // Create chain instance (memoized)
  const dashboardChain = useMemo(() => new DashboardChain(), []);

  // Prepare chain input
  const chainInput = useMemo(
    () => ({
      filters: {
        jobs: { status: 'ALL' },
        agents: { status: 'ALL' },
        deployments: { status: 'ALL' },
      },
    }),
    []
  );

  // Run chain
  const { data, loading, error, refetch } = useChain<DashboardData>(
    dashboardChain,
    chainInput,
    {
      autoRun: true,
      initialData: {
        jobs: [],
        agents: [],
        deployments: [],
        metrics: {
          totalJobs: 0,
          runningJobs: 0,
          failedJobs: 0,
          totalAgents: 0,
          activeAgents: 0,
          totalDeployments: 0,
          activeDeployments: 0,
        },
      },
    }
  );

  const dashboardData = data || {
    jobs: [],
    agents: [],
    deployments: [],
    metrics: {
      totalJobs: 0,
      runningJobs: 0,
      failedJobs: 0,
      totalAgents: 0,
      activeAgents: 0,
      totalDeployments: 0,
      activeDeployments: 0,
    },
  };

  return {
    jobs: dashboardData.jobs,
    agents: dashboardData.agents,
    deployments: dashboardData.deployments,
    metrics: dashboardData.metrics,
    data: dashboardData,
    loading,
    error,
    refetch,
  };
}
