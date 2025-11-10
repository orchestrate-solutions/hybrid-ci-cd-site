/**
 * ConfigCard Component - Professional display card using MUI X
 * 
 * Displays a configuration card with status badge, title, description,
 * and optional edit/delete actions. Uses MUI Card + Chip for consistent styling.
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  IconButton,
  Box,
  Stack,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { CheckCircle as CheckCircleIcon, Warning as WarningIcon } from '@mui/icons-material';

export type ConfigStatus = 'active' | 'inactive' | 'warning' | 'error';

interface ConfigCardProps {
  /** Card title */
  title: string;
  /** Card description */
  description: string;
  /** Status indicator */
  status: ConfigStatus;
  /** Edit handler (shows button if provided) */
  onEdit?: () => void;
  /** Delete handler (shows button if provided) */
  onDelete?: () => void;
  /** Compact layout variant */
  compact?: boolean;
}

/**
 * Get status config with MUI color scheme
 */
function getStatusConfig(status: ConfigStatus) {
  const configs = {
    active: { icon: CheckCircleIcon, color: 'success' as const, label: 'Active' },
    inactive: { icon: WarningIcon, color: 'default' as const, label: 'Inactive' },
    warning: { icon: WarningIcon, color: 'warning' as const, label: 'Warning' },
    error: { icon: WarningIcon, color: 'error' as const, label: 'Error' },
  };
  return configs[status];
}

/**
 * ConfigCard component using MUI Card
 */
export function ConfigCard({
  title,
  description,
  status,
  onEdit,
  onDelete,
  compact = false,
}: ConfigCardProps) {
  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  return (
    <Card
      data-testid="config-card"
      data-status={status}
      data-compact={compact}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)',
        },
        border: `1px solid`,
        borderColor: (theme) =>
          status === 'error'
            ? theme.palette.error.main
            : status === 'warning'
              ? theme.palette.warning.main
              : status === 'active'
                ? theme.palette.success.main
                : theme.palette.divider,
      }}
    >
      {/* Card Content */}
      <CardContent
        sx={{
          flex: 1,
          pb: compact ? 1 : 2,
        }}
      >
        {/* Header with status and title */}
        <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 1.5 }}>
          {/* Status icon */}
          <Box sx={{ pt: 0.25, flex Shrink: 0 }}>
            <StatusIcon
              data-testid="status-indicator"
              sx={{
                fontSize: compact ? 20 : 24,
                color: `${statusConfig.color}.main`,
              }}
            />
          </Box>

          {/* Title */}
          <Typography
            variant={compact ? 'body2' : 'h6'}
            component="div"
            sx={{
              fontWeight: 600,
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </Typography>

          {/* Status badge */}
          <Chip
            icon={<StatusIcon />}
            label={statusConfig.label}
            color={statusConfig.color}
            size="small"
            variant="outlined"
            sx={{ flex Shrink: 0 }}
          />
        </Stack>

        {/* Description */}
        <Typography
          variant="body2"
          color="textSecondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {description}
        </Typography>
      </CardContent>

      {/* Action buttons */}
      {(onEdit || onDelete) && (
        <CardActions
          sx={{
            pt: 0,
            pb: compact ? 0.5 : 1,
            gap: 0.5,
          }}
        >
          {onEdit && (
            <IconButton
              data-testid="btn-edit"
              onClick={onEdit}
              size="small"
              aria-label="Edit configuration"
              color="primary"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {onDelete && (
            <IconButton
              data-testid="btn-delete"
              onClick={onDelete}
              size="small"
              aria-label="Delete configuration"
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </CardActions>
      )}
    </Card>
  );
}
