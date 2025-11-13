'use client';

/**
 * Dashboard Overview Page
 * 
 * Real-time dashboard with:
 * - System metrics (jobs, deployments, agents)
 * - Real-time status indicators
 * - Quick access to jobs, deployments, agents
 * - Real-time update control via user preferences
 * 
 * Architecture:
 * - Uses useDashboard() hook for unified state
 * - Uses useRealTime() hook for polling
 * - Respects user preferences (Live/Efficient/Off)
 * - Fully responsive (mobile, tablet, desktop)
 */

import React, { useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Grid,
  Paper,
  Card,
  CardContent,
  CardActions,
  Chip,
  Stack,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useDashboard, useRealTime } from '@/lib/hooks';
import Link from 'next/link';

/**
 * StatusCard Component - Reusable metric card
 */
function StatusCard({
  title,
  value,
  icon,
  color,
  trend,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: 'success' | 'warning' | 'error' | 'info';
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: color === 'error' ? '#fff3e0' : '#f5f5f5',
      }}
    >
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ fontSize: '2rem' }}>{icon}</Box>
          {trend && (
            <TrendingUpIcon
              sx={{
                fontSize: '1.2rem',
                color:
                  trend === 'up' ? '#4caf50' : trend === 'down' ? '#f44336' : '#9e9e9e',
                transform: trend === 'down' ? 'rotate(180deg)' : 'none',
              }}
            />
          )}
        </Box>
        <Typography color="textSecondary" sx={{ mt: 1 }} variant="body2">
          {title}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

/**
 * Dashboard Overview Page Component
 */
export default function DashboardPage() {
  const { jobs, agents, deployments, metrics, loading, error, refetch } =
    useDashboard();

  // Set up real-time polling (respects user preference)
  useRealTime({
    onRefresh: refetch,
    enabled: true,
  });

  // Compute derived statistics
  const stats = useMemo(
    () => ({
      jobHealthy: metrics.runningJobs + metrics.completedJobs > 0,
      agentCapacity:
        metrics.onlineAgents > 0
          ? ((metrics.busyAgents / metrics.onlineAgents) * 100).toFixed(0)
          : 0,
      deploymentSuccessRate:
        metrics.totalDeployments > 0
          ? (
              ((metrics.totalDeployments - metrics.failedDeployments) /
                metrics.totalDeployments) *
              100
            ).toFixed(0)
          : 'N/A',
    }),
    [metrics]
  );

  // Error state
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Dashboard
          </Typography>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={refetch}>
                <RefreshIcon sx={{ mr: 1 }} />
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        </Box>
      </Container>
    );
  }

  // Loading state
  if (loading && jobs.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Dashboard
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Page Header */}
        <Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
              mb: 2,
            }}
          >
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                Dashboard
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                Real-time overview of jobs, deployments, and infrastructure
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={refetch}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* System Status Section */}
        <Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <CheckCircleIcon sx={{ fontSize: '1.3rem', color: '#4caf50' }} />
            System Status
          </Typography>

          <Grid container spacing={2}>
            {/* Jobs Card */}
            <Grid item xs={12} sm={6} md={3}>
              <StatusCard
                title="Jobs Running"
                value={metrics.runningJobs}
                icon="⚡"
                color={metrics.runningJobs > 0 ? 'success' : 'info'}
                trend={metrics.runningJobs > 0 ? 'up' : 'neutral'}
              />
            </Grid>

            {/* Failed Jobs Card */}
            <Grid item xs={12} sm={6} md={3}>
              <StatusCard
                title="Failed Jobs"
                value={metrics.failedJobs}
                icon="⚠️"
                color={metrics.failedJobs > 0 ? 'error' : 'success'}
                trend={metrics.failedJobs > 0 ? 'up' : 'neutral'}
              />
            </Grid>

            {/* Agents Card */}
            <Grid item xs={12} sm={6} md={3}>
              <StatusCard
                title="Agents Online"
                value={`${metrics.onlineAgents}/${metrics.totalAgents}`}
                icon="🤖"
                color={metrics.onlineAgents === metrics.totalAgents ? 'success' : 'warning'}
              />
            </Grid>

            {/* Deployments Card */}
            <Grid item xs={12} sm={6} md={3}>
              <StatusCard
                title="Deployments"
                value={metrics.totalDeployments}
                icon="🚀"
                color={metrics.inProgressDeployments === 0 ? 'success' : 'info'}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Queued Jobs Section */}
        <Box>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'textSecondary' }}>
                📋 Queued Jobs
              </Typography>
              <Chip
                label={`${metrics.queuedJobs} pending`}
                color={metrics.queuedJobs > 10 ? 'warning' : 'default'}
                size="small"
              />
            </Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                mt: 1,
                color: metrics.queuedJobs > 0 ? '#2196f3' : '#9e9e9e',
              }}
            >
              {metrics.queuedJobs}
            </Typography>
            <Link href="/dashboard/jobs" style={{ textDecoration: 'none' }}>
              <Button variant="text" size="small" sx={{ mt: 1 }}>
                View all jobs →
              </Button>
            </Link>
          </Paper>
        </Box>

        {/* Quick Stats Section */}
        <Grid container spacing={2}>
          {/* Success Rate */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 600 }}>
                Deployment Success Rate
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: '#4caf50' }}>
                {stats.deploymentSuccessRate}%
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                {metrics.completedDeployments} of {metrics.totalDeployments} deployments
              </Typography>
            </Paper>
          </Grid>

          {/* Agent Capacity */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 600 }}>
                Agent Capacity Utilization
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  mt: 1,
                  color: stats.agentCapacity > 80 ? '#ff9800' : '#4caf50',
                }}
              >
                {stats.agentCapacity}%
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                {metrics.busyAgents} busy of {metrics.onlineAgents} online agents
              </Typography>
            </Paper>
          </Grid>

          {/* Jobs Completed */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 600 }}>
                Jobs Completed
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: '#4caf50' }}>
                {metrics.completedJobs}
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                {metrics.totalJobs} total jobs in system
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Quick Links Section */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Quick Navigation
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ flexWrap: 'wrap' }}
          >
            <Link href="/dashboard/jobs" style={{ textDecoration: 'none' }}>
              <Button variant="contained" color="primary">
                View All Jobs ({metrics.totalJobs})
              </Button>
            </Link>
            <Link href="/dashboard/deployments" style={{ textDecoration: 'none' }}>
              <Button variant="contained" color="primary">
                View Deployments ({metrics.totalDeployments})
              </Button>
            </Link>
            <Link href="/dashboard/agents" style={{ textDecoration: 'none' }}>
              <Button variant="contained" color="primary">
                View Agents ({metrics.totalAgents})
              </Button>
            </Link>
          </Stack>
        </Box>

        {/* Help Section */}
        <Paper sx={{ p: 3, backgroundColor: '#e3f2fd' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            💡 Tip: Set your refresh rate
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Go to Settings to choose between Live (10s), Efficient (30s), or Manual refresh modes.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}
