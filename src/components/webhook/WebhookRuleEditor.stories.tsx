import type { Meta, StoryObj } from '@storybook/react';
import { WebhookRuleEditor } from './WebhookRuleEditor';

const meta = {
  component: WebhookRuleEditor,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    loading: { control: 'boolean' },
  },
} satisfies Meta<typeof WebhookRuleEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockRule = {
  id: '1',
  name: 'Job Completion Notifier',
  enabled: true,
  event_types: ['job.completed', 'job.failed'],
  routing_target: 'https://webhook.example.com/jobs',
  conditions: [{ field: 'status', operator: 'equals', value: 'FAILED' }],
  success_count: 145,
  failure_count: 3,
};

export const Create: Story = {
  args: {
    open: true,
    rule: null,
    onSave: async () => alert('Rule saved!'),
    onClose: () => alert('Dialog closed'),
  },
};

export const Edit: Story = {
  args: {
    open: true,
    rule: mockRule,
    onSave: async () => alert('Rule updated!'),
    onClose: () => alert('Dialog closed'),
  },
};

export const Loading: Story = {
  args: {
    open: true,
    rule: null,
    loading: true,
    onSave: async () => alert('Rule saved!'),
    onClose: () => alert('Dialog closed'),
  },
};

export const WithError: Story = {
  args: {
    open: true,
    rule: null,
    error: 'Failed to save rule. Please try again.',
    onSave: async () => alert('Rule saved!'),
    onClose: () => alert('Dialog closed'),
  },
};

export const Closed: Story = {
  args: {
    open: false,
    rule: null,
    onSave: async () => alert('Rule saved!'),
    onClose: () => alert('Dialog closed'),
  },
};
