/**
 * DeploymentsPage Stories (Storybook)
 * 
 * Visual contract for DeploymentsPage component across different states and viewports.
 */

import { Meta, StoryObj } from '@storybook/react';
import DeploymentsPage from './page';

export default {
  title: 'Pages/DeploymentsPage',
  component: DeploymentsPage,
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
} satisfies Meta<typeof DeploymentsPage>;

type Story = StoryObj<typeof DeploymentsPage>;

/**
 * Default state - Deployments list with real API
 */
export const Default: Story = {};

/**
 * Loading state
 */
export const Loading: Story = {
  parameters: {},
};

/**
 * Error state
 */
export const Error: Story = {
  parameters: {},
};

/**
 * Empty state
 */
export const Empty: Story = {
  parameters: {},
};

/**
 * Filtered by production environment
 */
export const ProductionOnly: Story = {
  parameters: {},
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
 * Desktop view
 */
export const Desktop: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};
