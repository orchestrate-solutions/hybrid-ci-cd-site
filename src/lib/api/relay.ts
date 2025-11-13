/**
 * Relay Management API Client
 * Handles relay registration, health monitoring, API key management
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Relay {
  id: string;
  name: string;
  status: "HEALTHY" | "DEGRADED" | "OFFLINE";
  last_heartbeat: string;
  created_at: string;
  version: string;
  endpoint?: string;
}

export interface RelayMetrics {
  total_relays: number;
  healthy: number;
  degraded: number;
  offline: number;
  avg_latency_ms: number;
}

export interface APIKey {
  id: string;
  relay_id: string;
  key_hash: string;
  created_at: string;
  last_used?: string;
  expires_at?: string;
  description: string;
}

export interface RegisterRelayRequest {
  name: string;
  endpoint: string;
  description?: string;
}

export interface RegisterRelayResponse {
  relay_id: string;
  api_key: string; // Only returned once
  api_key_id: string;
  registration_token: string;
}

export const relayApi = {
  /**
   * List all registered relays
   */
  async listRelays(): Promise<Relay[]> {
    const res = await fetch(`${BASE_URL}/api/relays`);
    if (!res.ok) throw new Error(`Failed to list relays: ${res.status}`);
    const data = await res.json();
    return (data.relays || []) as Relay[];
  },

  /**
   * Get relay by ID
   */
  async getRelay(relayId: string): Promise<Relay> {
    const res = await fetch(`${BASE_URL}/api/relays/${relayId}`);
    if (!res.ok) throw new Error(`Failed to get relay: ${res.status}`);
    return res.json();
  },

  /**
   * Get relay metrics summary
   */
  async getRelayMetrics(): Promise<RelayMetrics> {
    const res = await fetch(`${BASE_URL}/api/relays/metrics/summary`);
    if (!res.ok) throw new Error(`Failed to fetch relay metrics: ${res.status}`);
    return res.json();
  },

  /**
   * Register a new relay
   */
  async registerRelay(
    request: RegisterRelayRequest
  ): Promise<RegisterRelayResponse> {
    const res = await fetch(`${BASE_URL}/api/relays/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(`Failed to register relay: ${res.status}`);
    return res.json();
  },

  /**
   * Delete relay
   */
  async deleteRelay(relayId: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/relays/${relayId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error(`Failed to delete relay: ${res.status}`);
  },

  /**
   * List API keys for a relay
   */
  async listAPIKeys(relayId: string): Promise<APIKey[]> {
    const res = await fetch(`${BASE_URL}/api/relays/${relayId}/api-keys`);
    if (!res.ok) throw new Error(`Failed to list API keys: ${res.status}`);
    const data = await res.json();
    return (data.api_keys || []) as APIKey[];
  },

  /**
   * Generate new API key for relay
   */
  async generateAPIKey(
    relayId: string,
    description?: string
  ): Promise<{ key: string; key_id: string }> {
    const res = await fetch(
      `${BASE_URL}/api/relays/${relayId}/api-keys/generate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      }
    );
    if (!res.ok) throw new Error(`Failed to generate API key: ${res.status}`);
    return res.json();
  },

  /**
   * Revoke API key
   */
  async revokeAPIKey(relayId: string, keyId: string): Promise<void> {
    const res = await fetch(
      `${BASE_URL}/api/relays/${relayId}/api-keys/${keyId}/revoke`,
      { method: "POST" }
    );
    if (!res.ok) throw new Error(`Failed to revoke API key: ${res.status}`);
  },

  /**
   * Get relay health status
   */
  async getRelayHealth(relayId: string): Promise<{
    status: "HEALTHY" | "DEGRADED" | "OFFLINE";
    latency_ms: number;
    last_heartbeat: string;
    queue_connection: "OK" | "ERROR";
    vault_connection: "OK" | "ERROR";
  }> {
    const res = await fetch(`${BASE_URL}/api/relays/${relayId}/health`);
    if (!res.ok) throw new Error(`Failed to fetch relay health: ${res.status}`);
    return res.json();
  },

  /**
   * Test relay connectivity
   */
  async testRelay(relayId: string): Promise<{
    success: boolean;
    latency_ms: number;
    message: string;
  }> {
    const res = await fetch(`${BASE_URL}/api/relays/${relayId}/test`, {
      method: "POST",
    });
    if (!res.ok) throw new Error(`Failed to test relay: ${res.status}`);
    return res.json();
  },
};
