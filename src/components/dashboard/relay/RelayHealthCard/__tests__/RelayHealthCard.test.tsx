import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RelayHealthCard from '../RelayHealthCard';
import type { RelayHealthMetrics } from '@/lib/api/relays';

describe('RelayHealthCard', () => {
  const mockRelay: RelayHealthMetrics = {
    relay_id: 'relay-1',
    name: 'Production Relay',
    status: 'online',
    uptime_24h: 99.9,
    uptime_7d: 99.95,
    uptime_30d: 99.9,
    response_time_ms: 45,
    error_rate: 0.1,
    throughput_msgs_sec: 1200,
    last_heartbeat: new Date().toISOString(),
    region: 'us-east-1',
    environment: 'prod',
  };

  it('should render relay name and status', () => {
    render(<RelayHealthCard relay={mockRelay} />);
    
    expect(screen.getByText('Production Relay')).toBeInTheDocument();
    expect(screen.getByText('online')).toBeInTheDocument();
  });

  it('should display uptime percentage for 24h', () => {
    render(<RelayHealthCard relay={mockRelay} />);
    
    expect(screen.getByText('99.9%')).toBeInTheDocument();
  });

  it('should display response time in milliseconds', () => {
    render(<RelayHealthCard relay={mockRelay} />);
    
    expect(screen.getByText('45ms')).toBeInTheDocument();
  });

  it('should display error rate', () => {
    render(<RelayHealthCard relay={mockRelay} />);
    
    expect(screen.getByText('0.1%')).toBeInTheDocument();
  });

  it('should show status badge with correct color for online relay', () => {
    render(<RelayHealthCard relay={mockRelay} />);
    
    const statusBadge = screen.getByRole('status');
    expect(statusBadge).toHaveClass('success');
  });

  it('should show degraded status with warning color', () => {
    const degradedRelay = { ...mockRelay, status: 'degraded' as const };
    render(<RelayHealthCard relay={degradedRelay} />);
    
    const statusBadge = screen.getByRole('status');
    expect(statusBadge).toHaveClass('warning');
  });

  it('should show offline status with error color', () => {
    const offlineRelay = {
      ...mockRelay,
      status: 'offline' as const,
      uptime_24h: 50,
    };
    render(<RelayHealthCard relay={offlineRelay} />);
    
    const statusBadge = screen.getByRole('status');
    expect(statusBadge).toHaveClass('error');
  });

  it('should display region and environment', () => {
    render(<RelayHealthCard relay={mockRelay} />);
    
    expect(screen.getByText('us-east-1')).toBeInTheDocument();
    expect(screen.getByText('prod')).toBeInTheDocument();
  });

  it('should display throughput in messages per second', () => {
    render(<RelayHealthCard relay={mockRelay} />);
    
    expect(screen.getByText('1,200 msgs/sec')).toBeInTheDocument();
  });

  it('should show last heartbeat time', () => {
    const timestamp = new Date().toISOString();
    const relay = { ...mockRelay, last_heartbeat: timestamp };
    render(<RelayHealthCard relay={relay} />);
    
    // Should format timestamp to readable format
    expect(screen.getByText(/just now|ago/)).toBeInTheDocument();
  });

  it('should trigger onClick callback when clicked', () => {
    const onClickSpy = vi.fn();
    const { container } = render(
      <RelayHealthCard relay={mockRelay} onClick={onClickSpy} />
    );
    
    container.click();
    expect(onClickSpy).toHaveBeenCalledWith('relay-1');
  });
});
