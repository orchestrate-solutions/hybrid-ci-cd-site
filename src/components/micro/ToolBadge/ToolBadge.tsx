/**
 * ToolBadge Component - Professional badge using MUI X
 * 
 * Displays tool information with verified status, category, and version.
 * Themeable badge for showcasing integrated tools.
 */

import React from 'react';
import { Chip, Box, Stack, Tooltip } from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';

export type ToolCategory = 'ci' | 'deployment' | 'monitoring' | 'security' | 'other';
export type BadgeSize = 'small' | 'medium' | 'large';

interface ToolBadgeProps {
  /** Tool name */
  name: string;
  /** Tool version */
  version: string;
  /** Tool category */
  category: ToolCategory;
  /** Whether tool is verified by orchestrate */
  verified?: boolean;
  /** Badge size */
  size?: BadgeSize;
}

/**
 * Get category config with MUI color scheme
 */
function getCategoryConfig(category: ToolCategory) {
  const configs = {
    ci: { label: 'CI/CD', color: 'info' as const },
    deployment: { label: 'Deployment', color: 'success' as const },
    monitoring: { label: 'Monitoring', color: 'warning' as const },
    security: { label: 'Security', color: 'error' as const },
    other: { label: 'Other', color: 'default' as const },
  };
  return configs[category];
}

/**
 * Get MUI size prop
 */
function getMUISize(size: BadgeSize = 'medium'): 'small' | 'medium' {
  return size === 'large' ? 'medium' : 'small';
}

/**
 * ToolBadge component using MUI Chip
 */
export function ToolBadge({
  name,
  version,
  category,
  verified = false,
  size = 'medium',
}: ToolBadgeProps) {
  const categoryConfig = getCategoryConfig(category);
  const muiSize = getMUISize(size);

  return (
    <Tooltip title={verified ? 'Verified tool' : `${name} v${version}`}>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        data-testid="tool-badge"
        data-category={category}
        data-size={size}
        sx={{
          display: 'inline-flex',
          padding: size === 'large' ? '12px' : '8px',
          backgroundColor: (theme) => theme.palette.background.paper,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          borderRadius: (theme) => theme.shape.borderRadius / 4,
        }}
      >
        {/* Category chip */}
        <Chip
          label={categoryConfig.label}
          color={categoryConfig.color}
          size={muiSize}
          variant="filled"
          data-testid="category-badge"
          sx={{ fontWeight: 600 }}
        />

        {/* Tool info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <span style={{ fontWeight: 500, fontSize: size === 'large' ? '16px' : '14px' }}>
            {name}
          </span>
          <span style={{ fontSize: size === 'large' ? '14px' : '12px', opacity: 0.7 }}>
            v{version}
          </span>
        </Box>

        {/* Verified badge */}
        {verified && (
          <CheckCircleIcon
            data-testid="verified-badge"
            sx={{
              fontSize: size === 'large' ? 20 : 16,
              color: 'success.main',
              marginLeft: 0.5,
            }}
          />
        )}
      </Stack>
    </Tooltip>
  );
}
