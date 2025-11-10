/**
 * Jobs API Client
 * 
 * Typed fetch wrapper for all jobs-related API endpoints.
 * Handles errors, timeouts, and response parsing.
 */

import {
  Job,
  ListJobsResponse,
  ListJobsParams,
  CreateJobRequest,
  CreateJobResponse,
  GetJobResponse,
  UpdateJobRequest,
  DeleteJobResponse,
  RetryJobResponse,
  CancelJobResponse,
  JobStats,
  BulkJobsResponse,
} from '@/lib/types/jobs';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * List all jobs with optional filtering, sorting, pagination
 */
export async function listJobs(params: ListJobsParams = {}): Promise<ListJobsResponse> {
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
 * Delete a job
 */
export async function deleteJob(jobId: string): Promise<DeleteJobResponse> {
  const url = `${BASE_URL}/api/dashboard/jobs/${jobId}`;

  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to delete job: ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error(`deleteJob error for ${jobId}:`, error);
    throw error;
  }
}

/**
 * Retry a failed job
 */
export async function retryJob(jobId: string): Promise<RetryJobResponse> {
  const url = `${BASE_URL}/api/dashboard/jobs/${jobId}/retry`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to retry job: ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error(`retryJob error for ${jobId}:`, error);
    throw error;
  }
}

/**
 * Cancel a job
 */
export async function cancelJob(jobId: string): Promise<CancelJobResponse> {
  const url = `${BASE_URL}/api/dashboard/jobs/${jobId}/cancel`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to cancel job: ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error(`cancelJob error for ${jobId}:`, error);
    throw error;
  }
}

/**
 * Get job statistics
 */
export async function getJobStats(): Promise<JobStats> {
  const url = `${BASE_URL}/api/dashboard/jobs/stats`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to get job stats: ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('getJobStats error:', error);
    throw error;
  }
}

/**
 * Bulk delete jobs
 */
export async function bulkDeleteJobs(jobIds: string[]): Promise<BulkJobsResponse> {
  const url = `${BASE_URL}/api/dashboard/jobs/bulk/delete`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_ids: jobIds }),
    });

    if (!res.ok) {
      throw new Error(`Failed to bulk delete jobs: ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('bulkDeleteJobs error:', error);
    throw error;
  }
}

/**
 * Bulk cancel jobs
 */
export async function bulkCancelJobs(jobIds: string[]): Promise<BulkJobsResponse> {
  const url = `${BASE_URL}/api/dashboard/jobs/bulk/cancel`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_ids: jobIds }),
    });

    if (!res.ok) {
      throw new Error(`Failed to bulk cancel jobs: ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('bulkCancelJobs error:', error);
    throw error;
  }
}

/**
 * Export jobs to CSV
 */
export async function exportJobsToCSV(params: ListJobsParams = {}): Promise<Blob> {
  const searchParams = new URLSearchParams();

  if (params.status) searchParams.append('status', params.status);
  if (params.priority) searchParams.append('priority', params.priority);
  if (params.search) searchParams.append('search', params.search);

  const url = `${BASE_URL}/api/dashboard/jobs/export/csv?${searchParams.toString()}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'text/csv' },
    });

    if (!res.ok) {
      throw new Error(`Failed to export jobs: ${res.status}`);
    }

    const blob = await res.blob();
    return blob;
  } catch (error) {
    console.error('exportJobsToCSV error:', error);
    throw error;
  }
}
