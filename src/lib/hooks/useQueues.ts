import { useState, useEffect, useCallback, useMemo } from 'react';
import { queueApi, QueueMetrics, QueueStats, DLQMessage } from '../api/queue';

interface ComputedQueueStats {
  totalQueued: number;
  totalActive: number;
  totalCompleted: number;
  avgWaitTime: number;
  throughput: number;
  dlqCount: number;
}

interface UseQueuesReturn {
  metrics: QueueMetrics | null;
  stats: QueueStats[];
  dlqMessages: DLQMessage[];
  computedStats: ComputedQueueStats;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  requeueDLQMessage: (messageId: string) => Promise<void>;
}

const POLL_INTERVAL = 5000; // 5 seconds

export function useQueues(pollInterval = POLL_INTERVAL): UseQueuesReturn {
  const [metrics, setMetrics] = useState<QueueMetrics | null>(null);
  const [stats, setStats] = useState<QueueStats[]>([]);
  const [dlqMessages, setDlqMessages] = useState<DLQMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch queue data
  const fetchQueueData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [metricsData, statsData, dlqData] = await Promise.all([
        queueApi.getMetrics(),
        queueApi.getQueueStats(),
        queueApi.getDeadLetterQueue(),
      ]);

      setMetrics(metricsData);
      setStats(statsData);
      setDlqMessages(dlqData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch queue data'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Computed stats - derived from metrics
  const computedStats = useMemo<ComputedQueueStats>(() => {
    if (!metrics) {
      return {
        totalQueued: 0,
        totalActive: 0,
        totalCompleted: 0,
        avgWaitTime: 0,
        throughput: 0,
        dlqCount: dlqMessages.length,
      };
    }

    return {
      totalQueued: metrics.jobs_queued,
      totalActive: metrics.jobs_running,
      totalCompleted: metrics.jobs_completed,
      avgWaitTime: metrics.avg_wait_time_ms,
      throughput: metrics.throughput_per_minute,
      dlqCount: metrics.dlq_count,
    };
  }, [metrics, dlqMessages.length]);

  // Polling effect
  useEffect(() => {
    // Initial fetch
    fetchQueueData();

    // Set up polling interval
    const interval = setInterval(fetchQueueData, pollInterval);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, [fetchQueueData, pollInterval]);

  // Requeue DLQ message
  const requeueDLQMessage = useCallback(async (messageId: string) => {
    try {
      await queueApi.requeueDLQMessage(messageId);
      // Refetch DLQ list after requeue
      const updatedDlq = await queueApi.getDeadLetterQueue();
      setDlqMessages(updatedDlq);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to requeue message'));
    }
  }, []);

  return {
    metrics,
    stats,
    dlqMessages,
    computedStats,
    loading,
    error,
    refetch: fetchQueueData,
    requeueDLQMessage,
  };
}
