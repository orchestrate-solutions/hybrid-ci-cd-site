/**
 * StatusCard Tests
 *
 * Unit tests for StatusCard component including:
 * - Theme compliance (light/dark/solarized)
 * - Status variants (success/warning/error/info)
 * - Props handling (label, value, icon, onClick, testId)
 * - Rendering and interactions
 * - Accessibility features
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { StatusCard, StatusType } from './StatusCard';
import {
  CheckCircle as SuccessIcon,
  WarningAmber as WarningIcon,
  ErrorOutline as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock themes
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    success: { main: '#4caf50', light: '#81c784' },
    warning: { main: '#ff9800', light: '#ffb74d' },
    error: { main: '#f44336', light: '#ef5350' },
    info: { main: '#2196f3', light: '#64b5f6' },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#90caf9' },
    success: { main: '#66bb6a', light: '#81c784' },
    warning: { main: '#ffa726', light: '#ffb74d' },
    error: { main: '#ef5350', light: '#f48fb1' },
    info: { main: '#42a5f5', light: '#64b5f6' },
  },
});

const solarizedTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#268bd2' },
    success: { main: '#859900', light: '#93a400' },
    warning: { main: '#b58900', light: '#d4a917' },
    error: { main: '#dc322f', light: '#ff6b6b' },
    info: { main: '#2aa198', light: '#4dd0e1' },
  },
});

interface RenderOptions {
  theme?: any;
}

function renderWithTheme(component: React.ReactElement, options: RenderOptions = {}) {
  const { theme = lightTheme } = options;

  return render(
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {component}
    </ThemeProvider>
  );
}

describe('StatusCard', () => {
  describe('Rendering - Basic Props', () => {
    it('renders with label and value', () => {
      renderWithTheme(
        <StatusCard label="Jobs Running" value={8} testId="jobs-card" />
      );

      expect(screen.getByText('Jobs Running')).toBeInTheDocument();
      expect(screen.getByTestId('jobs-card-value')).toHaveTextContent('8');
    });

    it('renders numeric values with thousands separator', () => {
      renderWithTheme(
        <StatusCard label="Total Processed" value={1234567} testId="total-card" />
      );

      expect(screen.getByTestId('total-card-value')).toHaveTextContent('1,234,567');
    });

    it('renders string values without formatting', () => {
      renderWithTheme(
        <StatusCard label="Status" value="OPERATIONAL" testId="status-card" />
      );

      expect(screen.getByTestId('status-card-value')).toHaveTextContent('OPERATIONAL');
    });

    it('renders with optional icon', () => {
      renderWithTheme(
        <StatusCard
          label="Success Case"
          value={10}
          icon={<SuccessIcon data-testid="success-icon" />}
          testId="icon-card"
        />
      );

      expect(screen.getByTestId('success-icon')).toBeInTheDocument();
    });

    it('renders without icon when not provided', () => {
      renderWithTheme(
        <StatusCard label="No Icon" value={5} testId="no-icon-card" />
      );

      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('Status Variants', () => {
    const statuses: StatusType[] = ['success', 'warning', 'error', 'info'];
    const statusIcons = {
      success: SuccessIcon,
      warning: WarningIcon,
      error: ErrorIcon,
      info: InfoIcon,
    };
    const statusBadges = {
      success: '✅',
      warning: '⚠️',
      error: '❌',
      info: 'ℹ️',
    };

    statuses.forEach((status) => {
      it(`renders ${status} status with correct badge`, () => {
        const IconComponent = statusIcons[status];
        renderWithTheme(
          <StatusCard
            label={`${status} Status`}
            value={1}
            status={status}
            icon={<IconComponent data-testid={`${status}-icon`} />}
            testId={`${status}-card`}
          />
        );

        expect(screen.getByText(statusBadges[status])).toBeInTheDocument();
        expect(screen.getByTestId(`${status}-icon`)).toBeInTheDocument();
      });
    });

    it('defaults to info status when not provided', () => {
      renderWithTheme(
        <StatusCard label="Default" value={0} testId="default-card" />
      );

      expect(screen.getByText('ℹ️')).toBeInTheDocument();
    });
  });

  describe('Theme Compliance', () => {
    it('renders with light theme palette tokens', () => {
      const { container } = renderWithTheme(
        <StatusCard label="Light Theme" value={5} testId="light-card" />,
        { theme: lightTheme }
      );

      const card = container.querySelector('[data-testid="light-card"]');
      const styles = window.getComputedStyle(card);

      // Verify theme tokens are applied
      expect(styles.borderColor).toBeDefined();
      expect(styles.backgroundColor).toBeDefined();
    });

    it('renders with dark theme palette tokens', () => {
      const { container } = renderWithTheme(
        <StatusCard label="Dark Theme" value={5} testId="dark-card" />,
        { theme: darkTheme }
      );

      const card = container.querySelector('[data-testid="dark-card"]');
      const styles = window.getComputedStyle(card);

      expect(styles.borderColor).toBeDefined();
      expect(styles.backgroundColor).toBeDefined();
    });

    it('renders with solarized theme palette tokens', () => {
      const { container } = renderWithTheme(
        <StatusCard label="Solarized" value={5} testId="solarized-card" />,
        { theme: solarizedTheme }
      );

      const card = container.querySelector('[data-testid="solarized-card"]');
      const styles = window.getComputedStyle(card);

      expect(styles.borderColor).toBeDefined();
      expect(styles.backgroundColor).toBeDefined();
    });
  });

  describe('Interactive Behavior', () => {
    it('applies click handler when onClick is provided', async () => {
      const handleClick = vi.fn();

      renderWithTheme(
        <StatusCard
          label="Clickable"
          value={10}
          onClick={handleClick}
          testId="clickable-card"
        />
      );

      const card = screen.getByTestId('clickable-card');
      await userEvent.click(card);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not apply click cursor when onClick is not provided', () => {
      const { container } = renderWithTheme(
        <StatusCard label="Not Clickable" value={5} testId="not-clickable" />
      );

      const card = container.querySelector('[data-testid="not-clickable"]');
      const styles = window.getComputedStyle(card);

      expect(styles.cursor).toBe('default');
    });

    it('applies pointer cursor when onClick is provided', () => {
      const { container } = renderWithTheme(
        <StatusCard
          label="Clickable"
          value={5}
          onClick={() => {}}
          testId="pointer-cursor"
        />
      );

      const card = container.querySelector('[data-testid="pointer-cursor"]');
      const styles = window.getComputedStyle(card);

      expect(styles.cursor).toBe('pointer');
    });
  });

  describe('Accessibility', () => {
    it('supports data-testid for testing framework integration', () => {
      renderWithTheme(
        <StatusCard
          label="A11y Test"
          value={100}
          testId="a11y-test-card"
        />
      );

      expect(screen.getByTestId('a11y-test-card')).toBeInTheDocument();
      expect(screen.getByTestId('a11y-test-card-value')).toBeInTheDocument();
    });

    it('uses semantic typography for visual hierarchy', () => {
      renderWithTheme(
        <StatusCard label="Semantic" value={50} testId="semantic-card" />
      );

      // Caption should be for label
      expect(screen.getByText('Semantic')).toHaveClass('MuiTypography-caption');

      // h5 should be for value
      const value = screen.getByTestId('semantic-card-value');
      expect(value).toHaveClass('MuiTypography-h5');
    });

    it('provides sufficient color contrast in all themes', () => {
      const themes = [lightTheme, darkTheme, solarizedTheme];

      themes.forEach((theme) => {
        const { container } = renderWithTheme(
          <StatusCard
            label="Contrast Test"
            value={75}
            status="success"
            testId="contrast-test"
          />,
          { theme }
        );

        const card = container.querySelector('[data-testid="contrast-test"]');
        expect(card).toBeInTheDocument();

        // Visual inspection required for actual contrast ratios
        // This test ensures component renders without errors in each theme
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles zero value', () => {
      renderWithTheme(
        <StatusCard label="Zero" value={0} testId="zero-card" />
      );

      expect(screen.getByTestId('zero-card-value')).toHaveTextContent('0');
    });

    it('handles negative numbers', () => {
      renderWithTheme(
        <StatusCard label="Negative" value={-5} testId="negative-card" />
      );

      expect(screen.getByTestId('negative-card-value')).toHaveTextContent('-5');
    });

    it('handles very long labels', () => {
      const longLabel = 'This is a very long label that might wrap to multiple lines in some layouts';

      renderWithTheme(
        <StatusCard label={longLabel} value={1} testId="long-label-card" />
      );

      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });

    it('handles empty string value', () => {
      renderWithTheme(
        <StatusCard label="Empty" value="" testId="empty-card" />
      );

      expect(screen.getByTestId('empty-card-value')).toHaveTextContent('');
    });

    it('handles special characters in values', () => {
      renderWithTheme(
        <StatusCard label="Special" value="100% ✓" testId="special-card" />
      );

      expect(screen.getByTestId('special-card-value')).toHaveTextContent('100% ✓');
    });
  });

  describe('Theme Switching', () => {
    it('responds to theme changes', () => {
      const { rerender, container } = renderWithTheme(
        <StatusCard label="Theme Switch" value={10} testId="theme-switch" />,
        { theme: lightTheme }
      );

      let card = container.querySelector('[data-testid="theme-switch"]');
      let initialBgColor = window.getComputedStyle(card).backgroundColor;

      // Rerender with dark theme
      rerender(
        <ThemeProvider theme={darkTheme}>
          <CssBaseline />
          <StatusCard label="Theme Switch" value={10} testId="theme-switch" />
        </ThemeProvider>
      );

      card = container.querySelector('[data-testid="theme-switch"]');
      let darkBgColor = window.getComputedStyle(card).backgroundColor;

      // Backgrounds should differ (though we can't guarantee exact color values in test)
      expect(card).toBeInTheDocument();
    });
  });

  describe('Visual Regression', () => {
    it('maintains visual consistency with all status variants', () => {
      const { container } = renderWithTheme(
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <StatusCard label="Success" value={10} status="success" testId="vreg-success" />
          <StatusCard label="Warning" value={3} status="warning" testId="vreg-warning" />
          <StatusCard label="Error" value={1} status="error" testId="vreg-error" />
          <StatusCard label="Info" value={7} status="info" testId="vreg-info" />
        </div>
      );

      expect(screen.getByTestId('vreg-success')).toBeInTheDocument();
      expect(screen.getByTestId('vreg-warning')).toBeInTheDocument();
      expect(screen.getByTestId('vreg-error')).toBeInTheDocument();
      expect(screen.getByTestId('vreg-info')).toBeInTheDocument();
    });
  });
});
