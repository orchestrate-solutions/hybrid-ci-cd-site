'use client';

import { Card, CardContent, Box, Typography, Chip, LinearProgress } from '@mui/material';
import {
  Cloud as OnlineIcon,
  CloudOff as OfflineIcon,
  Warning as DegradedIcon,
  TrendingUp as ThroughputIcon,
  Timer as LatencyIcon,
  AlertCircle as ErrorIcon,
} from '@mui/icons-material';
import type { RelayHealthMetrics } from '@/lib/api/relays';

interface RelayHealthCardProps {
  relay: RelayHealthMetrics;
  onClick?: (relayId: string) => void;
}

/**
 * Card component displaying relay health status and metrics
 */
export default function RelayHealthCard({ relay, onClick }: RelayHealthCardProps) {
  const getStatusIcon = () => {
    switch (relay.status) {
      case 'online':
        return <OnlineIcon sx={{ color: 'success.main' }} />;
      case 'offline':
        return <OfflineIcon sx={{ color: 'error.main' }} />;
      case 'degraded':
        return <DegradedIcon sx={{ color: 'warning.main' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (): 'success' | 'error' | 'warning' | 'default' => {
    switch (relay.status) {
      case 'online':
        return 'success';
      case 'offline':
        return 'error';
      case 'degraded':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getUptimeColor = (uptime: number) => {
    if (uptime >= 99.9) return 'success';
    if (uptime >= 99) return 'warning';
    return 'error';
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <Card
      onClick={() => onClick?.(relay.relay_id)}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        '&:hover': onClick ? { boxShadow: 4, transform: 'translateY(-2px)' } : {},
      }}
    >
      <CardContent>
        {/* Header: Name and Status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {relay.name}
          </Typography>
          <Box
            role="status"
            className={`status-${relay.status}`}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            {getStatusIcon()}
            <Chip label={relay.status} color={getStatusColor()} size="small" />
          </Box>
        </Box>

        {/* Region and Environment */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Chip label={relay.region} size="small" variant="outlined" />
          <Chip label={relay.environment} size="small" variant="outlined" />
        </Box>

        {/* Uptime Metrics */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Uptime (24h)
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinearProgress
              variant="determinate"
              value={relay.uptime_24h}
              sx={{
                flex: 1,
                height: 8,
                borderRadius: 4,
                backgroundColor: `${getUptimeColor(relay.uptime_24h)}.lighter`,
              }}
            />
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: `${getUptimeColor(relay.uptime_24h)}.main`,
                minWidth: 50,
              }}
            >
              {relay.uptime_24h.toFixed(2)}%
            </Typography>
          </Box>
        </Box>

        {/* Performance Metrics */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
          {/* Response Time */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <LatencyIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Response Time
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {relay.response_time_ms}ms
            </Typography>
          </Box>

          {/* Error Rate */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <ErrorIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Error Rate
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {relay.error_rate.toFixed(2)}%
            </Typography>
          </Box>
        </Box>

        {/* Throughput */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <ThroughputIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Throughput:
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {relay.throughput_msgs_sec.toLocaleString()} msgs/sec
          </Typography>
        </Box>

        {/* Last Heartbeat */}
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Last heartbeat: {formatTime(relay.last_heartbeat)}
        </Typography>
      </CardContent>
    </Card>
  );
}
