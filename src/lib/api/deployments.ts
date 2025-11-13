/**
 * Deployments API Client
 * 
 * Typed fetch wrapper for all deployments-related API endpoints.
 * Handles errors, timeouts, and response parsing.
 * Supports demo mode for offline development.
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
import { getDemoDeploymentsResponse, getDemoDeployments } from '@/lib/mocks/demo-data';

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
 * List all deployments with optional filtering, sorting, pagination
 */
export async function listDeployments(
  params: ListDeploymentsParams = {}
): Promise<ListDeploymentsResponse> {
  // Check demo mode first
  if (isDemoModeEnabled()) {
    return getDemoDeploymentsResponse();
  }

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
  // Check demo mode first
  if (isDemoModeEnabled()) {
    const demoDeployments = getDemoDeployments();
    const deployment = demoDeployments.find(d => d.id === deploymentId);
    if (deployment) {
      return { deployment };
    }
    throw new Error(`Deployment not found in demo: ${deploymentId}`);
  }

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
 * Deploy to staging environment
 */
export async function deployToStaging(
  deploymentId: string,
  config?: Record<string, unknown>
): Promise<Deployment> {
  const url = `${BASE_URL}/api/dashboard/deployments/${deploymentId}/staging`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
    });

    if (!res.ok) {
      throw new Error(`Failed to deploy to staging: ${res.status}`);
    }

    const data = await res.json();
    return data.deployment;
  } catch (error) {
    console.error(`deployToStaging error for ${deploymentId}:`, error);
    throw error;
  }
}

/**
 * Promote deployment from staging to production
 */
export async function promoteToProduction(deploymentId: string): Promise<Deployment> {
  const url = `${BASE_URL}/api/dashboard/deployments/${deploymentId}/promote`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to promote to production: ${res.status}`);
    }

    const data = await res.json();
    return data.deployment;
  } catch (error) {
    console.error(`promoteToProduction error for ${deploymentId}:`, error);
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
 * Get service deployment history (all deployments for a service)
 */
export async function getServiceHistory(
  serviceId: string,
  limit = 50
): Promise<Deployment[]> {
  const url = `${BASE_URL}/api/dashboard/services/${serviceId}/deployments?limit=${limit}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to get service deployment history: ${res.status}`);
    }

    const data = await res.json();
    return data.deployments || [];
  } catch (error) {
    console.error(`getServiceHistory error for ${serviceId}:`, error);
    throw error;
  }
}
