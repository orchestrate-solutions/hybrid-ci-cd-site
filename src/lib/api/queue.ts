const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Types
export interface QueueMetrics {
  total_queued: number;
  total_active: number;
  total_completed: number;
  priority_breakdown: {
    CRITICAL: number;
    HIGH: number;
    NORMAL: number;
    LOW: number;
  };
  avg_wait_time_ms: number;
  throughput_per_minute: number;
  dlq_count: number;
}

export interface QueueStats {
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
  count: number;
  oldest_age_ms: number;
}

export interface DLQMessage {
  id: string;
  original_job_id: string;
  error: string;
  failed_at: string;
  retry_count: number;
}

export interface PriorityBreakdown {
  [key: string]: {
    count: number;
    percentage: number;
  };
}

export interface QueueHistoryPoint {
  timestamp: number;
  queued: number;
  active: number;
}

export interface RequeuResult {
  success: boolean;
  job_id: string;
}

// API Client
export const queueApi = {
  async getMetrics(): Promise<QueueMetrics> {
    const res = await fetch(`${BASE_URL}/api/queue/metrics`);
    if (!res.ok) throw new Error(`Failed to fetch queue metrics: ${res.status}`);
    return res.json();
  },

  async getQueueStats(): Promise<QueueStats[]> {
    const res = await fetch(`${BASE_URL}/api/queue/stats`);
    if (!res.ok) throw new Error(`Failed to fetch queue stats: ${res.status}`);
    return res.json();
  },

  async getDeadLetterQueue(): Promise<DLQMessage[]> {
    const res = await fetch(`${BASE_URL}/api/queue/dlq`);
    if (!res.ok) throw new Error(`Failed to fetch DLQ: ${res.status}`);
    return res.json();
  },

  async getPriorityBreakdown(): Promise<PriorityBreakdown> {
    const res = await fetch(`${BASE_URL}/api/queue/priority-breakdown`);
    if (!res.ok) throw new Error(`Failed to fetch priority breakdown: ${res.status}`);
    return res.json();
  },

  async getQueueHistory(): Promise<QueueHistoryPoint[]> {
    const res = await fetch(`${BASE_URL}/api/queue/history?limit=60`);
    if (!res.ok) throw new Error(`Failed to fetch queue history: ${res.status}`);
    return res.json();
  },

  async requeueDLQMessage(messageId: string): Promise<RequeuResult> {
    const res = await fetch(`${BASE_URL}/api/queue/dlq/${messageId}/requeue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`Failed to requeue message: ${res.status}`);
    return res.json();
  },
};
