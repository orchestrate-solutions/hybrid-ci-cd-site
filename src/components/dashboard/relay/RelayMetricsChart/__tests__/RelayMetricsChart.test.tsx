import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RelayMetricsChart from '../RelayMetricsChart';
import type { RelayMetricsHistory } from '@/lib/api/relays';

describe('RelayMetricsChart', () => {
  const mockMetricsHistory: RelayMetricsHistory[] = [
    {
      relay_id: 'relay-1',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      response_time_ms: 45,
      error_count: 0,
      message_count: 1200,
    },
    {
      relay_id: 'relay-1',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      response_time_ms: 52,
      error_count: 1,
      message_count: 1150,
    },
    {
      relay_id: 'relay-1',
      timestamp: new Date().toISOString(),
      response_time_ms: 48,
      error_count: 0,
      message_count: 1300,
    },
  ];

  it('should render chart title', () => {
    render(
      <RelayMetricsChart
        relayId="relay-1"
        metrics={mockMetricsHistory}
        metricType="response_time"
      />
    );
    
    expect(screen.getByText(/response time|latency/i)).toBeInTheDocument();
  });

  it('should render response time chart', () => {
    render(
      <RelayMetricsChart
        relayId="relay-1"
        metrics={mockMetricsHistory}
        metricType="response_time"
      />
    );
    
    // Chart should be rendered (canvas or SVG)
    const chart = screen.getByRole('img', { hidden: true });
    expect(chart).toBeInTheDocument();
  });

  it('should render error rate chart', () => {
    render(
      <RelayMetricsChart
        relayId="relay-1"
        metrics={mockMetricsHistory}
        metricType="error_rate"
      />
    );
    
    const chart = screen.getByRole('img', { hidden: true });
    expect(chart).toBeInTheDocument();
  });

  it('should render throughput chart', () => {
    render(
      <RelayMetricsChart
        relayId="relay-1"
        metrics={mockMetricsHistory}
        metricType="throughput"
      />
    );
    
    const chart = screen.getByRole('img', { hidden: true });
    expect(chart).toBeInTheDocument();
  });

  it('should display min/max/avg values for metric', () => {
    render(
      <RelayMetricsChart
        relayId="relay-1"
        metrics={mockMetricsHistory}
        metricType="response_time"
      />
    );
    
    // Should show statistics
    expect(screen.getByText(/min:|avg:|max:/i)).toBeInTheDocument();
  });

  it('should show loading state when loading prop is true', () => {
    render(
      <RelayMetricsChart
        relayId="relay-1"
        metrics={[]}
        metricType="response_time"
        loading={true}
      />
    );
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should display error message when error occurs', () => {
    render(
      <RelayMetricsChart
        relayId="relay-1"
        metrics={[]}
        metricType="response_time"
        error={new Error('Failed to load metrics')}
      />
    );
    
    expect(screen.getByText('Failed to load metrics')).toBeInTheDocument();
  });

  it('should handle empty metrics array', () => {
    render(
      <RelayMetricsChart
        relayId="relay-1"
        metrics={[]}
        metricType="response_time"
      />
    );
    
    expect(screen.getByText(/no data|empty/i)).toBeInTheDocument();
  });

  it('should support time range selection', () => {
    render(
      <RelayMetricsChart
        relayId="relay-1"
        metrics={mockMetricsHistory}
        metricType="response_time"
        timeRange="24h"
      />
    );
    
    const rangeButtons = screen.getAllByRole('button', {
      name: /24h|7d|30d/i,
    });
    expect(rangeButtons.length).toBeGreaterThan(0);
  });

  it('should have refresh button', () => {
    const onRefreshSpy = vi.fn();
    render(
      <RelayMetricsChart
        relayId="relay-1"
        metrics={mockMetricsHistory}
        metricType="response_time"
        onRefresh={onRefreshSpy}
      />
    );
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    refreshButton.click();
    expect(onRefreshSpy).toHaveBeenCalled();
  });

  it('should export chart data', () => {
    render(
      <RelayMetricsChart
        relayId="relay-1"
        metrics={mockMetricsHistory}
        metricType="response_time"
      />
    );
    
    const exportButton = screen.getByRole('button', { name: /export/i });
    expect(exportButton).toBeInTheDocument();
  });
});
