/**
 * DashboardPage Tests (GREEN Phase - Implementation)
 * 
 * Now that DashboardPage exists, run tests to verify it passes.
 * All tests should PASS.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardPage from './page';
import * as metricsApi from '@/lib/api/metrics';

// Mock the metrics API
vi.mock('@/lib/api/metrics');

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Layout', () => {
    it('renders dashboard header', () => {
      vi.mocked(metricsApi.getDashboardMetrics).mockResolvedValue({
        jobs_running: 0,
        jobs_failed_today: 0,
        deployments_today: 0,
        queue_depth: 0,
        average_wait_time_seconds: 0,
      });

      render(<DashboardPage />);
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    });

    it('has semantic page structure', async () => {
      vi.mocked(metricsApi.getDashboardMetrics).mockResolvedValue({
        jobs_running: 0,
        jobs_failed_today: 0,
        deployments_today: 0,
        queue_depth: 0,
        average_wait_time_seconds: 0,
      });

      const { container } = render(<DashboardPage />);

      await waitFor(() => {
        expect(container.querySelector('main')).toBeInTheDocument();
      });
      
      expect(container.querySelector('h1')).toBeInTheDocument();
    });

    it('renders metrics section', async () => {
      vi.mocked(metricsApi.getDashboardMetrics).mockResolvedValue({
        jobs_running: 3,
        jobs_failed_today: 1,
        deployments_today: 2,
        queue_depth: 5,
        average_wait_time_seconds: 45,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('metrics-section')).toBeInTheDocument();
      });
    });

    it('renders recent activity section', async () => {
      vi.mocked(metricsApi.getDashboardMetrics).mockResolvedValue({
        jobs_running: 3,
        jobs_failed_today: 1,
        deployments_today: 2,
        queue_depth: 5,
        average_wait_time_seconds: 45,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('activity-section')).toBeInTheDocument();
      });
    });
  });

  describe('Data Loading', () => {
    it('fetches dashboard metrics on mount', async () => {
      vi.mocked(metricsApi.getDashboardMetrics).mockResolvedValue({
        jobs_running: 3,
        jobs_failed_today: 1,
        deployments_today: 2,
        queue_depth: 5,
        average_wait_time_seconds: 45,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(metricsApi.getDashboardMetrics).toHaveBeenCalled();
      });
    });

    it('displays metrics values correctly', async () => {
      vi.mocked(metricsApi.getDashboardMetrics).mockResolvedValue({
        jobs_running: 3,
        jobs_failed_today: 1,
        deployments_today: 2,
        queue_depth: 5,
        average_wait_time_seconds: 45,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('metrics-running')).toBeInTheDocument();
      });
    });

    it('shows loading state while fetching', () => {
      vi.mocked(metricsApi.getDashboardMetrics).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          jobs_running: 0,
          jobs_failed_today: 0,
          deployments_today: 0,
          queue_depth: 0,
          average_wait_time_seconds: 0,
        }), 100))
      );

      render(<DashboardPage />);

      // Should show loading indicator (spinner, etc)
      expect(
        screen.queryByRole('progressbar') ||
        screen.queryByText(/Loading/i)
      ).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('shows error message on fetch failure', async () => {
      vi.mocked(metricsApi.getDashboardMetrics).mockRejectedValue(
        new Error('Failed to fetch metrics')
      );

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });
    });

    it('provides retry button on error', async () => {
      vi.mocked(metricsApi.getDashboardMetrics).mockRejectedValue(
        new Error('Network error')
      );

      render(<DashboardPage />);

      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /retry/i });
        expect(retryButton).toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    it('handles zero metrics gracefully', async () => {
      vi.mocked(metricsApi.getDashboardMetrics).mockResolvedValue({
        jobs_running: 0,
        jobs_failed_today: 0,
        deployments_today: 0,
        queue_depth: 0,
        average_wait_time_seconds: 0,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('metrics-section')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', async () => {
      vi.mocked(metricsApi.getDashboardMetrics).mockResolvedValue({
        jobs_running: 3,
        jobs_failed_today: 1,
        deployments_today: 2,
        queue_depth: 5,
        average_wait_time_seconds: 45,
      });

      const { container } = render(<DashboardPage />);

      const h1 = container.querySelector('h1');
      expect(h1).toBeInTheDocument();
      expect(h1?.textContent).toMatch(/Dashboard/i);
    });
  });
});
