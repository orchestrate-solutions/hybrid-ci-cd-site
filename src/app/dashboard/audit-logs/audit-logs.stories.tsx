import type { Meta, StoryObj } from '@storybook/react';
import AuditLogsPage from './page';

const meta = {
  component: AuditLogsPage,
  tags: ['autodocs'],
} satisfies Meta<typeof AuditLogsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    layout: 'fullscreen',
  },
};

export const WithData: Story = {
  parameters: {
    layout: 'fullscreen',
  },
};

export const WithHighSensitivity: Story = {
  parameters: {
    layout: 'fullscreen',
  },
};

export const Empty: Story = {
  parameters: {
    layout: 'fullscreen',
  },
};

export const MobileView: Story = {
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const TabletView: Story = {
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};
