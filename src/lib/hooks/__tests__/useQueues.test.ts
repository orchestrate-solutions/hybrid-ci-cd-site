import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useQueues } from '../useQueues';

vi.mock('../../api/queue', () => ({
  queueApi: {
    getMetrics: vi.fn(),
    getQueueStats: vi.fn(),
    getDeadLetterQueue: vi.fn(),
  },
}));

describe('useQueues Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useQueues());
    expect(result.current.metrics).toBeNull();
    expect(result.current.stats).toEqual([]);
    expect(result.current.dlqMessages).toEqual([]);
  });

  it('should have computedStats with total queued', () => {
    const { result } = renderHook(() => useQueues());
    expect(result.current.computedStats).toHaveProperty('totalQueued');
    expect(result.current.computedStats).toHaveProperty('avgWaitTime');
    expect(result.current.computedStats).toHaveProperty('dlqCount');
  });

  it('should have callable refetch', () => {
    const { result } = renderHook(() => useQueues());
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should have callable requeueDLQMessage', () => {
    const { result } = renderHook(() => useQueues());
    expect(typeof result.current.requeueDLQMessage).toBe('function');
  });
});
