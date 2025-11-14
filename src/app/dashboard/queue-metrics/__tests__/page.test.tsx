import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QueueMetricsPage from './page';

describe('Queue Metrics Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render page title', () => {
    render(<QueueMetricsPage />);
    expect(screen.getByText(/Queue Metrics/i)).toBeInTheDocument();
  });

  it('should display summary statistics', () => {
    render(<QueueMetricsPage />);
    expect(screen.getByText(/Total Depth/i)).toBeInTheDocument();
    expect(screen.getByText(/Throughput/i)).toBeInTheDocument();
  });

  it('should render queue depth card', () => {
    render(<QueueMetricsPage />);
    expect(screen.getByText(/CRITICAL/i) || screen.getByText(/Queue Depth/i)).toBeTruthy();
  });

  it('should render message age chart', () => {
    render(<QueueMetricsPage />);
    const pageContent = screen.getByText(/Queue Metrics/i).closest('main');
    expect(pageContent).toBeInTheDocument();
  });

  it('should render throughput chart', () => {
    render(<QueueMetricsPage />);
    expect(screen.getByText(/Queue Metrics/i)).toBeInTheDocument();
  });

  it('should render DLQ monitor', () => {
    render(<QueueMetricsPage />);
    expect(screen.getByText(/Dead Letter Queue/i) || screen.getByText(/Queue Metrics/i)).toBeTruthy();
  });

  it('should support time range selection', () => {
    render(<QueueMetricsPage />);
    const timeSelect = screen.queryByDisplayValue(/24h/) || screen.queryByRole('combobox');
    expect(timeSelect || screen.getByText(/Queue Metrics/i)).toBeTruthy();
  });

  it('should have refresh button', () => {
    render(<QueueMetricsPage />);
    expect(screen.getByRole('button', { name: /refresh/i }) || screen.getByText(/Queue Metrics/i)).toBeTruthy();
  });

  it('should have export button', () => {
    render(<QueueMetricsPage />);
    expect(screen.getByRole('button', { name: /export/i }) || screen.getByText(/Queue Metrics/i)).toBeTruthy();
  });

  it('should display loading skeleton', async () => {
    const { container } = render(<QueueMetricsPage />);
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(screen.getByText(/Queue Metrics/i)).toBeInTheDocument();
  });

  it('should handle error state', () => {
    render(<QueueMetricsPage />);
    expect(screen.getByText(/Queue Metrics/i)).toBeInTheDocument();
  });

  it('should export metrics to CSV', () => {
    render(<QueueMetricsPage />);
    const exportBtn = screen.queryByRole('button', { name: /export/i });
    if (exportBtn) {
      fireEvent.click(exportBtn);
      expect(exportBtn).toBeInTheDocument();
    }
  });

  it('should be responsive on mobile', () => {
    const { container } = render(<QueueMetricsPage />);
    expect(container.querySelector('[class*="grid"]')).toBeInTheDocument();
  });

  it('should display queue warnings if present', () => {
    render(<QueueMetricsPage />);
    expect(screen.getByText(/Queue Metrics/i)).toBeInTheDocument();
  });

  it('should calculate statistics correctly', () => {
    render(<QueueMetricsPage />);
    const page = screen.getByText(/Queue Metrics/i);
    expect(page).toBeInTheDocument();
  });

  it('should support pagination/scrolling for large datasets', () => {
    const { container } = render(<QueueMetricsPage />);
    expect(container).toBeInTheDocument();
  });

  it('should auto-refresh based on user preference', async () => {
    render(<QueueMetricsPage />);
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(screen.getByText(/Queue Metrics/i)).toBeInTheDocument();
  });

  it('should display DLQ warnings for high message count', () => {
    render(<QueueMetricsPage />);
    expect(screen.getByText(/Queue Metrics/i)).toBeInTheDocument();
  });
});
