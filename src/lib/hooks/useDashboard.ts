/**
 * useDashboard - Master hook for dashboard state management
 * 
 * Orchestrates jobs, agents, and deployments chains
 * Provides unified dashboard data interface with computed metrics
 * Returns: {jobs, agents, deployments, metrics, loading, error, refetch}
 */

import { useMemo, useCallback } from 'react';
import { useChain, UseChainResult } from './useChain';
import { JobsChain } from '@/lib/chains/jobs';
import { AgentsChain } from '@/lib/chains/agents';
import { DeploymentsChain } from '@/lib/chains/deployments';
import { dashboardApi } from '@/lib/api/dashboard';
import type { Job } from '@/lib/types/jobs';
import type { Agent } from '@/lib/types/agents';
import type { Deployment } from '@/lib/types/deployments';

export interface DashboardMetrics {
  totalJobs: number;
  runningJobs: number;
  completedJobs: number;
  failedJobs: number;
  queuedJobs: number;
  totalAgents: number;
  onlineAgents: number;
  busyAgents: number;
  offlineAgents: number;
  totalDeployments: number;
  completedDeployments: number;
  failedDeployments: number;
  inProgressDeployments: number;
  uptime?: number;
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
 * Compute dashboard metrics from data
 */
function computeMetrics(
  jobs: Job[],
  agents: Agent[],
  deployments: Deployment[]
): DashboardMetrics {
  // Job statistics
  const jobStats = {
    total: jobs.length,
    running: jobs.filter(j => j.status === 'RUNNING').length,
    completed: jobs.filter(j => j.status === 'COMPLETED').length,
    failed: jobs.filter(j => j.status === 'FAILED').length,
    queued: jobs.filter(j => j.status === 'QUEUED').length,
  };

  // Agent statistics
  const agentStats = {
    total: agents.length,
    online: agents.filter(a => a.status === 'ONLINE').length,
    busy: agents.filter(a => a.status === 'BUSY').length,
    offline: agents.filter(a => a.status === 'OFFLINE').length,
  };

  // Deployment statistics
  const deploymentStats = {
    total: deployments.length,
    completed: deployments.filter(d => d.status === 'COMPLETED').length,
    failed: deployments.filter(d => d.status === 'FAILED').length,
    inProgress: deployments.filter(d => d.status === 'IN_PROGRESS').length,
  };

  return {
    totalJobs: jobStats.total,
    runningJobs: jobStats.running,
    completedJobs: jobStats.completed,
    failedJobs: jobStats.failed,
    queuedJobs: jobStats.queued,
    totalAgents: agentStats.total,
    onlineAgents: agentStats.online,
    busyAgents: agentStats.busy,
    offlineAgents: agentStats.offline,
    totalDeployments: deploymentStats.total,
    completedDeployments: deploymentStats.completed,
    failedDeployments: deploymentStats.failed,
    inProgressDeployments: deploymentStats.inProgress,
  };
}

/**
 * Hook for fetching and managing complete dashboard state
 * 
 * ARCHITECTURE:
 * - Runs three parallel chains: JobsChain, AgentsChain, DeploymentsChain
 * - Computes metrics from live data
 * - Supports real-time polling via useRealTime integration
 * 
 * USAGE:
 * ```tsx
 * const { jobs, agents, deployments, metrics, loading, refetch } = useDashboard();
 * 
 * // Use real-time updates
 * useRealTime({
 *   onRefresh: refetch,
 *   enabled: true,
 * });
 * ```
 */
export function useDashboard(): UseDashboardResult {
  // Create chain instances (memoized)
  const jobsChain = useMemo(() => new JobsChain(true), []); // includeQueue: true
  const agentsChain = useMemo(() => new AgentsChain(true), []); // includePoolHealth: true
  const deploymentsChain = useMemo(() => new DeploymentsChain(false), []); // includeHistory: false for overview

  // Run all three chains in parallel
  const jobsResult = useChain(
    jobsChain,
    { filters: { status: 'ALL', priority: 'ALL' } },
    { autoRun: true, initialData: [] }
  );

  const agentsResult = useChain(
    agentsChain,
    { filters: { status: 'ALL' } },
    { autoRun: true, initialData: [] }
  );

  const deploymentsResult = useChain(
    deploymentsChain,
    { filters: { status: 'ALL', region: 'ALL' } },
    { autoRun: true, initialData: [] }
  );

  // Combine results
  const jobs = jobsResult.data || [];
  const agents = agentsResult.data || [];
  const deployments = deploymentsResult.data || [];

  // Compute metrics
  const metrics = useMemo(
    () => computeMetrics(jobs, agents, deployments),
    [jobs, agents, deployments]
  );

  // Combined loading/error state
  const loading =
    jobsResult.loading || agentsResult.loading || deploymentsResult.loading;
  const error =
    jobsResult.error || agentsResult.error || deploymentsResult.error;

  // Combined refetch function
  const refetch = useCallback(async () => {
    await Promise.all([
      jobsResult.refetch(),
      agentsResult.refetch(),
      deploymentsResult.refetch(),
    ]);
  }, [jobsResult, agentsResult, deploymentsResult]);

  const dashboardData: DashboardData = {
    jobs,
    agents,
    deployments,
    metrics,
  };

  return {
    jobs,
    agents,
    deployments,
    metrics,
    data: dashboardData,
    loading,
    error,
    refetch,
  };
}
