import type { Meta, StoryObj } from '@storybook/react';
import RegionHealthMap from './RegionHealthMap';
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
    name: 'us-west-2-relay',
    region: 'us-west-2',
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
  {
    id: 'relay-3',
    name: 'eu-west-1-relay',
    region: 'eu-west-1',
    environment: 'production',
    status: 'degraded',
    uptime_24h: 95.0,
    uptime_7d: 93.5,
    uptime_30d: 92.0,
    response_time_ms: 250,
    response_time_p95_ms: 500,
    response_time_p99_ms: 800,
    error_rate_percent: 2.5,
    throughput_rps: 450,
    last_heartbeat_at: new Date().toISOString(),
  },
  {
    id: 'relay-4',
    name: 'ap-northeast-1-relay',
    region: 'ap-northeast-1',
    environment: 'production',
    status: 'offline',
    uptime_24h: 0,
    uptime_7d: 50.0,
    uptime_30d: 75.0,
    response_time_ms: 5000,
    response_time_p95_ms: 5000,
    response_time_p99_ms: 5000,
    error_rate_percent: 100,
    throughput_rps: 0,
    last_heartbeat_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

const meta = {
  component: RegionHealthMap,
  tags: ['autodocs'],
  argTypes: {
    relays: { control: 'object' },
    filterRegion: { control: 'text' },
    filterStatus: { control: 'select', options: [undefined, 'online', 'offline', 'degraded'] },
    loading: { control: 'boolean' },
    error: { control: 'object' },
    onRegionClick: { action: 'region clicked' },
  },
} satisfies Meta<typeof RegionHealthMap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    relays: mockRelays,
    loading: false,
    error: null,
    onRegionClick: () => {},
  },
};

export const FilteredByStatus: Story = {
  args: {
    relays: mockRelays,
    filterStatus: 'online',
    loading: false,
    error: null,
    onRegionClick: () => {},
  },
};

export const FilteredByRegion: Story = {
  args: {
    relays: mockRelays,
    filterRegion: 'us-east-1',
    loading: false,
    error: null,
    onRegionClick: () => {},
  },
};

export const Loading: Story = {
  args: {
    relays: [],
    loading: true,
    error: null,
    onRegionClick: () => {},
  },
};

export const Error: Story = {
  args: {
    relays: [],
    loading: false,
    error: new Error('Failed to fetch region data'),
    onRegionClick: () => {},
  },
};

export const Empty: Story = {
  args: {
    relays: [],
    loading: false,
    error: null,
    onRegionClick: () => {},
  },
};

export const OnlineOnly: Story = {
  args: {
    relays: mockRelays.filter((r) => r.status === 'online'),
    loading: false,
    error: null,
    onRegionClick: () => {},
  },
};
