'use client';

/**
 * Settings Page
 * 
 * User preferences for:
 * - Real-time update mode (Live/Efficient/Off)
 * - Theme (light/dark/auto)
 * - Stored in localStorage (MVP)
 */

import React from 'react';
import { Box, Typography, Card, Divider, Stack } from '@mui/material';
import { RefreshSlider, DemoModeToggle } from '@/components/dashboard';
import { useUserPreferences } from '@/lib/hooks';
import { ThemeProvider } from '@/components/ThemeProvider';

export default function SettingsPage() {
  const { preferences, updatePreferences } = useUserPreferences();

  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    updatePreferences({ theme });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 600 }}>
      {/* Page Header */}
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
          Settings
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Configure your dashboard preferences
        </Typography>
      </Box>

      {/* Real-Time Mode */}
      <Box>
        <RefreshSlider />
      </Box>

      <Divider />

      {/* Demo Mode */}
      <Box>
        <Card sx={{ p: 2.5, borderRadius: 1.5, bgcolor: 'background.paper' }}>
          <DemoModeToggle
            enabled={preferences.demoMode}
            onChange={(enabled) => updatePreferences({ demoMode: enabled })}
          />
        </Card>
      </Box>

      <Divider />
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Appearance
        </Typography>

        <Card sx={{ p: 2.5, borderRadius: 1.5, bgcolor: 'background.paper' }}>
          <Stack spacing={1.5}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 0.5 }}>
                Current Theme
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {preferences.theme === 'light'
                  ? 'Light Mode'
                  : preferences.theme === 'dark'
                    ? 'Dark Mode'
                    : 'System (Auto)'}
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                gap: 1,
                pt: 1,
              }}
            >
              {['light', 'dark', 'auto'].map((theme) => (
                <Box
                  key={theme}
                  onClick={() =>
                    handleThemeChange(theme as 'light' | 'dark' | 'auto')
                  }
                  sx={{
                    flex: 1,
                    p: 1.5,
                    borderRadius: 1,
                    border: '2px solid',
                    borderColor:
                      preferences.theme === theme
                        ? 'primary.main'
                        : 'divider',
                    bgcolor:
                      theme === 'light'
                        ? '#f5f5f5'
                        : theme === 'dark'
                          ? '#1a1a1a'
                          : 'action.hover',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                    '&:hover': {
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 500 }}>
                    {theme === 'light'
                      ? '☀️ Light'
                      : theme === 'dark'
                        ? '🌙 Dark'
                        : '⚙️ Auto'}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Stack>
        </Card>
      </Box>

      <Divider />

      {/* Info Section */}
      <Box
        sx={{
          p: 2,
          borderRadius: 1,
          bgcolor: 'info.lighter',
          border: '1px solid',
          borderColor: 'info.light',
        }}
      >
        <Typography variant="caption" color="info.dark">
          💾 Your preferences are saved locally on this device. Sign up for cloud sync in v2.
        </Typography>
      </Box>
    </Box>
  );
}
