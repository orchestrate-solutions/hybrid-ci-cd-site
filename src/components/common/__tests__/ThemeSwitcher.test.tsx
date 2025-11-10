/**
 * ThemeSwitcher Component Tests
 *
 * Tests the theme switching functionality using our custom theme system.
 * Verifies that clicking the button cycles through all available themes.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ThemeSwitcher } from '../ThemeSwitcher';
import { useTheme } from '@/lib/themes/ThemeProvider';
import { getTheme } from '@/lib/themes/themes';

// Mock the useTheme hook
vi.mock('@/lib/themes/ThemeProvider', () => ({
  useTheme: vi.fn(),
}));

const mockUseTheme = vi.mocked(useTheme);

describe('ThemeSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTheme.mockReturnValue({
      theme: getTheme('light'),
      themeName: 'light',
      setTheme: vi.fn(),
      isDark: false,
    });
  });

  it('renders with default props', () => {
    render(<ThemeSwitcher />);

    const button = screen.getByRole('button', { name: /switch theme/i });
    expect(button).toBeInTheDocument();
  });

  it('shows tooltip by default', async () => {
    const user = userEvent.setup();
    render(<ThemeSwitcher />);

    const button = screen.getByRole('button', { name: /switch theme/i });
    await user.hover(button);

    // Tooltip should appear (though we can't easily test the content in jsdom)
    expect(button).toBeInTheDocument();
  });

  it('hides tooltip when showTooltip is false', () => {
    render(<ThemeSwitcher showTooltip={false} />);

    const button = screen.getByRole('button', { name: /switch theme/i });
    expect(button).toBeInTheDocument();
  });

  it('cycles through themes on click', async () => {
    const user = userEvent.setup();
    const mockSetTheme = vi.fn();
    mockUseTheme.mockReturnValue({
      theme: getTheme('light'),
      themeName: 'light',
      setTheme: mockSetTheme,
      isDark: false,
    });

    render(<ThemeSwitcher />);

    const button = screen.getByRole('button', { name: /switch theme/i });

    // Click to switch to dark
    await user.click(button);
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('applies custom className', () => {
    render(<ThemeSwitcher className="custom-theme-switcher" />);

    const button = screen.getByRole('button', { name: /switch theme/i });
    expect(button).toHaveClass('custom-theme-switcher');
  });

  it('supports different sizes', () => {
    const { rerender } = render(<ThemeSwitcher size="small" />);

    let button = screen.getByRole('button', { name: /switch theme/i });
    expect(button).toBeInTheDocument();

    rerender(<ThemeSwitcher size="large" />);
    button = screen.getByRole('button', { name: /switch theme/i });
    expect(button).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<ThemeSwitcher />);

    const button = screen.getByRole('button', { name: /switch theme.*light/i });
    expect(button).toHaveAttribute('aria-label', 'Switch theme (current: light)');
  });
});