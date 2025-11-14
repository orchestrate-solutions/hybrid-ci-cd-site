const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface QueueMetrics {
  total_depth: number;
  critical_depth: number;
  high_depth: number;
  normal_depth: number;
  low_depth: number;
  avg_age_ms: number;
  throughput_rps: number;
  error_rate: number;
}

export interface QueueMetricsPoint {
  timestamp: string;
  depth: number;
  throughput: number;
  avg_age: number;
}

export interface MessageAgeDistribution {
  p50: number;
  p75: number;
  p95: number;
  p99: number;
  max: number;
}

export interface ThroughputPoint {
  timestamp: string;
  throughput_rps: number;
}

export interface DLQStats {
  total_messages: number;
  failed_retries: number;
  max_retries_exceeded: number;
  oldest_message_age_ms: number;
  error_types: Array<{ type: string; count: number }>;
}

export interface QueueWarning {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

export const queueApi = {
  async getMetrics(): Promise<QueueMetrics> {
    const res = await fetch(`${BASE_URL}/api/queue/metrics`);
    if (!res.ok) throw new Error(`Failed to fetch queue metrics: ${res.status}`);
    return res.json();
  },

  async getMetricsHistory(
    timeRange: '24h' | '7d' | '30d' = '24h',
    interval: '5m' | '1h' | '1d' = '1h'
  ): Promise<QueueMetricsPoint[]> {
    const res = await fetch(`${BASE_URL}/api/queue/metrics/history?timeRange=${timeRange}&interval=${interval}`);
    if (!res.ok) throw new Error('Failed to fetch metrics history');
    return res.json();
  },

  async getDepthByPriority(): Promise<{
    CRITICAL: number;
    HIGH: number;
    NORMAL: number;
    LOW: number;
    total: number;
  }> {
    const res = await fetch(`${BASE_URL}/api/queue/depth/priority`);
    if (!res.ok) throw new Error('Failed to fetch priority breakdown');
    return res.json();
  },

  async getMessageAgeDistribution(): Promise<MessageAgeDistribution> {
    const res = await fetch(`${BASE_URL}/api/queue/message-age/distribution`);
    if (!res.ok) throw new Error('Failed to fetch message age distribution');
    return res.json();
  },

  async getThroughputHistory(timeRange: '24h' | '7d' | '30d' = '24h'): Promise<ThroughputPoint[]> {
    const res = await fetch(`${BASE_URL}/api/queue/throughput/history?timeRange=${timeRange}`);
    if (!res.ok) throw new Error('Failed to fetch throughput history');
    return res.json();
  },

  async getDLQStats(): Promise<DLQStats> {
    const res = await fetch(`${BASE_URL}/api/queue/dlq/stats`);
    if (!res.ok) throw new Error('Failed to fetch DLQ stats');
    return res.json();
  },

  async retryDLQMessage(messageId: string): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/api/queue/dlq/${messageId}/retry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to retry DLQ message');
    return res.json();
  },

  async getQueueWarnings(): Promise<QueueWarning[]> {
    const res = await fetch(`${BASE_URL}/api/queue/warnings`);
    if (!res.ok) throw new Error('Failed to fetch queue warnings');
    return res.json();
  },
};
