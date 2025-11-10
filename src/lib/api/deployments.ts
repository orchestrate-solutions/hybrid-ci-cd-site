/**
 * Deployments API Client
 * 
 * Typed fetch wrapper for all deployments-related API endpoints.
 * Handles errors, timeouts, and response parsing.
 */

import {
  Deployment,
  ListDeploymentsResponse,
  ListDeploymentsParams,
  CreateDeploymentRequest,
  CreateDeploymentResponse,
  GetDeploymentResponse,
  RollbackDeploymentResponse,
  CancelDeploymentResponse,
  DeploymentStats,
  DeploymentHistory,
} from '@/lib/types/deployments';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * List all deployments with optional filtering, sorting, pagination
 */
export async function listDeployments(
  params: ListDeploymentsParams = {}
): Promise<ListDeploymentsResponse> {
  const searchParams = new URLSearchParams();

  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.offset !== undefined) searchParams.append('offset', params.offset.toString());
  if (params.status) searchParams.append('status', params.status);
  if (params.environment) searchParams.append('environment', params.environment);
  if (params.sort_by) searchParams.append('sort_by', params.sort_by);
  if (params.sort_order) searchParams.append('sort_order', params.sort_order);
  if (params.search) searchParams.append('search', params.search);

  const url = `${BASE_URL}/api/dashboard/deployments?${searchParams.toString()}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to list deployments: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('listDeployments error:', error);
    throw error;
  }
}

/**
 * Get a single deployment by ID
 */
export async function getDeployment(deploymentId: string): Promise<GetDeploymentResponse> {
  const url = `${BASE_URL}/api/dashboard/deployments/${deploymentId}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Deployment not found: ${deploymentId}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error(`getDeployment error for ${deploymentId}:`, error);
    throw error;
  }
}

/**
 * Create a new deployment
 */
export async function createDeployment(
  request: CreateDeploymentRequest
): Promise<CreateDeploymentResponse> {
  const url = `${BASE_URL}/api/dashboard/deployments`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      throw new Error(`Failed to create deployment: ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('createDeployment error:', error);
    throw error;
  }
}

/**
 * Rollback a deployment to previous version
 */
export async function rollbackDeployment(
  deploymentId: string
): Promise<RollbackDeploymentResponse> {
  const url = `${BASE_URL}/api/dashboard/deployments/${deploymentId}/rollback`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to rollback deployment: ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error(`rollbackDeployment error for ${deploymentId}:`, error);
    throw error;
  }
}

/**
 * Cancel a deployment
 */
export async function cancelDeployment(
  deploymentId: string
): Promise<CancelDeploymentResponse> {
  const url = `${BASE_URL}/api/dashboard/deployments/${deploymentId}/cancel`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to cancel deployment: ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error(`cancelDeployment error for ${deploymentId}:`, error);
    throw error;
  }
}

/**
 * Get deployment statistics
 */
export async function getDeploymentStats(): Promise<DeploymentStats> {
  const url = `${BASE_URL}/api/dashboard/deployments/stats`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to get deployment stats: ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('getDeploymentStats error:', error);
    throw error;
  }
}

/**
 * Get deployment history
 */
export async function getDeploymentHistory(
  deploymentId: string,
  limit = 100
): Promise<DeploymentHistory[]> {
  const url = `${BASE_URL}/api/dashboard/deployments/${deploymentId}/history?limit=${limit}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to get deployment history: ${res.status}`);
    }

    const data = await res.json();
    return data.history || [];
  } catch (error) {
    console.error(`getDeploymentHistory error for ${deploymentId}:`, error);
    throw error;
  }
}

/**
 * Export deployments to CSV
 */
export async function exportDeploymentsToCSV(
  params: ListDeploymentsParams = {}
): Promise<Blob> {
  const searchParams = new URLSearchParams();

  if (params.status) searchParams.append('status', params.status);
  if (params.environment) searchParams.append('environment', params.environment);
  if (params.search) searchParams.append('search', params.search);

  const url = `${BASE_URL}/api/dashboard/deployments/export/csv?${searchParams.toString()}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'text/csv' },
    });

    if (!res.ok) {
      throw new Error(`Failed to export deployments: ${res.status}`);
    }

    const blob = await res.blob();
    return blob;
  } catch (error) {
    console.error('exportDeploymentsToCSV error:', error);
    throw error;
  }
}
