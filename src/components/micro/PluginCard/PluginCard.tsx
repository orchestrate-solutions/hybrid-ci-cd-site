import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Stack,
} from '@mui/material';
import {
  Star as StarIcon,
  GetApp as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as UpdateIcon,
} from '@mui/icons-material';

export type PluginStatus = 'available' | 'installed' | 'update-available';

export interface Plugin {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  stars: number;
  downloads: number;
  verified: boolean;
  status: PluginStatus;
  installedVersion?: string;
}

interface PluginCardProps {
  plugin: Plugin;
  onInstall: (pluginId: string) => void;
}

/**
 * Get button label based on plugin status
 */
function getButtonLabel(status: PluginStatus): string {
  switch (status) {
    case 'available':
      return 'Install';
    case 'installed':
      return 'Configure';
    case 'update-available':
      return 'Update';
  }
}

/**
 * Get button color based on plugin status
 */
function getButtonColor(status: PluginStatus): 'primary' | 'info' | 'warning' {
  switch (status) {
    case 'available':
      return 'primary';
    case 'installed':
      return 'info';
    case 'update-available':
      return 'warning';
  }
}

/**
 * PluginCard component using MUI X
 */
export function PluginCard({ plugin, onInstall }: PluginCardProps) {
  const handleClick = () => {
    onInstall(plugin.id);
  };

  return (
    <Card
      data-testid={`plugin-card-${plugin.id}`}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ flex: 1, pb: 1 }}>
        {/* Header with name and verified badge */}
        <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 1.5 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              component="h3"
              className="truncate"
              sx={{
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              data-testid="plugin-name"
            >
              {plugin.name}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              by {plugin.author}
            </Typography>
          </Box>
          {plugin.verified && (
            <Chip
              icon={<CheckCircleIcon />}
              label="Verified"
              color="success"
              size="small"
              variant="filled"
              sx={{ flexShrink: 0 }}
            />
          )}
        </Stack>

        {/* Status Badge */}
        {plugin.status === 'update-available' && (
          <Box sx={{ mb: 1.5 }}>
            <Chip
              icon={<UpdateIcon />}
              label="Update Available"
              color="warning"
              size="small"
              variant="outlined"
            />
          </Box>
        )}

        {/* Version info */}
        <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant="caption" color="textSecondary">
            v{plugin.version}
          </Typography>
          {plugin.installedVersion && plugin.status === 'update-available' && (
            <Typography variant="caption" color="textSecondary" sx={{ fontStyle: 'italic' }}>
              installed: v{plugin.installedVersion}
            </Typography>
          )}
        </Box>

        {/* Description */}
        <Typography
          variant="body2"
          color="textSecondary"
          className="line-clamp-2"
          sx={{
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
          data-testid="plugin-description"
        >
          {plugin.description}
        </Typography>

        {/* Stats */}
        <Stack direction="row" spacing={3} sx={{ color: 'textSecondary' }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
            <Typography variant="caption">{plugin.stars}</Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <DownloadIcon sx={{ fontSize: 16, color: 'info.main' }} />
            <Typography variant="caption">{plugin.downloads} downloads</Typography>
          </Stack>
        </Stack>
      </CardContent>

      {/* Action Button */}
      <CardActions sx={{ pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          color={getButtonColor(plugin.status)}
          onClick={handleClick}
        >
          {getButtonLabel(plugin.status)}
        </Button>
      </CardActions>
    </Card>
  );
}
