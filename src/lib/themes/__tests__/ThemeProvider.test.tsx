/**
 * RED Phase: ThemeProvider Component Tests
 * 
 * These tests specify ThemeProvider behavior before implementation.
 * Written first to define component contract.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactNode } from 'react';
import { ThemeProvider, useTheme } from '../ThemeProvider';

/**
 * Test Component that uses useTheme hook
 */
function TestComponent() {
  const { theme, themeName, isDark, setTheme } = useTheme();

  return (
    <div>
      <div data-testid="current-theme">{themeName}</div>
      <div data-testid="is-dark">{isDark ? 'dark' : 'light'}</div>
      <div data-testid="theme-label">{theme.label}</div>
      <div data-testid="primary-color">{theme.colors.brand.primary}</div>

      <button
        data-testid="btn-light"
        onClick={() => setTheme('light')}
      >
        Light
      </button>
      <button
        data-testid="btn-dark"
        onClick={() => setTheme('dark')}
      >
        Dark
      </button>
      <button
        data-testid="btn-solarized-light"
        onClick={() => setTheme('solarized-light')}
      >
        Solarized Light
      </button>
      <button
        data-testid="btn-solarized-dark"
        onClick={() => setTheme('solarized-dark')}
      >
        Solarized Dark
      </button>
    </div>
  );
}

describe('ThemeProvider Component (RED Phase)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.style.cssText = '';
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initial Render', () => {
    it('renders with default light theme on first load', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
      expect(screen.getByTestId('is-dark')).toHaveTextContent('light');
    });

    it('renders with initialTheme prop when provided', () => {
      render(
        <ThemeProvider initialTheme="dark">
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      expect(screen.getByTestId('is-dark')).toHaveTextContent('dark');
    });

    it('displays correct theme label', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('theme-label')).toHaveTextContent('Light');
    });

    it('applies CSS variables to document root', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        const root = document.documentElement;
        expect(root.style.getPropertyValue('--bg-primary')).toBeTruthy();
        expect(root.style.getPropertyValue('--text-primary')).toBeTruthy();
      });
    });

    it('adds theme class to document root', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        const root = document.documentElement;
        expect(root.classList.contains('light')).toBe(true);
      });
    });
  });

  describe('Theme Switching', () => {
    it('switches to dark theme when button clicked', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');

      await user.click(screen.getByTestId('btn-dark'));

      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
        expect(screen.getByTestId('is-dark')).toHaveTextContent('dark');
      });
    });

    it('switches to solarized-light theme', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId('btn-solarized-light'));

      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('solarized-light');
      });
    });

    it('switches to solarized-dark theme', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId('btn-solarized-dark'));

      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('solarized-dark');
      });
    });

    it('updates CSS variables when theme changes', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const root = document.documentElement;
      const lightPrimary = root.style.getPropertyValue('--bg-primary');

      await user.click(screen.getByTestId('btn-dark'));

      await waitFor(() => {
        const darkPrimary = root.style.getPropertyValue('--bg-primary');
        expect(darkPrimary).not.toBe(lightPrimary);
      });
    });

    it('updates document root classes when theme changes', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(document.documentElement.classList.contains('light')).toBe(true);
      });

      await user.click(screen.getByTestId('btn-dark'));

      await waitFor(() => {
        expect(document.documentElement.classList.contains('light')).toBe(false);
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });
    });

    it('removes previous theme class when switching', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider initialTheme="light">
          <TestComponent />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId('btn-solarized-light'));

      await waitFor(() => {
        const root = document.documentElement;
        expect(root.classList.contains('light')).toBe(false);
        expect(root.classList.contains('solarized-light')).toBe(true);
      });
    });
  });

  describe('localStorage Persistence', () => {
    it('saves theme preference to localStorage', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId('btn-dark'));

      await waitFor(() => {
        expect(localStorage.getItem('app-theme-preference')).toBe('dark');
      });
    });

    it('restores theme from localStorage on mount', () => {
      localStorage.setItem('app-theme-preference', 'solarized-dark');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('current-theme')).toHaveTextContent('solarized-dark');
    });

    it('persists theme changes across multiple switches', async () => {
      const user = userEvent.setup();

      const { unmount } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId('btn-dark'));

      await waitFor(() => {
        expect(localStorage.getItem('app-theme-preference')).toBe('dark');
      });

      unmount();

      // Re-render to simulate page reload
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });
  });

  describe('useTheme Hook', () => {
    it('throws error when used outside ThemeProvider', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useTheme must be used within ThemeProvider');

      consoleError.mockRestore();
    });

    it('provides current theme from context', () => {
      render(
        <ThemeProvider initialTheme="dark">
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });

    it('provides isDark boolean correctly for light theme', () => {
      render(
        <ThemeProvider initialTheme="light">
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('is-dark')).toHaveTextContent('light');
    });

    it('provides isDark boolean correctly for dark theme', () => {
      render(
        <ThemeProvider initialTheme="dark">
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('is-dark')).toHaveTextContent('dark');
    });

    it('provides theme object with complete color palette', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Verify brand.primary color is rendered (shows theme object is complete)
      const primaryColor = screen.getByTestId('primary-color');
      expect(primaryColor.textContent).toBeTruthy();
      expect(primaryColor.textContent).toMatch(/#[\da-fA-F]{6}/);
    });
  });

  describe('Hydration & SSR', () => {
    it('does not render until hydrated (prevents hydration mismatch)', () => {
      const { container } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Component should be present after hydration
      expect(screen.getByTestId('current-theme')).toBeInTheDocument();
    });

    it('handles multiple children correctly', () => {
      const Component1 = () => {
        const { themeName } = useTheme();
        return <div data-testid="comp1">{themeName}</div>;
      };

      const Component2 = () => {
        const { themeName } = useTheme();
        return <div data-testid="comp2">{themeName}</div>;
      };

      render(
        <ThemeProvider initialTheme="dark">
          <Component1 />
          <Component2 />
        </ThemeProvider>
      );

      expect(screen.getByTestId('comp1')).toHaveTextContent('dark');
      expect(screen.getByTestId('comp2')).toHaveTextContent('dark');
    });
  });

  describe('Custom Events', () => {
    it('dispatches theme-changed event when theme changes', async () => {
      const user = userEvent.setup();
      const eventListener = vi.fn();

      window.addEventListener('theme-changed', eventListener);

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId('btn-dark'));

      await waitFor(() => {
        expect(eventListener).toHaveBeenCalledWith(
          expect.objectContaining({
            detail: expect.objectContaining({
              theme: 'dark',
              isDark: true,
            }),
          })
        );
      });

      window.removeEventListener('theme-changed', eventListener);
    });

    it('event includes correct isDark flag for light theme', async () => {
      const user = userEvent.setup();
      const eventListener = vi.fn();

      window.addEventListener('theme-changed', eventListener);

      render(
        <ThemeProvider initialTheme="dark">
          <TestComponent />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId('btn-light'));

      await waitFor(() => {
        expect(eventListener).toHaveBeenCalledWith(
          expect.objectContaining({
            detail: expect.objectContaining({
              theme: 'light',
              isDark: false,
            }),
          })
        );
      });

      window.removeEventListener('theme-changed', eventListener);
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid theme changes', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId('btn-dark'));
      await user.click(screen.getByTestId('btn-light'));
      await user.click(screen.getByTestId('btn-dark'));

      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      });
    });

    it('maintains localStorage consistency after rapid changes', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId('btn-dark'));
      await user.click(screen.getByTestId('btn-solarized-light'));
      await user.click(screen.getByTestId('btn-solarized-dark'));

      await waitFor(() => {
        expect(localStorage.getItem('app-theme-preference')).toBe('solarized-dark');
      });
    });
  });
});
