/**
 * useRelays Hook
 * Custom hook for relay management with polling and real-time updates
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { relayApi, Relay, RelayMetrics } from "@/lib/api/relay";

interface UseRelaysOptions {
  pollInterval?: number; // milliseconds
  enabled?: boolean;
}

export function useRelays(options: UseRelaysOptions = {}) {
  const { pollInterval = 5000, enabled = true } = options;

  const [relays, setRelays] = useState<Relay[]>([]);
  const [metrics, setMetrics] = useState<RelayMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRelays = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    try {
      const [relaysData, metricsData] = await Promise.all([
        relayApi.listRelays(),
        relayApi.getRelayMetrics(),
      ]);
      setRelays(relaysData);
      setMetrics(metricsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch relays"));
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchRelays();
    const interval = setInterval(fetchRelays, pollInterval);
    return () => clearInterval(interval);
  }, [fetchRelays, pollInterval]);

  const stats = useMemo(() => {
    return {
      total: relays.length,
      healthy: relays.filter((r) => r.status === "HEALTHY").length,
      degraded: relays.filter((r) => r.status === "DEGRADED").length,
      offline: relays.filter((r) => r.status === "OFFLINE").length,
    };
  }, [relays]);

  const deleteRelay = useCallback(
    async (relayId: string) => {
      try {
        await relayApi.deleteRelay(relayId);
        setRelays((prev) => prev.filter((r) => r.id !== relayId));
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to delete relay"));
        throw err;
      }
    },
    []
  );

  const testRelay = useCallback(async (relayId: string) => {
    try {
      return await relayApi.testRelay(relayId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to test relay"));
      throw err;
    }
  }, []);

  const registerRelay = useCallback(async (data: any) => {
    try {
      const result = await relayApi.registerRelay(data);
      fetchRelays();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to register relay"));
      throw err;
    }
  }, [fetchRelays]);

  return {
    relays,
    metrics,
    stats,
    loading,
    error,
    fetchRelays,
    deleteRelay,
    testRelay,
    registerRelay,
  };
}
