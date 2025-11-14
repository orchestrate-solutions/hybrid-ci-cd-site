import type { Meta, StoryObj } from '@storybook/react';
import SecurityGuaranteeCard from './SecurityGuaranteeCard';

const meta = {
  component: SecurityGuaranteeCard,
  tags: ['autodocs'],
} satisfies Meta<typeof SecurityGuaranteeCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockVerified = {
  title: 'No Payload Storage',
  description: 'Webhook events contain no payload data',
  implementation: 'WebhookEvent has no payload field',
  verified: true,
  testCases: ['test_webhook_event_has_no_payload_field', 'test_payload_sanitization'],
};

const mockUnverified = {
  title: 'API Key Hashing',
  description: 'API keys are hashed before storage',
  implementation: 'SHA-256 hashing applied to all API keys',
  verified: false,
  testCases: ['test_api_key_hashing'],
};

export const Verified: Story = {
  args: { guarantee: mockVerified },
};

export const Unverified: Story = {
  args: { guarantee: mockUnverified },
};

export const ManyTestCases: Story = {
  args: {
    guarantee: {
      ...mockVerified,
      testCases: [
        'test1',
        'test2',
        'test3',
        'test4',
        'test5',
      ],
    },
  },
};

export const LongDescription: Story = {
  args: {
    guarantee: {
      ...mockVerified,
      description:
        'This is a comprehensive security guarantee that ensures webhook events never contain full payload data. The system sanitizes and extracts only metadata, maintaining zero exposure of sensitive information. This guarantee is verified by multiple test cases that validate the sanitization process.',
    },
  },
};
