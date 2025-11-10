/**
 * Metrics API Client
 * 
 * Typed API client for dashboard metrics endpoint.
 * Used by DashboardPage and dashboard chains.
 */

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
 * Get overall dashboard metrics
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const res = await fetch(`${BASE_URL}/api/metrics/dashboard/`);
  if (!res.ok) {
    throw new Error(`Failed to fetch dashboard metrics: ${res.status}`);
  }
  return res.json();
}

/**
 * Get job timeline data for charts
 */
export async function getJobTimeline(limit = 100): Promise<JobTimeline[]> {
  const res = await fetch(`${BASE_URL}/api/metrics/jobs/timeline/?limit=${limit}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch job timeline: ${res.status}`);
  }
  const data = await res.json();
  return data.jobs || [];
}

/**
 * Get deployment metrics
 */
export async function getDeploymentMetrics(): Promise<DeploymentMetrics> {
  const res = await fetch(`${BASE_URL}/api/metrics/deployments/`);
  if (!res.ok) {
    throw new Error(`Failed to fetch deployment metrics: ${res.status}`);
  }
  return res.json();
}
