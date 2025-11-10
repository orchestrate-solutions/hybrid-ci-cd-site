/**
 * ThemeSwitcher Component Stories
 *
 * Stories for the ThemeSwitcher component to demonstrate theme switching functionality.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Box, Typography, Paper } from '@mui/material';
import { ThemeSwitcher } from './ThemeSwitcher';

const meta = {
  component: ThemeSwitcher,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Box sx={{ p: 4, minHeight: '200px' }}>
        <Typography variant="h4" gutterBottom>
          Theme Switcher Demo
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Click the theme switcher button to cycle through all available themes.
        </Typography>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Current Theme Colors
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box
              sx={{
                width: 50,
                height: 50,
                bgcolor: 'primary.main',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'primary.contrastText',
                fontSize: '0.75rem',
                fontWeight: 'bold',
              }}
            >
              P
            </Box>
            <Box
              sx={{
                width: 50,
                height: 50,
                bgcolor: 'secondary.main',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'secondary.contrastText',
                fontSize: '0.75rem',
                fontWeight: 'bold',
              }}
            >
              S
            </Box>
            <Box
              sx={{
                width: 50,
                height: 50,
                bgcolor: 'background.paper',
                borderRadius: 1,
                border: 1,
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.primary',
                fontSize: '0.75rem',
                fontWeight: 'bold',
              }}
            >
              BG
            </Box>
            <Box
              sx={{
                width: 50,
                height: 50,
                bgcolor: 'text.primary',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'background.paper',
                fontSize: '0.75rem',
                fontWeight: 'bold',
              }}
            >
              T
            </Box>
          </Box>
        </Paper>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2">
            Theme Switcher:
          </Typography>
          <Story />
        </Box>
      </Box>
    ),
  ],
} satisfies Meta<typeof ThemeSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Small: Story = {
  args: {
    size: 'small',
  },
};

export const Large: Story = {
  args: {
    size: 'large',
  },
};

export const WithoutTooltip: Story = {
  args: {
    showTooltip: false,
  },
};

export const WithCustomClass: Story = {
  args: {
    className: 'custom-theme-switcher',
  },
};