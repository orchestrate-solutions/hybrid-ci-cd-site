'use client';

/**
 * JobsPage - GREEN Phase Implementation
 *
 * Minimal implementation to make all RED phase tests pass.
 * Displays jobs in MUI Data Grid with filtering, sorting, pagination.
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { listJobs } from '@/lib/api/jobs';
import { Job, JobStatus, JobPriority, ListJobsParams } from '@/lib/types/jobs';

/**
 * Status Badge Component
 */
function StatusBadge({ status }: { status: JobStatus }) {
  const colorMap: Record<JobStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
    QUEUED: 'warning',
    RUNNING: 'info',
    COMPLETED: 'success',
    FAILED: 'error',
    CANCELED: 'default',
  };

  return (
    <Chip
      label={status}
      color={colorMap[status]}
      size="small"
      data-testid={`status-badge-${status}`}
    />
  );
}

/**
 * JobsPage Component
 */
export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [orderBy, setOrderBy] = useState<string>('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<{
    status?: JobStatus;
    priority?: JobPriority;
  }>({});

  // Fetch jobs function
  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: ListJobsParams = {
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        status: filters.status,
        priority: filters.priority,
        sort_by: orderBy as any,
        sort_order: order,
      };

      const response = await listJobs(params);
      setJobs(response.jobs);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  // Fetch jobs on mount and when dependencies change
  useEffect(() => {
    fetchJobs();
  }, [page, rowsPerPage, orderBy, order, filters]);

  // Handle filter changes
  const handleStatusFilterChange = (status: JobStatus | '') => {
    setPage(0); // Reset page FIRST
    setFilters(prev => ({
      ...prev,
      status: status || undefined,
    }));
  };

  const handlePriorityFilterChange = (priority: JobPriority | '') => {
    setPage(0); // Reset page FIRST
    setFilters(prev => ({
      ...prev,
      priority: priority || undefined,
    }));
  };

  const handleResetFilters = () => {
    setPage(0); // Reset page FIRST
    setFilters({});
  };

  // Handle sorting
  const handleSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Loading state
  if (loading && jobs.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box component="main">
          <Typography variant="h4" component="h1" data-testid="jobs-header" sx={{ mb: 3 }}>
            Jobs
          </Typography>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress data-testid="loading-spinner" />
          </Box>
        </Box>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={fetchJobs}>
              Retry
            </Button>
          }
          data-testid="error-alert"
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box component="main">
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" data-testid="jobs-header">
            Jobs
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            data-testid="create-job-button"
          >
            Create Job
          </Button>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }} data-testid="jobs-filters">
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status || ''}
                  label="Status"
                  onChange={(e) => handleStatusFilterChange(e.target.value as JobStatus)}
                  data-testid="filter-status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="QUEUED">Queued</MenuItem>
                  <MenuItem value="RUNNING">Running</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                  <MenuItem value="FAILED">Failed</MenuItem>
                  <MenuItem value="CANCELED">Canceled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={filters.priority || ''}
                  label="Priority"
                  onChange={(e) => handlePriorityFilterChange(e.target.value as JobPriority)}
                  data-testid="filter-priority"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="NORMAL">Normal</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="CRITICAL">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <Button
                variant="outlined"
                onClick={handleResetFilters}
                data-testid="reset-filters-button"
              >
                Reset Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Jobs Table */}
        <Paper>
          <TableContainer>
            <Table data-testid="jobs-table">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'name'}
                      direction={orderBy === 'name' ? order : 'asc'}
                      onClick={() => handleSort('name')}
                    >
                      Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'status'}
                      direction={orderBy === 'status' ? order : 'asc'}
                      onClick={() => handleSort('status')}
                    >
                      Status
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'priority'}
                      direction={orderBy === 'priority' ? order : 'asc'}
                      onClick={() => handleSort('priority')}
                    >
                      Priority
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'created_at'}
                      direction={orderBy === 'created_at' ? order : 'asc'}
                      onClick={() => handleSort('created_at')}
                    >
                      Created
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id} hover>
                    <TableCell>{job.name}</TableCell>
                    <TableCell>
                      <StatusBadge status={job.status} />
                    </TableCell>
                    <TableCell>{job.priority}</TableCell>
                    <TableCell>{new Date(job.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[25, 50, 100]}
            data-testid="pagination"
          />
        </Paper>

        {/* Empty State */}
        {jobs.length === 0 && !loading && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight="200px"
            mt={3}
            data-testid="empty-state"
          >
            <Typography variant="h6" color="textSecondary">
              No jobs found
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Try adjusting your filters or create a new job.
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
}