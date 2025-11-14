import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWebhookEvents } from '../useWebhookEvents';
import * as webhooksApi from '../../api/webhooks';

vi.mock('../../api/webhooks');

describe('useWebhookEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    (webhooksApi.getEvents as any).mockResolvedValue([]);

    const { result } = renderHook(() => useWebhookEvents());

    expect(result.current.loading).toBe(true);
    expect(result.current.events).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should fetch events on mount', async () => {
    const mockEvents = [
      {
        id: 'evt_1',
        timestamp: '2025-11-14T10:00:00Z',
        provider: 'github',
        event_type: 'push',
        status: 'success',
        payload_hash: 'hash1',
        delivery_status: 'delivered',
        retry_count: 0,
      },
    ];

    (webhooksApi.getEvents as any).mockResolvedValue(mockEvents);

    const { result } = renderHook(() => useWebhookEvents());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.events).toEqual(mockEvents);
  });

  it('should handle fetch errors', async () => {
    const testError = new Error('Network error');
    (webhooksApi.getEvents as any).mockRejectedValue(testError);

    const { result } = renderHook(() => useWebhookEvents());

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.loading).toBe(false);
  });

  it('should filter events by status', async () => {
    const mockEvents = [
      { id: 'evt_1', status: 'success', delivery_status: 'delivered' } as any,
      { id: 'evt_2', status: 'failed', delivery_status: 'failed' } as any,
      { id: 'evt_3', status: 'success', delivery_status: 'delivered' } as any,
    ];

    (webhooksApi.getEvents as any).mockResolvedValue(mockEvents);

    const { result } = renderHook(() => useWebhookEvents());

    await waitFor(() => {
      expect(result.current.events).toHaveLength(3);
    });

    const filtered = result.current.filterByStatus('success');
    expect(filtered).toHaveLength(2);
    expect(filtered.every((e) => e.status === 'success')).toBe(true);
  });

  it('should filter events by provider', async () => {
    const mockEvents = [
      { id: 'evt_1', provider: 'github' } as any,
      { id: 'evt_2', provider: 'gitlab' } as any,
      { id: 'evt_3', provider: 'github' } as any,
    ];

    (webhooksApi.getEvents as any).mockResolvedValue(mockEvents);

    const { result } = renderHook(() => useWebhookEvents());

    await waitFor(() => {
      expect(result.current.events).toHaveLength(3);
    });

    const filtered = result.current.filterByProvider('github');
    expect(filtered).toHaveLength(2);
  });

  it('should search events by query', async () => {
    const mockEvents = [
      { id: 'evt_1', event_type: 'push', provider: 'github' } as any,
      { id: 'evt_2', event_type: 'pull_request', provider: 'github' } as any,
    ];

    (webhooksApi.getEvents as any).mockResolvedValue(mockEvents);

    const { result } = renderHook(() => useWebhookEvents());

    await waitFor(() => {
      expect(result.current.events).toHaveLength(2);
    });

    const results = result.current.searchEvents('pull_request');
    expect(results).toHaveLength(1);
    expect(results[0].event_type).toBe('pull_request');
  });

  it('should get event count by status', async () => {
    const mockEvents = [
      { id: 'evt_1', status: 'success', delivery_status: 'delivered' } as any,
      { id: 'evt_2', status: 'failed', delivery_status: 'failed' } as any,
      { id: 'evt_3', status: 'success', delivery_status: 'delivered' } as any,
    ];

    (webhooksApi.getEvents as any).mockResolvedValue(mockEvents);

    const { result } = renderHook(() => useWebhookEvents());

    await waitFor(() => {
      expect(result.current.events).toHaveLength(3);
    });

    const counts = result.current.getCountByStatus();
    expect(counts.success).toBe(2);
    expect(counts.failed).toBe(1);
  });

  it('should retry an event', async () => {
    (webhooksApi.getEvents as any).mockResolvedValue([
      { id: 'evt_1', status: 'failed' } as any,
    ]);
    (webhooksApi.retryEvent as any).mockResolvedValue({ success: true, retry_id: 'retry_1' });

    const { result } = renderHook(() => useWebhookEvents());

    await waitFor(() => {
      expect(result.current.events).toHaveLength(1);
    });

    let retryResult;
    await act(async () => {
      retryResult = await result.current.retryEvent('evt_1');
    });

    expect(retryResult?.success).toBe(true);
    expect(webhooksApi.retryEvent).toHaveBeenCalledWith('evt_1');
  });

  it('should get retry history for an event', async () => {
    const mockHistory = [
      { retry_id: 'retry_1', timestamp: '2025-11-14T10:01:00Z', status: 'failed' },
      { retry_id: 'retry_2', timestamp: '2025-11-14T10:05:00Z', status: 'success' },
    ];

    (webhooksApi.getRetryHistory as any).mockResolvedValue(mockHistory);

    const { result } = renderHook(() => useWebhookEvents());

    let history;
    await act(async () => {
      history = await result.current.getRetryHistory('evt_1');
    });

    expect(history).toHaveLength(2);
    expect(history?.[1].status).toBe('success');
  });

  it('should refetch events', async () => {
    const mockEvents = [{ id: 'evt_1', status: 'success' } as any];

    (webhooksApi.getEvents as any).mockResolvedValue(mockEvents);

    const { result } = renderHook(() => useWebhookEvents());

    await waitFor(() => {
      expect(result.current.events).toHaveLength(1);
    });

    vi.clearAllMocks();
    (webhooksApi.getEvents as any).mockResolvedValue([...mockEvents, { id: 'evt_2' } as any]);

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.events).toHaveLength(2);
    });
  });

  it('should get pagination info', async () => {
    const mockEvents = Array.from({ length: 100 }, (_, i) => ({
      id: `evt_${i}`,
      status: 'success',
    } as any));

    (webhooksApi.getEvents as any).mockResolvedValue(mockEvents);

    const { result } = renderHook(() => useWebhookEvents());

    await waitFor(() => {
      expect(result.current.events).toHaveLength(100);
    });

    const paginated = result.current.getPaginated(1, 20);
    expect(paginated).toHaveLength(20);
    expect(paginated[0].id).toBe('evt_0');
    expect(paginated[19].id).toBe('evt_19');
  });

  it('should verify event signature', async () => {
    (webhooksApi.verifySignature as any).mockResolvedValue({
      valid: true,
      verified_at: '2025-11-14T10:00:00Z',
    });

    const { result } = renderHook(() => useWebhookEvents());

    let verification;
    await act(async () => {
      verification = await result.current.verifySignature('evt_1');
    });

    expect(verification?.valid).toBe(true);
  });
});
