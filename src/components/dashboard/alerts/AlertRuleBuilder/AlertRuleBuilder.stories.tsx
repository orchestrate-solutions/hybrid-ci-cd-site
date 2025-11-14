import type { Meta, StoryObj } from '@storybook/react';
import AlertRuleBuilder from '../AlertRuleBuilder';

const meta = {
  component: AlertRuleBuilder,
  tags: ['autodocs'],
  argTypes: {
    onSave: { action: 'rule saved' },
    onCancel: { action: 'cancelled' },
  },
} satisfies Meta<typeof AlertRuleBuilder>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockTemplates = [
  {
    id: 'tpl_1',
    name: 'High Queue Depth',
    description: 'Alert when queue depth exceeds threshold',
    condition: { field: 'queue_depth', operator: '>', value: 1000 },
    severity: 'critical' as const,
    channels: ['email', 'slack'],
  },
  {
    id: 'tpl_2',
    name: 'Relay Offline',
    description: 'Alert when relay goes offline',
    condition: { field: 'relay_status', operator: 'equals', value: 'offline' },
    severity: 'high' as const,
    channels: ['email'],
  },
];

export const Empty: Story = {
  args: {
    templates: mockTemplates,
    onSave: async () => {},
    onCancel: () => {},
  },
};

export const EditingExisting: Story = {
  args: {
    templates: mockTemplates,
    initialRule: {
      id: 'rule_1',
      name: 'High Queue Depth Alert',
      description: 'Alert when queue exceeds 1000 messages',
      severity: 'critical',
      enabled: true,
      condition: { field: 'queue_depth', operator: '>', value: 1000 },
      channels: ['email', 'slack'],
    },
    onSave: async () => {},
    onCancel: () => {},
  },
};

export const ComplexConditions: Story = {
  args: {
    templates: mockTemplates,
    initialRule: {
      id: 'rule_2',
      name: 'Multiple Condition Alert',
      description: 'Combined threshold alert',
      severity: 'high',
      enabled: true,
      condition: {
        AND: [
          { field: 'queue_depth', operator: '>', value: 500 },
          { field: 'error_rate', operator: '>', value: 10 },
        ],
      },
      channels: ['email', 'slack', 'pagerduty'],
    },
    onSave: async () => {},
  },
};

export const WithoutTemplates: Story = {
  args: {
    templates: [],
    onSave: async () => {},
  },
};

export const Loading: Story = {
  args: {
    templates: mockTemplates,
    onSave: async () => {
      await new Promise((r) => setTimeout(r, 2000));
    },
  },
};
