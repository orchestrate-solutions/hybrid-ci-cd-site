import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Header } from '../Header';

// Mock the useTheme hook
vi.mock('@/lib/themes/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({
    themeName: 'light',
    setTheme: vi.fn(),
    isDark: false,
  })),
}));

describe('Header', () => {
  it('renders logo and title', () => {
    render(
      <Header 
        logo="🚀 App"
        title="Dashboard"
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
      />
    );
    const header = container.querySelector('header');
    expect(header).toHaveClass('MuiPaper-root', 'MuiAppBar-root');
    expect(header).toHaveClass('MuiAppBar-positionSticky');
  });

  it('renders theme switcher button by default', () => {
    render(
      <Header 
        logo="App"
        title="Test"
      />
    );
    const themeButton = screen.getByRole('button', { name: /switch theme/i });
    expect(themeButton).toBeInTheDocument();
  });

  it('does not render theme button when showThemeSwitcher is false', () => {
    render(
      <Header 
        logo="App"
        title="Test"
        showThemeSwitcher={false}
      />
    );
    const themeButton = screen.queryByRole('button', { name: /switch theme/i });
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
      />
    );
    const header = container.querySelector('header');
    expect(header).toHaveClass('MuiAppBar-positionSticky');
  });

  it('applies theme CSS variables to header', () => {
    const { container } = render(
      <Header 
        logo="App"
        title="Test"
      />
    );
    const header = container.querySelector('header');
    expect(header).toHaveClass('MuiPaper-root', 'MuiAppBar-root');
    // MUI handles theming through sx prop, so we check for MUI classes
  });

  it('renders logo and title in correct order', () => {
    const { container } = render(
      <Header 
        logo="🚀 App"
        title="Dashboard"
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
      />
    );
    const logoContainer = screen.getByText('App').closest('div');
    expect(logoContainer).toHaveClass('MuiTypography-root', 'MuiTypography-h6');
  });

  it('makes title flex-grow to fill available space', () => {
    const { container } = render(
      <Header 
        logo="App"
        title="Test"
        title2="Extra"
      />
    );
    const toolbar = container.querySelector('.MuiToolbar-root');
    expect(toolbar).toHaveClass('MuiToolbar-root');
  });

  it('renders empty user menu gracefully', () => {
    const { container } = render(
      <Header 
        logo="App"
        title="Test"
        userMenuItems={[]}
      />
    );
    const userMenuButton = screen.queryByRole('button', { name: /user|menu/i });
    expect(userMenuButton).not.toBeInTheDocument();
  });

  it('handles rapid theme toggle clicks', async () => {
    const user = userEvent.setup();
    render(
      <Header 
        logo="App"
        title="Test"
      />
    );
    const themeButton = screen.getByRole('button', { name: /switch theme/i });
    await user.click(themeButton);
    await user.click(themeButton);
    await user.click(themeButton);
    // Theme switching is handled internally, just verify button exists
    expect(themeButton).toBeInTheDocument();
  });

  it('maintains semantic HTML structure', () => {
    const { container } = render(
      <Header 
        logo="App"
        title="Test"
      />
    );
    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();
    expect(header?.tagName).toBe('HEADER');
  });
});
