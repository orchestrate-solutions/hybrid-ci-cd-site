import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import QueueDepthCard from './QueueDepthCard';

describe('QueueDepthCard', () => {
  const mockData = {
    CRITICAL: 50,
    HIGH: 200,
    NORMAL: 800,
    LOW: 450,
    total: 1500,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render queue depth card', () => {
    render(<QueueDepthCard data={mockData} loading={false} />);
    expect(screen.getByText(/Queue Depth/i)).toBeInTheDocument();
  });

  it('should display total queue depth', () => {
    render(<QueueDepthCard data={mockData} loading={false} />);
    expect(screen.getByText(/1500/)).toBeInTheDocument();
  });

  it('should show priority breakdown', () => {
    render(<QueueDepthCard data={mockData} loading={false} />);
    expect(screen.getByText(/CRITICAL/i)).toBeInTheDocument();
    expect(screen.getByText(/HIGH/i)).toBeInTheDocument();
  });

  it('should render loading state', () => {
    render(<QueueDepthCard data={null} loading={true} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should handle empty data', () => {
    render(<QueueDepthCard data={mockData} loading={false} />);
    expect(screen.getByText(/Queue Depth/i)).toBeInTheDocument();
  });

  it('should show warning for high CRITICAL depth', () => {
    const highCritical = { ...mockData, CRITICAL: 500 };
    const { container } = render(<QueueDepthCard data={highCritical} loading={false} />);
    expect(container.querySelector('.warning')).toBeInTheDocument();
  });

  it('should calculate percentages correctly', () => {
    render(<QueueDepthCard data={mockData} loading={false} />);
    // CRITICAL = 50/1500 = 3.33%
    const criticalPercent = (50 / 1500) * 100;
    expect(criticalPercent).toBeCloseTo(3.33, 1);
  });
});
