import { describe, it, expect, beforeEach, vi } from 'vitest';
import { auditApi } from '../audit';

global.fetch = vi.fn();

describe('auditApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLogs', () => {
    it('should fetch audit logs with default parameters', async () => {
      const mockLogs = [
        {
          id: 'audit_1',
          timestamp: '2025-11-14T10:00:00Z',
          user_id: 'user_1',
          action: 'create',
          resource_type: 'relay',
          resource_id: 'relay_1',
          before: null,
          after: { name: 'my-relay' },
          sensitivity: 'low',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: mockLogs }),
      });

      const result = await auditApi.getLogs();

      expect(result).toEqual(mockLogs);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/audit/logs'),
        expect.any(Object)
      );
    });

    it('should support filtering by user_id', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: [] }),
      });

      await auditApi.getLogs({ user_id: 'user_123' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('user_id=user_123'),
        expect.any(Object)
      );
    });

    it('should support filtering by action', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: [] }),
      });

      await auditApi.getLogs({ action: 'delete' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('action=delete'),
        expect.any(Object)
      );
    });

    it('should support filtering by resource_type', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: [] }),
      });

      await auditApi.getLogs({ resource_type: 'webhook' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('resource_type=webhook'),
        expect.any(Object)
      );
    });

    it('should support date range filtering', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: [] }),
      });

      const start = new Date('2025-11-01');
      const end = new Date('2025-11-14');
      await auditApi.getLogs({ start_date: start, end_date: end });

      const callUrl = (global.fetch as any).mock.calls[0][0];
      expect(callUrl).toContain('start_date=');
      expect(callUrl).toContain('end_date=');
    });

    it('should handle pagination', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: [] }),
      });

      await auditApi.getLogs({ limit: 50, offset: 100 });

      const callUrl = (global.fetch as any).mock.calls[0][0];
      expect(callUrl).toContain('limit=50');
      expect(callUrl).toContain('offset=100');
    });

    it('should throw error on failed request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(auditApi.getLogs()).rejects.toThrow();
    });
  });

  describe('getLogDetails', () => {
    it('should fetch audit log details by ID', async () => {
      const mockDetails = {
        id: 'audit_1',
        timestamp: '2025-11-14T10:00:00Z',
        user_id: 'user_1',
        action: 'update',
        resource_type: 'relay',
        resource_id: 'relay_1',
        before: { status: 'offline', uptime: '95%' },
        after: { status: 'online', uptime: '98%' },
        sensitivity: 'medium',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDetails,
      });

      const result = await auditApi.getLogDetails('audit_1');

      expect(result).toEqual(mockDetails);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/audit/logs/audit_1'),
        expect.any(Object)
      );
    });

    it('should throw error if log not found', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(auditApi.getLogDetails('invalid')).rejects.toThrow();
    });
  });

  describe('getLogsByResource', () => {
    it('should fetch audit logs for a specific resource', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: [] }),
      });

      await auditApi.getLogsByResource('relay', 'relay_1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/audit/logs/resource/relay_1'),
        expect.any(Object)
      );
    });
  });

  describe('getLogsByUser', () => {
    it('should fetch audit logs for a specific user', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: [] }),
      });

      await auditApi.getLogsByUser('user_1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/audit/logs/user/user_1'),
        expect.any(Object)
      );
    });
  });

  describe('searchLogs', () => {
    it('should search logs by query', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: [] }),
      });

      await auditApi.searchLogs({ query: 'relay deleted' });

      const callUrl = (global.fetch as any).mock.calls[0][0];
      expect(callUrl).toContain('query=relay%20deleted');
    });
  });

  describe('getSensitiveChanges', () => {
    it('should fetch only sensitive changes', async () => {
      const sensitiveChanges = [
        {
          id: 'audit_1',
          action: 'update',
          resource_type: 'vault_config',
          sensitivity: 'high',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: sensitiveChanges }),
      });

      const result = await auditApi.getSensitiveChanges();

      expect(result).toEqual(sensitiveChanges);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('sensitivity=high'),
        expect.any(Object)
      );
    });
  });
});
