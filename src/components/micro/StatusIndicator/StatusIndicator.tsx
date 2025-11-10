/**
 * StatusIndicator Component - MUI-based visual status indicator
 * 
 * Visual indicator for status with theming support.
 * Shows online, offline, idle, busy, or error states with optional pulsing.
 */

import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { keyframes } from '@mui/system';

export type Status = 'online' | 'offline' | 'idle' | 'busy' | 'error';
export type IndicatorSize = 'small' | 'medium' | 'large';

interface StatusIndicatorProps {
  /** Status to display */
  status: Status;
  /** Size of indicator */
  size?: IndicatorSize;
  /** Whether to show pulsing animation (for online/busy) */
  pulse?: boolean;
}

/**
 * Pulse animation keyframes
 */
const pulseAnimation = keyframes`
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.6;
  }
`;

/**
 * Get status config with MUI colors
 */
function getStatusConfig(status: Status) {
  const configs = {
    online: { color: 'success', label: 'Online' },
    offline: { color: 'default', label: 'Offline' },
    idle: { color: 'warning', label: 'Idle' },
    busy: { color: 'info', label: 'Busy' },
    error: { color: 'error', label: 'Error' },
  };
  return configs[status];
}

/**
 * Get size in pixels
 */
function getSizePixels(size: IndicatorSize = 'medium'): number {
  const sizes = {
    small: 8,
    medium: 12,
    large: 16,
  };
  return sizes[size];
}

/**
 * StatusIndicator component using MUI Box
 */
export function StatusIndicator({
  status,
  size = 'medium',
  pulse = false,
}: StatusIndicatorProps) {
  const shouldPulse = pulse && (status === 'online' || status === 'busy');
  const config = getStatusConfig(status);
  const sizePixels = getSizePixels(size);
  const colorProp = (theme: any) => theme.palette[config.color].main;

  return (
    <Tooltip title={config.label} arrow>
      <Box
        data-testid="status-indicator"
        data-status={status}
        data-size={size}
        data-pulse={shouldPulse}
        aria-label={`Status: ${config.label}`}
        sx={{
          display: 'inline-block',
          position: 'relative',
          width: sizePixels,
          height: sizePixels,
          borderRadius: '50%',
          backgroundColor: colorProp,
          boxShadow: (theme) => `0 0 ${sizePixels}px ${theme.palette[config.color].main}80`,
          animation: shouldPulse ? `${pulseAnimation} 2s ease-in-out infinite` : 'none',
        }}
      >
        {/* Inner dot for visual depth */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            backgroundColor: colorProp,
            opacity: 0.7,
          }}
        />
      </Box>
    </Tooltip>
  );
}
