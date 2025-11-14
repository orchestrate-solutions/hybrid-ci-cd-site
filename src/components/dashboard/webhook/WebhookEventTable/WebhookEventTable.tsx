import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  MenuItem,
  Box,
  Chip,
  TablePagination,
  CircularProgress,
  Typography,
} from '@mui/material';
import { WebhookEvent } from '../../api/webhooks';

interface WebhookEventTableProps {
  events: WebhookEvent[];
  onSelectEvent: (event: WebhookEvent) => void;
  loading?: boolean;
  itemsPerPage?: number;
}

export default function WebhookEventTable({
  events,
  onSelectEvent,
  loading = false,
  itemsPerPage = 20,
}: WebhookEventTableProps) {
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'timestamp' | 'provider'>('timestamp');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    let result = events;

    if (statusFilter !== 'all') {
      result = result.filter((e) => e.delivery_status === statusFilter);
    }
    if (providerFilter !== 'all') {
      result = result.filter((e) => e.provider === providerFilter);
    }
    if (searchQuery) {
      result = result.filter(
        (e) =>
          e.id.includes(searchQuery) ||
          e.event_type.includes(searchQuery) ||
          e.provider.includes(searchQuery)
      );
    }

    return result.sort((a, b) => {
      if (sortBy === 'timestamp') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      return a.provider.localeCompare(b.provider);
    });
  }, [events, statusFilter, providerFilter, sortBy, searchQuery]);

  const paginatedEvents = filtered.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress /> <Typography ml={2}>Loading events...</Typography>
      </Box>
    );
  }

  if (events.length === 0) {
    return (
      <Box p={4} textAlign="center">
        <Typography>No webhook events found</Typography>
      </Box>
    );
  }

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'delivered', label: 'Success' },
    { value: 'failed', label: 'Failed' },
    { value: 'retrying', label: 'Retrying' },
  ];

  const providerOptions = [
    { value: 'all', label: 'All Providers' },
    { value: 'github', label: 'GitHub' },
    { value: 'gitlab', label: 'GitLab' },
    { value: 'jenkins', label: 'Jenkins' },
  ];

  return (
    <Box>
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }} gap={2} mb={3}>
        <TextField
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(0);
          }}
          size="small"
        />
        <TextField
          select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          size="small"
        >
          {statusOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          value={providerFilter}
          onChange={(e) => {
            setProviderFilter(e.target.value);
            setPage(0);
          }}
          size="small"
        >
          {providerOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell onClick={() => setSortBy('timestamp')} sx={{ cursor: 'pointer' }}>
                Timestamp {sortBy === 'timestamp' && '↓'}
              </TableCell>
              <TableCell onClick={() => setSortBy('provider')} sx={{ cursor: 'pointer' }}>
                Provider {sortBy === 'provider' && '↓'}
              </TableCell>
              <TableCell>Event Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Retries</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedEvents.map((event) => (
              <TableRow
                key={event.id}
                onClick={() => onSelectEvent(event)}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: event.delivery_status === 'failed' ? '#ffebee' : 'inherit',
                  '&:hover': { backgroundColor: '#f9f9f9' },
                }}
                className={event.delivery_status === 'failed' ? 'error-row' : ''}
              >
                <TableCell>
                  {new Date(event.timestamp).toLocaleString()}
                </TableCell>
                <TableCell>{event.provider}</TableCell>
                <TableCell>{event.event_type}</TableCell>
                <TableCell>
                  <Chip
                    label={event.delivery_status}
                    color={event.delivery_status === 'delivered' ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">{event.retry_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[10, 20, 50]}
        component="div"
        count={filtered.length}
        rowsPerPage={itemsPerPage}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => setPage(0)}
      />

      <Box mt={2} textAlign="right">
        <Typography variant="caption">
          Page {page + 1} of {Math.ceil(filtered.length / itemsPerPage)}
        </Typography>
      </Box>
    </Box>
  );
}
