import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRelayHealth } from '../useRelayHealth';
import * as relaysApi from '@/lib/api/relays';

vi.mock('@/lib/api/relays');

describe('useRelayHealth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch relay health metrics on mount', async () => {
    const mockMetrics = [
      {
        relay_id: 'relay-1',
        name: 'Prod Relay',
        status: 'online' as const,
        uptime_24h: 99.9,
        uptime_7d: 99.95,
        uptime_30d: 99.9,
        response_time_ms: 45,
        error_rate: 0.1,
        throughput_msgs_sec: 1200,
        last_heartbeat: new Date().toISOString(),
        region: 'us-east-1',
        environment: 'prod',
      },
    ];

    vi.spyOn(relaysApi, 'relaysApi', 'get').mockReturnValue({
      getHealthMetrics: vi.fn().mockResolvedValue(mockMetrics),
    } as any);

    const { result } = renderHook(() => useRelayHealth());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.relays).toEqual(mockMetrics);
    expect(result.current.error).toBeNull();
  });

  it('should handle loading state', async () => {
    vi.spyOn(relaysApi, 'relaysApi', 'get').mockReturnValue({
      getHealthMetrics: vi.fn(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve([
                  {
                    relay_id: 'relay-1',
                    name: 'Test',
                    status: 'online' as const,
                    uptime_24h: 99.9,
                    uptime_7d: 99.95,
                    uptime_30d: 99.9,
                    response_time_ms: 45,
                    error_rate: 0.1,
                    throughput_msgs_sec: 1200,
                    last_heartbeat: new Date().toISOString(),
                    region: 'us-east-1',
                    environment: 'prod',
                  },
                ]),
              10
            )
          )
      ),
    } as any);

    const { result } = renderHook(() => useRelayHealth());

    expect(result.current.loading).toBe(true);
    expect(result.current.relays).toEqual([]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should handle errors gracefully', async () => {
    const errorMessage = 'Failed to fetch relays';
    vi.spyOn(relaysApi, 'relaysApi', 'get').mockReturnValue({
      getHealthMetrics: vi
        .fn()
        .mockRejectedValue(new Error(errorMessage)),
    } as any);

    const { result } = renderHook(() => useRelayHealth());

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error?.message).toBe(errorMessage);
    expect(result.current.relays).toEqual([]);
  });

  it('should provide refetch function', async () => {
    const mockMetrics = [
      {
        relay_id: 'relay-1',
        name: 'Test',
        status: 'online' as const,
        uptime_24h: 99.9,
        uptime_7d: 99.95,
        uptime_30d: 99.9,
        response_time_ms: 45,
        error_rate: 0.1,
        throughput_msgs_sec: 1200,
        last_heartbeat: new Date().toISOString(),
        region: 'us-east-1',
        environment: 'prod',
      },
    ];

    const mockFetch = vi
      .fn()
      .mockResolvedValue(mockMetrics);

    vi.spyOn(relaysApi, 'relaysApi', 'get').mockReturnValue({
      getHealthMetrics: mockFetch,
    } as any);

    const { result } = renderHook(() => useRelayHealth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);

    result.current.refetch();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  it('should filter relays by status', async () => {
    const mockMetrics = [
      {
        relay_id: 'relay-1',
        name: 'Online',
        status: 'online' as const,
        uptime_24h: 99.9,
        uptime_7d: 99.95,
        uptime_30d: 99.9,
        response_time_ms: 45,
        error_rate: 0.1,
        throughput_msgs_sec: 1200,
        last_heartbeat: new Date().toISOString(),
        region: 'us-east-1',
        environment: 'prod',
      },
      {
        relay_id: 'relay-2',
        name: 'Offline',
        status: 'offline' as const,
        uptime_24h: 50,
        uptime_7d: 60,
        uptime_30d: 70,
        response_time_ms: 0,
        error_rate: 100,
        throughput_msgs_sec: 0,
        last_heartbeat: new Date(Date.now() - 3600000).toISOString(),
        region: 'us-west-2',
        environment: 'prod',
      },
    ];

    vi.spyOn(relaysApi, 'relaysApi', 'get').mockReturnValue({
      getHealthMetrics: vi.fn().mockResolvedValue(mockMetrics),
    } as any);

    const { result } = renderHook(() => useRelayHealth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const onlineRelays = result.current.filterByStatus('online');
    expect(onlineRelays).toHaveLength(1);
    expect(onlineRelays[0].relay_id).toBe('relay-1');

    const offlineRelays = result.current.filterByStatus('offline');
    expect(offlineRelays).toHaveLength(1);
    expect(offlineRelays[0].relay_id).toBe('relay-2');
  });

  it('should calculate average uptime across relays', async () => {
    const mockMetrics = [
      {
        relay_id: 'relay-1',
        name: 'Test1',
        status: 'online' as const,
        uptime_24h: 100,
        uptime_7d: 99.95,
        uptime_30d: 99.9,
        response_time_ms: 45,
        error_rate: 0.1,
        throughput_msgs_sec: 1200,
        last_heartbeat: new Date().toISOString(),
        region: 'us-east-1',
        environment: 'prod',
      },
      {
        relay_id: 'relay-2',
        name: 'Test2',
        status: 'online' as const,
        uptime_24h: 98,
        uptime_7d: 99.95,
        uptime_30d: 99.9,
        response_time_ms: 45,
        error_rate: 0.1,
        throughput_msgs_sec: 1200,
        last_heartbeat: new Date().toISOString(),
        region: 'us-west-2',
        environment: 'staging',
      },
    ];

    vi.spyOn(relaysApi, 'relaysApi', 'get').mockReturnValue({
      getHealthMetrics: vi.fn().mockResolvedValue(mockMetrics),
    } as any);

    const { result } = renderHook(() => useRelayHealth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const avgUptime = result.current.getAverageUptime('24h');
    expect(avgUptime).toBe(99); // (100 + 98) / 2
  });

  it('should sort relays by response time', async () => {
    const mockMetrics = [
      {
        relay_id: 'relay-1',
        name: 'Slow',
        status: 'online' as const,
        uptime_24h: 99.9,
        uptime_7d: 99.95,
        uptime_30d: 99.9,
        response_time_ms: 200,
        error_rate: 0.1,
        throughput_msgs_sec: 1200,
        last_heartbeat: new Date().toISOString(),
        region: 'us-east-1',
        environment: 'prod',
      },
      {
        relay_id: 'relay-2',
        name: 'Fast',
        status: 'online' as const,
        uptime_24h: 99.9,
        uptime_7d: 99.95,
        uptime_30d: 99.9,
        response_time_ms: 45,
        error_rate: 0.1,
        throughput_msgs_sec: 1200,
        last_heartbeat: new Date().toISOString(),
        region: 'us-west-2',
        environment: 'staging',
      },
    ];

    vi.spyOn(relaysApi, 'relaysApi', 'get').mockReturnValue({
      getHealthMetrics: vi.fn().mockResolvedValue(mockMetrics),
    } as any);

    const { result } = renderHook(() => useRelayHealth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const sorted = result.current.sortByResponseTime();
    expect(sorted[0].response_time_ms).toBe(45);
    expect(sorted[1].response_time_ms).toBe(200);
  });
});
