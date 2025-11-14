'use client';

import { Box, Card, CardContent, Typography, ToggleButtonGroup, ToggleButton, CircularProgress, Button } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download as DownloadIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import type { RelayMetricsHistory } from '@/lib/api/relays';
import { useState } from 'react';

interface RelayMetricsChartProps {
  relayId: string;
  metrics: RelayMetricsHistory[];
  metricType: 'response_time' | 'error_rate' | 'throughput';
  timeRange?: '24h' | '7d' | '30d';
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
}

/**
 * Chart component for displaying relay metrics over time
 */
export default function RelayMetricsChart({
  relayId,
  metrics,
  metricType,
  timeRange = '24h',
  loading = false,
  error = null,
  onRefresh,
}: RelayMetricsChartProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d'>(timeRange);

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent sx={{ minHeight: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography color="error" align="center" sx={{ mb: 2 }}>
            {error.message}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (metrics.length === 0) {
    return (
      <Card>
        <CardContent sx={{ minHeight: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Typography color="textSecondary">No data available</Typography>
        </CardContent>
      </Card>
    );
  }

  // Calculate statistics
  const getMetricValue = (metric: RelayMetricsHistory): number => {
    switch (metricType) {
      case 'response_time':
        return metric.response_time_ms;
      case 'error_rate':
        return (metric.error_count / (metric.error_count + metric.message_count)) * 100;
      case 'throughput':
        return metric.message_count;
      default:
        return 0;
    }
  };

  const values = metrics.map(getMetricValue);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;

  // Format data for chart
  const chartData = metrics.map((metric) => ({
    time: new Date(metric.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: getMetricValue(metric),
  }));

  const getChartTitle = (): string => {
    switch (metricType) {
      case 'response_time':
        return 'Response Time (ms)';
      case 'error_rate':
        return 'Error Rate (%)';
      case 'throughput':
        return 'Throughput (msgs/sec)';
      default:
        return 'Metrics';
    }
  };

  const getChartColor = (): string => {
    switch (metricType) {
      case 'response_time':
        return '#2196F3';
      case 'error_rate':
        return '#F44336';
      case 'throughput':
        return '#4CAF50';
      default:
        return '#999';
    }
  };

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Value'],
      ...chartData.map((d) => [d.time, d.value]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relay-${relayId}-${metricType}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {getChartTitle()}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={onRefresh}
              disabled={!onRefresh}
            >
              Refresh
            </Button>
            <Button
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
            >
              Export
            </Button>
          </Box>
        </Box>

        {/* Statistics */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Min
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {min.toFixed(2)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Avg
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {avg.toFixed(2)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Max
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {max.toFixed(2)}
            </Typography>
          </Box>
        </Box>

        {/* Time Range Selector */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <ToggleButtonGroup
            value={selectedTimeRange}
            exclusive
            onChange={(_, newRange) => {
              if (newRange) setSelectedTimeRange(newRange);
            }}
            size="small"
          >
            <ToggleButton value="24h">24h</ToggleButton>
            <ToggleButton value="7d">7d</ToggleButton>
            <ToggleButton value="30d">30d</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke={getChartColor()}
              dot={false}
              isAnimationActive={true}
              name={getChartTitle()}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
