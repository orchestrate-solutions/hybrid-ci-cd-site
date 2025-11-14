'use client';

import { useState, useMemo } from 'react';
import { Box, Grid, Typography, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress } from '@mui/material';
import { Timeline, Speed, CheckCircle, WarningAmber } from '@mui/icons-material';
import { useQueues } from '@/lib/hooks/useQueues';
import { QueueStatusCard } from '@/components/dashboard/QueueStatusCard';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function QueuesPage() {
  const [tabValue, setTabValue] = useState(0);
  const { metrics, stats, dlqMessages, computedStats, loading, error, refetch } = useQueues();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (error && !metrics) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" mb={3}>
          Queue Status
        </Typography>
        <Paper sx={{ p: 2, textAlign: 'center', color: 'error.main' }}>
          <WarningAmber sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="body1">Failed to load queue data</Typography>
          <Typography variant="caption" display="block" mt={1}>
            {error.message}
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" mb={3}>
        Queue Status
      </Typography>

      {/* Metrics Grid */}
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <QueueStatusCard
            title="Queued"
            value={computedStats.totalQueued || 0}
            icon={<Timeline />}
            color="warning"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QueueStatusCard
            title="Running"
            value={computedStats.totalActive || 0}
            icon={<Speed />}
            color="info"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QueueStatusCard
            title="Completed"
            value={computedStats.totalCompleted || 0}
            icon={<CheckCircle />}
            color="success"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QueueStatusCard
            title="Dead Letter"
            value={computedStats.dlqCount || 0}
            icon={<WarningAmber />}
            color={computedStats.dlqCount > 0 ? 'error' : 'success'}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Tabbed Content */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="queue tabs">
          <Tab label="Priority Breakdown" id="tab-0" aria-controls="tabpanel-0" />
          <Tab label="Dead Letter Queue" id="tab-1" aria-controls="tabpanel-1" />
        </Tabs>

        {/* Priority Stats Tab */}
        <TabPanel value={tabValue} index={0}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : stats.length === 0 ? (
            <Typography color="textSecondary" sx={{ p: 2 }}>
              No queue data available
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>Priority</TableCell>
                    <TableCell align="right">Count</TableCell>
                    <TableCell align="right">Oldest Age (ms)</TableCell>
                    <TableCell align="right">Percentage</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.map((stat) => (
                    <TableRow key={stat.priority}>
                      <TableCell>{stat.priority}</TableCell>
                      <TableCell align="right">{stat.count}</TableCell>
                      <TableCell align="right">{stat.oldest_age_ms.toLocaleString()}</TableCell>
                      <TableCell align="right">
                        {computedStats.totalQueued > 0
                          ? ((stat.count / computedStats.totalQueued) * 100).toFixed(1)
                          : 0}
                        %
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* Dead Letter Queue Tab */}
        <TabPanel value={tabValue} index={1}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : dlqMessages.length === 0 ? (
            <Typography color="textSecondary" sx={{ p: 2 }}>
              Dead Letter Queue is empty
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>Message ID</TableCell>
                    <TableCell>Original Job ID</TableCell>
                    <TableCell>Error</TableCell>
                    <TableCell align="right">Retries</TableCell>
                    <TableCell>Failed At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dlqMessages.map((msg) => (
                    <TableRow key={msg.id}>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {msg.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {msg.original_job_id.substring(0, 8)}...
                      </TableCell>
                      <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {msg.error}
                      </TableCell>
                      <TableCell align="right">{msg.retry_count}</TableCell>
                      <TableCell>{new Date(msg.failed_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
}
