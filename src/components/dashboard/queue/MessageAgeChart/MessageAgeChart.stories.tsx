import type { Meta, StoryObj } from '@storybook/react';
import MessageAgeChart from './MessageAgeChart';

const mockHistory = [
  { timestamp: '2024-01-01T00:00:00Z', p50: 1200, p95: 3000, p99: 4900 },
  { timestamp: '2024-01-01T01:00:00Z', p50: 1300, p95: 3200, p99: 5100 },
  { timestamp: '2024-01-01T02:00:00Z', p50: 1150, p95: 2900, p99: 4800 },
  { timestamp: '2024-01-01T03:00:00Z', p50: 1400, p95: 3400, p99: 5300 },
];

const mockDistribution = {
  p50: 1250,
  p75: 1800,
  p95: 3150,
  p99: 5075,
  max: 15000,
};

const meta = {
  component: MessageAgeChart,
  tags: ['autodocs'],
  argTypes: {
    data: { control: 'object' },
    distribution: { control: 'object' },
    loading: { control: 'boolean' },
    error: { control: 'object' },
  },
} satisfies Meta<typeof MessageAgeChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Healthy: Story = {
  args: {
    data: mockHistory,
    distribution: mockDistribution,
    loading: false,
    error: null,
  },
};

export const HighLatency: Story = {
  args: {
    data: mockHistory,
    distribution: { ...mockDistribution, p99: 12000 },
    loading: false,
    error: null,
  },
};

export const VeryOldMessages: Story = {
  args: {
    data: mockHistory,
    distribution: { ...mockDistribution, p99: 18000, max: 86400000 },
    loading: false,
    error: null,
  },
};

export const Loading: Story = {
  args: {
    data: [],
    distribution: null,
    loading: true,
    error: null,
  },
};

export const Error: Story = {
  args: {
    data: [],
    distribution: null,
    loading: false,
    error: new Error('Failed to fetch message age data'),
  },
};

export const Empty: Story = {
  args: {
    data: [],
    distribution: mockDistribution,
    loading: false,
    error: null,
  },
};
