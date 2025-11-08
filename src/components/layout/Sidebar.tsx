/**
 * Sidebar Component
 * 
 * Left navigation for desktop view.
 * Shows main navigation items with active state highlighting.
 * Migrated to MUI X components.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Box,
  Stack,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  useTheme,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useSidebarState } from '@/hooks/useSidebarState';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Marketplace', href: '/dashboard/marketplace', icon: '📦' },
  { label: 'Jobs', href: '/dashboard/jobs', icon: '⚙️' },
  { label: 'Agents', href: '/dashboard/agents', icon: '🤖' },
  { label: 'Deployments', href: '/dashboard/deployments', icon: '🚀' },
  { label: 'Providers', href: '/dashboard/providers', icon: '🔗' },
  { label: 'Workflows', href: '/dashboard/workflows', icon: '⚡' },
  { label: 'Configuration', href: '/dashboard/config', icon: '⚙️' },
  { label: 'Observability', href: '/dashboard/observability', icon: '🔍' },
];

const settingsItems = [
  { label: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
  { label: 'Compliance', href: '/dashboard/compliance', icon: '📋' },
  { label: 'Documentation', href: '/docs', icon: '📖' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleCollapsed } = useSidebarState();
  const theme = useTheme();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname.startsWith('/dashboard/');
    }
    return pathname.startsWith(href);
  };

  return (
    <Box
      id="sidebar-root"
      component="aside"
      sx={{
        height: '100%',
        width: 'var(--sidebar-width)',
        borderRight: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 300ms ease-in-out',
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Stack id="sidebar-nav" sx={{ height: '100%', spacing: 0 }}>
        {/* Collapse Toggle Button */}
        <Box
          id="sidebar-toggle-section"
          sx={{
            px: 1.5,
            py: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            transition: 'all 300ms ease-in-out',
          }}
        >
          {!isCollapsed && (
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Menu
            </Typography>
          )}
          <IconButton
            size="small"
            onClick={toggleCollapsed}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            sx={{
              transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 300ms ease-in-out',
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
        </Box>

        {/* Main Navigation */}
        <Box id="sidebar-main-nav" sx={{ flex: 1, overflowY: 'auto', px: 1, py: 2 }}>
          <List sx={{ spacing: 0.5 }}>
            {navItems.map((item) => (
              <ListItem
                key={item.href}
                id={`sidebar-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                disablePadding
                title={isCollapsed ? item.label : undefined}
                component={Link}
                href={item.href}
                sx={{ display: 'block' }}
              >
                <ListItemButton
                  selected={isActive(item.href)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    px: 1.5,
                    py: 1,
                    color: isActive(item.href) ? theme.palette.primary.main : 'inherit',
                    backgroundColor: isActive(item.href)
                      ? theme.palette.action.selected
                      : 'transparent',
                    '&:hover': {
                      backgroundColor: isActive(item.href)
                        ? theme.palette.action.selected
                        : theme.palette.action.hover,
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: isCollapsed ? 0 : 40,
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!isCollapsed && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Settings Navigation */}
        <Box
          id="sidebar-settings-nav"
          sx={{
            borderTop: `1px solid ${theme.palette.divider}`,
            px: 1,
            py: 2,
          }}
        >
          <List sx={{ spacing: 0.5 }}>
            {settingsItems.map((item) => (
              <ListItem
                key={item.href}
                id={`sidebar-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                disablePadding
                title={isCollapsed ? item.label : undefined}
                component={Link}
                href={item.href}
                sx={{ display: 'block' }}
              >
                <ListItemButton
                  selected={isActive(item.href)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    px: 1.5,
                    py: 1,
                    color: isActive(item.href) ? theme.palette.primary.main : 'inherit',
                    backgroundColor: isActive(item.href)
                      ? theme.palette.action.selected
                      : 'transparent',
                    '&:hover': {
                      backgroundColor: isActive(item.href)
                        ? theme.palette.action.selected
                        : theme.palette.action.hover,
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: isCollapsed ? 0 : 40,
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!isCollapsed && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Version Info */}
        <Box
          id="sidebar-version-info"
          sx={{
            borderTop: `1px solid ${theme.palette.divider}`,
            px: 1.5,
            py: 2,
            textAlign: 'center',
            fontSize: '0.75rem',
          }}
        >
          {!isCollapsed ? (
            <>
              <Typography variant="caption">Orchestrate v1.0.0</Typography>
              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                Status: Ready 🟢
              </Typography>
            </>
          ) : (
            <Typography variant="caption">v1.0.0</Typography>
          )}
        </Box>
      </Stack>
    </Box>
  );
}
