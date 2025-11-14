/**
 * useDashboard - Master hook for dashboard state management
 * 
 * Orchestrates jobs, agents, and deployments chains
 * Provides unified dashboard data interface with computed metrics
 * 
 * IMPORTANT: Chains return full context objects, not arrays!
 * - JobsChain.run() returns {jobs, filtered_jobs, jobs_sorted, ...}
 * - AgentsChain.run() returns {agents, agents_filtered, agents_sorted, ...}
 * - DeploymentsChain.run() returns {deployments, deployments_filtered, deployments_sorted, ...}
 * 
 * Must extract the _sorted key from each result.
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
  // Ensure we have arrays (chains return full context, need to extract)
  const jobsArray = Array.isArray(jobs) ? jobs : [];
  const agentsArray = Array.isArray(agents) ? agents : [];
  const deploymentsArray = Array.isArray(deployments) ? deployments : [];

  // Job statistics
  const jobStats = {
    total: jobsArray.length,
    running: jobsArray.filter(j => j.status === 'RUNNING').length,
    completed: jobsArray.filter(j => j.status === 'COMPLETED').length,
    failed: jobsArray.filter(j => j.status === 'FAILED').length,
    queued: jobsArray.filter(j => j.status === 'QUEUED').length,
  };

  // Agent statistics
  const agentStats = {
    total: agentsArray.length,
    online: agentsArray.filter(a => a.status === 'ONLINE').length,
    busy: agentsArray.filter(a => a.status === 'BUSY').length,
    offline: agentsArray.filter(a => a.status === 'OFFLINE').length,
  };

  // Deployment statistics
  const deploymentStats = {
    total: deploymentsArray.length,
    completed: deploymentsArray.filter(d => d.status === 'COMPLETED').length,
    failed: deploymentsArray.filter(d => d.status === 'FAILED').length,
    inProgress: deploymentsArray.filter(d => d.status === 'IN_PROGRESS').length,
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
 * - Extracts _sorted data from each chain's context result
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
    { autoRun: true, initialData: {} }
  );

  const agentsResult = useChain(
    agentsChain,
    { filters: { status: 'ALL' } },
    { autoRun: true, initialData: {} }
  );

  const deploymentsResult = useChain(
    deploymentsChain,
    { filters: { status: 'ALL', region: 'ALL' } },
    { autoRun: true, initialData: {} }
  );

  // Extract the _sorted arrays from chain context results
  // Chains return full context {jobs, filtered_jobs, jobs_sorted, ...}
  // We need the _sorted key which has final filtered+sorted data
  const jobs = (jobsResult.data?.jobs_sorted || []) as Job[];
  const agents = (agentsResult.data?.agents_sorted || []) as Agent[];
  const deployments = (deploymentsResult.data?.deployments_sorted || []) as Deployment[];

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
