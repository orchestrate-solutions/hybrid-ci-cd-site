import type { Meta, StoryObj } from '@storybook/react';
import RelayMetricsChart from './RelayMetricsChart';
import type { RelayHealthMetrics } from '@/lib/api/relays';

const mockRelays: RelayHealthMetrics[] = [
  {
    id: 'relay-1',
    name: 'us-east-1-relay',
    region: 'us-east-1',
    environment: 'production',
    status: 'online',
    uptime_24h: 99.99,
    uptime_7d: 99.98,
    uptime_30d: 99.95,
    response_time_ms: 42,
    response_time_p95_ms: 120,
    response_time_p99_ms: 250,
    error_rate_percent: 0.01,
    throughput_rps: 1250,
    last_heartbeat_at: new Date().toISOString(),
  },
  {
    id: 'relay-2',
    name: 'eu-west-1-relay',
    region: 'eu-west-1',
    environment: 'production',
    status: 'online',
    uptime_24h: 99.95,
    uptime_7d: 99.90,
    uptime_30d: 99.85,
    response_time_ms: 85,
    response_time_p95_ms: 200,
    response_time_p99_ms: 350,
    error_rate_percent: 0.05,
    throughput_rps: 980,
    last_heartbeat_at: new Date().toISOString(),
  },
];

const meta = {
  component: RelayMetricsChart,
  tags: ['autodocs'],
  argTypes: {
    relays: { control: 'object' },
    metricType: { control: 'select', options: ['response_time', 'error_rate', 'throughput'] },
    timeRange: { control: 'select', options: ['24h', '7d', '30d'] },
    loading: { control: 'boolean' },
    error: { control: 'object' },
  },
} satisfies Meta<typeof RelayMetricsChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    relays: mockRelays,
    metricType: 'response_time',
    timeRange: '24h',
    loading: false,
    error: null,
  },
};

export const ErrorRate: Story = {
  args: {
    relays: mockRelays,
    metricType: 'error_rate',
    timeRange: '24h',
    loading: false,
    error: null,
  },
};

export const Throughput: Story = {
  args: {
    relays: mockRelays,
    metricType: 'throughput',
    timeRange: '7d',
    loading: false,
    error: null,
  },
};

export const Loading: Story = {
  args: {
    relays: [],
    metricType: 'response_time',
    timeRange: '24h',
    loading: true,
    error: null,
  },
};

export const Error: Story = {
  args: {
    relays: [],
    metricType: 'response_time',
    timeRange: '24h',
    loading: false,
    error: new Error('Failed to fetch metrics'),
  },
};

export const Empty: Story = {
  args: {
    relays: [],
    metricType: 'response_time',
    timeRange: '24h',
    loading: false,
    error: null,
  },
};
