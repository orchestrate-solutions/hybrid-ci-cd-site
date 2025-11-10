/**
 * ToolStatusCard Component
 * 
 * Displays a tool (GitHub Actions, Terraform, Prometheus, etc.)
 * with status badge and link to external tool
 * MVP: Static list with hardcoded links
 */

import React from 'react';
import { Box, Typography, Chip, IconButton } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

interface ToolStatusCardProps {
  tool: string;
  icon: string; // Emoji or SVG URL
  status: 'healthy' | 'warning' | 'offline' | 'unknown';
  label?: string;
  externalUrl?: string;
  testId?: string;
}

const statusConfig = {
  healthy: { color: 'success' as const, icon: '🟢' },
  warning: { color: 'warning' as const, icon: '🟡' },
  offline: { color: 'error' as const, icon: '🔴' },
  unknown: { color: 'default' as const, icon: '⚪' },
};

export function ToolStatusCard({
  tool,
  icon,
  status = 'unknown',
  label,
  externalUrl,
  testId,
}: ToolStatusCardProps) {
  return (
    <Box
      data-testid={testId}
      sx={{
        p: 2,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: 2,
        },
      }}
    >
      {/* Left: Icon + Name + Status */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
        <Box sx={{ fontSize: '1.5rem', flexShrink: 0 }}>{icon}</Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {tool}
          </Typography>
          {label && (
            <Typography variant="caption" color="textSecondary">
              {label}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Right: Status Badge + Link */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        <Chip
          label={statusConfig[status].icon}
          size="small"
          variant="outlined"
          color={statusConfig[status].color}
          sx={{ cursor: 'default' }}
        />
        {externalUrl && (
          <IconButton
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            sx={{ ml: 0.5 }}
            aria-label={`Open ${tool}`}
          >
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    </Box>
  );
}
