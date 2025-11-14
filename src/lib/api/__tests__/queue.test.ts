import { describe, it, expect, beforeEach, vi } from 'vitest';
import { queueApi } from '../queue';

describe('Queue API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('getMetrics', () => {
    it('should fetch queue metrics', async () => {
      const mockMetrics = {
        total_queued: 42,
        total_active: 5,
        total_completed: 1000,
        priority_breakdown: {
          CRITICAL: 5,
          HIGH: 10,
          NORMAL: 25,
          LOW: 2,
        },
        avg_wait_time_ms: 1250,
        throughput_per_minute: 15.5,
        dlq_count: 2,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetrics,
      });

      const result = await queueApi.getMetrics();
      expect(result).toEqual(mockMetrics);
    });

    it('should throw on fetch error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(queueApi.getMetrics()).rejects.toThrow();
    });
  });

  describe('getQueueStats', () => {
    it('should fetch queue statistics by priority', async () => {
      const mockStats = [
        { priority: 'CRITICAL', count: 5, oldest_age_ms: 45000 },
        { priority: 'HIGH', count: 10, oldest_age_ms: 120000 },
        { priority: 'NORMAL', count: 25, oldest_age_ms: 300000 },
        { priority: 'LOW', count: 2, oldest_age_ms: 500000 },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      });

      const result = await queueApi.getQueueStats();
      expect(result).toEqual(mockStats);
      expect(result).toHaveLength(4);
    });
  });

  describe('getDeadLetterQueue', () => {
    it('should fetch dead letter queue messages', async () => {
      const mockDLQ = [
        {
          id: 'dlq-1',
          original_job_id: 'job-123',
          error: 'Max retries exceeded',
          failed_at: new Date().toISOString(),
          retry_count: 3,
        },
        {
          id: 'dlq-2',
          original_job_id: 'job-456',
          error: 'Invalid payload',
          failed_at: new Date().toISOString(),
          retry_count: 1,
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDLQ,
      });

      const result = await queueApi.getDeadLetterQueue();
      expect(result).toHaveLength(2);
      expect(result[0].error).toBe('Max retries exceeded');
    });
  });

  describe('getPriorityBreakdown', () => {
    it('should fetch priority distribution', async () => {
      const mockBreakdown = {
        CRITICAL: { count: 5, percentage: 10 },
        HIGH: { count: 10, percentage: 20 },
        NORMAL: { count: 25, percentage: 50 },
        LOW: { count: 10, percentage: 20 },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBreakdown,
      });

      const result = await queueApi.getPriorityBreakdown();
      expect(result.CRITICAL.count).toBe(5);
      expect(result.CRITICAL.percentage).toBe(10);
    });
  });

  describe('getQueueHistory', () => {
    it('should fetch historical queue data', async () => {
      const mockHistory = [
        { timestamp: Date.now() - 60000, queued: 42, active: 5 },
        { timestamp: Date.now() - 120000, queued: 38, active: 6 },
        { timestamp: Date.now() - 180000, queued: 45, active: 4 },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistory,
      });

      const result = await queueApi.getQueueHistory();
      expect(result).toHaveLength(3);
    });
  });

  describe('requeueDLQMessage', () => {
    it('should requeue a dead letter message', async () => {
      const mockResult = { success: true, job_id: 'job-new-123' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      const result = await queueApi.requeueDLQMessage('dlq-1');
      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/queue/dlq/dlq-1/requeue'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });
});
