import { Meta, StoryObj } from '@storybook/react';
import DeploymentsPage from './page';

export default {
  title: 'Pages/DeploymentsPage',
  component: DeploymentsPage,
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: true },
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

// Default render - shows deployments from API
export const Default: Story = {};

// Mobile viewport (375px)
export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

// Tablet viewport (768px)
export const Tablet: Story = {
  parameters: {
    viewport: { defaultViewport: 'tablet' },
  },
};

// Desktop viewport (1200px+)
export const Desktop: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
