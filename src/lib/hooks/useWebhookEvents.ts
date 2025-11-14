import { useState, useEffect, useCallback, useMemo } from 'react';
import { webhooksApi, WebhookEvent, EventDetails } from '../api/webhooks';

export function useWebhookEvents() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const data = await webhooksApi.getEvents();
        setEvents(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const filterByStatus = useCallback(
    (status: string) => events.filter((e) => e.status === status),
    [events]
  );

  const filterByProvider = useCallback(
    (provider: string) => events.filter((e) => e.provider === provider),
    [events]
  );

  const searchEvents = useCallback(
    (query: string) => {
      return events.filter(
        (e) =>
          e.id.includes(query) ||
          e.event_type.includes(query) ||
          e.provider.includes(query)
      );
    },
    [events]
  );

  const getCountByStatus = useCallback(() => {
    return events.reduce(
      (acc, e) => {
        acc[e.status as keyof typeof acc] = (acc[e.status as keyof typeof acc] || 0) + 1;
        return acc;
      },
      { success: 0, failed: 0, pending: 0 }
    );
  }, [events]);

  const retryEvent = useCallback(async (eventId: string) => {
    try {
      const result = await webhooksApi.retryEvent(eventId);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Retry failed'));
      return null;
    }
  }, []);

  const getRetryHistory = useCallback(async (eventId: string) => {
    try {
      const history = await webhooksApi.getRetryHistory(eventId);
      return history;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch retry history'));
      return null;
    }
  }, []);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const data = await webhooksApi.getEvents();
      setEvents(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  const getPaginated = useCallback(
    (page: number, pageSize: number) => {
      const start = (page - 1) * pageSize;
      return events.slice(start, start + pageSize);
    },
    [events]
  );

  const verifySignature = useCallback(async (eventId: string) => {
    try {
      const verification = await webhooksApi.verifySignature(eventId);
      return verification;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Verification failed'));
      return null;
    }
  }, []);

  return useMemo(
    () => ({
      events,
      loading,
      error,
      filterByStatus,
      filterByProvider,
      searchEvents,
      getCountByStatus,
      retryEvent,
      getRetryHistory,
      refetch,
      getPaginated,
      verifySignature,
    }),
    [events, loading, error, filterByStatus, filterByProvider, searchEvents, getCountByStatus, retryEvent, getRetryHistory, refetch, getPaginated, verifySignature]
  );
}
