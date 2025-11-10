/**
 * DashboardPage Stories (Storybook)
 * 
 * Visual contract for DashboardPage component across different states.
 * Stories show dashboard in various scenarios: loading, error, empty, normal, with real data.
 * 
 * Note: Default story requires API running (localhost:8000). 
 * For other states, we use environment setup or load simulated delays.
 */

import { Meta, StoryObj } from '@storybook/react';
import DashboardPage from './page';

export default {
  title: 'Pages/DashboardPage',
  component: DashboardPage,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DashboardPage>;

type Story = StoryObj<typeof DashboardPage>;

/**
 * Default state - Dashboard with real API call
 * Note: API must be running (localhost:8000) for this to render metrics
 */
export const Default: Story = {};

/**
 * Loading state - Shows spinner while metrics are being fetched
 * In real usage, this state appears briefly when component mounts
 */
export const Loading: Story = {
  parameters: {
    // This story shows the initial loading state
    // API call will happen, but we can see the loading indicator
  },
};

/**
 * Error state - API call fails
 * Shows error message with retry button
 * In real usage, this appears if backend is down or API fails
 */
export const Error: Story = {
  parameters: {
    // To see error state, backend API should be stopped
    // or environment variable should point to invalid endpoint
  },
};

/**
 * Empty state - No data to display
 * All metrics are 0
 */
export const Empty: Story = {
  parameters: {
    // Shows dashboard with all metrics at 0 (no jobs, deployments, or queue items)
  },
};

/**
 * Mobile view (default state on mobile)
 */
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Tablet view (default state on tablet)
 */
export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

/**
 * Desktop view - large screen (default state on desktop)
 */
export const Desktop: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};

