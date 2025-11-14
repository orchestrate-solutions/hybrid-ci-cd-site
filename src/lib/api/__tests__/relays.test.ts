import { describe, it, expect, beforeEach, vi } from 'vitest';
import { relaysApi, RelayHealthMetrics } from '../relays';

describe('relaysApi', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  describe('getHealthMetrics', () => {
    it('should fetch and return all relay health metrics', async () => {
      const mockRelays: RelayHealthMetrics[] = [
        {
          relay_id: 'relay-1',
          name: 'Production Relay',
          status: 'online',
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

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ relays: mockRelays }),
      });

      const result = await relaysApi.getHealthMetrics();
      expect(result).toEqual(mockRelays);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/relays/health'
      );
    });

    it('should handle empty relay list', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ relays: [] }),
      });

      const result = await relaysApi.getHealthMetrics();
      expect(result).toEqual([]);
    });

    it('should throw error on fetch failure', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(relaysApi.getHealthMetrics()).rejects.toThrow(
        'Failed to fetch relay health: 500'
      );
    });
  });

  describe('getRelayHealth', () => {
    it('should fetch health metrics for specific relay', async () => {
      const mockHealth: RelayHealthMetrics = {
        relay_id: 'relay-1',
        name: 'Production Relay',
        status: 'online',
        uptime_24h: 99.9,
        uptime_7d: 99.95,
        uptime_30d: 99.9,
        response_time_ms: 45,
        error_rate: 0.1,
        throughput_msgs_sec: 1200,
        last_heartbeat: new Date().toISOString(),
        region: 'us-east-1',
        environment: 'prod',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockHealth,
      });

      const result = await relaysApi.getRelayHealth('relay-1');
      expect(result).toEqual(mockHealth);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/relays/relay-1/health'
      );
    });
  });

  describe('getRelayMetricsHistory', () => {
    it('should fetch metrics history with default parameters', async () => {
      const mockHistory = [
        {
          relay_id: 'relay-1',
          timestamp: new Date().toISOString(),
          response_time_ms: 45,
          error_count: 0,
          message_count: 1200,
        },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ metrics: mockHistory }),
      });

      const result = await relaysApi.getRelayMetricsHistory('relay-1');
      expect(result).toEqual(mockHistory);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('relay-1/metrics/history')
      );
    });

    it('should accept custom time range and interval', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ metrics: [] }),
      });

      await relaysApi.getRelayMetricsHistory('relay-1', '7d', 'day');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('time_range=7d')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('interval=day')
      );
    });
  });

  describe('getRelayRecommendations', () => {
    it('should fetch recommendations for a relay', async () => {
      const mockRecommendations = [
        {
          relay_id: 'relay-1',
          type: 'scale-up' as const,
          severity: 'warning' as const,
          description: 'High CPU usage detected',
          projected_improvement: 25,
        },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ recommendations: mockRecommendations }),
      });

      const result = await relaysApi.getRelayRecommendations('relay-1');
      expect(result).toEqual(mockRecommendations);
    });
  });

  describe('getRelayAlertHistory', () => {
    it('should fetch alert history with default limit', async () => {
      const mockAlerts = [
        {
          alert_id: 'alert-1',
          relay_id: 'relay-1',
          timestamp: new Date().toISOString(),
          alert_type: 'latency_spike' as const,
          severity: 'warning' as const,
          message: 'Response time exceeded threshold',
          resolved_at: new Date().toISOString(),
        },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ alerts: mockAlerts }),
      });

      const result = await relaysApi.getRelayAlertHistory('relay-1');
      expect(result).toEqual(mockAlerts);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=50')
      );
    });

    it('should accept custom limit', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ alerts: [] }),
      });

      await relaysApi.getRelayAlertHistory('relay-1', 100);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=100')
      );
    });
  });

  describe('getSystemRecommendations', () => {
    it('should fetch recommendations for all relays', async () => {
      const mockRecommendations = [
        {
          relay_id: 'relay-1',
          type: 'scale-up' as const,
          severity: 'info' as const,
          description: 'Increased throughput detected',
          projected_improvement: 15,
        },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ recommendations: mockRecommendations }),
      });

      const result = await relaysApi.getSystemRecommendations();
      expect(result).toEqual(mockRecommendations);
    });
  });
});
