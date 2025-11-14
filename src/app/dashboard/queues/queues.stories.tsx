import type { Meta, StoryObj } from '@storybook/react';
import QueuesPage from './page';

const meta = {
  component: QueuesPage,
  tags: ['autodocs'],
} satisfies Meta<typeof QueuesPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    (Story) => (
      <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '20px' }}>
        <Story />
      </div>
    ),
  ],
};

export const Loading: Story = {
  decorators: [
    (Story) => (
      <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '20px' }}>
        <Story />
      </div>
    ),
  ],
};

export const Empty: Story = {
  decorators: [
    (Story) => (
      <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '20px' }}>
        <Story />
      </div>
    ),
  ],
};

export const WithDeadLetterMessages: Story = {
  decorators: [
    (Story) => (
      <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '20px' }}>
        <Story />
      </div>
    ),
  ],
};

export const Error: Story = {
  decorators: [
    (Story) => (
      <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '20px' }}>
        <Story />
      </div>
    ),
  ],
};
