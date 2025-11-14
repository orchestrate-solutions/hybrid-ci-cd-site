import type { Meta, StoryObj } from '@storybook/react';
import ArchitecturePage from './page';

const meta = {
  component: ArchitecturePage,
  tags: ['autodocs'],
} satisfies Meta<typeof ArchitecturePage>;

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

export const WithData: Story = {
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

export const Empty: Story = {
  decorators: [
    (Story) => (
      <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '20px' }}>
        <Story />
      </div>
    ),
  ],
};
