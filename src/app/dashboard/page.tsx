'use client';

/**
 * Dashboard Overview Page
 * 
 * Real-time dashboard with:
 * - System metrics (jobs, deployments, agents)
 * - Top 7 tool status cards
 * - Real-time update control via user preferences
 * - Placeholder slots for future features
 * 
 * Architecture:
 * - Uses useRealTime() hook for polling
 * - Respects user preferences (Live/Efficient/Off)
 * - Modular component structure
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Divider,
} from '@mui/material';
import { getDashboardMetrics, DashboardMetrics } from '@/lib/api/metrics';
import { useRealTime } from '@/lib/hooks';
import {
  StatusCard,
  ToolStatusCard,
  ComingSoonCard,
  RealTimeStatusBadge,
} from '@/components/dashboard';

/**
 * Tool Configuration (MVP - Static)
 * Links point to external tools
 * Statuses are mocked for now (can integrate with v2 backend API)
 */
const TOOLS_CONFIG = [
  {
    id: 'github-actions',
    tool: 'GitHub Actions',
    icon: '🚀',
    status: 'healthy' as const,
    externalUrl: 'https://github.com',
  },
  {
    id: 'terraform',
    tool: 'Terraform',
    icon: '🏗️',
    status: 'healthy' as const,
    externalUrl: 'https://www.terraform.io',
  },
  {
    id: 'prometheus',
    tool: 'Prometheus',
    icon: '📊',
    status: 'healthy' as const,
    externalUrl: 'https://prometheus.io',
  },
  {
    id: 'grafana',
    tool: 'Grafana',
    icon: '📈',
    status: 'healthy' as const,
    externalUrl: 'https://grafana.com',
  },
  {
    id: 'docker',
    tool: 'Docker',
    icon: '🐳',
    status: 'healthy' as const,
    externalUrl: 'https://docker.com',
  },
  {
    id: 'jenkins',
    tool: 'Jenkins',
    icon: '⚙️',
    status: 'healthy' as const,
    externalUrl: 'https://jenkins.io',
  },
  {
    id: 'kubernetes',
    tool: 'Kubernetes',
    icon: '☸️',
    status: 'healthy' as const,
    externalUrl: 'https://kubernetes.io',
  },
];

/**
 * Dashboard Overview Page Component
 */
export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load metrics
  const loadMetrics = async () => {
    try {
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

  // Set up real-time polling (respects user preference)
  useRealTime({
    onRefresh: loadMetrics,
    enabled: true,
  });

  // Initial load
  useEffect(() => {
    loadMetrics();
  }, []);

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0 }}>
            Dashboard
          </Typography>
          <RealTimeStatusBadge />
        </Box>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={loadMetrics}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Page Header */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Dashboard
          </Typography>
          <RealTimeStatusBadge />
        </Box>
        <Typography variant="body2" color="textSecondary">
          Real-time overview of jobs, deployments, and infrastructure
        </Typography>
      </Box>

      {/* Metrics Section: System Status */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : metrics ? (
        <Box data-testid="metrics-section">
          {/* Heading */}
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            System Status
          </Typography>

          {/* Cards Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
              gap: 2,
            }}
          >
            <StatusCard
              label="Jobs Running"
              value={metrics.jobs_running}
              status={metrics.jobs_running > 0 ? 'success' : 'info'}
              icon="⚡"
              testId="status-jobs-running"
            />
            <StatusCard
              label="Failed Today"
              value={metrics.jobs_failed_today}
              status={metrics.jobs_failed_today > 0 ? 'error' : 'success'}
              icon="⚠️"
              testId="status-failed"
            />
            <StatusCard
              label="Deployments"
              value={metrics.deployments_today}
              status="info"
              icon="🚀"
              testId="status-deployments"
            />
            <StatusCard
              label="Queue Depth"
              value={metrics.queue_depth}
              status={metrics.queue_depth > 10 ? 'warning' : 'success'}
              icon="📋"
              testId="status-queue"
            />
          </Box>
        </Box>
      ) : (
        <Alert severity="info">No metrics available</Alert>
      )}

      <Divider />

      {/* Tools Section */}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Connected Tools
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 1.5,
          }}
        >
          {TOOLS_CONFIG.map((toolConfig) => (
            <ToolStatusCard
              key={toolConfig.id}
              tool={toolConfig.tool}
              icon={toolConfig.icon}
              status={toolConfig.status}
              externalUrl={toolConfig.externalUrl}
              testId={`tool-${toolConfig.id}`}
            />
          ))}
        </Box>
      </Box>

      <Divider />

      {/* Coming Soon Section */}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          What's Next
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 2,
          }}
        >
          <ComingSoonCard
            title="AI Evaluations"
            description="Auto-detect anomalies in logs and provide intelligent insights powered by LLM analysis."
            version="Q1 2026"
            testId="coming-soon-ai"
          />
          <ComingSoonCard
            title="Advanced Approvals"
            description="Multi-stage approval workflows with SLA enforcement and comprehensive audit trails."
            version="v2"
            testId="coming-soon-approvals"
          />
        </Box>
      </Box>
    </Box>
  );
}
