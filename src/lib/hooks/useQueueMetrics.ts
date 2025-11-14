import { useState, useEffect, useCallback } from 'react';
import { queueApi, type QueueMetrics, type DLQStats } from '@/lib/api/queue';

export default function useQueueMetrics() {
  const [metrics, setMetrics] = useState<QueueMetrics | null>(null);
  const [dlqStats, setDLQStats] = useState<DLQStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const [metricsData, dlqData] = await Promise.all([queueApi.getMetrics(), queueApi.getDLQStats()]);
      setMetrics(metricsData);
      setDLQStats(dlqData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch metrics'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const refetch = useCallback(async () => {
    await fetchMetrics();
  }, [fetchMetrics]);

  const getDepthPercentages = useCallback(() => {
    if (!metrics) return { CRITICAL: 0, HIGH: 0, NORMAL: 0, LOW: 0 };
    const total = metrics.total_depth || 1;
    return {
      CRITICAL: (metrics.critical_depth / total) * 100,
      HIGH: (metrics.high_depth / total) * 100,
      NORMAL: (metrics.normal_depth / total) * 100,
      LOW: (metrics.low_depth / total) * 100,
    };
  }, [metrics]);

  const filterByPriority = useCallback(
    (priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW') => {
      if (!metrics) return null;
      return metrics[`${priority.toLowerCase()}_depth`];
    },
    [metrics]
  );

  const getAverageLatency = useCallback(() => {
    return metrics?.avg_age_ms || 0;
  }, [metrics]);

  const getThroughputHistory = useCallback(async (timeRange: '24h' | '7d' | '30d' = '24h') => {
    return queueApi.getThroughputHistory(timeRange);
  }, []);

  const getQueueWarnings = useCallback(async () => {
    return queueApi.getQueueWarnings();
  }, []);

  const getDLQStatsFormatted = useCallback(() => {
    if (!dlqStats) return null;
    return {
      ...dlqStats,
      oldestAgeFormatted:
        dlqStats.oldest_message_age_ms > 86400000
          ? `${Math.floor(dlqStats.oldest_message_age_ms / 86400000)} day(s)`
          : `${Math.floor(dlqStats.oldest_message_age_ms / 3600000)} hour(s)`,
    };
  }, [dlqStats]);

  return {
    metrics,
    dlqStats: getDLQStatsFormatted(),
    loading,
    error,
    refetch,
    getDepthPercentages,
    filterByPriority,
    getAverageLatency,
    getThroughputHistory,
    getQueueWarnings,
  };
}
