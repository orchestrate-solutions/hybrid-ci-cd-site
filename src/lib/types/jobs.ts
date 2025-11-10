/**
 * Jobs API Type Definitions
 * 
 * Typed interfaces for all jobs-related API endpoints.
 * Ensures type safety across the application.
 */

/**
 * Job status enum matching backend
 */
export const JOB_STATUS = {
  QUEUED: 'QUEUED',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELED: 'CANCELED',
} as const;

export type JobStatus = typeof JOB_STATUS[keyof typeof JOB_STATUS];

/**
 * Job priority enum
 */
export const JOB_PRIORITY = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

export type JobPriority = typeof JOB_PRIORITY[keyof typeof JOB_PRIORITY];

/**
 * Individual job record
 */
export interface Job {
  id: string;
  name: string;
  status: JobStatus;
  priority: JobPriority;
  created_at: string;
  updated_at?: string;
  completed_at?: string | null;
  error_message?: string | null;
  progress?: number; // 0-100
  tags?: string[];
}

/**
 * List jobs response
 */
export interface ListJobsResponse {
  jobs: Job[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * List jobs request parameters
 */
export interface ListJobsParams {
  limit?: number;
  offset?: number;
  status?: JobStatus;
  priority?: JobPriority;
  sort_by?: 'name' | 'status' | 'priority' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
  search?: string;
}

/**
 * Create job request
 */
export interface CreateJobRequest {
  name: string;
  priority?: JobPriority;
  tags?: string[];
  config?: Record<string, any>;
}

/**
 * Create job response
 */
export interface CreateJobResponse {
  job: Job;
}

/**
 * Get job by ID response
 */
export interface GetJobResponse {
  job: Job;
  timeline?: JobEvent[];
  logs?: string[];
}

/**
 * Job event (for timeline)
 */
export interface JobEvent {
  timestamp: string;
  event_type: 'created' | 'started' | 'completed' | 'failed' | 'retried' | 'canceled';
  message: string;
  data?: Record<string, any>;
}

/**
 * Update job request
 */
export interface UpdateJobRequest {
  name?: string;
  priority?: JobPriority;
  tags?: string[];
  status?: JobStatus;
}

/**
 * Delete job response
 */
export interface DeleteJobResponse {
  success: boolean;
  message: string;
}

/**
 * Retry job response
 */
export interface RetryJobResponse {
  job: Job;
}

/**
 * Cancel job response
 */
export interface CancelJobResponse {
  job: Job;
}

/**
 * Job statistics
 */
export interface JobStats {
  total: number;
  running: number;
  completed: number;
  failed: number;
  queued: number;
  canceled: number;
}

/**
 * Bulk operations response
 */
export interface BulkJobsResponse {
  affected: number;
  jobs: Job[];
}
