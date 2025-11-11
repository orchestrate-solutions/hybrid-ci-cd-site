import { describe, it, expect, beforeEach, vi } from 'vitest';
import { logsApi } from '../logs';

// Mock fetch
global.fetch = vi.fn();

describe('logsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getJobLogs', () => {
    it('fetches job logs successfully', async () => {
      const jobId = 'job-123';
      const mockLogs = {
        job_id: jobId,
        log_lines: [
          '[INFO] Job started',
          '[INFO] Running step 1',
          '[INFO] Job completed',
        ],
        total_lines: 3,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLogs,
      });

      const result = await logsApi.getJobLogs(jobId);

      expect(result).toEqual(mockLogs);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/dashboard/jobs/${jobId}/logs`),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('throws error for non-existent job', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(logsApi.getJobLogs('nonexistent')).rejects.toThrow('Failed to fetch logs');
    });

    it('returns typed response with required fields', async () => {
      const mockLogs = {
        job_id: 'job-123',
        log_lines: ['Line 1', 'Line 2'],
        total_lines: 2,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLogs,
      });

      const result = await logsApi.getJobLogs('job-123');

      expect(result).toHaveProperty('job_id');
      expect(result).toHaveProperty('log_lines');
      expect(result).toHaveProperty('total_lines');
      expect(Array.isArray(result.log_lines)).toBe(true);
    });

    it('handles empty log lines', async () => {
      const mockLogs = {
        job_id: 'job-123',
        log_lines: [],
        total_lines: 0,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLogs,
      });

      const result = await logsApi.getJobLogs('job-123');

      expect(result.log_lines).toEqual([]);
      expect(result.total_lines).toBe(0);
    });

    it('supports offset and limit parameters', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ job_id: 'job-123', log_lines: [], total_lines: 0 }),
      });

      await logsApi.getJobLogs('job-123', { offset: 50, limit: 100 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('offset=50'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=100'),
        expect.any(Object)
      );
    });
  });
});
