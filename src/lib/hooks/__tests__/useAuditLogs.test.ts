import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuditLogs } from '../useAuditLogs';
import * as auditApi from '../../api/audit';

vi.mock('../../api/audit');

describe('useAuditLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    (auditApi.getLogs as any).mockResolvedValue([]);

    const { result } = renderHook(() => useAuditLogs());

    expect(result.current.loading).toBe(true);
    expect(result.current.logs).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should fetch audit logs on mount', async () => {
    const mockLogs = [
      {
        id: 'audit_1',
        timestamp: '2025-11-14T10:00:00Z',
        user_id: 'user_1',
        action: 'create',
        resource_type: 'relay',
        resource_id: 'relay_1',
        before: null,
        after: { name: 'relay' },
        sensitivity: 'low',
      },
    ];

    (auditApi.getLogs as any).mockResolvedValue(mockLogs);

    const { result } = renderHook(() => useAuditLogs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.logs).toEqual(mockLogs);
  });

  it('should handle fetch errors', async () => {
    const testError = new Error('Network error');
    (auditApi.getLogs as any).mockRejectedValue(testError);

    const { result } = renderHook(() => useAuditLogs());

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.loading).toBe(false);
  });

  it('should filter logs by action', async () => {
    const mockLogs = [
      { id: 'audit_1', action: 'create', resource_type: 'relay' } as any,
      { id: 'audit_2', action: 'update', resource_type: 'relay' } as any,
      { id: 'audit_3', action: 'delete', resource_type: 'webhook' } as any,
    ];

    (auditApi.getLogs as any).mockResolvedValue(mockLogs);

    const { result } = renderHook(() => useAuditLogs());

    await waitFor(() => {
      expect(result.current.logs).toHaveLength(3);
    });

    const filtered = result.current.filterByAction('create');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].action).toBe('create');
  });

  it('should filter logs by user', async () => {
    const mockLogs = [
      { id: 'audit_1', user_id: 'user_1', action: 'create' } as any,
      { id: 'audit_2', user_id: 'user_2', action: 'update' } as any,
      { id: 'audit_3', user_id: 'user_1', action: 'delete' } as any,
    ];

    (auditApi.getLogs as any).mockResolvedValue(mockLogs);

    const { result } = renderHook(() => useAuditLogs());

    await waitFor(() => {
      expect(result.current.logs).toHaveLength(3);
    });

    const filtered = result.current.filterByUser('user_1');
    expect(filtered).toHaveLength(2);
  });

  it('should filter logs by resource type', async () => {
    const mockLogs = [
      { id: 'audit_1', resource_type: 'relay' } as any,
      { id: 'audit_2', resource_type: 'webhook' } as any,
      { id: 'audit_3', resource_type: 'relay' } as any,
    ];

    (auditApi.getLogs as any).mockResolvedValue(mockLogs);

    const { result } = renderHook(() => useAuditLogs());

    await waitFor(() => {
      expect(result.current.logs).toHaveLength(3);
    });

    const filtered = result.current.filterByResourceType('relay');
    expect(filtered).toHaveLength(2);
  });

  it('should get count by action', async () => {
    const mockLogs = [
      { id: 'audit_1', action: 'create' } as any,
      { id: 'audit_2', action: 'update' } as any,
      { id: 'audit_3', action: 'create' } as any,
    ];

    (auditApi.getLogs as any).mockResolvedValue(mockLogs);

    const { result } = renderHook(() => useAuditLogs());

    await waitFor(() => {
      expect(result.current.logs).toHaveLength(3);
    });

    const counts = result.current.getCountByAction();
    expect(counts.create).toBe(2);
    expect(counts.update).toBe(1);
  });

  it('should identify sensitive changes', async () => {
    const mockLogs = [
      { id: 'audit_1', sensitivity: 'low' } as any,
      { id: 'audit_2', sensitivity: 'high' } as any,
      { id: 'audit_3', sensitivity: 'high' } as any,
    ];

    (auditApi.getLogs as any).mockResolvedValue(mockLogs);

    const { result } = renderHook(() => useAuditLogs());

    await waitFor(() => {
      expect(result.current.logs).toHaveLength(3);
    });

    const sensitive = result.current.getSensitiveChanges();
    expect(sensitive).toHaveLength(2);
    expect(sensitive.every((log: any) => log.sensitivity === 'high')).toBe(true);
  });

  it('should refetch logs', async () => {
    (auditApi.getLogs as any).mockResolvedValue([
      { id: 'audit_1', action: 'create' } as any,
    ]);

    const { result } = renderHook(() => useAuditLogs());

    await waitFor(() => {
      expect(result.current.logs).toHaveLength(1);
    });

    vi.clearAllMocks();
    (auditApi.getLogs as any).mockResolvedValue([
      { id: 'audit_1', action: 'create' } as any,
      { id: 'audit_2', action: 'update' } as any,
    ]);

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.logs).toHaveLength(2);
    });
  });

  it('should paginate logs', async () => {
    const mockLogs = Array.from({ length: 100 }, (_, i) => ({
      id: `audit_${i}`,
      action: 'create',
    } as any));

    (auditApi.getLogs as any).mockResolvedValue(mockLogs);

    const { result } = renderHook(() => useAuditLogs());

    await waitFor(() => {
      expect(result.current.logs).toHaveLength(100);
    });

    const paginated = result.current.getPaginated(1, 20);
    expect(paginated).toHaveLength(20);
    expect(paginated[0].id).toBe('audit_0');
  });

  it('should format before/after values with redaction', async () => {
    const mockLogs = [
      {
        id: 'audit_1',
        before: { password: 'secret123', api_key: 'sk_xxx' },
        after: { password: 'new_secret', api_key: 'sk_yyy' },
        sensitivity: 'high',
      } as any,
    ];

    (auditApi.getLogs as any).mockResolvedValue(mockLogs);

    const { result } = renderHook(() => useAuditLogs());

    await waitFor(() => {
      expect(result.current.logs).toHaveLength(1);
    });

    const formatted = result.current.getFormattedChange(mockLogs[0]);
    expect(formatted.before.password).toBe('[REDACTED]');
    expect(formatted.before.api_key).toBe('[REDACTED]');
  });

  it('should export logs as CSV', async () => {
    const mockLogs = [
      {
        id: 'audit_1',
        timestamp: '2025-11-14T10:00:00Z',
        user_id: 'user_1',
        action: 'create',
        resource_type: 'relay',
      } as any,
    ];

    (auditApi.getLogs as any).mockResolvedValue(mockLogs);

    const { result } = renderHook(() => useAuditLogs());

    await waitFor(() => {
      expect(result.current.logs).toHaveLength(1);
    });

    const csv = result.current.exportAsCSV();
    expect(csv).toContain('audit_1');
    expect(csv).toContain('create');
    expect(csv).toContain('relay');
  });
});
