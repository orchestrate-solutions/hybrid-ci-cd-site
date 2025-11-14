'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  MenuItem,
  Alert,
  Skeleton,
  Paper,
} from '@mui/material';
import {
  Refresh,
  Download,
  WarningAmber,
} from '@mui/icons-material';
import { useWebhookEvents } from '../../lib/hooks/useWebhookEvents';
import WebhookEventTable from '../../components/dashboard/webhook/WebhookEventTable/WebhookEventTable';
import EventDetailsModal from '../../components/dashboard/webhook/EventDetailsModal/EventDetailsModal';
import PayloadViewer from '../../components/dashboard/webhook/PayloadViewer/PayloadViewer';
import { EventDetails, webhooksApi } from '../../lib/api/webhooks';

export default function WebhookEventsPage() {
  const { events, loading, error, refetch, getCountByStatus, filterByStatus } = useWebhookEvents();
  const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateFilter, setDateFilter] = useState(false);

  const handleSelectEvent = async (event: any) => {
    try {
      const details = await webhooksApi.getEventDetails(event.id);
      setSelectedEvent(details);
      setShowDetails(true);
    } catch (err) {
      console.error('Failed to fetch event details:', err);
    }
  };

  const handleRetry = async (eventId: string) => {
    try {
      setIsRetrying(true);
      await webhooksApi.retryEvent(eventId);
      await refetch();
      setShowDetails(false);
    } catch (err) {
      console.error('Failed to retry event:', err);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Timestamp', 'Provider', 'Event Type', 'Status', 'Delivery Status', 'Retry Count'];
    const rows = events.map((e) => [
      e.id,
      e.timestamp,
      e.provider,
      e.event_type,
      e.status,
      e.delivery_status,
      e.retry_count,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `webhook-events-${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const counts = getCountByStatus();
  const recentFailures = filterByStatus('failed').filter(
    (e) => new Date(e.timestamp).getTime() > Date.now() - 1000 * 60 * 60 // Last hour
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={300} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Webhook Events
          </Typography>
          <Typography color="textSecondary">
            View and debug webhook deliveries
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            startIcon={<Refresh />}
            onClick={refetch}
            variant="outlined"
          >
            Refresh
          </Button>
          <Button
            startIcon={<Download />}
            onClick={handleExportCSV}
            variant="outlined"
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      {recentFailures.length > 0 && (
        <Alert severity="warning" icon={<WarningAmber />} sx={{ mb: 2 }}>
          Recent delivery failures detected ({recentFailures.length} in last hour)
        </Alert>
      )}

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Events
              </Typography>
              <Typography variant="h5">{events.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Successful
              </Typography>
              <Typography variant="h5" sx={{ color: 'success.main' }}>
                {counts.success}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Failed
              </Typography>
              <Typography variant="h5" sx={{ color: 'error.main' }}>
                {counts.failed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg Retries
              </Typography>
              <Typography variant="h5">
                {events.length > 0
                  ? Math.round(
                      events.reduce((sum, e) => sum + e.retry_count, 0) / events.length
                    )
                  : 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={2} mb={2}>
          <TextField
            label="Start Date"
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <TextField
            label="End Date"
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
        </Box>
        <Button variant="contained" onClick={() => setDateFilter(!dateFilter)}>
          {dateFilter ? 'Clear Filters' : 'Apply Filters'}
        </Button>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
          <Button size="small" onClick={refetch} sx={{ ml: 2 }}>
            Retry
          </Button>
        </Alert>
      )}

      {events.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="textSecondary">No webhook events found</Typography>
        </Paper>
      ) : (
        <WebhookEventTable
          events={events}
          onSelectEvent={handleSelectEvent}
          loading={loading}
        />
      )}

      <EventDetailsModal
        open={showDetails}
        event={selectedEvent}
        onClose={() => setShowDetails(false)}
        onRetry={handleRetry}
        isRetrying={isRetrying}
      />
    </Box>
  );
}
