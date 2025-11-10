import React, { ReactNode, useState } from 'react';

interface AppShellProps {
  header: ReactNode;
  sidebar: ReactNode;
  children?: ReactNode;
  onSidebarToggle?: (isOpen: boolean) => void;
}

/**
 * AppShell Component
 * 
 * Main layout container for the Hybrid CI/CD dashboard.
 * Provides a 3-section layout: header (top), sidebar (left), and content (main).
 * Responsive: sidebar visible on md+, drawer on mobile.
 * 
 * Structure:
 * - Header spans full width at top
 * - Sidebar on left side (fixed width, hidden on mobile)
 * - Content area fills remaining space
 */
export function AppShell({ header, sidebar, children, onSidebarToggle }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleToggle = (isOpen: boolean) => {
    setSidebarOpen(isOpen);
    onSidebarToggle?.(isOpen);
  };

  return (
    <div
      className="flex h-screen flex-col"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Header - full width at top */}
      <header className="w-full flex-shrink-0 border-b" style={{ borderColor: 'var(--ui-border)' }}>
        {React.cloneElement(header as React.ReactElement, {
          onMenuToggle: () => handleToggle(!sidebarOpen),
        })}
      </header>

      {/* Main content area - sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - left side, hidden on mobile */}
        <aside
          className="hidden md:flex flex-shrink-0 w-64 border-r overflow-y-auto"
          style={{ borderColor: 'var(--ui-border)', backgroundColor: 'var(--bg-secondary)' }}
        >
          {sidebar}
        </aside>

        {/* Mobile sidebar drawer */}
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 z-30 md:hidden"
              onClick={() => handleToggle(false)}
            />
            {/* Drawer */}
            <aside
              className="fixed left-0 top-16 bottom-0 w-64 z-40 overflow-y-auto md:hidden"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              {sidebar}
            </aside>
          </>
        )}

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
