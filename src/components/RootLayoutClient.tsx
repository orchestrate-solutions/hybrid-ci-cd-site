'use client';

import React from 'react';
import { MuiThemeProvider } from './MuiThemeProvider';

/**
 * Root Layout Client Wrapper
 * 
 * This component exists because MuiThemeProvider needs to be client-side
 * and must be inside ThemeProvider (which is in the server component).
 * This ensures proper provider hierarchy for hooks.
 */
export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <MuiThemeProvider>
      {children}
    </MuiThemeProvider>
  );
}
