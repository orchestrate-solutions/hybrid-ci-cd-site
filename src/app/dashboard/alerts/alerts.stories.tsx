import type { Meta, StoryObj } from '@storybook/react';
import AlertConfigurationPage from './page';

const meta = {
  component: AlertConfigurationPage,
  tags: ['autodocs'],
} satisfies Meta<typeof AlertConfigurationPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    layout: 'fullscreen',
  },
};

export const RulesTab: Story = {
  parameters: {
    layout: 'fullscreen',
    initialState: { activeTab: 0 },
  },
};

export const HistoryTab: Story = {
  parameters: {
    layout: 'fullscreen',
    initialState: { activeTab: 1 },
  },
};

export const ChannelsTab: Story = {
  parameters: {
    layout: 'fullscreen',
    initialState: { activeTab: 2 },
  },
};

export const QuietHoursTab: Story = {
  parameters: {
    layout: 'fullscreen',
    initialState: { activeTab: 3 },
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
