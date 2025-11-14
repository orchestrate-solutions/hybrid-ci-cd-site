import { useEffect, useState, useCallback } from 'react';
import { relaysApi, RelayHealthMetrics } from '@/lib/api/relays';

/**
 * Custom hook for managing relay health data and state
 */
export function useRelayHealth() {
  const [relays, setRelays] = useState<RelayHealthMetrics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRelays = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await relaysApi.getHealthMetrics();
      setRelays(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setRelays([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRelays();
  }, [fetchRelays]);

  const refetch = useCallback(() => {
    fetchRelays();
  }, [fetchRelays]);

  const filterByStatus = useCallback(
    (status: 'online' | 'offline' | 'degraded') => {
      return relays.filter((relay) => relay.status === status);
    },
    [relays]
  );

  const getAverageUptime = useCallback(
    (period: '24h' | '7d' | '30d') => {
      if (relays.length === 0) return 0;
      const key = `uptime_${period}` as keyof RelayHealthMetrics;
      const sum = relays.reduce((acc, relay) => {
        const value = relay[key];
        return acc + (typeof value === 'number' ? value : 0);
      }, 0);
      return Math.round((sum / relays.length) * 100) / 100;
    },
    [relays]
  );

  const sortByResponseTime = useCallback(() => {
    return [...relays].sort(
      (a, b) => a.response_time_ms - b.response_time_ms
    );
  }, [relays]);

  return {
    relays,
    loading,
    error,
    refetch,
    filterByStatus,
    getAverageUptime,
    sortByResponseTime,
  };
}
