import type { Meta, StoryObj } from '@storybook/react';
import WebhooksDashboard from './page';

const meta = { component: WebhooksDashboard, tags: ['autodocs'] } satisfies Meta<typeof WebhooksDashboard>;
export default meta;
type Story = StoryObj<typeof meta>;

const mockRules = [
  {
    id: '1',
    name: 'Job Completion Notifier',
    enabled: true,
    event_types: ['job.completed', 'job.failed'],
    routing_target: 'https://webhook.example.com/jobs',
    conditions: [{ field: 'status', operator: 'equals', value: 'FAILED' }],
    success_count: 145,
    failure_count: 3,
    last_triggered: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: '2',
    name: 'Deployment Monitor',
    enabled: true,
    event_types: ['deployment.started', 'deployment.completed'],
    routing_target: 'https://alerts.example.com/deployments',
    conditions: [],
    success_count: 89,
    failure_count: 1,
    last_triggered: new Date(Date.now() - 30 * 60000).toISOString(),
  },
];

export const Default: Story = {
  render: () => <WebhooksDashboard />,
  decorators: [
    (Story) => (
      <div style={{ minHeight: '100vh', background: '#fafafa' }}>
        <Story />
      </div>
    ),
  ],
};

export const Loading: Story = {
  render: () => <WebhooksDashboard />,
  decorators: [
    (Story) => (
      <div style={{ minHeight: '100vh', background: '#fafafa' }}>
        <Story />
      </div>
    ),
  ],
};

export const Empty: Story = {
  render: () => <WebhooksDashboard />,
  decorators: [
    (Story) => (
      <div style={{ minHeight: '100vh', background: '#fafafa' }}>
        <Story />
      </div>
    ),
  ],
};

export const WithRules: Story = {
  render: () => <WebhooksDashboard />,
  decorators: [
    (Story) => (
      <div style={{ minHeight: '100vh', background: '#fafafa' }}>
        <Story />
      </div>
    ),
  ],
};

export const Error: Story = {
  render: () => <WebhooksDashboard />,
  decorators: [
    (Story) => (
      <div style={{ minHeight: '100vh', background: '#fafafa' }}>
        <Story />
      </div>
    ),
  ],
};
