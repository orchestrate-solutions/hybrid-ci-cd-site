'use client';

/**
 * AuditTable Component
 * Displays audit logs with filtering, sorting, and pagination
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
  TableSortLabel,
  Box,
  Chip,
  Typography,
  TablePagination,
} from '@mui/material';
import { Warning } from '@mui/icons-material';
import type { AuditLog } from '@/lib/api/audit';

interface AuditTableProps {
  logs: AuditLog[];
  onSelectLog: (log: AuditLog) => void;
  loading?: boolean;
  itemsPerPage?: number;
}

type SortField = 'timestamp' | 'action' | 'user_id' | 'resource_type';
type SortOrder = 'asc' | 'desc';

export default function AuditTable({
  logs,
  onSelectLog,
  loading = false,
  itemsPerPage = 25,
}: AuditTableProps) {
  const [page, setPage] = React.useState(0);
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterResource, setFilterResource] = useState<string>('all');
  const [filterSensitivity, setFilterSensitivity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Sort and filter logs
  const sortedAndFiltered = useMemo(() => {
    let result = [...logs];

    // Apply filters
    if (filterAction !== 'all') {
      result = result.filter((log) => log.action === filterAction);
    }
    if (filterResource !== 'all') {
      result = result.filter((log) => log.resource_type === filterResource);
    }
    if (filterSensitivity !== 'all') {
      result = result.filter((log) => log.sensitivity === filterSensitivity);
    }
    if (searchTerm) {
      result = result.filter(
        (log) =>
          log.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.resource_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.action.includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') {
        aVal = (aVal as string).toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [logs, filterAction, filterResource, filterSensitivity, searchTerm, sortField, sortOrder]);

  const paginatedLogs = useMemo(() => {
    const start = page * itemsPerPage;
    return sortedAndFiltered.slice(start, start + itemsPerPage);
  }, [sortedAndFiltered, page, itemsPerPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getActionColor = (
    action: string
  ): 'success' | 'info' | 'warning' | 'error' => {
    switch (action) {
      case 'create':
        return 'success';
      case 'delete':
        return 'error';
      case 'update':
        return 'warning';
      case 'read':
        return 'info';
      default:
        return 'info';
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography>Loading audit logs...</Typography>
      </Paper>
    );
  }

  if (logs.length === 0) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography>No audit logs found</Typography>
      </Paper>
    );
  }

  return (
    <Paper>
      {/* Filters */}
      <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search logs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            flex: 1,
            minWidth: '200px',
          }}
        />

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
        >
          <option value="all">All Actions</option>
          <option value="create">Create</option>
          <option value="read">Read</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
        </select>

        <select
          value={filterResource}
          onChange={(e) => setFilterResource(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
        >
          <option value="all">All Resources</option>
          <option value="relay">Relay</option>
          <option value="webhook">Webhook</option>
          <option value="job">Job</option>
          <option value="agent">Agent</option>
        </select>

        <select
          value={filterSensitivity}
          onChange={(e) => setFilterSensitivity(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
        >
          <option value="all">All Levels</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </Box>

      {/* Table */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'timestamp'}
                  direction={sortField === 'timestamp' ? sortOrder : 'asc'}
                  onClick={() => handleSort('timestamp')}
                >
                  Timestamp
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'user_id'}
                  direction={sortField === 'user_id' ? sortOrder : 'asc'}
                  onClick={() => handleSort('user_id')}
                >
                  User
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'action'}
                  direction={sortField === 'action' ? sortOrder : 'asc'}
                  onClick={() => handleSort('action')}
                >
                  Action
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'resource_type'}
                  direction={sortField === 'resource_type' ? sortOrder : 'asc'}
                  onClick={() => handleSort('resource_type')}
                >
                  Resource
                </TableSortLabel>
              </TableCell>
              <TableCell>Sensitivity</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedLogs.map((log) => (
              <TableRow
                key={log.id}
                onClick={() => onSelectLog(log)}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: log.sensitivity === 'high' ? '#fff3e0' : 'inherit',
                  '&:hover': { backgroundColor: '#f5f5f5' },
                  className: log.sensitivity === 'high' ? 'sensitive-row' : '',
                }}
              >
                <TableCell sx={{ fontSize: '0.875rem' }}>
                  {new Date(log.timestamp).toLocaleString()}
                </TableCell>
                <TableCell sx={{ fontSize: '0.875rem' }}>{log.user_id}</TableCell>
                <TableCell>
                  <Chip
                    label={log.action}
                    color={getActionColor(log.action)}
                    size="small"
                    variant="outlined"
                    className={`action-${log.action}`}
                  />
                </TableCell>
                <TableCell sx={{ fontSize: '0.875rem' }}>
                  {log.resource_type} / {log.resource_id}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {log.sensitivity === 'high' && <Warning sx={{ color: '#d32f2f' }} />}
                    <Chip
                      label={log.sensitivity}
                      color={
                        log.sensitivity === 'high'
                          ? 'error'
                          : log.sensitivity === 'medium'
                            ? 'warning'
                            : 'success'
                      }
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[25, 50, 100]}
        component="div"
        count={sortedAndFiltered.length}
        rowsPerPage={itemsPerPage}
        page={page}
        onPageChange={(event, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event) => {
          setPage(0);
          // Page size change would be handled by parent
        }}
      />
    </Paper>
  );
}
