/**
 * MUI Theme Creator
 * 
 * Maps custom theme colors to MUI palette for consistent styling across all components.
 * Ensures text colors, backgrounds, and semantic colors match the theme system.
 */

import { createTheme, ThemeOptions } from '@mui/material/styles';
import type { Theme as CustomTheme } from './themes';

/**
 * Create MUI theme from custom theme configuration
 * 
 * Maps custom color system to MUI palette:
 * - text colors → typography variants and palette.text
 * - backgrounds → palette.background
 * - semantic colors → palette for success/warning/error/info
 * - brand colors → palette.primary/secondary
 */
export function createMuiThemeFromCustomTheme(customTheme: CustomTheme) {
  const { colors, isDark } = customTheme;

  const themeOptions: ThemeOptions = {
    palette: {
      mode: isDark ? 'dark' : 'light',
      // Primary brand color
      primary: {
        main: colors.brand.primary,
        light: colors.brand.primary + '20', // 20% opacity for lighter variant
        dark: colors.brand.primary,
      },
      // Secondary brand color
      secondary: {
        main: colors.brand.secondary,
        light: colors.brand.secondary + '20',
        dark: colors.brand.secondary,
      },
      // Background colors
      background: {
        default: colors.bg.primary,
        paper: colors.bg.secondary,
      },
      // Text colors - CRITICAL for readability
      text: {
        primary: colors.text.primary,
        secondary: colors.text.secondary,
        disabled: colors.text.tertiary,
      },
      // Semantic colors
      success: {
        main: colors.semantic.success,
      },
      warning: {
        main: colors.semantic.warning,
      },
      error: {
        main: colors.semantic.error,
      },
      info: {
        main: colors.semantic.info,
      },
      // UI elements
      divider: colors.ui.divider,
      // Action colors for interactive elements
      action: {
        active: colors.brand.primary,
        hover: colors.bg.tertiary,
        selected: colors.bg.tertiary,
        disabled: colors.text.tertiary,
        focus: colors.ui.focus,
      },
    },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: {
        color: colors.text.primary,
        fontWeight: 700,
      },
      h2: {
        color: colors.text.primary,
        fontWeight: 700,
      },
      h3: {
        color: colors.text.primary,
        fontWeight: 700,
      },
      h4: {
        color: colors.text.primary,
        fontWeight: 600,
      },
      h5: {
        color: colors.text.primary,
        fontWeight: 600,
      },
      h6: {
        color: colors.text.primary,
        fontWeight: 600,
      },
      body1: {
        color: colors.text.primary,
      },
      body2: {
        color: colors.text.secondary,
      },
      subtitle1: {
        color: colors.text.primary,
      },
      subtitle2: {
        color: colors.text.secondary,
      },
      caption: {
        color: colors.text.tertiary,
      },
      button: {
        color: colors.text.inverse, // White text on colored buttons
      },
    },
    components: {
      // AppBar styling
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: colors.bg.secondary,
            color: colors.text.primary,
            borderBottom: `1px solid ${colors.ui.border}`,
          },
        },
      },
      // List items
      MuiListItem: {
        styleOverrides: {
          root: {
            color: colors.text.primary,
            '&:hover': {
              backgroundColor: colors.bg.tertiary,
            },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            color: colors.text.primary,
            '&.Mui-selected': {
              backgroundColor: colors.brand.primary + '20',
              color: colors.brand.primary,
              '&:hover': {
                backgroundColor: colors.brand.primary + '30',
              },
            },
          },
        },
      },
      MuiListItemText: {
        styleOverrides: {
          primary: {
            color: colors.text.primary,
            fontWeight: 500,
          },
          secondary: {
            color: colors.text.secondary,
          },
        },
      },
      // Button styling
      MuiButton: {
        styleOverrides: {
          contained: {
            color: colors.text.inverse,
          },
          outlined: {
            color: colors.text.primary,
            borderColor: colors.ui.border,
            '&:hover': {
              borderColor: colors.ui.focus,
              backgroundColor: colors.bg.tertiary,
            },
          },
          text: {
            color: colors.text.primary,
            '&:hover': {
              backgroundColor: colors.bg.tertiary,
            },
          },
        },
      },
      // Text field styling
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              color: colors.text.primary,
              '& fieldset': {
                borderColor: colors.ui.border,
              },
              '&:hover fieldset': {
                borderColor: colors.ui.focus,
              },
            },
            '& .MuiOutlinedInput-input': {
              color: colors.text.primary,
              '&::placeholder': {
                color: colors.text.tertiary,
                opacity: 0.7,
              },
            },
            '& .MuiInputBase-input': {
              color: colors.text.primary,
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            color: colors.text.primary,
            '& fieldset': {
              borderColor: colors.ui.border,
            },
            '&:hover fieldset': {
              borderColor: colors.ui.focus,
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.ui.focus,
            },
          },
          input: {
            color: colors.text.primary,
            '&::placeholder': {
              color: colors.text.tertiary,
              opacity: 0.7,
            },
          },
        },
      },
      // Menu styling
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: colors.bg.secondary,
            color: colors.text.primary,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: colors.text.primary,
            '&:hover': {
              backgroundColor: colors.bg.tertiary,
            },
            '&.Mui-selected': {
              backgroundColor: colors.brand.primary + '20',
              color: colors.brand.primary,
              '&:hover': {
                backgroundColor: colors.brand.primary + '30',
              },
            },
          },
        },
      },
      // Dialog styling
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: colors.bg.secondary,
            color: colors.text.primary,
          },
        },
      },
      // Paper/Card styling
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: colors.bg.secondary,
            color: colors.text.primary,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: colors.bg.secondary,
            color: colors.text.primary,
            borderColor: colors.ui.border,
          },
        },
      },
      // Drawer styling
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: colors.bg.secondary,
            color: colors.text.primary,
            borderRight: `1px solid ${colors.ui.border}`,
          },
        },
      },
      // Table styling
      MuiTable: {
        styleOverrides: {
          root: {
            color: colors.text.primary,
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: colors.bg.tertiary,
            '& .MuiTableCell-head': {
              color: colors.text.primary,
              fontWeight: 600,
              borderColor: colors.ui.border,
            },
          },
        },
      },
      MuiTableBody: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-body': {
              color: colors.text.primary,
              borderColor: colors.ui.border,
            },
            '& .MuiTableRow-hover:hover': {
              backgroundColor: colors.bg.tertiary,
            },
          },
        },
      },
      // Divider styling
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: colors.ui.divider,
          },
        },
      },
      // Chip styling
      MuiChip: {
        styleOverrides: {
          root: {
            color: colors.text.primary,
            borderColor: colors.ui.border,
          },
          outlined: {
            borderColor: colors.ui.border,
            backgroundColor: colors.bg.tertiary,
          },
        },
      },
      // Icon button
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: colors.text.primary,
            '&:hover': {
              backgroundColor: colors.bg.tertiary,
            },
          },
        },
      },
    },
  };

  return createTheme(themeOptions);
}
