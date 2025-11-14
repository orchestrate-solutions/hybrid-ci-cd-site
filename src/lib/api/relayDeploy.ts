/**
 * Relay Deployment API Client
 * Handles all relay deployment wizard operations including validation, 
 * Terraform generation, deployment orchestration, and status monitoring
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface DeploymentConfig {
  provider: 'aws' | 'azure' | 'gcp';
  region: string;
  infrastructure_type: string;
  instance_type?: string;
  instance_count?: number;
  auto_scaling_min?: number;
  auto_scaling_max?: number;
  relay_name?: string;
  tags?: Record<string, string>;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface TerraformResult {
  code: string;
  checksum: string;
  resource_count?: number;
}

export interface Deployment {
  deployment_id: string;
  status: 'initializing' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'rolling_back';
  progress_percent?: number;
  current_step?: string;
  created_at: string;
  completed_at?: string;
  error?: string;
}

export interface DeploymentLog {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  step?: string;
}

export interface InfrastructureType {
  id: string;
  label: string;
  description: string;
  icon?: string;
  regions?: string[];
  supported_sizes?: string[];
}

export interface Credentials {
  provider: 'aws' | 'azure' | 'gcp';
  access_key?: string;
  secret_key?: string;
  tenant_id?: string;
  subscription_id?: string;
  client_id?: string;
  client_secret?: string;
  project_id?: string;
}

export interface CredentialValidation {
  valid: boolean;
  account_id?: string;
  subscription_id?: string;
  project_id?: string;
  error?: string;
}

export interface ResourceEstimate {
  estimated_cost_monthly: number;
  estimated_deployment_time_minutes: number;
  resource_count: number;
  breakdown?: {
    compute: number;
    network: number;
    storage: number;
  };
}

/**
 * Validate deployment configuration
 */
export async function validateDeploymentConfig(config: DeploymentConfig): Promise<ValidationResult> {
  const res = await fetch(`${BASE_URL}/api/relays/wizard/validate-config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });

  if (!res.ok) throw new Error(`Validation failed: ${res.status}`);
  return res.json();
}

/**
 * Generate Terraform code from configuration
 */
export async function generateTerraformCode(config: DeploymentConfig): Promise<TerraformResult> {
  const res = await fetch(`${BASE_URL}/api/relays/wizard/generate-terraform`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });

  if (!res.ok) throw new Error(`Terraform generation failed: ${res.status}`);
  return res.json();
}

/**
 * Initiate relay deployment
 */
export async function deployRelay(config: DeploymentConfig): Promise<Deployment> {
  const res = await fetch(`${BASE_URL}/api/relays/wizard/deploy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });

  if (!res.ok) throw new Error(`Deployment failed: ${res.status}`);
  return res.json();
}

/**
 * Get deployment status
 */
export async function getDeploymentStatus(deploymentId: string): Promise<Deployment> {
  const res = await fetch(`${BASE_URL}/api/relays/wizard/deploy/${deploymentId}/status`);

  if (!res.ok) throw new Error(`Failed to fetch deployment status: ${res.status}`);
  return res.json();
}

/**
 * Get deployment logs
 */
export async function getDeploymentLogs(
  deploymentId: string,
  limit = 100
): Promise<{ logs: DeploymentLog[]; total: number }> {
  const res = await fetch(`${BASE_URL}/api/relays/wizard/deploy/${deploymentId}/logs?limit=${limit}`);

  if (!res.ok) throw new Error(`Failed to fetch deployment logs: ${res.status}`);
  return res.json();
}

/**
 * Cancel ongoing deployment
 */
export async function cancelDeployment(deploymentId: string): Promise<Deployment> {
  const res = await fetch(`${BASE_URL}/api/relays/wizard/deploy/${deploymentId}/cancel`, {
    method: 'POST',
  });

  if (!res.ok) throw new Error(`Failed to cancel deployment: ${res.status}`);
  return res.json();
}

/**
 * Rollback completed deployment
 */
export async function rollbackDeployment(deploymentId: string): Promise<Deployment> {
  const res = await fetch(`${BASE_URL}/api/relays/wizard/deploy/${deploymentId}/rollback`, {
    method: 'POST',
  });

  if (!res.ok) throw new Error(`Failed to rollback deployment: ${res.status}`);
  return res.json();
}

/**
 * Get available infrastructure types for a provider
 */
export async function getInfrastructureTypes(
  provider: 'aws' | 'azure' | 'gcp'
): Promise<{ types: InfrastructureType[] }> {
  const res = await fetch(`${BASE_URL}/api/relays/wizard/infrastructure-types?provider=${provider}`);

  if (!res.ok) throw new Error(`Failed to fetch infrastructure types: ${res.status}`);
  return res.json();
}

/**
 * Validate credentials for a cloud provider
 */
export async function validateCredentials(credentials: Credentials): Promise<CredentialValidation> {
  const res = await fetch(`${BASE_URL}/api/relays/wizard/validate-credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) throw new Error(`Credential validation failed: ${res.status}`);
  return res.json();
}

/**
 * Get deployment history
 */
export async function getDeploymentHistory(options: {
  limit?: number;
  offset?: number;
  status?: string;
}): Promise<{ deployments: Deployment[]; total: number }> {
  const params = new URLSearchParams();
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.offset) params.append('offset', options.offset.toString());
  if (options.status) params.append('status', options.status);

  const res = await fetch(`${BASE_URL}/api/relays/wizard/deployments?${params}`);

  if (!res.ok) throw new Error(`Failed to fetch deployment history: ${res.status}`);
  return res.json();
}

/**
 * Estimate resources and costs for deployment
 */
export async function estimateResources(config: DeploymentConfig): Promise<ResourceEstimate> {
  const res = await fetch(`${BASE_URL}/api/relays/wizard/estimate-resources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });

  if (!res.ok) throw new Error(`Failed to estimate resources: ${res.status}`);
  return res.json();
}

/**
 * Get credential encryption key for secure storage
 */
export async function getCredentialEncryption(): Promise<{ public_key: string; algorithm: string }> {
  const res = await fetch(`${BASE_URL}/api/relays/wizard/credential-encryption`);

  if (!res.ok) throw new Error(`Failed to get encryption key: ${res.status}`);
  return res.json();
}
