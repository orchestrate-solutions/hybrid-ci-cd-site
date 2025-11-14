import { Card, CardContent, Box, Typography, Skeleton, CircularProgress } from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { ReactNode } from 'react';

interface QueueStatusCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  color?: 'success' | 'warning' | 'error' | 'info';
  loading?: boolean;
  error?: string;
  trend?: number;
  unit?: string;
}

export function QueueStatusCard({
  title,
  value,
  icon,
  color = 'info',
  loading = false,
  error,
  trend,
  unit,
}: QueueStatusCardProps) {
  const colorMap = {
    success: { light: '#e8f5e9', main: '#4caf50' },
    warning: { light: '#fff3e0', main: '#ff9800' },
    error: { light: '#ffebee', main: '#f44336' },
    info: { light: '#e3f2fd', main: '#2196f3' },
  };

  const colorScheme = colorMap[color];

  if (error) {
    return (
      <Card sx={{ background: colorScheme.light }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} flexDirection="column">
            <Box sx={{ color: colorScheme.main }}>{icon}</Box>
            <Box textAlign="center">
              <Typography color="textSecondary" variant="body2">
                {title}
              </Typography>
              <Typography variant="body2" sx={{ color: colorScheme.main, mt: 1 }}>
                {error}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ background: colorScheme.light }}>
      <CardContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={100}>
            <CircularProgress />
          </Box>
        ) : (
          <Box display="flex" alignItems="center" gap={2}>
            <Box sx={{ color: colorScheme.main, display: 'flex' }}>{icon}</Box>
            <Box flex={1}>
              <Typography color="textSecondary" variant="body2" sx={{ mb: 0.5 }}>
                {title}
              </Typography>
              <Box display="flex" alignItems="baseline" gap={1}>
                <Typography variant="h4" sx={{ color: colorScheme.main }}>
                  {value}
                </Typography>
                {unit && (
                  <Typography color="textSecondary" variant="body2">
                    {unit}
                  </Typography>
                )}
              </Box>
              {trend !== undefined && (
                <Box display="flex" alignItems="center" gap={0.5} mt={1}>
                  {trend > 0 ? (
                    <>
                      <ArrowUpward sx={{ fontSize: 16, color: '#f44336' }} />
                      <Typography variant="caption" sx={{ color: '#f44336' }}>
                        +{trend}
                      </Typography>
                    </>
                  ) : trend < 0 ? (
                    <>
                      <ArrowDownward sx={{ fontSize: 16, color: '#4caf50' }} />
                      <Typography variant="caption" sx={{ color: '#4caf50' }}>
                        {trend}
                      </Typography>
                    </>
                  ) : null}
                </Box>
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
