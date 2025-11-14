import type { Meta, StoryObj } from '@storybook/react';
import VaultsPage from './page';

const meta = {
  component: VaultsPage,
  tags: ['autodocs'],
} satisfies Meta<typeof VaultsPage>;

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

export const WithMultipleVaults: Story = {
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
