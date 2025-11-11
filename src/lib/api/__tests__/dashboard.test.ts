import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dashboardApi } from '../dashboard';

// Mock fetch
global.fetch = vi.fn();

describe('dashboardApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSummary', () => {
    it('fetches dashboard summary successfully', async () => {
      const mockSummary = {
        jobs_running: 5,
        jobs_failed_today: 2,
        deployments_today: 3,
        agents_healthy: 8,
        agents_total: 10,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSummary,
      });

      const result = await dashboardApi.getSummary();

      expect(result).toEqual(mockSummary);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/dashboard/summary'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('throws error when API returns non-ok status', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(dashboardApi.getSummary()).rejects.toThrow('Failed to fetch dashboard summary');
    });

    it('handles network errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(dashboardApi.getSummary()).rejects.toThrow('Network error');
    });

    it('returns typed response with all required fields', async () => {
      const mockSummary = {
        jobs_running: 0,
        jobs_failed_today: 0,
        deployments_today: 0,
        agents_healthy: 0,
        agents_total: 0,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSummary,
      });

      const result = await dashboardApi.getSummary();

      expect(result).toHaveProperty('jobs_running');
      expect(result).toHaveProperty('jobs_failed_today');
      expect(result).toHaveProperty('deployments_today');
      expect(result).toHaveProperty('agents_healthy');
      expect(result).toHaveProperty('agents_total');
    });
  });
});
