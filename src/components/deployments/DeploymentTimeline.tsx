/**
 * DeploymentTimeline Component
 * Displays deployment progression through environments with timestamps and status
 */

'use client';

import React from 'react';
import {
  Box,
  Card,
  Chip,
  Typography,
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';

export interface Deployment {
  id: string;
  version: string;
  status: 'DRAFT' | 'STAGED' | 'LIVE' | 'ROLLED_BACK';
  environment: string;
  created_at: string;
  staged_at: string | null;
  production_at: string | null;
  created_by: string;
  approved_by: string | null;
  rolled_back_at: string | null;
  rolled_back_reason: string | null;
}

interface DeploymentTimelineProps {
  /** Deployment object with timeline data */
  deployment: Deployment;
  /** Optional compact mode for reduced spacing */
  compact?: boolean;
  /** Optional callback when rollback is triggered */
  onRollback?: (deploymentId: string, reason: string) => void;
  /** Optional callback when deployment is approved */
  onApprove?: (deploymentId: string) => void;
}

/**
 * Maps deployment status to color
 */
const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' => {
  switch (status) {
    case 'LIVE':
      return 'success';
    case 'STAGED':
      return 'info';
    case 'DRAFT':
      return 'warning';
    case 'ROLLED_BACK':
      return 'error';
    default:
      return 'info';
  }
};

/**
 * Maps deployment status to display label
 */
const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'LIVE':
      return 'In Production';
    case 'STAGED':
      return 'In Staging';
    case 'DRAFT':
      return 'Draft';
    case 'ROLLED_BACK':
      return 'Rolled Back';
    default:
      return status;
  }
};

/**
 * DeploymentTimeline component
 * Shows deployment progression: Draft → Staging → Production with timestamps and users
 */
export function DeploymentTimeline({
  deployment,
  compact = false,
  onRollback,
  onApprove,
}: DeploymentTimelineProps) {
  // Build timeline events
  const events = [
    {
      title: 'Created',
      timestamp: deployment.created_at,
      user: deployment.created_by,
      status: 'completed',
      icon: CheckCircleIcon,
    },
    {
      title: 'Promoted to Staging',
      timestamp: deployment.staged_at,
      user: 'system',
      status: deployment.staged_at ? 'completed' : 'pending',
      icon: deployment.staged_at ? CheckCircleIcon : ScheduleIcon,
    },
    {
      title: 'Approved for Production',
      timestamp: deployment.production_at ? deployment.created_at : null,
      user: deployment.approved_by || 'pending',
      status: deployment.production_at ? 'completed' : 'pending',
      icon: deployment.production_at ? CheckCircleIcon : ScheduleIcon,
    },
    {
      title: 'Deployed to Production',
      timestamp: deployment.production_at,
      user: 'system',
      status: deployment.production_at ? 'completed' : 'pending',
      icon: deployment.production_at ? CheckCircleIcon : ScheduleIcon,
    },
    ...(deployment.rolled_back_at
      ? [
          {
            title: 'Rolled Back',
            timestamp: deployment.rolled_back_at,
            user: 'system',
            status: 'rolled_back' as const,
            icon: ErrorIcon,
          },
        ]
      : []),
  ];

  return (
    <Card
      sx={{
        p: compact ? 2 : 3,
        backgroundColor: 'background.paper',
      }}
    >
      {/* Header with version and status */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Version {deployment.version}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Environment: {deployment.environment}
          </Typography>
        </Box>
        <Chip
          label={getStatusLabel(deployment.status)}
          color={getStatusColor(deployment.status)}
          variant="filled"
          size="medium"
        />
      </Box>

      {/* Rollback reason if applicable */}
      {deployment.status === 'ROLLED_BACK' && deployment.rolled_back_reason && (
        <Box
          sx={{
            mb: 3,
            p: 2,
            backgroundColor: '#ffebee',
            border: '1px solid #ef5350',
            borderRadius: 1,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#c62828', mb: 0.5 }}>
            🔄 Rollback Reason
          </Typography>
          <Typography variant="body2" color="text.primary">
            {deployment.rolled_back_reason}
          </Typography>
        </Box>
      )}

      {/* Timeline as List */}
      <List
        role="region"
        aria-label={`Deployment timeline for version ${deployment.version}`}
        sx={{
          p: 0,
          m: 0,
          '& .MuiListItem-root': {
            minHeight: compact ? '60px' : '100px',
            px: 0,
          },
        }}
      >
        {events.map((event, index) => {
          const IconComponent = event.icon;
          const isCompleted = event.status === 'completed';
          const isRolledBack = event.status === 'rolled_back';
          const isPending = event.status === 'pending';

          return (
            <React.Fragment key={index}>
              <ListItem role="listitem" sx={{ py: 2, px: 0 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: isRolledBack
                        ? '#ef5350'
                        : isCompleted
                          ? '#4caf50'
                          : '#bdbdbd',
                      boxShadow: isCompleted || isRolledBack ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                    }}
                  >
                    <IconComponent
                      sx={{
                        fontSize: '1.2rem',
                        color: 'white',
                      }}
                    />
                  </Box>
                </ListItemIcon>

                <ListItemText
                  primary={
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        color: isRolledBack ? '#c62828' : 'text.primary',
                      }}
                    >
                      {event.title}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      {event.timestamp ? (
                        <Typography variant="body2" color="text.secondary">
                          <strong>{format(new Date(event.timestamp), 'MMM dd, yyyy HH:mm:ss')}</strong>
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.disabled">
                          Pending
                        </Typography>
                      )}
                      {event.user && event.user !== 'pending' && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
                          <strong>By:</strong> {event.user}
                        </Typography>
                      )}
                      {isPending && (
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'inline-block',
                            mt: 0.5,
                            px: 1,
                            py: 0.3,
                            backgroundColor: '#fff3cd',
                            borderRadius: 0.5,
                            color: '#856404',
                          }}
                        >
                          ⏳ Waiting...
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
              {index < events.length - 1 && <Divider sx={{ my: 1 }} />}
            </React.Fragment>
          );
        })}
      </List>

      {/* Timeline metadata footer */}
      <Box
        sx={{
          mt: 3,
          pt: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Deployment ID
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
            {deployment.id}
          </Typography>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Duration
          </Typography>
          <Typography variant="body2">
            {deployment.production_at
              ? formatDistanceToNow(new Date(deployment.created_at))
              : deployment.staged_at
                ? formatDistanceToNow(new Date(deployment.created_at))
                : '—'}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
}
