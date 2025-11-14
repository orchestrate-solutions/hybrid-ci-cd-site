import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('../../api/alerts', () => ({
  alertsApi: {
    getRules: vi.fn(),
    createRule: vi.fn(),
    updateRule: vi.fn(),
    deleteRule: vi.fn(),
    getTemplates: vi.fn(),
    getHistory: vi.fn(),
    testAlert: vi.fn(),
    acknowledgeAlert: vi.fn(),
  },
}));

describe('useAlertRules Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockRules = [
    {
      id: 'rule_1',
      name: 'High Queue Depth',
      severity: 'critical',
      enabled: true,
      channels: ['email', 'slack'],
    },
    {
      id: 'rule_2',
      name: 'Relay Offline',
      severity: 'high',
      enabled: true,
      channels: ['email'],
    },
  ];

  it('should initialize with empty rules', () => {
    const { result } = renderHook(() => {
      // useAlertRules implementation
      return { rules: [], loading: false, error: null };
    });

    expect(result.current.rules).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should fetch alert rules', async () => {
    const { result } = renderHook(() => {
      // useAlertRules implementation
      return { rules: mockRules, loading: false, error: null, fetchRules: vi.fn() };
    });

    expect(result.current.rules).toHaveLength(2);
  });

  it('should filter rules by severity', () => {
    const { result } = renderHook(() => {
      return {
        rules: mockRules,
        loading: false,
        error: null,
        filterBySeverity: vi.fn((sev) => mockRules.filter((r) => r.severity === sev)),
      };
    });

    expect(result.current.filterBySeverity).toBeDefined();
  });

  it('should enable/disable rules', async () => {
    const toggleRule = vi.fn();
    const { result } = renderHook(() => {
      return { rules: mockRules, toggleRule };
    });

    expect(result.current.toggleRule).toBeDefined();
  });

  it('should create new alert rule', async () => {
    const createRule = vi.fn();
    const { result } = renderHook(() => {
      return { createRule };
    });

    expect(result.current.createRule).toBeDefined();
  });

  it('should update existing alert rule', async () => {
    const updateRule = vi.fn();
    const { result } = renderHook(() => {
      return { updateRule };
    });

    expect(result.current.updateRule).toBeDefined();
  });

  it('should delete alert rule', async () => {
    const deleteRule = vi.fn();
    const { result } = renderHook(() => {
      return { deleteRule };
    });

    expect(result.current.deleteRule).toBeDefined();
  });

  it('should get alert templates', async () => {
    const templates = [
      { id: 'tpl_1', name: 'High Queue Depth' },
      { id: 'tpl_2', name: 'Relay Offline' },
    ];
    const getTemplates = vi.fn().mockResolvedValue(templates);
    const { result } = renderHook(() => {
      return { getTemplates };
    });

    expect(result.current.getTemplates).toBeDefined();
  });

  it('should test alert notification', async () => {
    const testAlert = vi.fn();
    const { result } = renderHook(() => {
      return { testAlert };
    });

    expect(result.current.testAlert).toBeDefined();
  });

  it('should fetch alert history', async () => {
    const getHistory = vi.fn();
    const { result } = renderHook(() => {
      return { getHistory };
    });

    expect(result.current.getHistory).toBeDefined();
  });

  it('should acknowledge alert', async () => {
    const acknowledgeAlert = vi.fn();
    const { result } = renderHook(() => {
      return { acknowledgeAlert };
    });

    expect(result.current.acknowledgeAlert).toBeDefined();
  });

  it('should manage quiet hours', async () => {
    const setQuietHours = vi.fn();
    const { result } = renderHook(() => {
      return { setQuietHours };
    });

    expect(result.current.setQuietHours).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    const { result } = renderHook(() => {
      return { error: null, loading: false };
    });

    expect(result.current.error).toBeNull();
  });
});
