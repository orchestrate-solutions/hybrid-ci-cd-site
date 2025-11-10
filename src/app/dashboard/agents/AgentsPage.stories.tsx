import type { Meta, StoryObj } from '@storybook/react';
import AgentsPage from './page';

const meta = {
  component: AgentsPage,
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
} satisfies Meta<typeof AgentsPage>;

export default meta;
type Story = StoryObj<typeof AgentsPage>;

// Default render - shows agents from API
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
