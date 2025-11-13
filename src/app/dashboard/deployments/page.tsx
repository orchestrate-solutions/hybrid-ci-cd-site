'use client';

/**
 * Deployments Page - MVP Dashboard
 * 
 * Comprehensive deployment management with:
 * - Timeline view of deployments across environments
 * - Environment toggles (dev → staging → prod)
 * - Promotion controls (staging → production gating)
 * - Rollback with confirmation
 * - Service history tracking
 * - Real-time status updates
 * - Responsive design
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Card,
  CardContent,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import {
  Timeline as MuiTimeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineOppositeContent,
  TimelineDot,
} from '@mui/lab';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  HourglassTop as HourglassIcon,
  Refresh as RefreshIcon,
  Undo as RollbackIcon,
  GetApp as PromoteIcon,
} from '@mui/icons-material';
import { useDeployments, useRealTime } from '@/lib/hooks';
import type { Deployment, DeploymentStatus, DeploymentEnvironment } from '@/lib/types/deployments';

/**
 * Status Color Map
 */
const STATUS_COLORS: Record<DeploymentStatus, 'default' | 'success' | 'error' | 'warning' | 'info'> = {
  PENDING: 'warning',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  FAILED: 'error',
  ROLLED_BACK: 'error',
  CANCELED: 'default',
};

/**
 * Environment Color Map
 */
const ENV_COLORS: Record<DeploymentEnvironment, 'primary' | 'info' | 'error'> = {
  DEVELOPMENT: 'primary',
  STAGING: 'info',
  PRODUCTION: 'error',
};

/**
 * Status Icon Component
 */
function StatusIcon({ status }: { status: DeploymentStatus }) {
  const iconProps = { sx: { fontSize: '1.5rem' } };

  switch (status) {
    case 'COMPLETED':
      return <CheckCircleIcon {...iconProps} sx={{ ...iconProps.sx, color: '#4caf50' }} />;
    case 'FAILED':
    case 'ROLLED_BACK':
      return <WarningIcon {...iconProps} sx={{ ...iconProps.sx, color: '#f44336' }} />;
    case 'IN_PROGRESS':
      return <HourglassIcon {...iconProps} sx={{ ...iconProps.sx, color: '#2196f3' }} />;
    default:
      return <CircularProgress size={24} />;
  }
}

/**
 * Deployment Timeline Item Component
 */
function DeploymentTimelineItem({
  deployment,
  onPromote,
  onRollback,
}: {
  deployment: Deployment;
  onPromote: (deployment: Deployment) => void;
  onRollback: (deployment: Deployment) => void;
}) {
  const isCompleted = deployment.status === 'COMPLETED';
  const isFailed = deployment.status === 'FAILED';
  const canPromote = isCompleted && deployment.environment !== 'PRODUCTION';
  const canRollback = isCompleted && deployment.environment === 'PRODUCTION';

  return (
    <TimelineItem>
      <TimelineOppositeContent color="textSecondary" sx={{ flex: 0.2 }}>
        <Typography variant="caption">
          {new Date(deployment.created_at).toLocaleDateString()}
        </Typography>
      </TimelineOppositeContent>

      <TimelineSeparator>
        <TimelineDot
          sx={{
            bgcolor: isCompleted
              ? '#4caf50'
              : isFailed
                ? '#f44336'
                : '#2196f3',
            boxShadow: 3,
          }}
        >
          <StatusIcon status={deployment.status} />
        </TimelineDot>
        <TimelineConnector sx={{ bgcolor: '#e0e0e0' }} />
      </TimelineSeparator>

      <TimelineContent sx={{ py: 2, flex: 0.8 }}>
        <Card
          sx={{
            backgroundColor: isFailed ? '#fff3e0' : isCompleted ? '#f1f8e9' : '#e3f2fd',
            border: '1px solid',
            borderColor: isFailed ? '#ffb74d' : isCompleted ? '#9ccc65' : '#64b5f6',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {deployment.name}
                  </Typography>
                  <Chip
                    label={deployment.status}
                    color={STATUS_COLORS[deployment.status]}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                  <Chip
                    label={deployment.environment}
                    color={ENV_COLORS[deployment.environment]}
                    size="small"
                    variant="outlined"
                  />
                </Box>

                {deployment.version && (
                  <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 0.5 }}>
                    Version: {deployment.version}
                  </Typography>
                )}

                {deployment.description && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {deployment.description}
                  </Typography>
                )}

                {isFailed && deployment.error_message && (
                  <Alert severity="error" sx={{ mt: 1, py: 0.5 }}>
                    <Typography variant="caption">{deployment.error_message}</Typography>
                  </Alert>
                )}
              </Box>

              {/* Actions */}
              <Stack direction="column" spacing={1} sx={{ minWidth: 120 }}>
                {canPromote && (
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    startIcon={<PromoteIcon />}
                    onClick={() => onPromote(deployment)}
                    fullWidth
                  >
                    Promote
                  </Button>
                )}

                {canRollback && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<RollbackIcon />}
                    onClick={() => onRollback(deployment)}
                    fullWidth
                  >
                    Rollback
                  </Button>
                )}

                {!canPromote && !canRollback && (
                  <Button size="small" variant="outlined" disabled fullWidth>
                    No Actions
                  </Button>
                )}
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </TimelineContent>
    </TimelineItem>
  );
}

/**
 * Deployments Page Component
 */
export default function DeploymentsPage() {
  const [search, setSearch] = useState('');
  const [environmentFilter, setEnvironmentFilter] = useState<DeploymentEnvironment | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<DeploymentStatus | 'ALL'>('ALL');
  const [promoteDialog, setPromoteDialog] = useState<{ open: boolean; deployment: Deployment | null }>({
    open: false,
    deployment: null,
  });
  const [rollbackDialog, setRollbackDialog] = useState<{ open: boolean; deployment: Deployment | null }>({
    open: false,
    deployment: null,
  });

  // Fetch deployments with filters
  const { deployments, loading, error, refetch } = useDeployments({
    environment: environmentFilter === 'ALL' ? undefined : environmentFilter,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  });

  // Set up real-time polling
  useRealTime({
    onRefresh: refetch,
    enabled: true,
  });

  // Filter deployments by search term
  const filteredDeployments = useMemo(() => {
    if (!search) return deployments;
    return deployments.filter((d) =>
      d.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [deployments, search]);

  // Group deployments by environment for context
  const deploymentsByEnvironment = useMemo(() => {
    return {
      DEVELOPMENT: filteredDeployments.filter((d) => d.environment === 'DEVELOPMENT'),
      STAGING: filteredDeployments.filter((d) => d.environment === 'STAGING'),
      PRODUCTION: filteredDeployments.filter((d) => d.environment === 'PRODUCTION'),
    };
  }, [filteredDeployments]);

  // Summary stats
  const stats = useMemo(
    () => ({
      total: deploymentsByEnvironment.DEVELOPMENT.length +
        deploymentsByEnvironment.STAGING.length +
        deploymentsByEnvironment.PRODUCTION.length,
      successful: filteredDeployments.filter((d) => d.status === 'COMPLETED').length,
      failed: filteredDeployments.filter((d) => d.status === 'FAILED').length,
      inProgress: filteredDeployments.filter((d) => d.status === 'IN_PROGRESS').length,
    }),
    [deploymentsByEnvironment, filteredDeployments]
  );

  const handlePromote = (deployment: Deployment) => {
    setPromoteDialog({ open: true, deployment });
  };

  const confirmPromote = async () => {
    if (!promoteDialog.deployment) return;

    try {
      // TODO: Call deployToStaging or promoteToProduction API
      const targetEnv = promoteDialog.deployment.environment === 'DEVELOPMENT' ? 'STAGING' : 'PRODUCTION';
      console.log(`Promoting ${promoteDialog.deployment.name} to ${targetEnv}`);

      // Simulate promotion - in real app would call API
      setPromoteDialog({ open: false, deployment: null });
      refetch();
    } catch (err) {
      console.error('Promotion failed:', err);
    }
  };

  const handleRollback = (deployment: Deployment) => {
    setRollbackDialog({ open: true, deployment });
  };

  const confirmRollback = async () => {
    if (!rollbackDialog.deployment) return;

    try {
      // TODO: Call rollbackDeployment API
      console.log(`Rolling back ${rollbackDialog.deployment.name}`);

      // Simulate rollback - in real app would call API
      setRollbackDialog({ open: false, deployment: null });
      refetch();
    } catch (err) {
      console.error('Rollback failed:', err);
    }
  };

  // Loading state
  if (loading && filteredDeployments.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
              Deployments
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
              Manage deployments across dev, staging, and production environments
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={refetch}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button variant="contained">Create Deployment</Button>
          </Stack>
        </Box>

        {/* Error State */}
        {error && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={refetch}>
                Retry
              </Button>
            }
          >
            {error.message || String(error)}
          </Alert>
        )}

        {/* Summary Stats */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Card sx={{ flex: 1 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography color="textSecondary" gutterBottom variant="caption">
                Total Deployments
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {stats.total}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography color="textSecondary" gutterBottom variant="caption">
                Successful
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#4caf50' }}>
                {stats.successful}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography color="textSecondary" gutterBottom variant="caption">
                In Progress
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#2196f3' }}>
                {stats.inProgress}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography color="textSecondary" gutterBottom variant="caption">
                Failed
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#f44336' }}>
                {stats.failed}
              </Typography>
            </CardContent>
          </Card>
        </Stack>

        {/* Filters Section */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Filters & Search
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              size="small"
              placeholder="Search deployments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              variant="outlined"
              sx={{ flex: 1, minWidth: 150 }}
              label="Search"
            />

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Environment</InputLabel>
              <Select
                value={environmentFilter}
                label="Environment"
                onChange={(e) => setEnvironmentFilter(e.target.value as DeploymentEnvironment | 'ALL')}
              >
                <MenuItem value="ALL">All Environments</MenuItem>
                <MenuItem value="DEVELOPMENT">Development</MenuItem>
                <MenuItem value="STAGING">Staging</MenuItem>
                <MenuItem value="PRODUCTION">Production</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value as DeploymentStatus | 'ALL')}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="FAILED">Failed</MenuItem>
                <MenuItem value="ROLLED_BACK">Rolled Back</MenuItem>
              </Select>
            </FormControl>

            {(environmentFilter !== 'ALL' || statusFilter !== 'ALL' || search) && (
              <Button
                variant="outlined"
                onClick={() => {
                  setSearch('');
                  setEnvironmentFilter('ALL');
                  setStatusFilter('ALL');
                }}
              >
                Reset
              </Button>
            )}
          </Stack>
        </Paper>

        {/* Timeline View */}
        {filteredDeployments.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No deployments found
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Try adjusting your filters or create a new deployment to get started.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Paper sx={{ p: 3 }}>
            <MuiTimeline position="alternate">
              {filteredDeployments.map((deployment, index) => (
                <React.Fragment key={deployment.id}>
                  <DeploymentTimelineItem
                    deployment={deployment}
                    onPromote={handlePromote}
                    onRollback={handleRollback}
                  />
                  {index < filteredDeployments.length - 1 && <Divider sx={{ my: 2 }} />}
                </React.Fragment>
              ))}
            </MuiTimeline>
          </Paper>
        )}

        {/* Info Card */}
        <Card sx={{ backgroundColor: '#e3f2fd' }}>
          <CardContent>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              💡 Deployment Workflow
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Deployments flow through environments: Development → Staging (test) → Production (live). Use &quot;Promote&quot;
              to move between environments. Rollback is available for production deployments only.
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Promote Dialog */}
      <Dialog open={promoteDialog.open} onClose={() => setPromoteDialog({ open: false, deployment: null })}>
        <DialogTitle>Promote Deployment</DialogTitle>
        <DialogContent sx={{ minWidth: 400 }}>
          {promoteDialog.deployment && (
            <>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Promote &quot;{promoteDialog.deployment.name}&quot; from{' '}
                <strong>{promoteDialog.deployment.environment}</strong> to{' '}
                <strong>
                  {promoteDialog.deployment.environment === 'DEVELOPMENT' ? 'STAGING' : 'PRODUCTION'}
                </strong>
                ?
              </Typography>
              {promoteDialog.deployment.environment === 'STAGING' && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  This will promote to PRODUCTION. Ensure all tests pass in staging first.
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPromoteDialog({ open: false, deployment: null })}>Cancel</Button>
          <Button onClick={confirmPromote} variant="contained" color="success">
            Promote
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rollback Dialog */}
      <Dialog open={rollbackDialog.open} onClose={() => setRollbackDialog({ open: false, deployment: null })}>
        <DialogTitle>Confirm Rollback</DialogTitle>
        <DialogContent sx={{ minWidth: 400 }}>
          {rollbackDialog.deployment && (
            <Typography variant="body2">
              Roll back &quot;{rollbackDialog.deployment.name}&quot; to the previous version? This action cannot be
              undone and will immediately stop the current deployment.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRollbackDialog({ open: false, deployment: null })}>Cancel</Button>
          <Button onClick={confirmRollback} variant="contained" color="error">
            Rollback
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
