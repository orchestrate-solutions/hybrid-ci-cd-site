/**
 * Metrics API Client
 * 
 * Typed API client for dashboard metrics endpoint.
 * Used by DashboardPage and dashboard chains.
 */

import { getDemoMetrics } from '../mocks/demo-data';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface DashboardMetrics {
  jobs_running: number;
  jobs_failed_today: number;
  deployments_today: number;
  queue_depth: number;
  average_wait_time_seconds: number;
}

export interface JobTimeline {
  timestamp: string;
  job_id: string;
  status: string;
  duration_seconds?: number;
}

export interface DeploymentMetrics {
  total_deployments: number;
  successful_deployments: number;
  failed_deployments: number;
  average_deployment_time_seconds: number;
}

/**
 * Check if demo mode is enabled in localStorage
 */
function isDemoModeEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const prefs = localStorage.getItem('hybrid-prefs');
    if (!prefs) return false;
    const parsed = JSON.parse(prefs);
    return parsed.demoMode === true;
  } catch {
    return false;
  }
}

/**
 * Get overall dashboard metrics
 * Calls /api/dashboard/summary which provides aggregated metrics
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  // Check demo mode first
  if (isDemoModeEnabled()) {
    return getDemoMetrics();
  }

  const res = await fetch(`${BASE_URL}/api/dashboard/summary`);
  if (!res.ok) {
    throw new Error(`Failed to fetch dashboard metrics: ${res.status}`);
  }
  const data = await res.json();
  return data.metrics || data;
}

/**
 * Get job timeline data for charts
 * Calls /api/dashboard/jobs with limit for timeline
 */
export async function getJobTimeline(limit = 100): Promise<JobTimeline[]> {
  const res = await fetch(`${BASE_URL}/api/dashboard/jobs?limit=${limit}&status=COMPLETED,FAILED`);
  if (!res.ok) {
    throw new Error(`Failed to fetch job timeline: ${res.status}`);
  }
  const data = await res.json();
  return (data.jobs || []).map((job: any) => ({
    timestamp: job.completed_at || job.created_at,
    job_id: job.id,
    status: job.status,
    duration_seconds: job.duration_seconds,
  }));
}

/**
 * Get deployment metrics
 * Calls /api/dashboard/deployments to extract metrics
 */
export async function getDeploymentMetrics(): Promise<DeploymentMetrics> {
  const res = await fetch(`${BASE_URL}/api/dashboard/deployments`);
  if (!res.ok) {
    throw new Error(`Failed to fetch deployment metrics: ${res.status}`);
  }
  const data = await res.json();
  const deployments = data.deployments || [];
  
  const successful = deployments.filter((d: any) => d.status === 'COMPLETED').length;
  const failed = deployments.filter((d: any) => d.status === 'FAILED').length;
  const avgTime = deployments.length > 0
    ? deployments.reduce((sum: number, d: any) => sum + (d.duration_seconds || 0), 0) / deployments.length
    : 0;

  return {
    total_deployments: deployments.length,
    successful_deployments: successful,
    failed_deployments: failed,
    average_deployment_time_seconds: avgTime,
  };
}
