import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Stack,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Lock as LockIcon,
  Public as NetworkIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

export type IsolationLevel = 'strict' | 'standard' | 'moderate';
export type SandboxStatus = 'active' | 'inactive';

export interface Sandbox {
  id: string;
  name: string;
  isolationLevel: IsolationLevel;
  resources: {
    cpuLimit: string;
    memoryLimit: string;
    diskLimit: string;
  };
  networkAccess: {
    enabled: boolean;
    allowedDomains: string[];
    blockedPorts: string[];
  };
  fileSystemAccess: {
    readPaths: string[];
    writePaths: string[];
    restrictedPaths: string[];
  };
  status: SandboxStatus;
}

interface SandboxPreviewProps {
  sandbox: Sandbox;
}

/**
 * Get isolation color for MUI color system
 */
function getIsolationColor(level: IsolationLevel): 'success' | 'info' | 'warning' {
  switch (level) {
    case 'strict':
      return 'success';
    case 'standard':
      return 'info';
    case 'moderate':
      return 'warning';
  }
}

/**
 * Get isolation label
 */
function getIsolationLabel(level: IsolationLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

/**
 * SandboxPreview component using MUI X
 */
export function SandboxPreview({ sandbox }: SandboxPreviewProps) {
  const isolationColor = getIsolationColor(sandbox.isolationLevel);
  const isActive = sandbox.status === 'active';

  return (
    <Card>
      <CardContent sx={{ '&:last-child': { pb: 2 } }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              {sandbox.name}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              ID: {sandbox.id}
            </Typography>
          </Box>
          <Chip
            icon={isActive ? <CheckCircleIcon /> : <CancelIcon />}
            label={isActive ? 'Active' : 'Inactive'}
            color={isActive ? 'success' : 'error'}
            size="small"
          />
        </Stack>

        {/* Isolation Level Badge */}
        <Box sx={{ mb: 3, display: 'flex', gap: 1, alignItems: 'center' }}>
          <LockIcon sx={{ fontSize: 16 }} />
          <Chip
            label={`${getIsolationLabel(sandbox.isolationLevel)} Isolation`}
            color={isolationColor}
            size="small"
            variant="outlined"
          />
        </Box>

        {/* Resources Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
            Resources
          </Typography>
          <Grid container spacing={2}>
            {[
              { label: 'CPU', value: sandbox.resources.cpuLimit },
              { label: 'Memory', value: sandbox.resources.memoryLimit },
              { label: 'Disk', value: sandbox.resources.diskLimit },
            ].map(({ label, value }) => (
              <Grid item xs={4} key={label}>
                <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                  <Typography variant="caption" color="textSecondary" display="block">
                    {label}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontFamily: 'monospace', fontWeight: 500 }}
                  >
                    {value}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Network Access Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
            Network Access
          </Typography>
          <Paper
            variant="outlined"
            sx={{ p: 2, backgroundColor: (theme) => theme.palette.background.default }}
          >
            {/* Status */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <NetworkIcon
                sx={{
                  fontSize: 16,
                  color: sandbox.networkAccess.enabled ? 'success.main' : 'error.main',
                }}
              />
              <Typography variant="body2">
                {sandbox.networkAccess.enabled
                  ? 'Network access enabled'
                  : 'Network access disabled'}
              </Typography>
            </Stack>

            {/* Allowed domains and blocked ports */}
            {sandbox.networkAccess.enabled && (
              <Stack spacing={2}>
                {/* Allowed Domains */}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                    Allowed Domains:
                  </Typography>
                  {sandbox.networkAccess.allowedDomains.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {sandbox.networkAccess.allowedDomains.map(domain => (
                        <Chip
                          key={domain}
                          label={domain}
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="caption" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                      No domains allowed
                    </Typography>
                  )}
                </Box>

                {/* Blocked Ports */}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                    Blocked Ports:
                  </Typography>
                  {sandbox.networkAccess.blockedPorts.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {sandbox.networkAccess.blockedPorts.map(port => (
                        <Chip
                          key={port}
                          label={port}
                          size="small"
                          color="error"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="caption" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                      No ports blocked
                    </Typography>
                  )}
                </Box>
              </Stack>
            )}
          </Paper>
        </Box>

        {/* File System Access Section */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
            File System Access
          </Typography>
          <Grid container spacing={2}>
            {[
              {
                title: 'Read Paths',
                paths: sandbox.fileSystemAccess.readPaths,
                color: 'info',
              },
              {
                title: 'Write Paths',
                paths: sandbox.fileSystemAccess.writePaths,
                color: 'success',
              },
              {
                title: 'Blocked Paths',
                paths: sandbox.fileSystemAccess.restrictedPaths,
                color: 'error',
              },
            ].map(({ title, paths, color }) => (
              <Grid item xs={4} key={title}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 600, display: 'block', mb: 1, color: `${color}.main` }}
                  >
                    {title}
                  </Typography>
                  <List dense sx={{ '& .MuiListItem-root': { paddingX: 0 } }}>
                    {paths.length > 0 ? (
                      paths.map(path => (
                        <ListItem key={path} disableGutters>
                          <ListItemText
                            primary={path}
                            primaryTypographyProps={{
                              variant: 'caption',
                              sx: { fontFamily: 'monospace', fontSize: '11px' },
                            }}
                          />
                        </ListItem>
                      ))
                    ) : (
                      <Typography variant="caption" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                        No paths
                      </Typography>
                    )}
                  </List>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
}
