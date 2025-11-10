'use client';

import React from 'react';
import { ThemeProvider as MuiThemeProviderBase } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useTheme } from '@/lib/themes/ThemeProvider';
import { createMuiThemeFromCustomTheme } from '@/lib/themes/createMuiTheme';

/**
 * MUI Theme Integration Component
 * 
 * Bridges custom theme system with MUI components.
 * Creates MUI theme from custom theme configuration and applies it globally.
 */
export function MuiThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  
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
