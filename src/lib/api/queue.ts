/**
 * Queue API Client
 * 
 * Typed API client for job queue endpoints.
 * Supports job enqueuing, claiming, and lifecycle management.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface QueuedJob {
  id: string;
  name: string;
  status: 'QUEUED' | 'CLAIMED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
  created_at: string;
  claimed_at?: string;
  started_at?: string;
  completed_at?: string;
  agent_id?: string;
  error?: string;
}

export interface QueueStats {
  total_jobs: number;
  queued_jobs: number;
  running_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  average_wait_time_seconds: number;
  average_execution_time_seconds: number;
}

export interface ClaimJobResponse {
  job: QueuedJob;
  lease_expires_at: string;
}

export interface ListQueuedJobsResponse {
  jobs: QueuedJob[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Enqueue a new job
 */
export async function enqueueJob(data: {
  name: string;
  priority?: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
  config?: Record<string, unknown>;
  tags?: string[];
}): Promise<QueuedJob> {
  const res = await fetch(`${BASE_URL}/api/queue/enqueue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to enqueue job: ${res.status}`);
  return res.json();
}

/**
 * Claim a job from the queue (agent operation)
 * Returns job + lease expiration time
 */
export async function claimJob(agentId: string): Promise<ClaimJobResponse> {
  const res = await fetch(`${BASE_URL}/api/queue/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agent_id: agentId }),
  });
  if (!res.ok) throw new Error(`Failed to claim job: ${res.status}`);
  return res.json();
}

/**
 * Mark a job as started (agent operation)
 */
export async function startJob(jobId: string, agentId: string): Promise<QueuedJob> {
  const res = await fetch(`${BASE_URL}/api/queue/jobs/${jobId}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agent_id: agentId }),
  });
  if (!res.ok) throw new Error(`Failed to start job: ${res.status}`);
  return res.json();
}

/**
 * Mark a job as completed (agent operation)
 */
export async function completeJob(
  jobId: string,
  agentId: string,
  data?: {
    output?: Record<string, unknown>;
    logs?: string;
  }
): Promise<QueuedJob> {
  const res = await fetch(`${BASE_URL}/api/queue/jobs/${jobId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agent_id: agentId, ...data }),
  });
  if (!res.ok) throw new Error(`Failed to complete job: ${res.status}`);
  return res.json();
}

/**
 * Mark a job as failed (agent operation)
 */
export async function failJob(
  jobId: string,
  agentId: string,
  error: string
): Promise<QueuedJob> {
  const res = await fetch(`${BASE_URL}/api/queue/jobs/${jobId}/fail`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agent_id: agentId, error }),
  });
  if (!res.ok) throw new Error(`Failed to fail job: ${res.status}`);
  return res.json();
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<QueueStats> {
  const res = await fetch(`${BASE_URL}/api/queue/stats`);
  if (!res.ok) throw new Error(`Failed to fetch queue stats: ${res.status}`);
  return res.json();
}

/**
 * List pending/queued jobs
 */
export async function listPendingJobs(params?: {
  limit?: number;
  offset?: number;
  status?: string;
  priority?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}): Promise<ListQueuedJobsResponse> {
  const url = new URL(`${BASE_URL}/api/queue/jobs`);
  if (params?.limit) url.searchParams.set('limit', params.limit.toString());
  if (params?.offset) url.searchParams.set('offset', params.offset.toString());
  if (params?.status) url.searchParams.set('status', params.status);
  if (params?.priority) url.searchParams.set('priority', params.priority);
  if (params?.sort_by) url.searchParams.set('sort_by', params.sort_by);
  if (params?.sort_order) url.searchParams.set('sort_order', params.sort_order);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Failed to list pending jobs: ${res.status}`);
  return res.json();
}

/**
 * Get a specific job by ID
 */
export async function getQueuedJob(jobId: string): Promise<QueuedJob> {
  const res = await fetch(`${BASE_URL}/api/queue/jobs/${jobId}`);
  if (!res.ok) throw new Error(`Failed to fetch job: ${res.status}`);
  return res.json();
}

/**
 * Requeue a failed job
 */
export async function requeueJob(jobId: string): Promise<QueuedJob> {
  const res = await fetch(`${BASE_URL}/api/queue/jobs/${jobId}/requeue`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to requeue job: ${res.status}`);
  return res.json();
}

/**
 * Maintenance: Delete completed jobs older than specified days
 */
export async function deleteOldJobs(daysOld: number): Promise<{ deleted_count: number }> {
  const res = await fetch(`${BASE_URL}/api/queue/maintenance/cleanup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ days_old: daysOld }),
  });
  if (!res.ok) throw new Error(`Failed to cleanup jobs: ${res.status}`);
  return res.json();
}
