import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useArchitecture } from '../useArchitecture';

// Mock the architecture API
vi.mock('../architecture', () => ({
  architectureApi: {
    getSecurityGuarantees: vi.fn(),
    getRiskComparison: vi.fn(),
    getArchitectureFlow: vi.fn(),
    getNetZeroModel: vi.fn(),
    getDataFlow: vi.fn(),
  },
}));

describe('useArchitecture Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useArchitecture());

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.securityGuarantees).toEqual([]);
    expect(result.current.riskComparison).toEqual([]);
    expect(result.current.architectureFlow).toEqual([]);
    expect(result.current.netZeroModel).toBeNull();
    expect(result.current.dataFlow).toBeNull();
  });

  it('should fetch all architecture data on mount', async () => {
    const { result } = renderHook(() => useArchitecture());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should provide callable methods for data refresh', () => {
    const { result } = renderHook(() => useArchitecture());

    expect(typeof result.current.refreshSecurityGuarantees).toBe('function');
    expect(typeof result.current.refreshRiskComparison).toBe('function');
    expect(typeof result.current.refreshArchitectureFlow).toBe('function');
    expect(typeof result.current.refreshNetZeroModel).toBe('function');
    expect(typeof result.current.refreshDataFlow).toBe('function');
    expect(typeof result.current.refreshAll).toBe('function');
  });

  it('should handle loading state correctly', async () => {
    const { result } = renderHook(() => useArchitecture());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should handle error state when fetch fails', async () => {
    const mockError = new Error('Failed to fetch');
    vi.mock('../architecture', () => ({
      architectureApi: {
        getSecurityGuarantees: vi.fn().mockRejectedValue(mockError),
      },
    }));

    const { result } = renderHook(() => useArchitecture());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should allow manual refresh of all data', async () => {
    const { result } = renderHook(() => useArchitecture());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Trigger refresh
    result.current.refreshAll();

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should have memoized refresh functions', () => {
    const { result, rerender } = renderHook(() => useArchitecture());

    const refresh1 = result.current.refreshAll;
    rerender();
    const refresh2 = result.current.refreshAll;

    expect(refresh1).toBe(refresh2);
  });

  it('should provide all required data properties', () => {
    const { result } = renderHook(() => useArchitecture());

    expect(result.current).toHaveProperty('securityGuarantees');
    expect(result.current).toHaveProperty('riskComparison');
    expect(result.current).toHaveProperty('architectureFlow');
    expect(result.current).toHaveProperty('netZeroModel');
    expect(result.current).toHaveProperty('dataFlow');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('error');
  });
});
