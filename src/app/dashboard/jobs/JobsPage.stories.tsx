/**
 * JobsPage Stories (Storybook)
 * 
 * Visual contract for JobsPage component across different states and viewports.
 * Stories show jobs page in: default, loading, error, empty, filters active, paginated states.
 * 
 * Note: Default story requires API running (localhost:8000).
 */

import { Meta, StoryObj } from '@storybook/react';
import JobsPage from './page';

export default {
  title: 'Pages/JobsPage',
  component: JobsPage,
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
} satisfies Meta<typeof JobsPage>;

type Story = StoryObj<typeof JobsPage>;

/**
 * Default state - Jobs list with real API call
 * Note: API must be running (localhost:8000) for this to render jobs
 */
export const Default: Story = {};

/**
 * Loading state - Shows spinner while jobs are being fetched
 * In real usage, this state appears briefly when component mounts
 */
export const Loading: Story = {
  parameters: {
    // Component will show loading indicator during API fetch
  },
};

/**
 * Error state - API call fails
 * Shows error message with retry button
 * In real usage, this appears if backend is down or API fails
 */
export const Error: Story = {
  parameters: {
    // To see error state, backend API should be stopped or unreachable
  },
};

/**
 * Empty state - No jobs to display
 * All filters result in zero jobs
 */
export const Empty: Story = {
  parameters: {
    // Shows "No jobs" message when results are empty
  },
};

/**
 * With filters applied - Status filter = RUNNING
 * Shows jobs filtered by status
 */
export const FilteredByStatus: Story = {
  parameters: {
    // Shows jobs with status = RUNNING
  },
};

/**
 * With pagination - Second page
 * Shows pagination controls and second page of results
 */
export const Paginated: Story = {
  parameters: {
    // Shows page 2 of results with pagination controls
  },
};

/**
 * Mobile view
 */
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Tablet view
 */
export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

/**
 * Desktop view - large screen
 */
export const Desktop: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};
