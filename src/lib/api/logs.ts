/**
 * Logs API Client
 * Provides typed access to job logs
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface JobLogs {
  job_id: string;
  log_lines: string[];
  total_lines: number;
}

export interface LogsOptions {
  offset?: number;
  limit?: number;
}

/**
 * Fetch logs for a specific job
 * @param jobId - Job ID
 * @param options - Optional offset and limit for pagination
 * @returns Promise<JobLogs>
 */
async function getJobLogs(jobId: string, options?: LogsOptions): Promise<JobLogs> {
  const params = new URLSearchParams();
  if (options?.offset !== undefined) params.append('offset', options.offset.toString());
  if (options?.limit !== undefined) params.append('limit', options.limit.toString());

  const queryString = params.toString();
  const url = `${BASE_URL}/api/dashboard/jobs/${jobId}/logs${queryString ? `?${queryString}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch logs for job ${jobId}: ${res.status}`);
  }

  return res.json();
}

export const logsApi = {
  getJobLogs,
};
