'use client';

/**
 * Dashboard Page
 * 
 * Main dashboard showing system metrics and recent activity.
 * Powered by CodeUChain for state management and metrics API integration.
 */

import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Grid, CircularProgress, Alert, Button } from '@mui/material';
import { getDashboardMetrics, DashboardMetrics } from '@/lib/api/metrics';

/**
 * Metric Card Component (inline for now, can extract later)
 */
function MetricCard({
  label,
  value,
  testId,
}: {
  label: string;
  value: number | string;
  testId: string;
}) {
  return (
    <Box
      data-testid={testId}
      sx={{
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: 2,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Typography variant="caption" color="textSecondary" display="block">
        {label}
      </Typography>
      <Typography
        variant="h4"
        component="div"
        data-testid="metric-value"
        sx={{ fontWeight: 700, my: 1 }}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Typography>
    </Box>
  );
}

/**
 * Recent Activity Section (placeholder)
 */
function RecentActivitySection() {
  return (
    <Box data-testid="activity-section" sx={{ mt: 4 }}>
      <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
        Recent Activity
      </Typography>
      <Box sx={{ color: 'textSecondary', fontStyle: 'italic' }}>
        Activity will appear here as jobs and deployments run.
      </Box>
    </Box>
  );
}

/**
 * Dashboard Page Component
 */
export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load dashboard metrics'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();

    // Auto-refresh every 60 seconds
    const interval = setInterval(loadMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <Box component="main" sx={{ py: 4 }}>
        <Container maxWidth="lg">
          <Typography variant="h1" component="h1" sx={{ mb: 3 }}>
            Dashboard
          </Typography>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={loadMetrics}>
            Retry
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box component="main" sx={{ py: 4 }}>
      <Container maxWidth="lg">
        {/* Page Title */}
        <Typography variant="h1" component="h1" sx={{ mb: 3, fontWeight: 700 }}>
          Dashboard
        </Typography>

        {/* Metrics Section */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : metrics ? (
          <>
            <Box data-testid="metrics-section">
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <MetricCard
                    label="Running"
                    value={metrics.jobs_running}
                    testId="metrics-running"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <MetricCard
                    label="Failed Today"
                    value={metrics.jobs_failed_today}
                    testId="metrics-failed"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <MetricCard
                    label="Deployments Today"
                    value={metrics.deployments_today}
                    testId="metrics-deployments"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <MetricCard
                    label="Queue Depth"
                    value={metrics.queue_depth}
                    testId="metrics-queue"
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Recent Activity */}
            <RecentActivitySection />
          </>
        ) : (
          <Alert severity="info">No data available</Alert>
        )}
      </Container>
    </Box>
  );
}
