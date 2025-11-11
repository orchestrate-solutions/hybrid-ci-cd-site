/**
 * Dashboard API Client
 * Provides typed access to dashboard summary metrics
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface DashboardSummary {
  jobs_running: number;
  jobs_failed_today: number;
  deployments_today: number;
  agents_healthy: number;
  agents_total: number;
}

/**
 * Fetch dashboard summary metrics
 * @returns Promise<DashboardSummary>
 */
async function getSummary(): Promise<DashboardSummary> {
  const res = await fetch(`${BASE_URL}/api/dashboard/summary`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch dashboard summary: ${res.status}`);
  }

  return res.json();
}

export const dashboardApi = {
  getSummary,
};
