'use client';

import { Box, Container, Typography, Button, TextField, Select, MenuItem, Skeleton, Paper, Grid } from '@mui/material';
import { Refresh as RefreshIcon, Download as DownloadIcon } from '@mui/icons-material';
import RelayHealthCard from '@/components/dashboard/relay/RelayHealthCard/RelayHealthCard';
import RelayMetricsChart from '@/components/dashboard/relay/RelayMetricsChart/RelayMetricsChart';
import RegionHealthMap from '@/components/dashboard/relay/RegionHealthMap/RegionHealthMap';
import useRelayHealth from '@/lib/hooks/useRelayHealth';
import { useState, useCallback } from 'react';

export default function RelayHealthPage() {
  const { data: relays, loading, error, refetch } = useRelayHealth();
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'degraded'>('all');
  const [regionFilter, setRegionFilter] = useState('');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  // Filter relays based on search and status
  const filteredRelays = (relays || []).filter((relay) => {
    const nameMatch = relay.name.toLowerCase().includes(searchFilter.toLowerCase());
    const statusMatch = statusFilter === 'all' || relay.status === statusFilter;
    const regionMatch = !regionFilter || relay.region === regionFilter;
    return nameMatch && statusMatch && regionMatch;
  });

  // Calculate summary statistics
  const stats = {
    total: filteredRelays.length,
    online: filteredRelays.filter((r) => r.status === 'online').length,
    offline: filteredRelays.filter((r) => r.status === 'offline').length,
    degraded: filteredRelays.filter((r) => r.status === 'degraded').length,
    avgUptime: filteredRelays.length
      ? (filteredRelays.reduce((a, b) => a + b.uptime_24h, 0) / filteredRelays.length).toFixed(2)
      : 0,
    avgLatency: filteredRelays.length
      ? Math.round(filteredRelays.reduce((a, b) => a + b.response_time_ms, 0) / filteredRelays.length)
      : 0,
  };

  // Get unique regions for filter
  const regions = Array.from(new Set((relays || []).map((r) => r.region)));

  // Export to CSV
  const handleExport = useCallback(() => {
    const csv = [
      ['Name', 'Region', 'Status', 'Uptime 24h', 'Response Time (ms)', 'Error Rate', 'Throughput'],
      ...filteredRelays.map((r) => [
        r.name,
        r.region,
        r.status,
        r.uptime_24h,
        r.response_time_ms,
        r.error_rate_percent,
        r.throughput_rps,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relay-health-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }, [filteredRelays]);

  // Handle region click drill-down
  const handleRegionClick = useCallback((region: string) => {
    setRegionFilter(region);
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Relay Health Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Monitor relay infrastructure across regions and time zones
        </Typography>
      </Box>

      {/* Summary Statistics */}
      {loading ? (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={2} key={i}>
              <Skeleton variant="rectangular" height={100} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Total
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {stats.total}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'success.light' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Online
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'success.main' }}>
                {stats.online}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'warning.light' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Degraded
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'warning.main' }}>
                {stats.degraded}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'error.light' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Offline
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'error.main' }}>
                {stats.offline}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Avg Uptime
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {stats.avgUptime}%
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Avg Latency
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {stats.avgLatency}ms
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search relays by name..."
          size="small"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          sx={{ flex: 1, minWidth: 200 }}
        />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} size="small" sx={{ minWidth: 120 }}>
          <MenuItem value="all">All Status</MenuItem>
          <MenuItem value="online">Online</MenuItem>
          <MenuItem value="degraded">Degraded</MenuItem>
          <MenuItem value="offline">Offline</MenuItem>
        </Select>
        <Select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} size="small" sx={{ minWidth: 120 }}>
          <MenuItem value="">All Regions</MenuItem>
          {regions.map((region) => (
            <MenuItem key={region} value={region}>
              {region}
            </MenuItem>
          ))}
        </Select>
        <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value as any)} size="small" sx={{ minWidth: 100 }}>
          <MenuItem value="24h">24 Hours</MenuItem>
          <MenuItem value="7d">7 Days</MenuItem>
          <MenuItem value="30d">30 Days</MenuItem>
        </Select>
        <Button startIcon={<RefreshIcon />} onClick={() => refetch()} size="small" aria-label="refresh data">
          Refresh
        </Button>
        <Button startIcon={<DownloadIcon />} onClick={handleExport} size="small" aria-label="export to csv">
          Export
        </Button>
      </Box>

      {/* Error State */}
      {error && (
        <Paper sx={{ p: 2, backgroundColor: 'error.light', color: 'error.main', mb: 4 }}>
          <Typography>Failed to load relay health data: {error.message}</Typography>
        </Paper>
      )}

      {/* Geographic Map */}
      {loading ? (
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="rectangular" height={400} />
        </Box>
      ) : (
        <Box sx={{ mb: 4 }}>
          <RegionHealthMap relays={relays || []} filterRegion={regionFilter} filterStatus={statusFilter as any} onRegionClick={handleRegionClick} />
        </Box>
      )}

      {/* Metrics Chart */}
      {loading ? (
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="rectangular" height={300} />
        </Box>
      ) : (
        <Box sx={{ mb: 4 }}>
          <RelayMetricsChart relays={filteredRelays} metricType="response_time" timeRange={timeRange} />
        </Box>
      )}

      {/* Relay Cards Grid */}
      {loading ? (
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
          ))}
        </Grid>
      ) : filteredRelays.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="textSecondary">No relays match your filters</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filteredRelays.map((relay) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={relay.id}>
              <RelayHealthCard relay={relay} onClick={() => {}} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
