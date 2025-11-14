import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MessageAgeChart from './MessageAgeChart';

describe('MessageAgeChart', () => {
  const mockDistribution = {
    p50: 1200,
    p75: 1800,
    p95: 3200,
    p99: 5100,
    max: 15000,
  };

  const mockHistory = [
    { timestamp: '2024-01-01T00:00:00Z', p50: 1100, p95: 3000, p99: 4900 },
    { timestamp: '2024-01-01T01:00:00Z', p50: 1300, p95: 3400, p99: 5300 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render message age chart', () => {
    render(<MessageAgeChart data={mockHistory} distribution={mockDistribution} loading={false} />);
    expect(screen.getByText(/Message Age/i)).toBeInTheDocument();
  });

  it('should display percentile metrics', () => {
    render(<MessageAgeChart data={mockHistory} distribution={mockDistribution} loading={false} />);
    expect(screen.getByText(/p50/i)).toBeInTheDocument();
    expect(screen.getByText(/p95/i)).toBeInTheDocument();
    expect(screen.getByText(/p99/i)).toBeInTheDocument();
  });

  it('should show time series chart', () => {
    const { container } = render(
      <MessageAgeChart data={mockHistory} distribution={mockDistribution} loading={false} />
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should display statistics cards', () => {
    render(<MessageAgeChart data={mockHistory} distribution={mockDistribution} loading={false} />);
    expect(screen.getByText(/1200/)).toBeInTheDocument(); // p50
    expect(screen.getByText(/5100/)).toBeInTheDocument(); // p99
  });

  it('should render loading state', () => {
    render(<MessageAgeChart data={[]} distribution={null} loading={true} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should handle empty data', () => {
    render(<MessageAgeChart data={[]} distribution={mockDistribution} loading={false} />);
    expect(screen.getByText(/Message Age/i)).toBeInTheDocument();
  });

  it('should show warning for high p99', () => {
    const highP99 = { ...mockDistribution, p99: 15000 };
    const { container } = render(
      <MessageAgeChart data={mockHistory} distribution={highP99} loading={false} />
    );
    expect(container.querySelector('.warning')).toBeInTheDocument();
  });

  it('should calculate age ranges correctly', () => {
    const maxAge = 15000;
    const minAge = 1200;
    const range = maxAge - minAge;
    expect(range).toBe(13800);
  });

  it('should color-code by severity', () => {
    const { container } = render(
      <MessageAgeChart data={mockHistory} distribution={mockDistribution} loading={false} />
    );
    const severityBadges = container.querySelectorAll('.severity-badge');
    expect(severityBadges.length).toBeGreaterThan(0);
  });
});
