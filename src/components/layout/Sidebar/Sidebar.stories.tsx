import type { Meta, StoryObj } from '@storybook/react';
import { Box } from '@mui/material';
import { Sidebar } from './Sidebar';
import { Home, Briefcase, Settings, ErrorOutline, BarChart3, GitBranch, Users } from 'lucide-react';

const meta = {
  component: Sidebar,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
        }}
      >
        {/* Simulate header */}
        <Box
          sx={{
            height: 64,
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            px: 3,
          }}
        >
          Navigation Example
        </Box>
        {/* Sidebar */}
        <Box sx={{ display: 'flex', flex: 1 }}>
          <Box sx={{ width: 256, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }}>
            <Story />
          </Box>
          <Box sx={{ flex: 1, p: 4, overflowY: 'auto', color: 'text.secondary' }}>
            Content area
          </Box>
        </Box>
      </Box>
    ),
  ],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/' },
  { id: 'jobs', label: 'Jobs', icon: Briefcase, href: '/jobs' },
  { id: 'agents', label: 'Agents', icon: Users, href: '/agents' },
  { id: 'deployments', label: 'Deployments', icon: GitBranch, href: '/deployments' },
  { id: 'metrics', label: 'Metrics', icon: BarChart3, href: '/metrics' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
];

export const Default: Story = {
  args: {
    items: navigationItems,
    activeId: 'dashboard',
    onNavigate: (id) => console.log('Navigated to:', id),
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
          { id: 'overview', label: 'Overview', href: '/' },
          { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
          { id: 'metrics', label: 'Metrics', href: '/metrics' },
        ],
      },
      {
        id: 'execution',
        label: 'Execution',
        icon: Briefcase,
        submenu: [
          { id: 'jobs', label: 'Jobs', href: '/jobs' },
          { id: 'queue', label: 'Queue', href: '/queue' },
        ],
      },
      {
        id: 'infrastructure',
        label: 'Infrastructure',
        icon: Users,
        submenu: [
          { id: 'agents', label: 'Agents', href: '/agents' },
          { id: 'pools', label: 'Pools', href: '/pools' },
        ],
      },
      { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
    ],
    activeId: 'dashboard',
    onNavigate: (id) => console.log('Navigated to:', id),
  },
};

export const LongNavigationList: Story = {
  args: {
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'jobs', label: 'Jobs', icon: Briefcase },
      { id: 'agents', label: 'Agents', icon: Users },
      { id: 'deployments', label: 'Deployments', icon: GitBranch },
      { id: 'alerts', label: 'Alerts', icon: ErrorOutline },
      { id: 'metrics', label: 'Metrics', icon: BarChart3 },
      { id: 'settings', label: 'Settings', icon: Settings },
      { id: 'docs', label: 'Documentation', icon: Briefcase },
      { id: 'support', label: 'Support', icon: ErrorOutline },
    ],
    activeId: 'jobs',
    onNavigate: (id) => console.log('Navigated to:', id),
  },
};

export const Empty: Story = {
  args: {
    items: [],
    onNavigate: (id) => console.log('Navigated to:', id),
  },
};

export const SingleItem: Story = {
  args: {
    items: [{ id: 'home', label: 'Home', icon: Home, href: '/' }],
    activeId: 'home',
    onNavigate: (id) => console.log('Navigated to:', id),
  },
};

export const AllExpanded: Story = {
  args: {
    items: [
      {
        id: 'section1',
        label: 'Section 1',
        icon: Home,
        submenu: [
          { id: 'item1a', label: 'Item 1A' },
          { id: 'item1b', label: 'Item 1B' },
        ],
      },
      {
        id: 'section2',
        label: 'Section 2',
        icon: Settings,
        submenu: [
          { id: 'item2a', label: 'Item 2A' },
          { id: 'item2b', label: 'Item 2B' },
          { id: 'item2c', label: 'Item 2C' },
        ],
      },
    ],
    activeId: 'item1a',
    onNavigate: (id) => console.log('Navigated to:', id),
  },
};

export const DarkMode: Story = {
  args: {
    items: navigationItems,
    activeId: 'metrics',
    onNavigate: (id) => console.log('Navigated to:', id),
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
};
