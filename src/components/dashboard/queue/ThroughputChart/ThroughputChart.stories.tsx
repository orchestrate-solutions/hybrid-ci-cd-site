import type { Meta, StoryObj } from '@storybook/react';
import ThroughputChart from './ThroughputChart';

const mockHistory = [
  { timestamp: '2024-01-01T00:00:00Z', throughput_rps: 100 },
  { timestamp: '2024-01-01T01:00:00Z', throughput_rps: 120 },
  { timestamp: '2024-01-01T02:00:00Z', throughput_rps: 135 },
  { timestamp: '2024-01-01T03:00:00Z', throughput_rps: 115 },
  { timestamp: '2024-01-01T04:00:00Z', throughput_rps: 140 },
];

const meta = {
  component: ThroughputChart,
  tags: ['autodocs'],
  argTypes: {
    data: { control: 'object' },
    loading: { control: 'boolean' },
    error: { control: 'object' },
    timeRange: { control: 'select', options: ['24h', '7d', '30d'] },
  },
} satisfies Meta<typeof ThroughputChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Healthy: Story = {
  args: {
    data: mockHistory,
    loading: false,
    error: null,
    timeRange: '24h',
  },
};

export const HighThroughput: Story = {
  args: {
    data: mockHistory.map(h => ({ ...h, throughput_rps: h.throughput_rps * 2 })),
    loading: false,
    error: null,
    timeRange: '24h',
  },
};

export const Declining: Story = {
  args: {
    data: [
      { timestamp: '2024-01-01T00:00:00Z', throughput_rps: 200 },
      { timestamp: '2024-01-01T01:00:00Z', throughput_rps: 180 },
      { timestamp: '2024-01-01T02:00:00Z', throughput_rps: 160 },
      { timestamp: '2024-01-01T03:00:00Z', throughput_rps: 140 },
      { timestamp: '2024-01-01T04:00:00Z', throughput_rps: 120 },
    ],
    loading: false,
    error: null,
    timeRange: '24h',
  },
};

export const SevenDays: Story = {
  args: {
    data: mockHistory,
    loading: false,
    error: null,
    timeRange: '7d',
  },
};

export const Loading: Story = {
  args: {
    data: [],
    loading: true,
    error: null,
    timeRange: '24h',
  },
};

export const Error: Story = {
  args: {
    data: [],
    loading: false,
    error: new Error('Failed to fetch throughput data'),
    timeRange: '24h',
  },
};

export const Empty: Story = {
  args: {
    data: [],
    loading: false,
    error: null,
    timeRange: '24h',
  },
};
