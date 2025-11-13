/**
 * Jobs API Client
 * 
 * Typed fetch wrapper for all jobs-related API endpoints.
 * Handles errors, timeouts, and response parsing.
 * Supports demo mode for offline development.
 * 
 * NOTE: Removed non-existent endpoints (deleteJob, retryJob, cancelJob, bulkCancelJobs, 
 * bulkDeleteJobs, getJobStats, exportJobsToCSV) that were calling 404 endpoints.
 * Job lifecycle is managed via queue API (claimJob, startJob, completeJob, failJob).
 */

import {
  Job,
  ListJobsResponse,
  ListJobsParams,
  CreateJobRequest,
  CreateJobResponse,
  GetJobResponse,
  UpdateJobRequest,
} from '@/lib/types/jobs';
import { getDemoJobsResponse, getDemoJobs } from '@/lib/mocks/demo-data';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
 * List all jobs with optional filtering, sorting, pagination
 */
export async function listJobs(params: ListJobsParams = {}): Promise<ListJobsResponse> {
  // Check demo mode first
  if (isDemoModeEnabled()) {
    return getDemoJobsResponse();
  }

  const searchParams = new URLSearchParams();

  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.offset !== undefined) searchParams.append('offset', params.offset.toString());
  if (params.status) searchParams.append('status', params.status);
  if (params.priority) searchParams.append('priority', params.priority);
  if (params.sort_by) searchParams.append('sort_by', params.sort_by);
  if (params.sort_order) searchParams.append('sort_order', params.sort_order);
  if (params.search) searchParams.append('search', params.search);

  const url = `${BASE_URL}/api/dashboard/jobs?${searchParams.toString()}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to list jobs: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('listJobs error:', error);
    throw error;
  }
}

/**
 * Get a single job by ID
 */
export async function getJob(jobId: string): Promise<GetJobResponse> {
  // Check demo mode first
  if (isDemoModeEnabled()) {
    const demoJobs = getDemoJobs();
    const job = demoJobs.find(j => j.id === jobId);
    if (job) {
      return { job };
    }
    throw new Error(`Job not found in demo: ${jobId}`);
  }

  const url = `${BASE_URL}/api/dashboard/jobs/${jobId}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Job not found: ${jobId}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error(`getJob error for ${jobId}:`, error);
    throw error;
  }
}

/**
 * Create a new job
 */
export async function createJob(request: CreateJobRequest): Promise<CreateJobResponse> {
  const url = `${BASE_URL}/api/dashboard/jobs`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      throw new Error(`Failed to create job: ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('createJob error:', error);
    throw error;
  }
}

/**
 * Update an existing job
 */
export async function updateJob(
  jobId: string,
  request: UpdateJobRequest
): Promise<Job> {
  const url = `${BASE_URL}/api/dashboard/jobs/${jobId}`;

  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      throw new Error(`Failed to update job: ${res.status}`);
    }

    const data = await res.json();
    return data.job;
  } catch (error) {
    console.error(`updateJob error for ${jobId}:`, error);
    throw error;
  }
}

/**
 * DEPRECATED: Job lifecycle now managed via queue API
 * Use: queueApi.failJob() instead to mark job as failed
 * Or:  queueApi.requeueJob() to requeue a failed job
 */
// export async function deleteJob(jobId: string): Promise<DeleteJobResponse> { }

/**
 * DEPRECATED: Job lifecycle now managed via queue API
 * Use: queueApi.completeJob() with success status instead
 * Job completion happens when agent marks it COMPLETED in the queue
 */
// export async function retryJob(jobId: string): Promise<RetryJobResponse> { }

/**
 * DEPRECATED: Job lifecycle now managed via queue API
 * Use: queueApi.failJob() instead to mark job as failed
 * Jobs are claimed by agents and executed via queue operations
 */
// export async function cancelJob(jobId: string): Promise<CancelJobResponse> { }

/**
 * DEPRECATED: Job statistics are now aggregated from queue
 * Use: queueApi.getQueueStats() instead for queue-based metrics
 */
// export async function getJobStats(): Promise<JobStats> { }

/**
 * DEPRECATED: Bulk operations removed - use queue API for batch operations
 * Individual jobs should be managed via queue claim/complete workflow
 */
// export async function bulkDeleteJobs(jobIds: string[]): Promise<BulkJobsResponse> { }

/**
 * DEPRECATED: Bulk operations removed - use queue API for individual job management
 */
// export async function bulkCancelJobs(jobIds: string[]): Promise<BulkJobsResponse> { }

/**
 * DEPRECATED: CSV export removed - use dashboard query endpoints instead
 */
// export async function exportJobsToCSV(params: ListJobsParams = {}): Promise<Blob> { }
