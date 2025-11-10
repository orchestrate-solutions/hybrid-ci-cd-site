'use client';

import React from 'react';
import { ThemeProvider } from '@/lib/themes/ThemeProvider';
import { MuiThemeProvider } from './MuiThemeProvider';

/**
 * Root Layout Client Wrapper
 *
 * This component wraps the entire app with theme providers.
 * ThemeProvider provides custom theme context, MuiThemeProvider bridges to MUI.
 * This ensures proper provider hierarchy for hooks in client components.
 */
export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <MuiThemeProvider>
        {children}
      </MuiThemeProvider>
    </ThemeProvider>
  );
}
