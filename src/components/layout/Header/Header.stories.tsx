import type { Meta, StoryObj } from '@storybook/react';
import { Header } from './Header';

const meta = {
  component: Header,
  tags: ['autodocs'],
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    logo: '🚀 CI/CD Platform',
    title: 'Dashboard',
    onThemeToggle: () => console.log('Theme toggled'),
  },
};

export const WithUserMenu: Story = {
  args: {
    logo: '🚀 CI/CD Platform',
    title: 'Job Details',
    userMenuItems: [
      { label: 'Profile', onClick: () => console.log('Profile clicked') },
      { label: 'Settings', onClick: () => console.log('Settings clicked') },
      { label: 'Logout', onClick: () => console.log('Logout clicked') },
    ],
    onThemeToggle: () => console.log('Theme toggled'),
  },
};

export const MinimalHeader: Story = {
  args: {
    logo: 'App',
    title: 'Home',
    onThemeToggle: () => console.log('Theme toggled'),
  },
};

export const WithLongTitle: Story = {
  args: {
    logo: '🚀 CI/CD',
    title: 'Deployment Configuration and Pipeline Management',
    onThemeToggle: () => console.log('Theme toggled'),
  },
};

export const WithoutThemeToggle: Story = {
  args: {
    logo: '🔧 Tools',
    title: 'Integrations',
  },
};
