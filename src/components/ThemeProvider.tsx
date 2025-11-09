'use client';

import React from 'react';

interface ThemeProviderProps {
  children: React.ReactNode;
  [key: string]: React.ReactNode | undefined;
}

/**
 * ThemeProvider Component
 * Provides theme context for the application
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <div className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50" {...props}>
      {children}
    </div>
  );
}
