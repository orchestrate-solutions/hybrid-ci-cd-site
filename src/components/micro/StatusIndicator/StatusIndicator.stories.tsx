/**
 * StatusIndicator Component Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { StatusIndicator } from './StatusIndicator';

const meta = {
  component: StatusIndicator,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: { type: 'select', options: ['online', 'offline', 'idle', 'busy', 'error'] },
    },
    size: { control: { type: 'select', options: ['sm', 'md', 'lg'] } },
    pulse: { control: 'boolean' },
  },
} satisfies Meta<typeof StatusIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Online: Story = {
  args: {
    status: 'online',
  },
};

export const Offline: Story = {
  args: {
    status: 'offline',
  },
};

export const Idle: Story = {
  args: {
    status: 'idle',
  },
};

export const Busy: Story = {
  args: {
    status: 'busy',
    pulse: true,
  },
};

export const Error: Story = {
  args: {
    status: 'error',
  },
};

export const AllStatuses: Story = {
  render: () => (
    <div className="flex gap-4">
      <StatusIndicator status="online" />
      <StatusIndicator status="offline" />
      <StatusIndicator status="idle" />
      <StatusIndicator status="busy" pulse />
      <StatusIndicator status="error" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <StatusIndicator status="online" size="sm" />
      <StatusIndicator status="online" size="md" />
      <StatusIndicator status="online" size="lg" />
    </div>
  ),
};

export const WithPulse: Story = {
  args: {
    status: 'online',
    pulse: true,
  },
};
