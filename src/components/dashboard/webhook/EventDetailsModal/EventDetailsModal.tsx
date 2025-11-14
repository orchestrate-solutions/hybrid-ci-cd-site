import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  CheckCircle,
  ErrorOutline,
  Schedule,
  Close as CloseIcon,
} from '@mui/icons-material';
import { EventDetails } from '../../api/webhooks';

interface EventDetailsModalProps {
  open: boolean;
  event: EventDetails | null;
  onClose: () => void;
  onRetry: (eventId: string) => void;
  isRetrying?: boolean;
}

export default function EventDetailsModal({
  open,
  event,
  onClose,
  onRetry,
  isRetrying = false,
}: EventDetailsModalProps) {
  if (!event) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Event Details
        <Button
          size="small"
          onClick={onClose}
          aria-label="Close"
          sx={{ minWidth: 'auto' }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2 }}>
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Provider
                </Typography>
                <Typography variant="h6">{event.provider}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Event Type
                </Typography>
                <Typography variant="h6">{event.event_type}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Status
                </Typography>
                <Chip
                  label={event.delivery_status}
                  color={event.delivery_status === 'delivered' ? 'success' : 'error'}
                  size="small"
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Timestamp
                </Typography>
                <Typography variant="body2">
                  {new Date(event.timestamp).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Payload Hash
                </Typography>
                <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                  {event.payload_hash}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Signature
                </Typography>
                <Chip
                  label={event.signature_verified ? 'Signature Verified' : 'Not Verified'}
                  color={event.signature_verified ? 'success' : 'warning'}
                  size="small"
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {event.retry_history && event.retry_history.length > 0 && (
          <Box>
            <Typography variant="h6" mb={2}>
              Retry History
            </Typography>
            <Timeline>
              {event.retry_history.map((retry, idx) => (
                <TimelineItem key={retry.retry_id}>
                  <TimelineSeparator>
                    <TimelineDot
                      color={retry.status === 'success' ? 'success' : 'error'}
                    >
                      {retry.status === 'success' ? (
                        <CheckCircle />
                      ) : (
                        <ErrorOutline />
                      )}
                    </TimelineDot>
                    {idx < event.retry_history.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="body2">
                      Attempt {idx + 1}: {retry.status}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {new Date(retry.timestamp).toLocaleString()}
                    </Typography>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </Box>
        )}

        {!event.retry_history || event.retry_history.length === 0 && (
          <Box p={2} textAlign="center">
            <Typography color="textSecondary">No retry history</Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {event.delivery_status === 'failed' && (
          <Button
            onClick={() => onRetry(event.id)}
            variant="contained"
            color="primary"
            disabled={isRetrying}
          >
            {isRetrying ? 'Retrying...' : 'Retry Delivery'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
