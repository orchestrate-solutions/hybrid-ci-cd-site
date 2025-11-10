'use client';

import React from 'react';
import { ThemeProvider as MuiThemeProviderBase } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useTheme } from '@/lib/themes/ThemeProvider';
import { createMuiThemeFromCustomTheme } from '@/lib/themes/createMuiTheme';
import { getTheme, DEFAULT_THEME } from '@/lib/themes/themes';

/**
 * MUI Theme Integration Component
 *
 * Bridges custom theme system with MUI components.
 * Creates MUI theme from custom theme configuration and applies it globally.
 */
export function MuiThemeProvider({ children }: { children: React.ReactNode }) {
  // Try to get theme from context, fallback to default if not available
  let theme;
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
  } catch (error) {
    // Context not available yet, use default theme
    theme = DEFAULT_THEME;
  }

  // Create MUI theme from custom theme
  const muiTheme = React.useMemo(
    () => createMuiThemeFromCustomTheme(theme),
    [theme]
  );

  return (
    <MuiThemeProviderBase theme={muiTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProviderBase>
  );
}
