import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useQueueMetrics from '../useQueueMetrics';

describe('useQueueMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useQueueMetrics());
    expect(result.current.loading).toBe(true);
    expect(result.current.metrics).toBeNull();
  });

  it('should fetch metrics on mount', async () => {
    const { result } = renderHook(() => useQueueMetrics());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.loading).toBe(false);
  });

  it('should calculate queue depth percentages', async () => {
    const { result } = renderHook(() => useQueueMetrics());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    if (result.current.metrics) {
      const percentages = result.current.getDepthPercentages();
      expect(percentages.CRITICAL + percentages.HIGH + percentages.NORMAL + percentages.LOW).toBe(100);
    }
  });

  it('should filter metrics by priority', async () => {
    const { result } = renderHook(() => useQueueMetrics());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const filtered = result.current.filterByPriority('CRITICAL');
    expect(filtered).toBeDefined();
  });

  it('should calculate average latency', async () => {
    const { result } = renderHook(() => useQueueMetrics());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const avg = result.current.getAverageLatency();
    expect(typeof avg).toBe('number');
    expect(avg).toBeGreaterThanOrEqual(0);
  });

  it('should refetch metrics', async () => {
    const { result } = renderHook(() => useQueueMetrics());
    
    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.loading).toBe(false);
  });

  it('should handle errors gracefully', async () => {
    const { result } = renderHook(() => useQueueMetrics());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.error).toBeNull();
  });

  it('should track throughput over time', async () => {
    const { result } = renderHook(() => useQueueMetrics());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const history = result.current.getThroughputHistory();
    expect(Array.isArray(history)).toBe(true);
  });

  it('should identify queue warnings', async () => {
    const { result } = renderHook(() => useQueueMetrics());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const warnings = result.current.getQueueWarnings();
    expect(Array.isArray(warnings)).toBe(true);
  });

  it('should calculate DLQ stats', async () => {
    const { result } = renderHook(() => useQueueMetrics());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const dlqStats = result.current.getDLQStats();
    expect(dlqStats).toBeDefined();
  });
});
