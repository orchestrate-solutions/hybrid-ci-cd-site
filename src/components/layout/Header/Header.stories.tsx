import type { Meta, StoryObj } from '@storybook/react';
import { Box } from '@mui/material';
import { Header } from './Header';

const meta = {
  component: Header,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Story />
        <Box
          sx={{
            flex: 1,
            p: 4,
            bgcolor: 'background.default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.secondary',
          }}
        >
          Content area below header
        </Box>
      </Box>
    ),
  ],
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    logo: '🚀 Hybrid CI/CD',
    title: 'Dashboard',
    onThemeToggle: () => console.log('Theme toggled'),
  },
};

export const WithUserMenu: Story = {
  args: {
    logo: '🚀 CI/CD Platform',
    title: 'Job Details',
    userMenuItems: [
      { label: 'Profile', onClick: () => alert('Profile clicked') },
      { label: 'Settings', onClick: () => alert('Settings clicked') },
      { label: 'Logout', onClick: () => alert('Logout clicked') },
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
    userMenuItems: [
      { label: 'Profile', onClick: () => alert('Profile') },
    ],
    onThemeToggle: () => console.log('Theme toggled'),
  },
};

export const WithoutThemeToggle: Story = {
  args: {
    logo: '🔧 Tools',
    title: 'Integrations',
    userMenuItems: [
      { label: 'API Keys', onClick: () => alert('API Keys') },
      { label: 'Integrations', onClick: () => alert('Integrations') },
    ],
  },
};

export const WithMenuAndUserOptions: Story = {
  args: {
    logo: '⚡ Platform',
    title: 'Agent Management',
    userMenuItems: [
      { label: '👤 Profile', onClick: () => alert('Profile') },
      { label: '⚙️ Settings', onClick: () => alert('Settings') },
      { label: '🔐 Change Password', onClick: () => alert('Change Password') },
      { label: '📋 Documentation', onClick: () => alert('Docs') },
      { label: '🚪 Logout', onClick: () => alert('Logout') },
    ],
    onThemeToggle: () => console.log('Theme toggled'),
    onMenuToggle: () => console.log('Mobile menu toggled'),
  },
};

export const Responsive: Story = {
  args: {
    logo: '🚀 CI/CD',
    title: 'Jobs',
    userMenuItems: [
      { label: 'Profile', onClick: () => alert('Profile') },
      { label: 'Logout', onClick: () => alert('Logout') },
    ],
    onThemeToggle: () => console.log('Theme toggled'),
    onMenuToggle: () => console.log('Mobile menu toggled'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
