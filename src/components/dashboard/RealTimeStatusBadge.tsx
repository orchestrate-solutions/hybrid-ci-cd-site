/**
 * RealTimeStatusBadge Component
 * 
 * Shows current real-time mode with warning indicator
 * Yellow for Efficient, Red for Off, Green (hidden) for Live
 */

import React from 'react';
import { Box, Chip, Tooltip } from '@mui/material';
import { useUserPreferences } from '@/lib/hooks';

export function RealTimeStatusBadge() {
  const { preferences } = useUserPreferences();

  const config = {
    off: {
      label: '🔴 Manual Refresh Only',
      icon: '🔴',
      color: 'error' as const,
      tooltip: 'Real-time updates are disabled. Click Settings to enable.',
    },
    efficient: {
      label: '⚠️ Updates Every 30s',
      icon: '🟡',
      color: 'warning' as const,
      tooltip: 'Efficient mode: Updates checked every 30 seconds for lower resource usage.',
    },
    live: {
      label: '🟢 Live Updates',
      icon: '🟢',
      color: 'success' as const,
      tooltip: 'Live mode: Real-time updates every 10 seconds.',
    },
  };

  const current = config[preferences.realTimeMode];

  // Don't show badge in live mode
  if (preferences.realTimeMode === 'live') {
    return null;
  }

  return (
    <Tooltip title={current.tooltip}>
      <Box sx={{ display: 'inline-block' }}>
        <Chip
          label={current.label}
          color={current.color}
          variant="outlined"
          size="small"
          icon={<Box sx={{ fontSize: '0.875rem' }}>{current.icon}</Box>}
        />
      </Box>
    </Tooltip>
  );
}
