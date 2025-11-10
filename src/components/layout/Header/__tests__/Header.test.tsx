import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Header } from '../Header';

describe('Header', () => {
  it('renders logo and title', () => {
    render(
      <Header 
        logo="🚀 App"
        title="Dashboard"
        onThemeToggle={() => {}}
      />
    );
    expect(screen.getByText('🚀 App')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders full-width header with proper styling', () => {
    const { container } = render(
      <Header 
        logo="App"
        title="Test"
        onThemeToggle={() => {}}
      />
    );
    const header = container.querySelector('header');
    expect(header).toHaveClass('w-full', 'h-16', 'flex', 'items-center', 'px-6');
  });

  it('renders theme toggle button when onThemeToggle provided', () => {
    render(
      <Header 
        logo="App"
        title="Test"
        onThemeToggle={() => {}}
      />
    );
    const themeButton = screen.getByRole('button', { name: /theme/i });
    expect(themeButton).toBeInTheDocument();
  });

  it('calls onThemeToggle when theme button clicked', async () => {
    const user = userEvent.setup();
    const onThemeToggle = vi.fn();
    render(
      <Header 
        logo="App"
        title="Test"
        onThemeToggle={onThemeToggle}
      />
    );
    const themeButton = screen.getByRole('button', { name: /theme/i });
    await user.click(themeButton);
    expect(onThemeToggle).toHaveBeenCalledTimes(1);
  });

  it('does not render theme button when onThemeToggle not provided', () => {
    render(
      <Header 
        logo="App"
        title="Test"
      />
    );
    const themeButton = screen.queryByRole('button', { name: /theme/i });
    expect(themeButton).not.toBeInTheDocument();
  });

  it('renders user menu button when userMenuItems provided', () => {
    render(
      <Header 
        logo="App"
        title="Test"
        userMenuItems={[
          { label: 'Profile', onClick: () => {} },
        ]}
        onThemeToggle={() => {}}
      />
    );
    const userMenuButton = screen.getByRole('button', { name: /user|menu/i });
    expect(userMenuButton).toBeInTheDocument();
  });

  it('opens user menu when menu button clicked', async () => {
    const user = userEvent.setup();
    render(
      <Header 
        logo="App"
        title="Test"
        userMenuItems={[
          { label: 'Profile', onClick: () => {} },
          { label: 'Logout', onClick: () => {} },
        ]}
        onThemeToggle={() => {}}
      />
    );
    const menuButton = screen.getByRole('button', { name: /user|menu/i });
    await user.click(menuButton);
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('calls menu item onClick when item clicked', async () => {
    const user = userEvent.setup();
    const handleLogout = vi.fn();
    render(
      <Header 
        logo="App"
        title="Test"
        userMenuItems={[
          { label: 'Logout', onClick: handleLogout },
        ]}
        onThemeToggle={() => {}}
      />
    );
    const menuButton = screen.getByRole('button', { name: /user|menu/i });
    await user.click(menuButton);
    const logoutItem = screen.getByText('Logout');
    await user.click(logoutItem);
    expect(handleLogout).toHaveBeenCalledTimes(1);
  });

  it('closes user menu after item clicked', async () => {
    const user = userEvent.setup();
    render(
      <Header 
        logo="App"
        title="Test"
        userMenuItems={[
          { label: 'Logout', onClick: () => {} },
        ]}
        onThemeToggle={() => {}}
      />
    );
    const menuButton = screen.getByRole('button', { name: /user|menu/i });
    await user.click(menuButton);
    expect(screen.getByText('Logout')).toBeInTheDocument();
    await user.click(screen.getByText('Logout'));
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  it('has sticky positioning for header', () => {
    const { container } = render(
      <Header 
        logo="App"
        title="Test"
        onThemeToggle={() => {}}
      />
    );
    const header = container.querySelector('header');
    expect(header).toHaveClass('sticky', 'top-0', 'z-40');
  });

  it('applies theme CSS variables to header', () => {
    const { container } = render(
      <Header 
        logo="App"
        title="Test"
        onThemeToggle={() => {}}
      />
    );
    const header = container.querySelector('header');
    expect(header).toHaveClass('bg-header', 'border-b', 'border-divider');
  });

  it('renders logo and title in correct order', () => {
    const { container } = render(
      <Header 
        logo="🚀 App"
        title="Dashboard"
        onThemeToggle={() => {}}
      />
    );
    const logo = screen.getByText('🚀 App');
    const title = screen.getByText('Dashboard');
    expect(logo.compareDocumentPosition(title) & 4).toBe(4);
  });

  it('applies proper spacing to logo', () => {
    const { container } = render(
      <Header 
        logo="App"
        title="Test"
        onThemeToggle={() => {}}
      />
    );
    const logoContainer = screen.getByText('App').closest('div');
    expect(logoContainer).toHaveClass('text-lg', 'font-semibold', 'mr-8');
  });

  it('makes title flex-grow to fill available space', () => {
    const { container } = render(
      <Header 
        logo="App"
        title="Test"
        title2="Extra"
        onThemeToggle={() => {}}
      />
    );
    const titleContainer = screen.getByText('Test').closest('div');
    expect(titleContainer).toHaveClass('flex-1');
  });

  it('renders empty user menu gracefully', () => {
    const { container } = render(
      <Header 
        logo="App"
        title="Test"
        userMenuItems={[]}
        onThemeToggle={() => {}}
      />
    );
    const userMenuButton = screen.queryByRole('button', { name: /user|menu/i });
    expect(userMenuButton).not.toBeInTheDocument();
  });

  it('handles rapid theme toggle clicks', async () => {
    const user = userEvent.setup();
    const onThemeToggle = vi.fn();
    render(
      <Header 
        logo="App"
        title="Test"
        onThemeToggle={onThemeToggle}
      />
    );
    const themeButton = screen.getByRole('button', { name: /theme/i });
    await user.click(themeButton);
    await user.click(themeButton);
    await user.click(themeButton);
    expect(onThemeToggle).toHaveBeenCalledTimes(3);
  });

  it('maintains semantic HTML structure', () => {
    const { container } = render(
      <Header 
        logo="App"
        title="Test"
        onThemeToggle={() => {}}
      />
    );
    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();
    expect(header?.tagName).toBe('HEADER');
  });
});
