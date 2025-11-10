import type { Meta, StoryObj } from '@storybook/react';
import { Box, Container, Paper, Typography, Grid, Card, CardContent } from '@mui/material';
import { Home, Briefcase, Settings, AlertCircle } from 'lucide-react';
import { AppShell } from './AppShell';
import { Header } from '../Header/Header';
import { Sidebar } from '../Sidebar/Sidebar';

const meta = {
  component: AppShell,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/' },
  { id: 'jobs', label: 'Jobs', icon: Briefcase, href: '/jobs' },
  { id: 'deployments', label: 'Deployments', icon: Briefcase, href: '/deployments' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
];

const SampleContent = () => (
  <Container maxWidth="lg" sx={{ py: 4 }}>
    <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 600 }}>
      Welcome to Dashboard
    </Typography>
    <Grid container spacing={3}>
      {[1, 2, 3, 4].map((i) => (
        <Grid item xs={12} sm={6} md={4} key={i}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Metric {i}
              </Typography>
              <Typography variant="h5" component="div">
                {Math.floor(Math.random() * 1000)}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Last updated just now
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  </Container>
);

export const Default: Story = {
  args: {
    header: (
      <Header
        logo="🚀 Hybrid CI/CD"
        title="Dashboard"
        onThemeToggle={() => console.log('Theme toggled')}
      />
    ),
    sidebar: (
      <Sidebar
        items={sampleNavItems}
        activeId="dashboard"
        onNavigate={(id) => console.log('Navigate to:', id)}
      />
    ),
    children: <SampleContent />,
  },
};

export const WithUserMenu: Story = {
  args: {
    header: (
      <Header
        logo="🚀 CI/CD"
        title="Jobs Overview"
        userMenuItems={[
          { label: 'Profile', onClick: () => console.log('Profile') },
          { label: 'Settings', onClick: () => console.log('Settings') },
          { label: 'Logout', onClick: () => console.log('Logout') },
        ]}
        onThemeToggle={() => console.log('Theme toggled')}
      />
    ),
    sidebar: (
      <Sidebar
        items={sampleNavItems}
        activeId="jobs"
        onNavigate={(id) => console.log('Navigate to:', id)}
      />
    ),
    children: (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
          Jobs
        </Typography>
        <Paper sx={{ p: 3 }}>
          <Typography>Jobs overview content would appear here</Typography>
        </Paper>
      </Container>
    ),
  },
};

export const CollapsibleSidebar: Story = {
  args: {
    header: (
      <Header
        logo="Platform"
        title="Deployments"
        onThemeToggle={() => console.log('Theme toggled')}
      />
    ),
    sidebar: (
      <Sidebar
        items={[
          {
            id: 'main',
            label: 'Main',
            icon: Home,
            submenu: [
              { id: 'overview', label: 'Overview' },
              { id: 'metrics', label: 'Metrics' },
            ],
          },
          { id: 'jobs', label: 'Jobs', icon: Briefcase },
          { id: 'deployments', label: 'Deployments', icon: Briefcase },
          {
            id: 'admin',
            label: 'Admin',
            icon: Settings,
            submenu: [
              { id: 'agents', label: 'Agents' },
              { id: 'settings', label: 'Settings' },
              { id: 'logs', label: 'Logs' },
            ],
          },
        ]}
        activeId="deployments"
        onNavigate={(id) => console.log('Navigate to:', id)}
      />
    ),
    children: <SampleContent />,
  },
};

export const MinimalLayout: Story = {
  args: {
    header: (
      <Header
        logo="App"
        title="Home"
        onThemeToggle={() => console.log('Theme toggled')}
      />
    ),
    sidebar: (
      <Sidebar
        items={[
          { id: 'home', label: 'Home', icon: Home },
          { id: 'settings', label: 'Settings', icon: Settings },
        ]}
        activeId="home"
      />
    ),
    children: (
      <Box sx={{ p: 4 }}>
        <Typography variant="h6">Minimal Layout Example</Typography>
      </Box>
    ),
  },
};

export const DarkMode: Story = {
  args: {
    header: (
      <Header
        logo="🚀 CI/CD"
        title="Dark Mode Dashboard"
        onThemeToggle={() => console.log('Theme toggled')}
      />
    ),
    sidebar: (
      <Sidebar
        items={sampleNavItems}
        activeId="settings"
        onNavigate={(id) => console.log('Navigate to:', id)}
      />
    ),
    children: (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          This looks great in dark mode!
        </Typography>
        <Paper sx={{ p: 3 }}>
          <Typography>Dark mode is supported via theme system</Typography>
        </Paper>
      </Container>
    ),
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
};
