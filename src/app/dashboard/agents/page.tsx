'use client';

/**
 * Agents Page - MVP Dashboard
 * 
 * Comprehensive agent pool management with:
 * - Pool overview cards (status, agent counts, metrics)
 * - Individual agent grid (status, heartbeat, current jobs, CPU/memory)
 * - Pool controls (drain, scale, pause, resume)
 * - Real-time metrics and health indicators
 * - Responsive design
 * - Heartbeat-based offline detection
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  CardHeader,
  Chip,
  Stack,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Divider,
  Tooltip,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Cloud as OnlineIcon,
  CloudOff as OfflineIcon,
  PlayArrow as ResumeIcon,
  Pause as PauseIcon,
  GetApp as DrainIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useRealTime } from '@/lib/hooks/useRealTime';
import { listAgents, listAgentPools, getAgentMetrics, drainPool, scalePool, pauseAgent, resumeAgent } from '@/lib/api/agents';
import type { Agent, AgentPool, AgentMetrics } from '@/lib/types/agents';

/**
 * Status color map
 */
const STATUS_COLORS: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  IDLE: 'success',
  RUNNING: 'info',
  PAUSED: 'warning',
  OFFLINE: 'error',
  ERROR: 'error',
};

const POOL_STATUS_COLORS: Record<string, 'success' | 'warning' | 'error'> = {
  ACTIVE: 'success',
  PAUSED: 'warning',
  INACTIVE: 'error',
};

/**
 * Status icon component
 */
interface StatusIconProps {
  status: string;
  size?: 'small' | 'medium';
}

function StatusIcon({ status, size = 'small' }: StatusIconProps) {
  const theme = useTheme();
  
  const sizeMap = {
    small: { fontSize: '1.2rem' },
    medium: { fontSize: '1.5rem' },
  };
  
  const colorMap: Record<string, string> = {
    IDLE: theme.palette.success.main,
    RUNNING: theme.palette.info.main,
    PAUSED: theme.palette.warning.main,
    OFFLINE: theme.palette.error.main,
    ERROR: theme.palette.error.main,
  };

  switch (status) {
    case 'IDLE':
      return <CheckCircleIcon sx={{ color: colorMap.IDLE, ...sizeMap[size] }} />;
    case 'RUNNING':
      return <ResumeIcon sx={{ color: colorMap.RUNNING, ...sizeMap[size] }} />;
    case 'PAUSED':
      return <PauseIcon sx={{ color: colorMap.PAUSED, ...sizeMap[size] }} />;
    case 'OFFLINE':
      return <OfflineIcon sx={{ color: colorMap.OFFLINE, ...sizeMap[size] }} />;
    case 'ERROR':
      return <ErrorIcon sx={{ color: colorMap.ERROR, ...sizeMap[size] }} />;
    default:
      return <WarningIcon sx={{ color: colorMap.PAUSED, ...sizeMap[size] }} />;
  }
}

/**
 * Heartbeat indicator component
 */
interface HeartbeatIndicatorProps {
  lastHeartbeat: string;
  threshold?: number; // seconds
}

function HeartbeatIndicator({ lastHeartbeat, threshold = 60 }: HeartbeatIndicatorProps) {
  const theme = useTheme();
  const now = new Date();
  const lastBeat = new Date(lastHeartbeat);
  const secondsAgo = Math.floor((now.getTime() - lastBeat.getTime()) / 1000);
  const isHealthy = secondsAgo < threshold;

  return (
    <Tooltip title={`Last heartbeat: ${secondsAgo}s ago`}>
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1,
          py: 0.5,
          borderRadius: 1,
          bgcolor: isHealthy ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
          borderColor: isHealthy ? theme.palette.success.main : theme.palette.error.main,
          border: `1px solid ${isHealthy ? theme.palette.success.main : theme.palette.error.main}`,
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: isHealthy ? theme.palette.success.main : theme.palette.error.main,
            animation: isHealthy ? 'pulse 2s infinite' : 'none',
            '@keyframes pulse': {
              '0%': { opacity: 1 },
              '50%': { opacity: 0.5 },
              '100%': { opacity: 1 },
            },
          }}
        />
        <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
          {secondsAgo < 60 ? `${secondsAgo}s` : `${Math.floor(secondsAgo / 60)}m`}
        </Typography>
      </Box>
    </Tooltip>
  );
}

/**
 * Agent pool card component
 */
interface AgentPoolCardProps {
  pool: AgentPool;
  metrics: AgentMetrics | null;
  onDrain: () => void;
  onScale: () => void;
}

function AgentPoolCard({ pool, metrics, onDrain, onScale }: AgentPoolCardProps) {
  const healthPercentage = pool.agent_count > 0
    ? Math.round(((pool.idle_count + pool.running_count) / pool.agent_count) * 100)
    : 0;

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={pool.name}
        subheader={`Pool ID: ${pool.id.substring(0, 8)}...`}
        action={
          <Chip
            label={pool.status}
            color={POOL_STATUS_COLORS[pool.status]}
            variant="outlined"
            size="small"
          />
        }
        sx={{ pb: 1 }}
      />
      <Divider />
      <CardContent>
        <Stack spacing={2}>
          {/* Health Indicator */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="textSecondary">
                Overall Health
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                {healthPercentage}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={healthPercentage}
              sx={{
                height: 8,
                borderRadius: 1,
                bgcolor: 'rgba(0, 0, 0, 0.1)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: healthPercentage > 70 ? 'success.main' : healthPercentage > 40 ? 'warning.main' : 'error.main',
                },
              }}
            />
          </Box>

          {/* Agent Counts */}
          <Stack direction="row" spacing={1}>
            <Tooltip title="Idle agents ready for work">
              <Chip
                label={`Idle: ${pool.idle_count}`}
                icon={<CheckCircleIcon />}
                color="success"
                variant="outlined"
                size="small"
              />
            </Tooltip>
            <Tooltip title="Agents currently running jobs">
              <Chip
                label={`Running: ${pool.running_count}`}
                icon={<ResumeIcon />}
                color="info"
                variant="outlined"
                size="small"
              />
            </Tooltip>
            <Tooltip title="Total agents in pool">
              <Chip
                label={`Total: ${pool.agent_count}`}
                variant="outlined"
                size="small"
              />
            </Tooltip>
          </Stack>

          {/* Pool Controls */}
          <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<DrainIcon />}
              onClick={onDrain}
              fullWidth
            >
              Drain
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={onScale}
              fullWidth
            >
              Scale
            </Button>
          </Stack>

          {/* Pool Metadata */}
          <Stack spacing={0.5} sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="textSecondary">
              Created: {new Date(pool.created_at).toLocaleDateString()}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Updated: {new Date(pool.updated_at).toLocaleTimeString()}
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

/**
 * Agent card component
 */
interface AgentCardProps {
  agent: Agent;
  onPause?: () => void;
  onResume?: () => void;
}

function AgentCard({ agent, onPause, onResume }: AgentCardProps) {
  const isPaused = agent.status === 'PAUSED';
  const isOffline = agent.status === 'OFFLINE' || agent.status === 'ERROR';

  return (
    <Card
      sx={{
        opacity: isOffline ? 0.6 : 1,
        border: isOffline ? '1px solid #f44336' : '1px solid #e0e0e0',
        height: '100%',
      }}
    >
      <CardContent>
        <Stack spacing={1.5}>
          {/* Agent Name & Status */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {agent.name}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {agent.id.substring(0, 12)}...
              </Typography>
            </Box>
            <Chip
              label={agent.status}
              color={STATUS_COLORS[agent.status]}
              icon={<StatusIcon status={agent.status} size="small" />}
              size="small"
              variant="outlined"
            />
          </Box>

          {/* Heartbeat */}
          <Box sx={{ pt: 0.5 }}>
            <HeartbeatIndicator lastHeartbeat={agent.last_heartbeat} />
          </Box>

          {/* Current Job */}
          {agent.current_job_id && (
            <Box sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)', p: 1, borderRadius: 1 }}>
              <Typography variant="caption" color="textSecondary">
                Current Job
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                {agent.current_job_id.substring(0, 16)}...
              </Typography>
            </Box>
          )}

          {/* Resource Usage */}
          <Stack spacing={1} sx={{ pt: 0.5 }}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                <Typography variant="caption" color="textSecondary">
                  CPU
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                  {agent.cpu_cores} cores
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, (agent.cpu_cores / 16) * 100)}
                sx={{ height: 4, borderRadius: 2 }}
              />
            </Box>

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                <Typography variant="caption" color="textSecondary">
                  Memory
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                  {agent.memory_gb} GB
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, (agent.memory_gb / 64) * 100)}
                sx={{ height: 4, borderRadius: 2 }}
              />
            </Box>

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                <Typography variant="caption" color="textSecondary">
                  Disk
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                  {agent.disk_gb} GB
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, (agent.disk_gb / 1000) * 100)}
                sx={{ height: 4, borderRadius: 2 }}
              />
            </Box>
          </Stack>

          {/* Agent Version */}
          <Typography variant="caption" color="textSecondary">
            v{agent.version}
          </Typography>

          {/* Agent Controls */}
          {!isOffline && (
            <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
              {isPaused ? (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ResumeIcon />}
                  onClick={onResume}
                  fullWidth
                >
                  Resume
                </Button>
              ) : (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PauseIcon />}
                  onClick={onPause}
                  fullWidth
                >
                  Pause
                </Button>
              )}
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

/**
 * Agents Page Component
 */
export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [pools, setPools] = useState<AgentPool[]>([]);
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Dialog states
  const [scalingDialogOpen, setScalingDialogOpen] = useState(false);
  const [scalingPoolId, setScalingPoolId] = useState<string>('');
  const [desiredCount, setDesiredCount] = useState<string>('');

  // Fetch data (defined before hooks)
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [agentsRes, poolsRes, metricsRes] = await Promise.all([
        listAgents({ limit: 100 }),
        listAgentPools({ limit: 100 }),
        getAgentMetrics(),
      ]);

      if (isMounted) {
        setAgents(agentsRes.agents || []);
        setPools(poolsRes.pools || []);
        setMetrics(metricsRes);
      }
    } catch (err) {
      if (isMounted) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  }, [isMounted]);

  // Real-time settings (uses fetchData)
  useRealTime({
    onRefresh: fetchData,
    enabled: true,
  });

  // Mount effect
  useEffect(() => {
    setIsMounted(true);
    fetchData();
  }, []);

  // Handlers
  const handleDrainPool = async (poolId: string) => {
    try {
      await drainPool(poolId);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to drain pool'));
    }
  };

  const handleScalePool = (poolId: string) => {
    setScalingPoolId(poolId);
    setScalingDialogOpen(true);
  };

  const handleScaleConfirm = async () => {
    try {
      await scalePool(scalingPoolId, parseInt(desiredCount, 10));
      await fetchData();
      setScalingDialogOpen(false);
      setDesiredCount('');
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to scale pool'));
    }
  };

  const handlePauseAgent = async (agentId: string) => {
    try {
      await pauseAgent(agentId);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to pause agent'));
    }
  };

  const handleResumeAgent = async (agentId: string) => {
    try {
      await resumeAgent(agentId);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to resume agent'));
    }
  };

  // Filter agents by pool
  const agentsByPool = useMemo(() => {
    const grouped: Record<string, Agent[]> = {};
    agents.forEach((agent) => {
      if (!grouped[agent.pool_id]) {
        grouped[agent.pool_id] = [];
      }
      grouped[agent.pool_id].push(agent);
    });
    return grouped;
  }, [agents]);

  if (!isMounted) {
    return (
      <Container sx={{ py: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            Agent Management
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Monitor and manage your CI/CD agent pools
          </Typography>
        </Box>
        <Tooltip title="Refresh agents">
          <IconButton onClick={fetchData} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Metrics Summary */}
      {metrics && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ mb: 4, overflowX: 'auto' }}
        >
          <Card sx={{ flex: 1, minWidth: '200px' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Agents
              </Typography>
              <Typography variant="h5">{metrics.total_agents}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, minWidth: '200px' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Idle Agents
              </Typography>
              <Typography variant="h5" sx={{ color: '#4caf50' }}>
                {metrics.idle_agents}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, minWidth: '200px' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Running
              </Typography>
              <Typography variant="h5" sx={{ color: '#2196f3' }}>
                {metrics.running_agents}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, minWidth: '200px' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Offline/Error
              </Typography>
              <Typography variant="h5" sx={{ color: '#f44336' }}>
                {metrics.offline_agents + metrics.error_agents}
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      )}

      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={fetchData}>
              Retry
            </Button>
          }
        >
          {error.message || String(error)}
        </Alert>
      )}

      {/* Loading State */}
      {loading && <CircularProgress sx={{ display: 'block', mx: 'auto', mb: 3 }} />}

      {/* Agent Pools */}
      {pools.length > 0 && (
        <Box sx={{ mb: 6 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Agent Pools
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'column', md: 'row' }}
            spacing={2}
            sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}
          >
            {pools.map((pool) => (
              <Box key={pool.id}>
                <AgentPoolCard
                  pool={pool}
                  metrics={metrics}
                  onDrain={() => handleDrainPool(pool.id)}
                  onScale={() => handleScalePool(pool.id)}
                />
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {/* Agents by Pool */}
      {Object.entries(agentsByPool).length > 0 ? (
        Object.entries(agentsByPool).map(([poolId, poolAgents]) => {
          const pool = pools.find((p) => p.id === poolId);
          const poolName = pool?.name || `Pool ${poolId.substring(0, 8)}`;

          return (
            <Box key={poolId} sx={{ mb: 6 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                {poolName} ({poolAgents.length} agents)
              </Typography>
              <Stack
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: '1fr 1fr',
                    md: '1fr 1fr 1fr',
                    lg: '1fr 1fr 1fr 1fr',
                  },
                  gap: 2,
                }}
              >
                {poolAgents.map((agent) => (
                  <Box key={agent.id}>
                    <AgentCard
                      agent={agent}
                      onPause={() => handlePauseAgent(agent.id)}
                      onResume={() => handleResumeAgent(agent.id)}
                    />
                  </Box>
                ))}
              </Stack>
            </Box>
          );
        })
      ) : (
        !loading && (
          <Alert severity="info">
            No agents available. Create an agent pool and register agents to get started.
          </Alert>
        )
      )}

      {/* Scale Pool Dialog */}
      <Dialog open={scalingDialogOpen} onClose={() => setScalingDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Scale Agent Pool</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Desired Agent Count"
            type="number"
            value={desiredCount}
            onChange={(e) => setDesiredCount(e.target.value)}
            fullWidth
            inputProps={{ min: '1', max: '1000' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScalingDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleScaleConfirm}
            variant="contained"
            disabled={!desiredCount || parseInt(desiredCount, 10) < 1}
          >
            Scale
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
