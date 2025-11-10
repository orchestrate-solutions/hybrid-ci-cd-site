import type { Meta, StoryObj } from '@storybook/react';
import { Sidebar } from './Sidebar';
import { Home, Briefcase, Settings, AlertCircle } from 'lucide-react';

const meta = {
  component: Sidebar,
  tags: ['autodocs'],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/' },
      { id: 'projects', label: 'Projects', icon: Briefcase, href: '/projects' },
      { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
    ],
    activeId: 'dashboard',
  },
};

export const WithCollapsible: Story = {
  args: {
    items: [
      { 
        id: 'main', 
        label: 'Main', 
        icon: Home,
        submenu: [
          { id: 'dashboard', label: 'Dashboard', href: '/' },
          { id: 'overview', label: 'Overview', href: '/overview' },
        ]
      },
      { id: 'projects', label: 'Projects', icon: Briefcase, href: '/projects' },
    ],
    activeId: 'dashboard',
  },
};

export const LongNavigationList: Story = {
  args: {
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/' },
      { id: 'projects', label: 'Projects', icon: Briefcase, href: '/projects' },
      { id: 'alerts', label: 'Alerts', icon: AlertCircle, href: '/alerts' },
      { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
      { id: 'docs', label: 'Documentation', icon: Briefcase, href: '/docs' },
      { id: 'support', label: 'Support', icon: AlertCircle, href: '/support' },
    ],
    activeId: 'projects',
  },
};

export const Empty: Story = {
  args: {
    items: [],
  },
};

export const SingleItem: Story = {
  args: {
    items: [
      { id: 'home', label: 'Home', icon: Home, href: '/' },
    ],
    activeId: 'home',
  },
};
