import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import QueuesPage from '../page';

vi.mock('../../../lib/hooks/useQueues', () => ({
  useQueues: vi.fn(() => ({
    metrics: {
      jobs_queued: 42,
      jobs_running: 5,
      jobs_completed: 100,
      avg_wait_time_ms: 1500,
      throughput_per_minute: 2.5,
      dlq_count: 2,
    },
    stats: [
      { priority: 'HIGH', count: 10, oldest_age_ms: 5000 },
      { priority: 'NORMAL', count: 32, oldest_age_ms: 3000 },
    ],
    dlqMessages: [],
    computedStats: {
      totalQueued: 42,
      totalActive: 5,
      totalCompleted: 100,
      avgWaitTime: 1500,
      throughput: 2.5,
      dlqCount: 2,
    },
    loading: false,
    error: null,
    refetch: vi.fn(),
    requeueDLQMessage: vi.fn(),
  })),
}));

describe('QueuesPage', () => {
  it('should render page title', () => {
    render(<QueuesPage />);
    expect(screen.getByText(/Queue/i)).toBeInTheDocument();
  });

  it('should display metrics cards', () => {
    render(<QueuesPage />);
    expect(screen.getByText(/Queued/i)).toBeInTheDocument();
    expect(screen.getByText(/Running/i)).toBeInTheDocument();
    expect(screen.getByText(/Completed/i)).toBeInTheDocument();
  });

  it('should show metrics values', () => {
    render(<QueuesPage />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('should have tabbed interface', () => {
    render(<QueuesPage />);
    expect(screen.getByRole('tab', { name: /Priority/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /DLQ/i })).toBeInTheDocument();
  });
});
