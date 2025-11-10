/**
 * DashboardPage Stories (RED Phase - Storybook)
 * 
 * Visual contract for DashboardPage component across different states.
 * All stories FAIL initially—component doesn't exist yet.
 */

import { Meta, StoryObj } from '@storybook/react';
import * as metricsApi from '@/lib/api/metrics';

// Mock the API
vi.mock('@/lib/api/metrics');

/**
 * PLACEHOLDER: DashboardPage Storybook Stories
 * 
 * These stories will define:
 * - Default state (all metrics loaded)
 * - Loading state (skeleton)
 * - Error state (fetch failed)
 * - Empty state (no jobs/deployments)
 * - Mobile responsive
 * 
 * Component doesn't exist yet—these will FAIL on first run (RED phase).
 */

export default {
  title: 'Pages/DashboardPage',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

type Story = StoryObj;

/**
 * RED: Default state with all metrics loaded
 * Tests will FAIL because DashboardPage doesn't exist yet
 */
export const Default: Story = {
  render: async () => {
    // This will fail—component doesn't exist
    const { default: DashboardPage } = await import('@/app/dashboard/page');
    
    // Mock API response
    vi.mocked(metricsApi.getDashboardMetrics).mockResolvedValue({
      jobs_running: 3,
      jobs_failed_today: 1,
      deployments_today: 2,
      queue_depth: 5,
      average_wait_time_seconds: 45,
    });

    return <DashboardPage />;
  },
};

/**
 * RED: Loading state
 */
export const Loading: Story = {
  render: async () => {
    const { default: DashboardPage } = await import('@/app/dashboard/page');
    
    // Mock slow API response
    vi.mocked(metricsApi.getDashboardMetrics).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        jobs_running: 0,
        jobs_failed_today: 0,
        deployments_today: 0,
        queue_depth: 0,
        average_wait_time_seconds: 0,
      }), 5000))
    );

    return <DashboardPage />;
  },
};

/**
 * RED: Error state
 */
export const Error: Story = {
  render: async () => {
    const { default: DashboardPage } = await import('@/app/dashboard/page');
    
    // Mock API error
    vi.mocked(metricsApi.getDashboardMetrics).mockRejectedValue(
      new Error('Failed to fetch metrics from backend')
    );

    return <DashboardPage />;
  },
};

/**
 * RED: Empty state - no activity
 */
export const Empty: Story = {
  render: async () => {
    const { default: DashboardPage } = await import('@/app/dashboard/page');
    
    // Mock empty response
    vi.mocked(metricsApi.getDashboardMetrics).mockResolvedValue({
      jobs_running: 0,
      jobs_failed_today: 0,
      deployments_today: 0,
      queue_depth: 0,
      average_wait_time_seconds: 0,
    });

    return <DashboardPage />;
  },
};

/**
 * RED: Mobile view
 */
export const Mobile: Story = {
  render: async () => {
    const { default: DashboardPage } = await import('@/app/dashboard/page');
    
    vi.mocked(metricsApi.getDashboardMetrics).mockResolvedValue({
      jobs_running: 3,
      jobs_failed_today: 1,
      deployments_today: 2,
      queue_depth: 5,
      average_wait_time_seconds: 45,
    });

    return <DashboardPage />;
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * RED: Tablet view
 */
export const Tablet: Story = {
  render: async () => {
    const { default: DashboardPage } = await import('@/app/dashboard/page');
    
    vi.mocked(metricsApi.getDashboardMetrics).mockResolvedValue({
      jobs_running: 3,
      jobs_failed_today: 1,
      deployments_today: 2,
      queue_depth: 5,
      average_wait_time_seconds: 45,
    });

    return <DashboardPage />;
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

/**
 * RED: High activity
 */
export const HighActivity: Story = {
  render: async () => {
    const { default: DashboardPage } = await import('@/app/dashboard/page');
    
    vi.mocked(metricsApi.getDashboardMetrics).mockResolvedValue({
      jobs_running: 45,
      jobs_failed_today: 12,
      deployments_today: 8,
      queue_depth: 127,
      average_wait_time_seconds: 234,
    });

    return <DashboardPage />;
  },
};
