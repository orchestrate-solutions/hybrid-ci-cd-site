'use client';

import { Box, Card, CardContent, Typography, CircularProgress, Select, MenuItem } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
import type { ThroughputPoint } from '@/lib/api/queue';

interface ThroughputChartProps {
  data: ThroughputPoint[];
  loading?: boolean;
  error?: Error | null;
  timeRange?: '24h' | '7d' | '30d';
  onTimeRangeChange?: (range: '24h' | '7d' | '30d') => void;
}

export default function ThroughputChart({
  data,
  loading = false,
  error = null,
  timeRange = '24h',
  onTimeRangeChange,
}: ThroughputChartProps) {
  const [selectedRange, setSelectedRange] = useState<'24h' | '7d' | '30d'>(timeRange);

  const handleRangeChange = (newRange: '24h' | '7d' | '30d') => {
    setSelectedRange(newRange);
    onTimeRangeChange?.(newRange);
  };

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
        <CardContent sx={{ minHeight: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Typography color="error">{error.message}</Typography>
        </CardContent>
      </Card>
    );
  }

  // Calculate statistics
  const stats = data.length
    ? {
        min: Math.min(...data.map((d) => d.throughput_rps)),
        max: Math.max(...data.map((d) => d.throughput_rps)),
        avg: Math.round((data.reduce((a, b) => a + b.throughput_rps, 0) / data.length) * 100) / 100,
      }
    : { min: 0, max: 0, avg: 0 };

  const getTrend = () => {
    if (data.length < 2) return '→';
    const lastValue = data[data.length - 1].throughput_rps;
    const firstValue = data[0].throughput_rps;
    if (lastValue > firstValue * 1.1) return '↑';
    if (lastValue < firstValue * 0.9) return '↓';
    return '→';
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Throughput (msgs/sec)
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Select value={selectedRange} onChange={(e) => handleRangeChange(e.target.value as any)} size="small">
              <MenuItem value="24h">24 Hours</MenuItem>
              <MenuItem value="7d">7 Days</MenuItem>
              <MenuItem value="30d">30 Days</MenuItem>
            </Select>
          </Box>
        </Box>

        {/* Statistics */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Min
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {stats.min.toFixed(1)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Max
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {stats.max.toFixed(1)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Avg
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {stats.avg.toFixed(1)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Trend
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {getTrend()}
            </Typography>
          </Box>
        </Box>

        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return selectedRange === '24h' ? date.toLocaleTimeString('en-US', { hour: '2-digit' }) : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />
              <YAxis tick={{ fontSize: 12 }} label={{ value: 'msgs/sec', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                formatter={(value: any) => `${value.toFixed(1)} msgs/sec`}
                labelFormatter={(label) => new Date(label).toLocaleString()}
              />
              <Legend />
              <Line type="monotone" dataKey="throughput_rps" stroke="#2196F3" strokeWidth={2} dot={false} name="Throughput" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <Typography color="textSecondary">No data available</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
