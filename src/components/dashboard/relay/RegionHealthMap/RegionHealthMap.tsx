'use client';

import { Box, Card, CardContent, Typography, Chip, CircularProgress, Button, Tooltip, useTheme } from '@mui/material';
import { ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon } from '@mui/icons-material';
import type { RelayHealthMetrics } from '@/lib/api/relays';
import { useState } from 'react';

interface RegionHealthMapProps {
  relays: RelayHealthMetrics[];
  filterRegion?: string;
  filterStatus?: 'online' | 'offline' | 'degraded';
  loading?: boolean;
  error?: Error | null;
  onRegionClick?: (region: string, relay: RelayHealthMetrics) => void;
}

// Simple region coordinates (latitude, longitude)
const REGION_COORDS: Record<string, [number, number]> = {
  'us-east-1': [33.3024, -81.6633],
  'us-west-2': [45.5951, -121.1787],
  'eu-west-1': [53.3498, -6.2603],
  'ap-southeast-1': [1.3521, 103.8198],
  'ap-northeast-1': [35.6762, 139.6503],
  'ca-central-1': [45.4215, -75.6972],
};

/**
 * Geographic map component for displaying relay distribution
 */
export default function RegionHealthMap({
  relays,
  filterRegion,
  filterStatus,
  loading = false,
  error = null,
  onRegionClick,
}: RegionHealthMapProps) {
  const theme = useTheme();
  const [zoomLevel, setZoomLevel] = useState(1);

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent sx={{ minHeight: 400, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography color="error" align="center">
            {error.message}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Filter relays
  let filteredRelays = relays;
  if (filterRegion) {
    filteredRelays = filteredRelays.filter((r) => r.region === filterRegion);
  }
  if (filterStatus) {
    filteredRelays = filteredRelays.filter((r) => r.status === filterStatus);
  }

  if (filteredRelays.length === 0) {
    return (
      <Card>
        <CardContent sx={{ minHeight: 400, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Typography color="textSecondary">No relays to display</Typography>
        </CardContent>
      </Card>
    );
  }

  // Group relays by region
  const regionStats = filteredRelays.reduce(
    (acc, relay) => {
      if (!acc[relay.region]) {
        acc[relay.region] = {
          relays: [],
          online: 0,
          offline: 0,
          degraded: 0,
          avgUptime: 0,
          avgLatency: 0,
        };
      }
      acc[relay.region].relays.push(relay);
      acc[relay.region][relay.status]++;
      acc[relay.region].avgUptime += relay.uptime_24h;
      acc[relay.region].avgLatency += relay.response_time_ms;
      return acc;
    },
    {} as Record<
      string,
      {
        relays: RelayHealthMetrics[];
        online: number;
        offline: number;
        degraded: number;
        avgUptime: number;
        avgLatency: number;
      }
    >
  );

  // Calculate averages
  Object.keys(regionStats).forEach((region) => {
    const count = regionStats[region].relays.length;
    regionStats[region].avgUptime = Math.round((regionStats[region].avgUptime / count) * 100) / 100;
    regionStats[region].avgLatency = Math.round(regionStats[region].avgLatency / count);
  });

  const getStatusColor = (status: string): string => {
    const { palette } = theme;
    switch (status) {
      case 'online':
        return palette.success.main;
      case 'offline':
        return palette.error.main;
      case 'degraded':
        return palette.warning.main;
      default:
        return palette.text.disabled;
    }
  };

  const getMarkerSize = (relayCount: number): number => {
    return Math.max(30, Math.min(80, relayCount * 10)) * zoomLevel;
  };

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Geographic Distribution
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              startIcon={<ZoomInIcon />}
              onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 2))}
              aria-label="zoom in"
            >
              Zoom In
            </Button>
            <Button
              size="small"
              startIcon={<ZoomOutIcon />}
              onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.6))}
              aria-label="zoom out"
            >
              Zoom Out
            </Button>
          </Box>
        </Box>

        {/* Summary Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Total Relays
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {filteredRelays.length}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Regions
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {Object.keys(regionStats).length}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Avg Uptime
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
              {(filteredRelays.reduce((a, b) => a + b.uptime_24h, 0) / filteredRelays.length).toFixed(2)}%
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Avg Latency
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {Math.round(filteredRelays.reduce((a, b) => a + b.response_time_ms, 0) / filteredRelays.length)}ms
            </Typography>
          </Box>
        </Box>

        {/* Regions Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
          {Object.entries(regionStats).map(([region, stats]) => (
            <Tooltip
              key={region}
              title={`${stats.relays.length} relay(s) - ${stats.online} online, ${stats.offline} offline`}
            >
              <Box
                role="button"
                tabIndex={0}
                onClick={() => onRegionClick?.(region, stats.relays[0])}
                className={`status-${stats.relays[0]?.status || 'unknown'}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onRegionClick?.(region, stats.relays[0]);
                  }
                }}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: 2,
                    borderColor: getStatusColor(stats.relays[0]?.status || 'unknown'),
                  },
                }}
              >
                {/* Marker */}
                <Box
                  sx={{
                    width: getMarkerSize(stats.relays.length),
                    height: getMarkerSize(stats.relays.length),
                    borderRadius: '50%',
                    backgroundColor: getStatusColor(stats.relays[0]?.status || 'unknown'),
                    opacity: 0.8,
                    mx: 'auto',
                    mb: 1,
                  }}
                />

                {/* Region Info */}
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  {region}
                </Typography>

                {/* Status Breakdown */}
                <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                  {stats.online > 0 && <Chip label={`${stats.online}✓`} size="small" color="success" variant="filled" />}
                  {stats.degraded > 0 && <Chip label={`${stats.degraded}⚠`} size="small" color="warning" variant="filled" />}
                  {stats.offline > 0 && <Chip label={`${stats.offline}✗`} size="small" color="error" variant="filled" />}
                </Box>

                {/* Metrics */}
                <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                  <div>Uptime: {stats.avgUptime.toFixed(2)}%</div>
                  <div>Latency: {stats.avgLatency}ms</div>
                </Box>
              </Box>
            </Tooltip>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
