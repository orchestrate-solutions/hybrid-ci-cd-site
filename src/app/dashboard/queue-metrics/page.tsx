'use client';

import {
  Box,
  Container,
  Typography,
  Button,
  Select,
  MenuItem,
  Skeleton,
  Paper,
  Grid,
} from '@mui/material';
import { Refresh as RefreshIcon, Download as DownloadIcon } from '@mui/icons-material';
import QueueDepthCard from '@/components/dashboard/queue/QueueDepthCard/QueueDepthCard';
import MessageAgeChart from '@/components/dashboard/queue/MessageAgeChart/MessageAgeChart';
import ThroughputChart from '@/components/dashboard/queue/ThroughputChart/ThroughputChart';
import DLQMonitor from '@/components/dashboard/queue/DLQMonitor/DLQMonitor';
import useQueueMetrics from '@/lib/hooks/useQueueMetrics';
import { queueApi } from '@/lib/api/queue';
import { useState, useEffect, useCallback } from 'react';

export default function QueueMetricsPage() {
  const { metrics, dlqStats, loading, error, refetch, getDepthPercentages } = useQueueMetrics();
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [metricsHistory, setMetricsHistory] = useState<any[]>([]);
  const [ageDistribution, setAgeDistribution] = useState<any>(null);
  const [throughputHistory, setThroughputHistory] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<any[]>([]);

  useEffect(() => {
    const fetchHistories = async () => {
      try {
        const [history, dist, throughput, warns] = await Promise.all([
          queueApi.getMetricsHistory(timeRange),
          queueApi.getMessageAgeDistribution(),
          queueApi.getThroughputHistory(timeRange),
          queueApi.getQueueWarnings(),
        ]);
        setMetricsHistory(history);
        setAgeDistribution(dist);
        setThroughputHistory(throughput);
        setWarnings(warns);
      } catch (err) {
        console.error('Failed to fetch metrics histories', err);
      }
    };

    fetchHistories();
  }, [timeRange]);

  const handleExport = useCallback(() => {
    if (!metrics) return;

    const csv = [
      ['Metric', 'Value'],
      ['Total Depth', metrics.total_depth],
      ['Critical', metrics.critical_depth],
      ['High', metrics.high_depth],
      ['Normal', metrics.normal_depth],
      ['Low', metrics.low_depth],
      ['Average Age (ms)', metrics.avg_age_ms],
      ['Throughput (msgs/sec)', metrics.throughput_rps],
      ['Error Rate', metrics.error_rate],
      ['', ''],
      ['DLQ Stats', ''],
      ['Total DLQ Messages', dlqStats?.total_messages],
      ['Failed Retries', dlqStats?.failed_retries],
      ['Max Retries Exceeded', dlqStats?.max_retries_exceeded],
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `queue-metrics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }, [metrics, dlqStats]);

  const hasWarnings = warnings.length > 0;
  const criticalWarnings = warnings.filter((w) => w.severity === 'critical');

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Queue Metrics
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Monitor queue performance, depth, and dead letter queue activity
        </Typography>
      </Box>

      {/* Warnings */}
      {hasWarnings && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {criticalWarnings.map((warning) => (
            <Grid item xs={12} key={warning.type}>
              <Paper sx={{ p: 2, backgroundColor: 'error.light', color: 'error.main' }}>
                <Typography variant="body2">
                  <strong>⚠️ Alert:</strong> {warning.message}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

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
                Total Depth
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {metrics?.total_depth || 0}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'error.light' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Critical
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'error.main' }}>
                {metrics?.critical_depth || 0}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'warning.light' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                High
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'warning.main' }}>
                {metrics?.high_depth || 0}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Avg Age
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {metrics ? `${(metrics.avg_age_ms / 1000).toFixed(1)}s` : '0s'}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Throughput
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {metrics?.throughput_rps.toFixed(1) || 0}/s
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Error Rate
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, color: metrics?.error_rate > 0.05 ? 'error.main' : 'inherit' }}>
                {(metrics?.error_rate * 100).toFixed(2) || 0}%
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value as any)} size="small">
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

      {/* Queue Depth */}
      {loading ? (
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="rectangular" height={300} />
        </Box>
      ) : (
        <Box sx={{ mb: 4 }}>
          <QueueDepthCard data={metrics ? {
            CRITICAL: metrics.critical_depth,
            HIGH: metrics.high_depth,
            NORMAL: metrics.normal_depth,
            LOW: metrics.low_depth,
            total: metrics.total_depth,
          } : null} loading={loading} error={error} />
        </Box>
      )}

      {/* Message Age Chart */}
      {loading ? (
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="rectangular" height={300} />
        </Box>
      ) : (
        <Box sx={{ mb: 4 }}>
          <MessageAgeChart data={metricsHistory} distribution={ageDistribution} loading={loading} error={error} />
        </Box>
      )}

      {/* Throughput Chart */}
      {loading ? (
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="rectangular" height={300} />
        </Box>
      ) : (
        <Box sx={{ mb: 4 }}>
          <ThroughputChart
            data={throughputHistory}
            loading={loading}
            error={error}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />
        </Box>
      )}

      {/* DLQ Monitor */}
      {loading ? (
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="rectangular" height={400} />
        </Box>
      ) : (
        <Box sx={{ mb: 4 }}>
          <DLQMonitor stats={dlqStats} loading={loading} error={error} onRetry={() => refetch()} />
        </Box>
      )}
    </Container>
  );
}
