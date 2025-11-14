'use client';

/**
 * AlertHistoryTable Component
 * Displays historical alerts with filtering and acknowledgement
 */

import React, { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  Typography,
  TablePagination,
  TextField,
  Stack,
} from '@mui/material';
import { CheckCircle, AlertTriangle } from '@mui/icons-material';
import type { AlertHistory } from '@/lib/api/alerts';

interface AlertHistoryTableProps {
  alerts: AlertHistory[];
  onAcknowledge?: (alertId: string) => Promise<void>;
  loading?: boolean;
}

type SortField = 'timestamp' | 'severity';
type SortOrder = 'asc' | 'desc';

export default function AlertHistoryTable({
  alerts,
  onAcknowledge,
  loading = false,
}: AlertHistoryTableProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterAcknowledged, setFilterAcknowledged] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Sort and filter
  const sortedAndFiltered = useMemo(() => {
    let result = [...alerts];

    // Filter by severity
    if (filterSeverity !== 'all') {
      result = result.filter((a) => a.severity === filterSeverity);
    }

    // Filter by acknowledged status
    if (filterAcknowledged !== 'all') {
      const isAcknowledged = filterAcknowledged === 'acknowledged';
      result = result.filter((a) => a.acknowledged === isAcknowledged);
    }

    // Search by message
    if (searchTerm) {
      result = result.filter((a) =>
        a.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [alerts, filterSeverity, filterAcknowledged, searchTerm, sortField, sortOrder]);

  const paginatedAlerts = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedAndFiltered.slice(start, start + rowsPerPage);
  }, [sortedAndFiltered, page, rowsPerPage]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getSeverityColor = (severity: string): 'success' | 'info' | 'warning' | 'error' => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      default:
        return 'success';
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography>Loading alert history...</Typography>
      </Paper>
    );
  }

  if (alerts.length === 0) {
    return (
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <Typography>No alerts recorded</Typography>
      </Paper>
    );
  }

  return (
    <Paper>
      {/* Filters */}
      <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search alerts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flex: 1, minWidth: '200px' }}
        />

        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          value={filterAcknowledged}
          onChange={(e) => setFilterAcknowledged(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
        >
          <option value="all">All Status</option>
          <option value="unacknowledged">Unacknowledged</option>
          <option value="acknowledged">Acknowledged</option>
        </select>
      </Box>

      {/* Table */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>Timestamp</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Status</TableCell>
              {onAcknowledge && <TableCell>Action</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedAlerts.map((alert) => (
              <TableRow key={alert.id} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                <TableCell sx={{ fontSize: '0.875rem' }}>
                  {new Date(alert.timestamp).toLocaleString()}
                </TableCell>
                <TableCell sx={{ fontSize: '0.875rem' }}>{alert.message}</TableCell>
                <TableCell>
                  <Chip
                    label={alert.severity}
                    color={getSeverityColor(alert.severity)}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell sx={{ fontSize: '0.875rem' }}>
                  {alert.value !== undefined ? alert.value.toLocaleString() : 'N/A'}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {alert.acknowledged ? (
                      <>
                        <CheckCircle sx={{ fontSize: '1rem', color: '#4caf50' }} />
                        <span>Acknowledged</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle sx={{ fontSize: '1rem', color: '#ff9800' }} />
                        <span>Pending</span>
                      </>
                    )}
                  </Box>
                </TableCell>
                {onAcknowledge && (
                  <TableCell>
                    {!alert.acknowledged && (
                      <button
                        onClick={() => onAcknowledge(alert.id)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid #ccc',
                          cursor: 'pointer',
                          backgroundColor: '#e3f2fd',
                        }}
                      >
                        Acknowledge
                      </button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={sortedAndFiltered.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
}
