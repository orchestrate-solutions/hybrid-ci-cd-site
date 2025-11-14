import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DLQMonitor from './DLQMonitor';

describe('DLQMonitor', () => {
  const mockDLQStats = {
    total_messages: 250,
    failed_retries: 150,
    max_retries_exceeded: 100,
    oldest_message_age_ms: 86400000,
    error_types: [
      { type: 'timeout', count: 80 },
      { type: 'invalid_payload', count: 70 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render DLQ monitor', () => {
    render(<DLQMonitor stats={mockDLQStats} loading={false} onRetry={() => {}} />);
    expect(screen.getByText(/Dead Letter Queue/i)).toBeInTheDocument();
  });

  it('should display total DLQ messages', () => {
    render(<DLQMonitor stats={mockDLQStats} loading={false} onRetry={() => {}} />);
    expect(screen.getByText(/250/)).toBeInTheDocument();
  });

  it('should show failed retries count', () => {
    render(<DLQMonitor stats={mockDLQStats} loading={false} onRetry={() => {}} />);
    expect(screen.getByText(/150/)).toBeInTheDocument();
  });

  it('should display max retries exceeded', () => {
    render(<DLQMonitor stats={mockDLQStats} loading={false} onRetry={() => {}} />);
    expect(screen.getByText(/100/)).toBeInTheDocument();
  });

  it('should show error type breakdown', () => {
    render(<DLQMonitor stats={mockDLQStats} loading={false} onRetry={() => {}} />);
    expect(screen.getByText(/timeout/i)).toBeInTheDocument();
    expect(screen.getByText(/invalid_payload/i)).toBeInTheDocument();
  });

  it('should display oldest message age', () => {
    render(<DLQMonitor stats={mockDLQStats} loading={false} onRetry={() => {}} />);
    expect(screen.getByText(/1 day/i)).toBeInTheDocument();
  });

  it('should render retry button', () => {
    render(<DLQMonitor stats={mockDLQStats} loading={false} onRetry={() => {}} />);
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should handle retry action', () => {
    const mockRetry = vi.fn();
    render(<DLQMonitor stats={mockDLQStats} loading={false} onRetry={mockRetry} />);
    const retryButton = screen.getByRole('button', { name: /retry/i });
    retryButton.click();
    expect(mockRetry).toHaveBeenCalled();
  });

  it('should render loading state', () => {
    render(<DLQMonitor stats={null} loading={true} onRetry={() => {}} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should show severity indicator for high DLQ', () => {
    const highDLQ = { ...mockDLQStats, total_messages: 5000 };
    const { container } = render(
      <DLQMonitor stats={highDLQ} loading={false} onRetry={() => {}} />
    );
    expect(container.querySelector('.severity-critical')).toBeInTheDocument();
  });

  it('should display error breakdown pie chart', () => {
    const { container } = render(
      <DLQMonitor stats={mockDLQStats} loading={false} onRetry={() => {}} />
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should handle empty error types', () => {
    const noErrors = { ...mockDLQStats, error_types: [] };
    render(<DLQMonitor stats={noErrors} loading={false} onRetry={() => {}} />);
    expect(screen.getByText(/Dead Letter Queue/i)).toBeInTheDocument();
  });
});
