/**
 * Relay API Client
 * 
 * Typed API client for relay management endpoints.
 * Supports NET ZERO relay registration, heartbeats, and webhook config.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Relay {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DEGRADED';
  region: string;
  api_key_hash: string;
  registered_at: string;
  last_heartbeat_at: string;
  webhook_url: string;
  queue_config: {
    provider: 'aws_sqs' | 'azure_eventgrid' | 'gcp_pubsub';
    queue_url: string;
    region: string;
  };
  vault_config: {
    provider: string;
    secret_prefix: string;
  };
}

export interface RelayRegistrationRequest {
  name: string;
  region: string;
  webhook_url: string;
  queue_config: {
    provider: 'aws_sqs' | 'azure_eventgrid' | 'gcp_pubsub';
    queue_url: string;
    region: string;
    role_arn?: string;
  };
  vault_config: {
    provider: string;
    region: string;
    secret_prefix: string;
  };
}

export interface RelayRegistrationResponse {
  relay: Relay;
  api_key: string;
}

export interface ListRelaysResponse {
  relays: Relay[];
  total: number;
}

export interface WebhookConfig {
  id: string;
  relay_id: string;
  tool: string;
  event_type: string;
  routing_rules: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Register a new relay with the provider
 * Returns relay info + API key (shown only once)
 */
export async function registerRelay(data: RelayRegistrationRequest): Promise<RelayRegistrationResponse> {
  const res = await fetch(`${BASE_URL}/api/relays/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to register relay: ${res.status}`);
  return res.json();
}

/**
 * Send heartbeat from relay to provider
 * Called by relay to indicate it's still active
 */
export async function sendHeartbeat(relayId: string, apiKey: string): Promise<Relay> {
  const res = await fetch(`${BASE_URL}/api/relays/${relayId}/heartbeat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({
      timestamp: new Date().toISOString(),
    }),
  });
  if (!res.ok) throw new Error(`Failed to send heartbeat: ${res.status}`);
  return res.json();
}

/**
 * List all registered relays
 */
export async function listRelays(params?: {
  limit?: number;
  offset?: number;
  status?: string;
}): Promise<ListRelaysResponse> {
  const url = new URL(`${BASE_URL}/api/relays`);
  if (params?.limit) url.searchParams.set('limit', params.limit.toString());
  if (params?.offset) url.searchParams.set('offset', params.offset.toString());
  if (params?.status) url.searchParams.set('status', params.status);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Failed to list relays: ${res.status}`);
  return res.json();
}

/**
 * Get relay status and details
 */
export async function getRelayStatus(relayId: string): Promise<Relay> {
  const res = await fetch(`${BASE_URL}/api/relays/${relayId}`);
  if (!res.ok) throw new Error(`Failed to get relay status: ${res.status}`);
  return res.json();
}

/**
 * Update relay configuration
 */
export async function updateRelay(
  relayId: string,
  data: Partial<RelayRegistrationRequest>
): Promise<Relay> {
  const res = await fetch(`${BASE_URL}/api/relays/${relayId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update relay: ${res.status}`);
  return res.json();
}

/**
 * Deregister a relay
 */
export async function deregisterRelay(relayId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/relays/${relayId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to deregister relay: ${res.status}`);
}

/**
 * Create webhook configuration for relay
 */
export async function createWebhookConfig(
  relayId: string,
  data: {
    tool: string;
    event_type: string;
    routing_rules: Record<string, unknown>;
  }
): Promise<WebhookConfig> {
  const res = await fetch(`${BASE_URL}/api/relays/${relayId}/webhooks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create webhook config: ${res.status}`);
  return res.json();
}

/**
 * List webhook configurations for a relay
 */
export async function listWebhookConfigs(relayId: string): Promise<WebhookConfig[]> {
  const res = await fetch(`${BASE_URL}/api/relays/${relayId}/webhooks`);
  if (!res.ok) throw new Error(`Failed to list webhook configs: ${res.status}`);
  const data = await res.json();
  return data.webhooks || [];
}

/**
 * Update webhook configuration
 */
export async function updateWebhookConfig(
  relayId: string,
  webhookId: string,
  data: Partial<{
    tool: string;
    event_type: string;
    routing_rules: Record<string, unknown>;
  }>
): Promise<WebhookConfig> {
  const res = await fetch(`${BASE_URL}/api/relays/${relayId}/webhooks/${webhookId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update webhook config: ${res.status}`);
  return res.json();
}

/**
 * Delete webhook configuration
 */
export async function deleteWebhookConfig(relayId: string, webhookId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/relays/${relayId}/webhooks/${webhookId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete webhook config: ${res.status}`);
}

/**
 * Get relay connection test status
 */
export async function testRelayConnection(relayId: string): Promise<{
  status: 'SUCCESS' | 'FAILED';
  queue_connected: boolean;
  vault_accessible: boolean;
  message: string;
}> {
  const res = await fetch(`${BASE_URL}/api/relays/${relayId}/test`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to test relay connection: ${res.status}`);
  return res.json();
}
