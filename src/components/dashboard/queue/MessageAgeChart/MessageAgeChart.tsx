'use client';

import { Box, Card, CardContent, Typography, CircularProgress } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { MessageAgeDistribution } from '@/lib/api/queue';

interface MessageAgePoint {
  timestamp: string;
  p50: number;
  p95: number;
  p99: number;
}

interface MessageAgeChartProps {
  data: MessageAgePoint[];
  distribution: MessageAgeDistribution | null;
  loading?: boolean;
  error?: Error | null;
}

export default function MessageAgeChart({
  data,
  distribution,
  loading = false,
  error = null,
}: MessageAgeChartProps) {
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

  const getSeverity = (p99: number | undefined) => {
    if (!p99) return 'info';
    if (p99 > 10000) return 'critical';
    if (p99 > 5000) return 'warning';
    return 'success';
  };

  const severity = getSeverity(distribution?.p99);

  const formatMs = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Message Age Distribution
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {distribution && (
              <>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    p50
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatMs(distribution.p50)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    p95
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatMs(distribution.p95)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    textAlign: 'right',
                    className: severity === 'critical' ? 'severity-badge critical' : 'severity-badge',
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    p99
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color:
                        severity === 'critical'
                          ? 'error.main'
                          : severity === 'warning'
                            ? 'warning.main'
                            : 'success.main',
                    }}
                  >
                    {formatMs(distribution.p99)}
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        </Box>

        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: any) => formatMs(value)}
                labelFormatter={(label) => new Date(label).toLocaleTimeString()}
              />
              <Legend />
              <Line type="monotone" dataKey="p50" stroke="#2196F3" strokeWidth={2} dot={false} name="p50" />
              <Line type="monotone" dataKey="p95" stroke="#FF9800" strokeWidth={2} dot={false} name="p95" />
              <Line type="monotone" dataKey="p99" stroke="#F44336" strokeWidth={2} dot={false} name="p99" />
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
