/**
 * Deployments API Type Definitions
 * 
 * Typed interfaces for all deployments-related API endpoints.
 * Ensures type safety across the application.
 */

/**
 * Deployment status enum matching backend
 */
export const DEPLOYMENT_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  ROLLED_BACK: 'ROLLED_BACK',
  CANCELED: 'CANCELED',
} as const;

export type DeploymentStatus = typeof DEPLOYMENT_STATUS[keyof typeof DEPLOYMENT_STATUS];

/**
 * Deployment environment
 */
export const DEPLOYMENT_ENVIRONMENT = {
  DEVELOPMENT: 'DEVELOPMENT',
  STAGING: 'STAGING',
  PRODUCTION: 'PRODUCTION',
} as const;

export type DeploymentEnvironment = typeof DEPLOYMENT_ENVIRONMENT[keyof typeof DEPLOYMENT_ENVIRONMENT];

/**
 * Individual deployment record
 */
export interface Deployment {
  id: string;
  name: string;
  version: string;
  status: DeploymentStatus;
  environment: DeploymentEnvironment;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  created_by: string;
  description?: string;
  progress?: number; // 0-100
  error_message?: string | null;
}

/**
 * Deployment event (for timeline)
 */
export interface DeploymentEvent {
  timestamp: string;
  event_type: 'created' | 'started' | 'progressed' | 'completed' | 'failed' | 'rolled_back' | 'canceled';
  message: string;
  data?: Record<string, any>;
}

/**
 * List deployments response
 */
export interface ListDeploymentsResponse {
  deployments: Deployment[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * List deployments request parameters
 */
export interface ListDeploymentsParams {
  limit?: number;
  offset?: number;
  status?: DeploymentStatus;
  environment?: DeploymentEnvironment;
  sort_by?: 'name' | 'status' | 'environment' | 'created_at' | 'completed_at';
  sort_order?: 'asc' | 'desc';
  search?: string;
}

/**
 * Get deployment by ID response
 */
export interface GetDeploymentResponse {
  deployment: Deployment;
  timeline?: DeploymentEvent[];
  logs?: string[];
  rollback_available?: boolean;
}

/**
 * Create deployment request
 */
export interface CreateDeploymentRequest {
  name: string;
  version: string;
  environment: DeploymentEnvironment;
  description?: string;
  config?: Record<string, any>;
}

/**
 * Create deployment response
 */
export interface CreateDeploymentResponse {
  deployment: Deployment;
}

/**
 * Rollback deployment response
 */
export interface RollbackDeploymentResponse {
  deployment: Deployment;
  previous_version: string;
}

/**
 * Cancel deployment response
 */
export interface CancelDeploymentResponse {
  deployment: Deployment;
}

/**
 * Deployment statistics
 */
export interface DeploymentStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  failed: number;
  rolled_back: number;
  by_environment: Record<DeploymentEnvironment, number>;
}

/**
 * Deployment history (for timeline view)
 */
export interface DeploymentHistory {
  id: string;
  deployment_id: string;
  version: string;
  status: DeploymentStatus;
  deployed_at: string;
  duration_seconds: number;
  created_by: string;
}
