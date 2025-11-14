import type { Meta, StoryObj } from '@storybook/react';
import { QueueStatusCard } from './QueueStatusCard';
import { Timeline, Speed, CheckCircle, AlertTriangle } from '@mui/icons-material';

const meta = {
  component: QueueStatusCard,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    value: { control: 'number' },
    color: { control: 'select', options: ['success', 'warning', 'error', 'info'] },
    loading: { control: 'boolean' },
    trend: { control: 'number' },
    unit: { control: 'text' },
    error: { control: 'text' },
  },
} satisfies Meta<typeof QueueStatusCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Queued',
    value: 42,
    icon: <Timeline />,
    color: 'warning',
  },
};

export const Running: Story = {
  args: {
    title: 'Running',
    value: 5,
    icon: <Speed />,
    color: 'info',
  },
};

export const Completed: Story = {
  args: {
    title: 'Completed',
    value: 100,
    icon: <CheckCircle />,
    color: 'success',
  },
};

export const DeadLetter: Story = {
  args: {
    title: 'Dead Letter Queue',
    value: 2,
    icon: <AlertTriangle />,
    color: 'error',
  },
};

export const Loading: Story = {
  args: {
    title: 'Queued',
    value: 0,
    icon: <Timeline />,
    color: 'warning',
    loading: true,
  },
};

export const Error: Story = {
  args: {
    title: 'Queue Status',
    value: 0,
    icon: <AlertTriangle />,
    color: 'error',
    error: 'Failed to load metrics',
  },
};

export const WithTrend: Story = {
  args: {
    title: 'Queue Depth',
    value: 42,
    icon: <Timeline />,
    color: 'warning',
    trend: 5,
  },
};

export const DownwardTrend: Story = {
  args: {
    title: 'Queue Depth',
    value: 42,
    icon: <Timeline />,
    color: 'warning',
    trend: -3,
  },
};

export const WithUnit: Story = {
  args: {
    title: 'Average Wait Time',
    value: 1500,
    icon: <Timeline />,
    color: 'info',
    unit: 'ms',
  },
};
