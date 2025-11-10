// cypress/support/component.tsx
// Setup for Cypress component testing

import React from 'react';
import { mount as cypressMount, MountOptions } from 'cypress/react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { createTheme } from '@mui/material/styles';

// Import the theme setup from your app
// (This mirrors the theme from ThemeProvider.tsx in your app)
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
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
  },
});

/**
 * Mount helper for component testing
 * Wraps components with MUI ThemeProvider and CssBaseline
 * Usage: mount(<MyComponent prop="value" />)
 */
export function mount(component: React.ReactElement, options?: MountOptions) {
  return cypressMount(
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      {component}
    </ThemeProvider>,
    options
  );
}

// Re-export mount for cypress
Cypress.Commands.add('mount', mount);

