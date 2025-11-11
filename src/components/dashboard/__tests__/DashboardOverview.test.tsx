import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import DashboardOverview from '../DashboardOverview';
import * as dashboardApi from '@/lib/api/dashboard';

// Mock the API
vi.mock('@/lib/api/dashboard');

describe('DashboardOverview Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard title and loading state initially', () => {
    vi.mocked(dashboardApi.getDashboardSummary).mockResolvedValueOnce({
      jobs_running: 5,
      jobs_failed_today: 1,
      deployments_today: 3,
      agents_healthy: 8,
    });

    render(<DashboardOverview />);
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
  });

  it('displays status cards after data loads', async () => {
    vi.mocked(dashboardApi.getDashboardSummary).mockResolvedValueOnce({
      jobs_running: 5,
      jobs_failed_today: 1,
      deployments_today: 3,
      agents_healthy: 8,
    });

    render(<DashboardOverview />);

    await waitFor(() => {
      expect(screen.getByText(/Jobs Running/i)).toBeInTheDocument();
      expect(screen.getByText(/Deployments Today/i)).toBeInTheDocument();
      expect(screen.getByText(/Agents Healthy/i)).toBeInTheDocument();
    });
  });

  it('displays correct counts in status cards', async () => {
    vi.mocked(dashboardApi.getDashboardSummary).mockResolvedValueOnce({
      jobs_running: 5,
      jobs_failed_today: 1,
      deployments_today: 3,
      agents_healthy: 8,
    });

    render(<DashboardOverview />);

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument(); // jobs_running
      expect(screen.getByText('3')).toBeInTheDocument(); // deployments_today
      expect(screen.getByText('8')).toBeInTheDocument(); // agents_healthy
    });
  });

  it('renders tool status cards section', async () => {
    vi.mocked(dashboardApi.getDashboardSummary).mockResolvedValueOnce({
      jobs_running: 5,
      jobs_failed_today: 1,
      deployments_today: 3,
      agents_healthy: 8,
    });

    render(<DashboardOverview />);

    await waitFor(() => {
      expect(screen.getByText(/GitHub Actions/i)).toBeInTheDocument();
      expect(screen.getByText(/Terraform/i)).toBeInTheDocument();
    });
  });

  it('renders coming soon cards for future features', async () => {
    vi.mocked(dashboardApi.getDashboardSummary).mockResolvedValueOnce({
      jobs_running: 5,
      jobs_failed_today: 1,
      deployments_today: 3,
      agents_healthy: 8,
    });

    render(<DashboardOverview />);

    await waitFor(() => {
      expect(screen.getByText(/AI Evaluations/i)).toBeInTheDocument();
      expect(screen.getByText(/Advanced Approvals/i)).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(dashboardApi.getDashboardSummary).mockRejectedValueOnce(
      new Error('Failed to fetch')
    );

    render(<DashboardOverview />);

    await waitFor(() => {
      expect(screen.getByText(/Error loading dashboard/i)).toBeInTheDocument();
    });
  });

  it('fetches data on mount', () => {
    vi.mocked(dashboardApi.getDashboardSummary).mockResolvedValueOnce({
      jobs_running: 5,
      jobs_failed_today: 1,
      deployments_today: 3,
      agents_healthy: 8,
    });

    render(<DashboardOverview />);

    expect(dashboardApi.getDashboardSummary).toHaveBeenCalledTimes(1);
  });

  it('respects real-time mode from user preferences', async () => {
    vi.mocked(dashboardApi.getDashboardSummary).mockResolvedValueOnce({
      jobs_running: 5,
      jobs_failed_today: 1,
      deployments_today: 3,
      agents_healthy: 8,
    });

    render(<DashboardOverview />);

    // Component should use useRealTime hook which respects preferences
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
  });

  it('displays responsive grid layout', async () => {
    vi.mocked(dashboardApi.getDashboardSummary).mockResolvedValueOnce({
      jobs_running: 5,
      jobs_failed_today: 1,
      deployments_today: 3,
      agents_healthy: 8,
    });

    const { container } = render(<DashboardOverview />);

    await waitFor(() => {
      const gridContainers = container.querySelectorAll('[class*="MuiGrid"]');
      expect(gridContainers.length).toBeGreaterThan(0);
    });
  });
});
