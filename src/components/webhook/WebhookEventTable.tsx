import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Box,
  Stack,
  TextField,
  MenuItem,
  Typography,
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { WebhookStatusBadge } from './WebhookStatusBadge';
import { WebhookEvent } from '../../lib/api/webhook';

interface WebhookEventTableProps {
  events: WebhookEvent[];
  loading?: boolean;
}

type EventStatus = 'SUCCESS' | 'FAILED' | 'PENDING';

export function WebhookEventTable({ events, loading = false }: WebhookEventTableProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesStatus =
        statusFilter === 'all' || event.status === statusFilter;
      const matchesSearch =
        event.event_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.source.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [events, statusFilter, searchQuery]);

  // Paginate
  const paginatedEvents = useMemo(() => {
    return filteredEvents.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [filteredEvents, page, rowsPerPage]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      {/* Filters */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Search"
          placeholder="Event type or source..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(0);
          }}
          size="small"
          sx={{ flex: 1 }}
          disabled={loading}
        />
        <TextField
          select
          label="Status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as any);
            setPage(0);
          }}
          size="small"
          sx={{ minWidth: 120 }}
          disabled={loading}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="SUCCESS">Success</MenuItem>
          <MenuItem value="FAILED">Failed</MenuItem>
          <MenuItem value="PENDING">Pending</MenuItem>
        </TextField>
      </Stack>

      {/* Table */}
      <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell>Event Type</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Latency (ms)</TableCell>
              <TableCell align="right">Delivered</TableCell>
              <TableCell>Error</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography color="textSecondary">
                    {events.length === 0
                      ? 'No webhook events yet'
                      : 'No events match your filters'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedEvents.map(event => (
                <TableRow key={event.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {event.event_type}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {event.source}
                  </TableCell>
                  <TableCell>
                    <WebhookStatusBadge status={event.status} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    {event.latency_ms ? `${event.latency_ms}ms` : '—'}
                  </TableCell>
                  <TableCell align="right">
                    {event.delivered_at
                      ? formatDistanceToNow(new Date(event.delivered_at), {
                          addSuffix: true,
                        })
                      : '—'}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {event.error_message ? (
                      <Typography variant="caption" color="error" title={event.error_message}>
                        {event.error_message}
                      </Typography>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {filteredEvents.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredEvents.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          disabled={loading}
        />
      )}
    </Box>
  );
}
