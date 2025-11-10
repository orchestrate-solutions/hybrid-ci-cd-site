import React, { ReactNode } from 'react';

interface AppShellProps {
  header: ReactNode;
  sidebar: ReactNode;
  children?: ReactNode;
}

/**
 * AppShell Component
 * 
 * Main layout container for the Hybrid CI/CD dashboard.
 * Provides a 3-section layout: header (top), sidebar (left), and content (main).
 * 
 * Structure:
 * - Header spans full width at top
 * - Sidebar on left side (fixed width)
 * - Content area fills remaining space
 */
export function AppShell({ header, sidebar, children }: AppShellProps) {
  return (
    <div
      className="flex h-screen flex-col"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Header - full width at top */}
      <header className="w-full flex-shrink-0 border-b" style={{ borderColor: 'var(--ui-border)' }}>
        {header}
      </header>

      {/* Main content area - sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - left side */}
        <aside
          className="flex-shrink-0 w-64 border-r overflow-y-auto"
          style={{ borderColor: 'var(--ui-border)', backgroundColor: 'var(--bg-secondary)' }}
        >
          {sidebar}
        </aside>

        {/* Content area - main scrollable region */}
        <main
          className="flex-1 overflow-auto"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
