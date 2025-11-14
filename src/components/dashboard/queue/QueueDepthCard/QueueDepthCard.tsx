'use client';

import { Box, Card, CardContent, Typography, CircularProgress, Chip } from '@mui/material';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

interface QueueDepthCardProps {
  data: { CRITICAL: number; HIGH: number; NORMAL: number; LOW: number; total: number } | null;
  loading?: boolean;
  error?: Error | null;
}

const COLORS = {
  CRITICAL: '#F44336',
  HIGH: '#FF9800',
  NORMAL: '#2196F3',
  LOW: '#4CAF50',
};

export default function QueueDepthCard({ data, loading = false, error = null }: QueueDepthCardProps) {
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

  if (!data) {
    return (
      <Card>
        <CardContent sx={{ minHeight: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Typography color="textSecondary">No data available</Typography>
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    { name: 'CRITICAL', value: data.CRITICAL },
    { name: 'HIGH', value: data.HIGH },
    { name: 'NORMAL', value: data.NORMAL },
    { name: 'LOW', value: data.LOW },
  ].filter(item => item.value > 0);

  const hasWarning = data.CRITICAL > data.total * 0.1; // >10% critical

  return (
    <Card className={hasWarning ? 'warning' : ''}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Queue Depth by Priority
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: hasWarning ? 'error.main' : 'inherit' }}>
            {data.total}
          </Typography>
        </Box>

        {hasWarning && (
          <Box sx={{ mb: 2 }}>
            <Chip label="⚠️ High critical queue depth" color="error" variant="filled" size="small" />
          </Box>
        )}

        {/* Priority breakdown */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, mb: 3 }}>
          {['CRITICAL', 'HIGH', 'NORMAL', 'LOW'].map((priority) => (
            <Box key={priority} sx={{ textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {priority}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: COLORS[priority as keyof typeof COLORS] }}>
                {data[priority as keyof typeof data]}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {((data[priority as keyof typeof data] / data.total) * 100).toFixed(1)}%
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Pie chart */}
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              dataKey="value"
              label
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value} msgs`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
