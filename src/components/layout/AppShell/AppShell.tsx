import React, { ReactNode, useState } from 'react';
import { Box, Drawer, useTheme, useMediaQuery, Backdrop } from '@mui/material';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleToggle = (isOpen: boolean) => {
    setSidebarOpen(isOpen);
    onSidebarToggle?.(isOpen);
  };

  const SIDEBAR_WIDTH = 256;

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      {/* Header - full width at top, z-index below drawer for mobile */}
      <Box
        sx={{
          width: '100%',
          flexShrink: 0,
          borderBottom: 1,
          borderColor: 'divider',
          position: 'relative',
          zIndex: (theme) => theme.zIndex.drawer,
        }}
      >
        {React.cloneElement(header as React.ReactElement, {
          onMenuToggle: () => handleToggle(!sidebarOpen),
        })}
      </Box>

      {/* Main content area - sidebar + content */}
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Sidebar - left side, hidden on mobile, visible on desktop */}
        <Box
          component="aside"
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            flexShrink: 0,
            width: SIDEBAR_WIDTH,
            borderRight: 1,
            borderColor: 'divider',
            overflowY: 'auto',
            bgcolor: 'background.paper',
          }}
        >
          {sidebar}
        </Box>

        {/* Mobile sidebar drawer - drawer is above header on mobile */}
        {isMobile && (
          <>
            {/* Backdrop */}
            <Backdrop
              open={sidebarOpen}
              onClick={() => handleToggle(false)}
              sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: (theme) => theme.zIndex.drawer + 1,
              }}
            />

            {/* Drawer */}
            <Drawer
              anchor="left"
              open={sidebarOpen}
              onClose={() => handleToggle(false)}
              PaperProps={{
                sx: {
                  zIndex: (theme) => theme.zIndex.drawer + 2,
                },
              }}
              sx={{
                '& .MuiDrawer-paper': {
                  width: SIDEBAR_WIDTH,
                  bgcolor: 'background.paper',
                  borderRight: 1,
                  borderColor: 'divider',
                },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  overflowY: 'auto',
                }}
              >
                {sidebar}
              </Box>
            </Drawer>
          </>
        )}

        {/* Content area - main scrollable region */}
        <Box
          component="main"
          sx={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            bgcolor: 'background.default',
            // Root-level padding creates consistent "slots" for components
            p: { xs: 2, sm: 3, md: 4 },
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              bgcolor: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'action.disabled',
              borderRadius: '4px',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
