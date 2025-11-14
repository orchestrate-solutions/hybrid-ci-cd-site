import { describe, it, expect, beforeEach, vi } from 'vitest';
import { queueApi } from '../queue';

describe('queueApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('getMetrics', () => {
    it('should fetch queue metrics successfully', async () => {
      const mockMetrics = {
        total_depth: 1500,
        critical_depth: 50,
        high_depth: 200,
        normal_depth: 800,
        low_depth: 450,
        avg_age_ms: 2500,
        throughput_rps: 125.5,
        error_rate: 0.02,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetrics,
      });

      const result = await queueApi.getMetrics();
      expect(result).toEqual(mockMetrics);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/queue/metrics'),
        expect.any(Object)
      );
    });

    it('should throw error on failed fetch', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(queueApi.getMetrics()).rejects.toThrow();
    });
  });

  describe('getMetricsHistory', () => {
    it('should fetch metrics history with time range', async () => {
      const mockHistory = [
        { timestamp: '2024-01-01T00:00:00Z', depth: 1500, throughput: 120, avg_age: 2400 },
        { timestamp: '2024-01-01T01:00:00Z', depth: 1650, throughput: 130, avg_age: 2600 },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistory,
      });

      const result = await queueApi.getMetricsHistory('24h', '5m');
      expect(result).toEqual(mockHistory);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('timeRange=24h'),
        expect.any(Object)
      );
    });

    it('should support 7d and 30d time ranges', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await queueApi.getMetricsHistory('7d', '1h');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('timeRange=7d'),
        expect.any(Object)
      );
    });
  });

  describe('getDepthByPriority', () => {
    it('should fetch queue depth breakdown by priority', async () => {
      const mockDepth = {
        CRITICAL: 50,
        HIGH: 200,
        NORMAL: 800,
        LOW: 450,
        total: 1500,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDepth,
      });

      const result = await queueApi.getDepthByPriority();
      expect(result).toEqual(mockDepth);
      expect(result.CRITICAL).toBe(50);
    });
  });

  describe('getMessageAgeDistribution', () => {
    it('should fetch message age percentiles', async () => {
      const mockDistribution = {
        p50: 1200,
        p75: 1800,
        p95: 3200,
        p99: 5100,
        max: 15000,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDistribution,
      });

      const result = await queueApi.getMessageAgeDistribution();
      expect(result).toEqual(mockDistribution);
      expect(result.p99).toBe(5100);
    });
  });

  describe('getThroughputHistory', () => {
    it('should fetch throughput over time', async () => {
      const mockThroughput = [
        { timestamp: '2024-01-01T00:00:00Z', throughput_rps: 120 },
        { timestamp: '2024-01-01T01:00:00Z', throughput_rps: 135 },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockThroughput,
      });

      const result = await queueApi.getThroughputHistory('24h');
      expect(result).toEqual(mockThroughput);
    });
  });

  describe('getDLQStats', () => {
    it('should fetch dead letter queue statistics', async () => {
      const mockDLQ = {
        total_messages: 250,
        failed_retries: 150,
        max_retries_exceeded: 100,
        oldest_message_age_ms: 86400000,
        error_types: [
          { type: 'timeout', count: 80 },
          { type: 'invalid_payload', count: 70 },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDLQ,
      });

      const result = await queueApi.getDLQStats();
      expect(result.total_messages).toBe(250);
      expect(result.error_types).toHaveLength(2);
    });
  });

  describe('retryDLQMessage', () => {
    it('should retry a dead letter queue message', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await queueApi.retryDLQMessage('msg-123');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/queue/dlq/msg-123/retry'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('getQueueWarnings', () => {
    it('should fetch queue warnings', async () => {
      const mockWarnings = [
        { type: 'high_depth', severity: 'warning', message: 'Queue depth exceeds 50%' },
        { type: 'old_messages', severity: 'critical', message: 'Messages older than 24h' },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockWarnings,
      });

      const result = await queueApi.getQueueWarnings();
      expect(result).toHaveLength(2);
      expect(result[1].severity).toBe('critical');
    });
  });
});
