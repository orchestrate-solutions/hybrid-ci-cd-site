/**
 * StatusCard Stories
 * 
 * Comprehensive documentation of StatusCard component in all themes:
 * - Light theme (default)
 * - Dark theme
 * - Solarized theme
 * 
 * All status variants: success, warning, error, info
 * All interaction states: default, hover, clicked
 */

import type { Meta, StoryObj } from '@storybook/react';
import { StatusCard } from './StatusCard';
import {
  CheckCircle as SuccessIcon,
  WarningAmber as WarningIcon,
  ErrorOutline as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

const meta = {
  component: StatusCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Label displayed above the value',
    },
    value: {
      control: 'text',
      description: 'Primary value (number or string) displayed prominently',
    },
    status: {
      control: 'radio',
      options: ['success', 'warning', 'error', 'info'],
      description: 'Status indicator color',
    },
    icon: {
      control: false,
      description: 'Optional icon to display next to label',
    },
    onClick: {
      action: 'clicked',
      description: 'Optional click handler - adds pointer cursor when provided',
    },
    testId: {
      control: 'text',
      description: 'Test ID for testing framework integration',
    },
  },
} satisfies Meta<typeof StatusCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default: Success status with jobs running count
 * Shows standard appearance with success theme token applied
 */
export const Default: Story = {
  args: {
    label: 'Jobs Running',
    value: 8,
    status: 'success',
    icon: <SuccessIcon sx={{ fontSize: '1.25rem' }} />,
    testId: 'jobs-running-card',
  },
};

/**
 * Success Status: Shows healthy system state
 * Uses success.main theme token for chip color
 * Demonstrates high count scenario
 */
export const Success: Story = {
  args: {
    label: 'Deployments Today',
    value: 42,
    status: 'success',
    icon: <SuccessIcon sx={{ fontSize: '1.25rem' }} />,
    testId: 'deployments-today-card',
  },
};

/**
 * Warning Status: Shows cautionary state
 * Uses warning.main theme token for chip color
 * Demonstrates moderate count
 */
export const Warning: Story = {
  args: {
    label: 'Agents Paused',
    value: 3,
    status: 'warning',
    icon: <WarningIcon sx={{ fontSize: '1.25rem' }} />,
    testId: 'agents-paused-card',
  },
};

/**
 * Error Status: Shows critical/failure state
 * Uses error.main theme token for chip color
 * Demonstrates empty/zero scenario
 */
export const Error: Story = {
  args: {
    label: 'Jobs Failed',
    value: 0,
    status: 'error',
    icon: <ErrorIcon sx={{ fontSize: '1.25rem' }} />,
    testId: 'jobs-failed-card',
  },
};

/**
 * Info Status: Shows informational state
 * Uses info.main theme token for chip color
 * Typical for generic metrics
 */
export const Info: Story = {
  args: {
    label: 'Relays Online',
    value: 12,
    status: 'info',
    icon: <InfoIcon sx={{ fontSize: '1.25rem' }} />,
    testId: 'relays-online-card',
  },
};

/**
 * Without Icon: Shows card without leading icon
 * Useful for compact layouts
 */
export const WithoutIcon: Story = {
  args: {
    label: 'Queue Depth',
    value: 256,
    status: 'info',
    testId: 'queue-depth-card',
  },
};

/**
 * Large Number: Demonstrates number formatting with thousands separator
 * Shows robust handling of large values
 */
export const LargeNumber: Story = {
  args: {
    label: 'Total Messages Processed',
    value: 1234567,
    status: 'success',
    icon: <SuccessIcon sx={{ fontSize: '1.25rem' }} />,
    testId: 'total-messages-card',
  },
};

/**
 * String Value: Demonstrates non-numeric values
 * Useful for status labels, percentages, or custom formats
 */
export const StringValue: Story = {
  args: {
    label: 'System Status',
    value: 'OPERATIONAL',
    status: 'success',
    icon: <SuccessIcon sx={{ fontSize: '1.25rem' }} />,
    testId: 'system-status-card',
  },
};

/**
 * Interactive/Clickable: Shows hover state interaction
 * Demonstrates use case where card is clickable
 */
export const Clickable: Story = {
  args: {
    label: 'Recent Deploys',
    value: 15,
    status: 'success',
    icon: <SuccessIcon sx={{ fontSize: '1.25rem' }} />,
    onClick: () => console.log('Card clicked'),
    testId: 'clickable-card',
  },
  parameters: {
    docs: {
      description: {
        story: 'Hover over card to see shadow and translation effects. Click to trigger action.',
      },
    },
  },
};

/**
 * Dark Theme: Success status in dark mode
 * Shows proper contrast and theme token application in dark theme
 * Background becomes darker, text becomes lighter
 */
export const DarkThemeSuccess: Story = {
  args: {
    label: 'Jobs Running',
    value: 8,
    status: 'success',
    icon: <SuccessIcon sx={{ fontSize: '1.25rem' }} />,
    testId: 'dark-jobs-running',
  },
  parameters: {
    theme: 'dark',
  },
  decorators: [
    (Story) => (
      <div style={{ backgroundColor: '#121212', padding: '24px', borderRadius: '8px' }}>
        <Story />
      </div>
    ),
  ],
};

/**
 * Dark Theme: Error status in dark mode
 * Demonstrates error indicator in dark theme
 */
export const DarkThemeError: Story = {
  args: {
    label: 'System Errors',
    value: 2,
    status: 'error',
    icon: <ErrorIcon sx={{ fontSize: '1.25rem' }} />,
    testId: 'dark-errors',
  },
  parameters: {
    theme: 'dark',
  },
  decorators: [
    (Story) => (
      <div style={{ backgroundColor: '#121212', padding: '24px', borderRadius: '8px' }}>
        <Story />
      </div>
    ),
  ],
};

/**
 * Solarized Theme: Success status in solarized light mode
 * Shows appearance with solarized color scheme
 * High contrast, warm tones
 */
export const SolarizedLightSuccess: Story = {
  args: {
    label: 'Deployments',
    value: 24,
    status: 'success',
    icon: <SuccessIcon sx={{ fontSize: '1.25rem' }} />,
    testId: 'solarized-light-deployments',
  },
  parameters: {
    theme: 'solarized-light',
  },
  decorators: [
    (Story) => (
      <div style={{ backgroundColor: '#fdf6e3', padding: '24px', borderRadius: '8px' }}>
        <Story />
      </div>
    ),
  ],
};

/**
 * Solarized Dark Theme: Warning status in solarized dark mode
 * Shows appearance with solarized dark color scheme
 * Cool tones, carefully chosen colors
 */
export const SolarizedDarkWarning: Story = {
  args: {
    label: 'Pending Approvals',
    value: 5,
    status: 'warning',
    icon: <WarningIcon sx={{ fontSize: '1.25rem' }} />,
    testId: 'solarized-dark-approvals',
  },
  parameters: {
    theme: 'solarized-dark',
  },
  decorators: [
    (Story) => (
      <div style={{ backgroundColor: '#002b36', padding: '24px', borderRadius: '8px' }}>
        <Story />
      </div>
    ),
  ],
};

/**
 * Theme Comparison: All status variants side-by-side
 * Useful for visual regression testing
 * Verifies all theme tokens render consistently
 */
export const ThemeComparison: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
      <StatusCard
        label="Success"
        value={10}
        status="success"
        icon={<SuccessIcon sx={{ fontSize: '1.25rem' }} />}
        testId="comparison-success"
      />
      <StatusCard
        label="Warning"
        value={3}
        status="warning"
        icon={<WarningIcon sx={{ fontSize: '1.25rem' }} />}
        testId="comparison-warning"
      />
      <StatusCard
        label="Error"
        value={1}
        status="error"
        icon={<ErrorIcon sx={{ fontSize: '1.25rem' }} />}
        testId="comparison-error"
      />
      <StatusCard
        label="Info"
        value={7}
        status="info"
        icon={<InfoIcon sx={{ fontSize: '1.25rem' }} />}
        testId="comparison-info"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All StatusCard status variants displayed together for visual comparison and testing.',
      },
    },
  },
};

/**
 * Grid Layout: Multiple cards in responsive grid
 * Shows typical dashboard usage pattern
 * Verifies responsive behavior and spacing
 */
export const GridLayout: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
      }}
    >
      <StatusCard
        label="Jobs Queued"
        value={42}
        status="info"
        icon={<InfoIcon sx={{ fontSize: '1.25rem' }} />}
        testId="grid-queued"
      />
      <StatusCard
        label="Jobs Running"
        value={8}
        status="success"
        icon={<SuccessIcon sx={{ fontSize: '1.25rem' }} />}
        testId="grid-running"
      />
      <StatusCard
        label="Jobs Failed"
        value={2}
        status="error"
        icon={<ErrorIcon sx={{ fontSize: '1.25rem' }} />}
        testId="grid-failed"
      />
      <StatusCard
        label="Pending Review"
        value={1}
        status="warning"
        icon={<WarningIcon sx={{ fontSize: '1.25rem' }} />}
        testId="grid-pending"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'StatusCard components in a responsive grid layout, typical dashboard usage.',
      },
    },
  },
};
