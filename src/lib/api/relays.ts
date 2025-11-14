/**
 * Relay API Client - Fetch relay health metrics and status
 * Provides type-safe interfaces for relay monitoring
 */

export interface RelayHealthMetrics {
  relay_id: string;
  name: string;
  status: 'online' | 'offline' | 'degraded';
  uptime_24h: number; // percentage 0-100
  uptime_7d: number;
  uptime_30d: number;
  response_time_ms: number;
  error_rate: number; // percentage 0-100
  throughput_msgs_sec: number;
  last_heartbeat: string; // ISO timestamp
  region: string;
  environment: string;
}

export interface RelayMetricsHistory {
  relay_id: string;
  timestamp: string; // ISO timestamp
  response_time_ms: number;
  error_count: number;
  message_count: number;
  cpu_percent?: number;
  memory_percent?: number;
}

export interface RelayRecommendation {
  relay_id: string;
  type: 'scale-up' | 'scale-down' | 'optimize-polling' | 'increase-batch-size';
  severity: 'critical' | 'warning' | 'info';
  description: string;
  projected_improvement: number; // percentage
}

export interface RelayAlertEvent {
  alert_id: string;
  relay_id: string;
  timestamp: string; // ISO timestamp
  alert_type: 'uptime_drop' | 'latency_spike' | 'error_rate_high' | 'offline';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  resolved_at?: string; // ISO timestamp, null if unresolved
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const relaysApi = {
  /**
   * Get health metrics for all relays
   */
  async getHealthMetrics(): Promise<RelayHealthMetrics[]> {
    const res = await fetch(`${BASE_URL}/api/relays/health`);
    if (!res.ok) {
      throw new Error(`Failed to fetch relay health: ${res.status}`);
    }
    const data = await res.json();
    return data.relays || [];
  },

  /**
   * Get detailed health for a specific relay
   */
  async getRelayHealth(relayId: string): Promise<RelayHealthMetrics> {
    const res = await fetch(`${BASE_URL}/api/relays/${relayId}/health`);
    if (!res.ok) {
      throw new Error(`Failed to fetch relay health: ${res.status}`);
    }
    return res.json();
  },

  /**
   * Get historical metrics for a relay (time series data)
   */
  async getRelayMetricsHistory(
    relayId: string,
    timeRange: '24h' | '7d' | '30d' = '24h',
    interval: 'minute' | 'hour' | 'day' = 'hour'
  ): Promise<RelayMetricsHistory[]> {
    const params = new URLSearchParams({
      time_range: timeRange,
      interval,
    });
    const res = await fetch(
      `${BASE_URL}/api/relays/${relayId}/metrics/history?${params}`
    );
    if (!res.ok) {
      throw new Error(`Failed to fetch relay metrics history: ${res.status}`);
    }
    const data = await res.json();
    return data.metrics || [];
  },

  /**
   * Get performance recommendations for a relay
   */
  async getRelayRecommendations(relayId: string): Promise<RelayRecommendation[]> {
    const res = await fetch(`${BASE_URL}/api/relays/${relayId}/recommendations`);
    if (!res.ok) {
      throw new Error(`Failed to fetch relay recommendations: ${res.status}`);
    }
    const data = await res.json();
    return data.recommendations || [];
  },

  /**
   * Get alert history for a relay
   */
  async getRelayAlertHistory(
    relayId: string,
    limit = 50
  ): Promise<RelayAlertEvent[]> {
    const res = await fetch(
      `${BASE_URL}/api/relays/${relayId}/alerts?limit=${limit}`
    );
    if (!res.ok) {
      throw new Error(`Failed to fetch relay alerts: ${res.status}`);
    }
    const data = await res.json();
    return data.alerts || [];
  },

  /**
   * Get recommendations for all relays (system-wide)
   */
  async getSystemRecommendations(): Promise<RelayRecommendation[]> {
    const res = await fetch(`${BASE_URL}/api/relays/recommendations`);
    if (!res.ok) {
      throw new Error(`Failed to fetch system recommendations: ${res.status}`);
    }
    const data = await res.json();
    return data.recommendations || [];
  },
};
