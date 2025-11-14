import { describe, it, expect, beforeEach, vi } from 'vitest';
import { webhooksApi } from '../webhooks';

// Mock fetch
global.fetch = vi.fn();

describe('webhooksApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEvents', () => {
    it('should fetch webhook events with default parameters', async () => {
      const mockEvents = [
        {
          id: 'evt_1',
          timestamp: '2025-11-14T10:00:00Z',
          provider: 'github',
          event_type: 'push',
          status: 'success',
          payload_hash: 'sha256_abc123',
          delivery_status: 'delivered',
          retry_count: 0,
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events: mockEvents }),
      });

      const result = await webhooksApi.getEvents();

      expect(result).toEqual(mockEvents);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/webhooks/events'),
        expect.any(Object)
      );
    });

    it('should support filtering by status', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events: [] }),
      });

      await webhooksApi.getEvents({ status: 'failed' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=failed'),
        expect.any(Object)
      );
    });

    it('should support date range filtering', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events: [] }),
      });

      const start = new Date('2025-11-01');
      const end = new Date('2025-11-14');
      await webhooksApi.getEvents({ start_date: start, end_date: end });

      const callUrl = (global.fetch as any).mock.calls[0][0];
      expect(callUrl).toContain('start_date=');
      expect(callUrl).toContain('end_date=');
    });

    it('should handle pagination', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events: [] }),
      });

      await webhooksApi.getEvents({ limit: 50, offset: 100 });

      const callUrl = (global.fetch as any).mock.calls[0][0];
      expect(callUrl).toContain('limit=50');
      expect(callUrl).toContain('offset=100');
    });

    it('should throw error on failed request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(webhooksApi.getEvents()).rejects.toThrow();
    });
  });

  describe('getEventDetails', () => {
    it('should fetch event details by ID', async () => {
      const mockDetails = {
        id: 'evt_1',
        timestamp: '2025-11-14T10:00:00Z',
        provider: 'github',
        event_type: 'push',
        status: 'success',
        payload_hash: 'sha256_abc123',
        delivery_status: 'delivered',
        retry_count: 0,
        signature_verified: true,
        retry_history: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDetails,
      });

      const result = await webhooksApi.getEventDetails('evt_1');

      expect(result).toEqual(mockDetails);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/webhooks/events/evt_1'),
        expect.any(Object)
      );
    });

    it('should throw error if event not found', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(webhooksApi.getEventDetails('invalid')).rejects.toThrow();
    });
  });

  describe('getPayloadPreview', () => {
    it('should fetch sanitized payload preview', async () => {
      const mockPayload = {
        repository: 'my-repo',
        branch: 'main',
        // No secrets should be included
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPayload,
      });

      const result = await webhooksApi.getPayloadPreview('evt_1');

      expect(result).toEqual(mockPayload);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/webhooks/events/evt_1/payload'),
        expect.any(Object)
      );
    });

    it('should NOT include sensitive fields in payload', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ repository: 'repo' }),
      });

      const result = await webhooksApi.getPayloadPreview('evt_1');

      // Verify no API keys, tokens, or secrets
      expect(JSON.stringify(result)).not.toMatch(/token|secret|key|password/i);
    });
  });

  describe('retryEvent', () => {
    it('should retry webhook delivery', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, retry_id: 'retry_1' }),
      });

      const result = await webhooksApi.retryEvent('evt_1');

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/webhooks/events/evt_1/retry'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should handle retry failure gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      await expect(webhooksApi.retryEvent('evt_1')).rejects.toThrow();
    });
  });

  describe('searchEvents', () => {
    it('should search events by provider and event_type', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events: [] }),
      });

      await webhooksApi.searchEvents({ provider: 'github', event_type: 'push' });

      const callUrl = (global.fetch as any).mock.calls[0][0];
      expect(callUrl).toContain('provider=github');
      expect(callUrl).toContain('event_type=push');
    });

    it('should support full-text search', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events: [] }),
      });

      await webhooksApi.searchEvents({ query: 'deployment-failed' });

      const callUrl = (global.fetch as any).mock.calls[0][0];
      expect(callUrl).toContain('query=deployment-failed');
    });
  });

  describe('getRetryHistory', () => {
    it('should fetch retry history for event', async () => {
      const mockHistory = [
        { retry_id: 'retry_1', timestamp: '2025-11-14T10:01:00Z', status: 'failed' },
        { retry_id: 'retry_2', timestamp: '2025-11-14T10:05:00Z', status: 'success' },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ retries: mockHistory }),
      });

      const result = await webhooksApi.getRetryHistory('evt_1');

      expect(result).toEqual(mockHistory);
      expect(result).toHaveLength(2);
      expect(result[1].status).toBe('success');
    });

    it('should return empty array if no retries', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ retries: [] }),
      });

      const result = await webhooksApi.getRetryHistory('evt_new');

      expect(result).toEqual([]);
    });
  });

  describe('verifySignature', () => {
    it('should verify webhook signature', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true, verified_at: '2025-11-14T10:00:00Z' }),
      });

      const result = await webhooksApi.verifySignature('evt_1');

      expect(result.valid).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/webhooks/events/evt_1/verify'),
        expect.any(Object)
      );
    });

    it('should detect invalid signatures', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: false, verified_at: '2025-11-14T10:00:00Z' }),
      });

      const result = await webhooksApi.verifySignature('evt_bad');

      expect(result.valid).toBe(false);
    });
  });
});
