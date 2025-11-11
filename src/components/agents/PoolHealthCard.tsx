/**
 * PoolHealthCard Component
 * Displays agent pool health metrics with progress indicators
 */

'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  Box,
  Typography,
  Chip,
  Stack,
} from '@mui/material';
import {
  CheckCircle as HealthyIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

interface PoolMetrics {
  /** CPU usage percentage (0-100) */
  cpu_usage_percent: number;
  /** Memory usage percentage (0-100) */
  memory_usage_percent: number;
  /** Disk usage percentage (0-100) */
  disk_usage_percent: number;
  /** Number of healthy agents */
  healthy_agent_count: number;
  /** Number of unhealthy agents */
  unhealthy_agent_count: number;
  /** Total agent count */
  total_agent_count: number;
}

interface PoolHealthCardProps {
  /** Pool metrics object */
  metrics: PoolMetrics;
}

/**
 * Get color based on metric value
 * - Green: < 60%
 * - Yellow: 60-80%
 * - Red: > 80%
 */
const getMetricColor = (
  value: number
): 'success' | 'warning' | 'error' => {
  if (value >= 80) return 'error';
  if (value >= 60) return 'warning';
  return 'success';
};

/**
 * Get status icon based on metric value
 */
const getStatusIcon = (
  value: number
): React.ReactNode => {
  if (value >= 80) return <ErrorIcon sx={{ fontSize: '1.2rem', color: '#d32f2f' }} />;
  if (value >= 60) return <WarningIcon sx={{ fontSize: '1.2rem', color: '#f57c00' }} />;
  return <HealthyIcon sx={{ fontSize: '1.2rem', color: '#388e3c' }} />;
};

/**
 * PoolHealthCard component
 * Displays CPU, memory, and disk usage with progress bars
 * Shows agent health status (healthy/unhealthy count)
 */
export function PoolHealthCard({ metrics }: PoolHealthCardProps) {
  const unhealthyPercent =
    metrics.total_agent_count > 0
      ? Math.round((metrics.unhealthy_agent_count / metrics.total_agent_count) * 100)
      : 0;

  const overallHealth =
    (metrics.cpu_usage_percent +
      metrics.memory_usage_percent +
      metrics.disk_usage_percent) /
    3;

  const overallStatus =
    overallHealth >= 80 ? 'critical' : overallHealth >= 60 ? 'degraded' : 'healthy';

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardHeader
        title="Agent Pool Health"
        subheader={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            {getStatusIcon(overallHealth)}
            <Typography variant="body2" color="text.secondary">
              {overallStatus === 'critical'
                ? 'Critical'
                : overallStatus === 'degraded'
                  ? 'Degraded'
                  : 'Healthy'}
            </Typography>
          </Box>
        }
        sx={{ pb: 2 }}
      />

      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Metrics Grid */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* CPU Usage */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                CPU
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {metrics.cpu_usage_percent}%
              </Typography>
            </Box>
            <LinearProgress
              role="progressbar"
              variant="determinate"
              value={metrics.cpu_usage_percent}
              color={getMetricColor(metrics.cpu_usage_percent)}
              sx={{ height: 6, borderRadius: 1 }}
            />
          </Box>

          {/* Memory Usage */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Memory
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {metrics.memory_usage_percent}%
              </Typography>
            </Box>
            <LinearProgress
              role="progressbar"
              variant="determinate"
              value={metrics.memory_usage_percent}
              color={getMetricColor(metrics.memory_usage_percent)}
              sx={{ height: 6, borderRadius: 1 }}
            />
          </Box>

          {/* Disk Usage */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Disk
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {metrics.disk_usage_percent}%
              </Typography>
            </Box>
            <LinearProgress
              role="progressbar"
              variant="determinate"
              value={metrics.disk_usage_percent}
              color={getMetricColor(metrics.disk_usage_percent)}
              sx={{ height: 6, borderRadius: 1 }}
            />
          </Box>
        </Box>

        {/* Agent Status */}
        <Box
          sx={{
            p: 2,
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Agent Status
          </Typography>

          <Stack direction="row" spacing={1}>
            {/* Healthy Agents */}
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <HealthyIcon sx={{ fontSize: '1rem', color: '#388e3c' }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Healthy
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {metrics.healthy_agent_count}
                </Typography>
              </Box>
            </Box>

            {/* Unhealthy Agents */}
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <ErrorIcon sx={{ fontSize: '1rem', color: '#d32f2f' }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Unhealthy
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {metrics.unhealthy_agent_count}
                </Typography>
              </Box>
            </Box>
          </Stack>

          {/* Overall Status Chip */}
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Chip
              label={`${metrics.total_agent_count} Total`}
              size="small"
              variant="outlined"
            />
            {metrics.unhealthy_agent_count > 0 && (
              <Chip
                label={`${unhealthyPercent}% Down`}
                size="small"
                color="error"
                variant="filled"
              />
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
