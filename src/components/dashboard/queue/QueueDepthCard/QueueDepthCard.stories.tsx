import type { Meta, StoryObj } from '@storybook/react';
import QueueDepthCard from './QueueDepthCard';

const mockDepth = {
  CRITICAL: 50,
  HIGH: 200,
  NORMAL: 800,
  LOW: 450,
  total: 1500,
};

const meta = {
  component: QueueDepthCard,
  tags: ['autodocs'],
  argTypes: {
    data: { control: 'object' },
    loading: { control: 'boolean' },
    error: { control: 'object' },
  },
} satisfies Meta<typeof QueueDepthCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HealthyQueue: Story = {
  args: {
    data: mockDepth,
    loading: false,
    error: null,
  },
};

export const HighCritical: Story = {
  args: {
    data: { ...mockDepth, CRITICAL: 500 },
    loading: false,
    error: null,
  },
};

export const Backlog: Story = {
  args: {
    data: { ...mockDepth, total: 5000, CRITICAL: 200, HIGH: 1000, NORMAL: 2500, LOW: 1300 },
    loading: false,
    error: null,
  },
};

export const Loading: Story = {
  args: {
    data: null,
    loading: true,
    error: null,
  },
};

export const Error: Story = {
  args: {
    data: null,
    loading: false,
    error: new Error('Failed to fetch queue depth'),
  },
};

export const Empty: Story = {
  args: {
    data: { CRITICAL: 0, HIGH: 0, NORMAL: 0, LOW: 0, total: 0 },
    loading: false,
    error: null,
  },
};
