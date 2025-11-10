/**
 * Test Utilities
 * Custom render function that wraps components with ThemeProvider
 */

import React from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '../lib/themes/ThemeProvider';

export function render(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(ThemeProvider, {}, children);
  }

  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

// Re-export everything from testing library
export * from '@testing-library/react';
