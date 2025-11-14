'use client';

import { Box, Card, CardContent, Typography, CircularProgress, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import type { DLQStats } from '@/lib/api/queue';

interface DLQMonitorProps {
  stats: DLQStats | null;
  loading?: boolean;
  error?: Error | null;
  onRetry?: (messageId?: string) => void;
}

export default function DLQMonitor({ stats, loading = false, error = null, onRetry }: DLQMonitorProps) {
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

  if (!stats) {
    return (
      <Card>
        <CardContent sx={{ minHeight: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Typography color="textSecondary">No DLQ data available</Typography>
        </CardContent>
      </Card>
    );
  }

  const severity =
    stats.total_messages > 1000
      ? 'severity-critical'
      : stats.total_messages > 500
        ? 'severity-warning'
        : 'severity-normal';

  const formatAge = (ms: number) => {
    const days = Math.floor(ms / 86400000);
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    const hours = Math.floor(ms / 3600000);
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${Math.floor(ms / 60000)} min`;
  };

  const pieData = stats.error_types.map((et) => ({
    name: et.type,
    value: et.count,
  }));

  const COLORS = ['#F44336', '#FF9800', '#2196F3', '#4CAF50', '#9C27B0'];

  return (
    <Card className={severity}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Dead Letter Queue Monitor
          </Typography>
          <Button
            variant="contained"
            color="warning"
            size="small"
            onClick={() => onRetry?.()}
            aria-label="retry dlq messages"
          >
            Retry Failed
          </Button>
        </Box>

        {/* Summary Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Total Messages
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main' }}>
              {stats.total_messages}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Failed Retries
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'warning.main' }}>
              {stats.failed_retries}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Max Retries Exceeded
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {stats.max_retries_exceeded}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Oldest Message
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {formatAge(stats.oldest_message_age_ms)}
            </Typography>
          </Box>
        </Box>

        {/* Error Type Breakdown */}
        {stats.error_types.length > 0 ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            {/* Pie Chart */}
            <Box>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} msgs`} />
                </PieChart>
              </ResponsiveContainer>
            </Box>

            {/* Error Type Table */}
            <TableContainer sx={{ maxHeight: 250, overflowY: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell>Error Type</TableCell>
                    <TableCell align="right">Count</TableCell>
                    <TableCell align="right">%</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.error_types.map((et, idx) => (
                    <TableRow key={et.type}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: COLORS[idx % COLORS.length],
                            }}
                          />
                          {et.type}
                        </Box>
                      </TableCell>
                      <TableCell align="right">{et.count}</TableCell>
                      <TableCell align="right">
                        {((et.count / stats.total_messages) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <Typography color="textSecondary">✓ No dead letter queue messages</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
