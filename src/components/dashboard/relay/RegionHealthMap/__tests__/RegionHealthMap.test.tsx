import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RegionHealthMap from '../RegionHealthMap';
import type { RelayHealthMetrics } from '@/lib/api/relays';

describe('RegionHealthMap', () => {
  const mockRelays: RelayHealthMetrics[] = [
    {
      relay_id: 'relay-1',
      name: 'US East Relay',
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
    },
    {
      relay_id: 'relay-2',
      name: 'EU West Relay',
      status: 'online',
      uptime_24h: 99.95,
      uptime_7d: 99.9,
      uptime_30d: 99.85,
      response_time_ms: 65,
      error_rate: 0.05,
      throughput_msgs_sec: 1100,
      last_heartbeat: new Date().toISOString(),
      region: 'eu-west-1',
      environment: 'prod',
    },
    {
      relay_id: 'relay-3',
      name: 'Asia Pacific Relay',
      status: 'degraded',
      uptime_24h: 95,
      uptime_7d: 96,
      uptime_30d: 97,
      response_time_ms: 120,
      error_rate: 2.5,
      throughput_msgs_sec: 800,
      last_heartbeat: new Date().toISOString(),
      region: 'ap-southeast-1',
      environment: 'prod',
    },
  ];

  it('should render geographic map', () => {
    render(<RegionHealthMap relays={mockRelays} />);
    
    const map = screen.getByRole('img', { hidden: true });
    expect(map).toBeInTheDocument();
  });

  it('should display relay markers for each region', () => {
    render(<RegionHealthMap relays={mockRelays} />);
    
    expect(screen.getByText('US East Relay')).toBeInTheDocument();
    expect(screen.getByText('EU West Relay')).toBeInTheDocument();
    expect(screen.getByText('Asia Pacific Relay')).toBeInTheDocument();
  });

  it('should color markers by status', () => {
    render(<RegionHealthMap relays={mockRelays} />);
    
    const onlineMarker = screen.getByRole('button', {
      name: /us east relay|online/i,
    });
    expect(onlineMarker).toHaveClass('status-online');
    
    const degradedMarker = screen.getByRole('button', {
      name: /asia pacific|degraded/i,
    });
    expect(degradedMarker).toHaveClass('status-degraded');
  });

  it('should show uptime percentage in marker tooltip', () => {
    render(<RegionHealthMap relays={mockRelays} />);
    
    const marker = screen.getByRole('button', { name: /us east/i });
    marker.focus();
    
    expect(screen.getByText(/99.9%/)).toBeInTheDocument();
  });

  it('should show response time in marker tooltip', () => {
    render(<RegionHealthMap relays={mockRelays} />);
    
    const marker = screen.getByRole('button', { name: /eu west/i });
    marker.focus();
    
    expect(screen.getByText(/65ms/)).toBeInTheDocument();
  });

  it('should handle empty relay list', () => {
    render(<RegionHealthMap relays={[]} />);
    
    expect(screen.getByText(/no relays|empty/i)).toBeInTheDocument();
  });

  it('should allow drilling down to region details', () => {
    const onRegionClickSpy = vi.fn();
    render(
      <RegionHealthMap relays={mockRelays} onRegionClick={onRegionClickSpy} />
    );
    
    const marker = screen.getByRole('button', { name: /us east/i });
    marker.click();
    
    expect(onRegionClickSpy).toHaveBeenCalledWith('us-east-1', mockRelays[0]);
  });

  it('should display region statistics', () => {
    render(<RegionHealthMap relays={mockRelays} />);
    
    // Should show stats for each region
    expect(screen.getByText(/total relays:|regions:|avg uptime:/i)).toBeInTheDocument();
  });

  it('should show loading state when loading prop is true', () => {
    render(<RegionHealthMap relays={[]} loading={true} />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should display error message when error occurs', () => {
    render(
      <RegionHealthMap
        relays={[]}
        error={new Error('Failed to load map')}
      />
    );
    
    expect(screen.getByText('Failed to load map')).toBeInTheDocument();
  });

  it('should support filtering by region', () => {
    const { rerender } = render(
      <RegionHealthMap relays={mockRelays} filterRegion="us-east-1" />
    );
    
    // Only US East relay should be visible
    expect(screen.getByText('US East Relay')).toBeInTheDocument();
    
    rerender(
      <RegionHealthMap relays={mockRelays} filterRegion="eu-west-1" />
    );
    
    expect(screen.getByText('EU West Relay')).toBeInTheDocument();
  });

  it('should support filtering by status', () => {
    render(<RegionHealthMap relays={mockRelays} filterStatus="online" />);
    
    expect(screen.getByText('US East Relay')).toBeInTheDocument();
    expect(screen.queryByText('Asia Pacific Relay')).not.toBeInTheDocument();
  });

  it('should have zoom controls', () => {
    render(<RegionHealthMap relays={mockRelays} />);
    
    const zoomIn = screen.getByRole('button', { name: /zoom in/i });
    const zoomOut = screen.getByRole('button', { name: /zoom out/i });
    
    expect(zoomIn).toBeInTheDocument();
    expect(zoomOut).toBeInTheDocument();
  });
});
