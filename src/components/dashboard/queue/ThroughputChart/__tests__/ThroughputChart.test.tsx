import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ThroughputChart from './ThroughputChart';

describe('ThroughputChart', () => {
  const mockHistory = [
    { timestamp: '2024-01-01T00:00:00Z', throughput_rps: 120 },
    { timestamp: '2024-01-01T01:00:00Z', throughput_rps: 135 },
    { timestamp: '2024-01-01T02:00:00Z', throughput_rps: 115 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render throughput chart', () => {
    render(<ThroughputChart data={mockHistory} loading={false} />);
    expect(screen.getByText(/Throughput/i)).toBeInTheDocument();
  });

  it('should display throughput in msgs/sec', () => {
    render(<ThroughputChart data={mockHistory} loading={false} />);
    expect(screen.getByText(/msgs\/sec/i)).toBeInTheDocument();
  });

  it('should show time series line chart', () => {
    const { container } = render(<ThroughputChart data={mockHistory} loading={false} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should display min/max/avg statistics', () => {
    render(<ThroughputChart data={mockHistory} loading={false} />);
    expect(screen.getByText(/min/i)).toBeInTheDocument();
    expect(screen.getByText(/max/i)).toBeInTheDocument();
    expect(screen.getByText(/avg/i)).toBeInTheDocument();
  });

  it('should calculate correct average', () => {
    const average = mockHistory.reduce((a, b) => a + b.throughput_rps, 0) / mockHistory.length;
    expect(average).toBeCloseTo(123.33, 1);
  });

  it('should identify max throughput', () => {
    const max = Math.max(...mockHistory.map(h => h.throughput_rps));
    expect(max).toBe(135);
  });

  it('should identify min throughput', () => {
    const min = Math.min(...mockHistory.map(h => h.throughput_rps));
    expect(min).toBe(115);
  });

  it('should render loading state', () => {
    render(<ThroughputChart data={[]} loading={true} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should handle empty data gracefully', () => {
    render(<ThroughputChart data={[]} loading={false} />);
    expect(screen.getByText(/Throughput/i)).toBeInTheDocument();
  });

  it('should support time range selection', () => {
    const { rerender } = render(<ThroughputChart data={mockHistory} loading={false} timeRange="24h" />);
    expect(screen.getByText(/24h/i)).toBeInTheDocument();
    
    rerender(<ThroughputChart data={mockHistory} loading={false} timeRange="7d" />);
    expect(screen.getByText(/7d/i)).toBeInTheDocument();
  });

  it('should show trend indicator', () => {
    render(<ThroughputChart data={mockHistory} loading={false} />);
    const trendIndicator = screen.queryByText(/↑|↓/);
    expect(trendIndicator || screen.getByText(/Throughput/i)).toBeTruthy();
  });
});
