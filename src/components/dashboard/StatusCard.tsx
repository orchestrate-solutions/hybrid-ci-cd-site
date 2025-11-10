/**
 * StatusCard Component
 * 
 * Displays a single metric (count + label) with status badge
 * Used for jobs running, deployments today, agents healthy, etc.
 */

import React from 'react';
import { Box, Typography, Chip, ChipProps } from '@mui/material';

export type StatusType = 'success' | 'warning' | 'error' | 'info';

interface StatusCardProps {
  label: string;
  value: number | string;
  status?: StatusType;
  icon?: React.ReactNode;
  onClick?: () => void;
  testId?: string;
}

const statusColorMap: Record<StatusType, ChipProps['color']> = {
  success: 'success',
  warning: 'warning',
  error: 'error',
  info: 'info',
};

const statusBadgeMap: Record<StatusType, string> = {
  success: '✅',
  warning: '⚠️',
  error: '❌',
  info: 'ℹ️',
};

export function StatusCard({
  label,
  value,
  status = 'info',
  icon,
  onClick,
  testId,
}: StatusCardProps) {
  return (
    <Box
      data-testid={testId}
      onClick={onClick}
      sx={{
        p: 2.5,
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        '&:hover': onClick
          ? {
              boxShadow: 3,
              transform: 'translateY(-2px)',
              borderColor: 'primary.main',
            }
          : {},
      }}
    >
      {/* Header: Icon + Label + Status Badge */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon && <Box sx={{ fontSize: '1.25rem' }}>{icon}</Box>}
          <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
            {label}
          </Typography>
        </Box>
        <Chip
          label={statusBadgeMap[status]}
          size="small"
          variant="outlined"
          color={statusColorMap[status]}
        />
      </Box>

      {/* Value */}
      <Typography
        variant="h5"
        component="div"
        data-testid={`${testId}-value`}
        sx={{ fontWeight: 700, color: 'text.primary' }}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Typography>
    </Box>
  );
}
