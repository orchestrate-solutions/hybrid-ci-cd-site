import type { Meta, StoryObj } from '@storybook/react';
import RelayDeployPage from './page';

const meta = {
  component: RelayDeployPage,
  tags: ['autodocs'],
} satisfies Meta<typeof RelayDeployPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <RelayDeployPage />,
  decorators: [
    (Story) => (
      <div style={{ padding: '1rem', minHeight: '100vh', backgroundColor: '#fafafa' }}>
        <Story />
      </div>
    ),
  ],
};

export const FullPage: Story = {
  render: () => <RelayDeployPage />,
  parameters: {
    layout: 'fullscreen',
  },
};

export const DarkMode: Story = {
  render: () => <RelayDeployPage />,
  decorators: [
    (Story) => (
      <div style={{ padding: '1rem', minHeight: '100vh', backgroundColor: '#121212', color: '#fff' }}>
        <Story />
      </div>
    ),
  ],
};

export const Mobile: Story = {
  render: () => <RelayDeployPage />,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const Tablet: Story = {
  render: () => <RelayDeployPage />,
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};
