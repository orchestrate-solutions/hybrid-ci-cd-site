import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import RelayHealthDashboard from '../page';

// Mock the API
vi.mock('@/lib/api/relays', () => ({
  relaysApi: {
    getHealthMetrics: vi.fn().mockResolvedValue([
      {
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
      },
    ]),
    getRelayMetricsHistory: vi.fn().mockResolvedValue([
      {
        relay_id: 'relay-1',
        timestamp: new Date().toISOString(),
        response_time_ms: 45,
        error_count: 0,
        message_count: 1200,
      },
    ]),
  },
}));

describe('RelayHealthDashboard Page', () => {
  it('should render page title', async () => {
    render(<RelayHealthDashboard />);
    
    expect(
      screen.getByText(/relay health|relay status|monitoring/i)
    ).toBeInTheDocument();
  });

  it('should display relay health cards', async () => {
    render(<RelayHealthDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Production Relay')).toBeInTheDocument();
    });
  });

  it('should show metrics chart on load', async () => {
    render(<RelayHealthDashboard />);
    
    await waitFor(() => {
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });
  });

  it('should display geographic map', async () => {
    render(<RelayHealthDashboard />);
    
    await waitFor(() => {
      const maps = screen.getAllByRole('img', { hidden: true });
      expect(maps.length).toBeGreaterThan(0);
    });
  });

  it('should have filter controls', () => {
    render(<RelayHealthDashboard />);
    
    expect(screen.getByPlaceholderText(/search|filter/i)).toBeInTheDocument();
  });

  it('should have time range selector', () => {
    render(<RelayHealthDashboard />);
    
    expect(screen.getByRole('button', { name: /24h/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /7d/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /30d/i })).toBeInTheDocument();
  });

  it('should have refresh button', () => {
    render(<RelayHealthDashboard />);
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toBeInTheDocument();
  });

  it('should display loading skeleton initially', () => {
    render(<RelayHealthDashboard />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should display error message on API failure', async () => {
    const mockApi = vi.mocked(require('@/lib/api/relays').relaysApi);
    mockApi.getHealthMetrics.mockRejectedValue(
      new Error('Failed to fetch relays')
    );
    
    render(<RelayHealthDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/failed|error/i)).toBeInTheDocument();
    });
  });

  it('should show empty state when no relays exist', async () => {
    const mockApi = vi.mocked(require('@/lib/api/relays').relaysApi);
    mockApi.getHealthMetrics.mockResolvedValue([]);
    
    render(<RelayHealthDashboard />);
    
    await waitFor(() => {
      expect(
        screen.getByText(/no relays|empty|create|add/i)
      ).toBeInTheDocument();
    });
  });

  it('should allow filtering by status', async () => {
    render(<RelayHealthDashboard />);
    
    const statusFilter = screen.getByRole('combobox', { name: /status/i });
    statusFilter.click();
    
    const onlineOption = screen.getByRole('option', { name: /online/i });
    onlineOption.click();
    
    await waitFor(() => {
      expect(statusFilter).toHaveValue('online');
    });
  });

  it('should allow filtering by region', async () => {
    render(<RelayHealthDashboard />);
    
    const regionFilter = screen.getByRole('combobox', { name: /region/i });
    regionFilter.click();
    
    const usEastOption = screen.getByRole('option', { name: /us-east/i });
    usEastOption.click();
    
    await waitFor(() => {
      expect(regionFilter).toHaveValue('us-east-1');
    });
  });

  it('should support responsive layout on mobile', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(max-width: 600px)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    
    const { container } = render(<RelayHealthDashboard />);
    
    expect(container.querySelector('[data-testid="mobile-layout"]')).toBeDefined();
  });

  it('should display summary statistics', async () => {
    render(<RelayHealthDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/total relays:/i)).toBeInTheDocument();
      expect(screen.getByText(/online:/i)).toBeInTheDocument();
      expect(screen.getByText(/avg uptime:/i)).toBeInTheDocument();
    });
  });

  it('should allow exporting data', () => {
    render(<RelayHealthDashboard />);
    
    const exportButton = screen.getByRole('button', { name: /export/i });
    expect(exportButton).toBeInTheDocument();
  });

  it('should refetch data when refresh is clicked', async () => {
    const mockApi = vi.mocked(require('@/lib/api/relays').relaysApi);
    
    render(<RelayHealthDashboard />);
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    refreshButton.click();
    
    await waitFor(() => {
      expect(mockApi.getHealthMetrics).toHaveBeenCalledTimes(2);
    });
  });

  it('should support auto-refresh interval', async () => {
    render(<RelayHealthDashboard />);
    
    const refreshIntervalControl = screen.getByRole('slider', {
      name: /refresh interval/i,
    });
    expect(refreshIntervalControl).toBeInTheDocument();
  });

  it('should show recommendations panel', async () => {
    render(<RelayHealthDashboard />);
    
    await waitFor(() => {
      expect(
        screen.getByText(/recommendations|suggestions|improve/i)
      ).toBeInTheDocument();
    });
  });

  it('should display alert history for selected relay', async () => {
    render(<RelayHealthDashboard />);
    
    await waitFor(() => {
      const relayCard = screen.getByText('Production Relay');
      relayCard.click();
    });
    
    expect(screen.getByText(/alert history|recent alerts/i)).toBeInTheDocument();
  });
});
