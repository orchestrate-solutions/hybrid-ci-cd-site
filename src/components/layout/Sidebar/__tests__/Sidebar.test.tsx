import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Sidebar } from '../Sidebar';
import { Home, Briefcase, Settings } from 'lucide-react';

describe('Sidebar', () => {
  const mockItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/' },
    { id: 'projects', label: 'Projects', icon: Briefcase, href: '/projects' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
  ];

  it('renders sidebar container with proper styling', () => {
    const { container } = render(
      <Sidebar items={mockItems} activeId="dashboard" />
    );
    const aside = container.querySelector('aside');
    expect(aside).toHaveClass('w-64', 'flex-shrink-0', 'overflow-y-auto', 'flex', 'flex-col');
  });

  it('renders all navigation items', () => {
    render(
      <Sidebar items={mockItems} activeId="dashboard" />
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('highlights active navigation item', () => {
    const { container } = render(
      <Sidebar items={mockItems} activeId="dashboard" />
    );
    const dashboardButton = screen.getByText('Dashboard').closest('button');
    expect(dashboardButton).toHaveClass('bg-surface-secondary');
  });

  it('renders navigation icons', () => {
    const { container } = render(
      <Sidebar items={mockItems} activeId="dashboard" />
    );
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('calls onNavigate when item clicked', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <Sidebar items={mockItems} activeId="dashboard" onNavigate={onNavigate} />
    );
    const projectsButton = screen.getByText('Projects').closest('button');
    await user.click(projectsButton);
    expect(onNavigate).toHaveBeenCalledWith('projects');
  });

  it('renders submenu items when collapsible item expanded', async () => {
    const user = userEvent.setup();
    const itemsWithSubmenu = [
      {
        id: 'main',
        label: 'Main',
        icon: Home,
        submenu: [
          { id: 'dashboard', label: 'Dashboard', href: '/' },
          { id: 'overview', label: 'Overview', href: '/overview' },
        ],
      },
    ];
    render(
      <Sidebar items={itemsWithSubmenu} activeId="main" />
    );
    const mainButton = screen.getByText('Main').closest('button');
    await user.click(mainButton);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });

  it('toggles submenu on repeated clicks', async () => {
    const user = userEvent.setup();
    const itemsWithSubmenu = [
      {
        id: 'main',
        label: 'Main',
        icon: Home,
        submenu: [
          { id: 'dashboard', label: 'Dashboard', href: '/' },
        ],
      },
    ];
    render(
      <Sidebar items={itemsWithSubmenu} activeId="main" />
    );
    const mainButton = screen.getByText('Main').closest('button');
    
    // First click: expand
    await user.click(mainButton);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    
    // Second click: collapse
    await user.click(mainButton);
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('renders empty sidebar when no items', () => {
    const { container } = render(
      <Sidebar items={[]} />
    );
    const items = container.querySelectorAll('button');
    expect(items.length).toBe(0);
  });

  it('applies theme CSS variables to sidebar', () => {
    const { container } = render(
      <Sidebar items={mockItems} activeId="dashboard" />
    );
    const aside = container.querySelector('aside');
    expect(aside).toHaveClass('bg-surface-primary', 'text-text-primary', 'border-r', 'border-divider');
  });

  it('handles items with and without icons', () => {
    const mixedItems = [
      { id: 'home', label: 'Home', icon: Home, href: '/' },
      { id: 'text', label: 'Text Only', href: '/text' },
    ];
    render(
      <Sidebar items={mixedItems} activeId="home" />
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Text Only')).toBeInTheDocument();
  });

  it('renders sidebar as scrollable container', () => {
    const { container } = render(
      <Sidebar items={mockItems} activeId="dashboard" />
    );
    const aside = container.querySelector('aside');
    expect(aside).toHaveClass('overflow-y-auto');
  });

  it('maintains flex layout structure', () => {
    const { container } = render(
      <Sidebar items={mockItems} activeId="dashboard" />
    );
    const aside = container.querySelector('aside');
    expect(aside).toHaveClass('flex', 'flex-col');
  });

  it('handles long navigation lists', () => {
    const longItems = Array.from({ length: 20 }, (_, i) => ({
      id: `item-${i}`,
      label: `Item ${i}`,
      icon: Home,
      href: `/item-${i}`,
    }));
    render(
      <Sidebar items={longItems} activeId="item-0" />
    );
    expect(screen.getByText('Item 0')).toBeInTheDocument();
    expect(screen.getByText('Item 19')).toBeInTheDocument();
  });

  it('navigates to correct href when available', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <Sidebar items={mockItems} activeId="dashboard" onNavigate={onNavigate} />
    );
    const projectsButton = screen.getByText('Projects').closest('button');
    await user.click(projectsButton);
    expect(onNavigate).toHaveBeenCalledWith('projects');
  });

  it('renders navigation list semantically', () => {
    const { container } = render(
      <Sidebar items={mockItems} activeId="dashboard" />
    );
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
  });

  it('applies hover effects to items', () => {
    const { container } = render(
      <Sidebar items={mockItems} activeId="dashboard" />
    );
    const buttons = container.querySelectorAll('button');
    buttons.forEach(btn => {
      expect(btn).toHaveClass('hover:bg-surface-secondary');
    });
  });

  it('distinguishes active from inactive items', () => {
    const { container } = render(
      <Sidebar items={mockItems} activeId="dashboard" />
    );
    const dashboardButton = screen.getByText('Dashboard').closest('button');
    const projectsButton = screen.getByText('Projects').closest('button');
    
    expect(dashboardButton).toHaveClass('bg-surface-secondary');
    expect(projectsButton).not.toHaveClass('bg-surface-secondary');
  });

  it('renders submenu item labels inside submenu', async () => {
    const user = userEvent.setup();
    const itemsWithSubmenu = [
      {
        id: 'admin',
        label: 'Admin',
        icon: Settings,
        submenu: [
          { id: 'users', label: 'Users', href: '/admin/users' },
          { id: 'roles', label: 'Roles', href: '/admin/roles' },
        ],
      },
    ];
    render(
      <Sidebar items={itemsWithSubmenu} activeId="admin" />
    );
    const adminButton = screen.getByText('Admin').closest('button');
    await user.click(adminButton);
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Roles')).toBeInTheDocument();
  });
});
