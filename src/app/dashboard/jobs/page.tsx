'use client';

/**
 * Jobs Page - MVP Dashboard
 * 
 * Comprehensive jobs management with:
 * - Filterable/sortable job table
 * - Inline log viewer (expandable)
 * - Real-time updates
 * - Responsive design
 * - Quick actions (logs, details)
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
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
  Collapse,
  IconButton,
  TextField,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useJobs, useRealTime } from '@/lib/hooks';
import { LogViewer } from '@/components/jobs/LogViewer';
import type { Job, JobStatus, JobPriority } from '@/lib/types/jobs';

/**
 * Priority Color Map
 */
const PRIORITY_COLORS: Record<JobPriority, 'default' | 'success' | 'warning' | 'error'> = {
  LOW: 'default',
  NORMAL: 'success',
  HIGH: 'warning',
  CRITICAL: 'error',
};

/**
 * Status Color Map
 */
const STATUS_COLORS: Record<JobStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  QUEUED: 'warning',
  RUNNING: 'info',
  COMPLETED: 'success',
  FAILED: 'error',
  CANCELED: 'default',
};

/**
 * Status Badge Component
 */
function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <Chip
      label={status}
      color={STATUS_COLORS[status]}
      size="small"
      sx={{ fontWeight: 600 }}
    />
  );
}

/**
 * Priority Badge Component
 */
function PriorityBadge({ priority }: { priority: JobPriority }) {
  return (
    <Chip
      label={priority}
      color={PRIORITY_COLORS[priority]}
      size="small"
      variant="outlined"
    />
  );
}

/**
 * Job Row with Inline Log Viewer
 */
function JobRow({ job, onExpandClick, isExpanded }: { job: Job; onExpandClick: () => void; isExpanded: boolean }) {
  return (
    <>
      <TableRow hover>
        <TableCell>
          <IconButton
            size="small"
            onClick={onExpandClick}
            sx={{ mr: 1 }}
          >
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
          {job.name}
        </TableCell>
        <TableCell>
          <StatusBadge status={job.status} />
        </TableCell>
        <TableCell>
          <PriorityBadge priority={job.priority} />
        </TableCell>
        <TableCell sx={{ fontSize: '0.875rem', color: 'textSecondary' }}>
          {new Date(job.created_at).toLocaleString()}
        </TableCell>
        <TableCell sx={{ fontSize: '0.875rem', color: 'textSecondary' }}>
          {job.updated_at ? new Date(job.updated_at).toLocaleString() : '-'}
        </TableCell>
        <TableCell>
          {job.progress !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ flexGrow: 1, height: 6, backgroundColor: '#e0e0e0', borderRadius: 1 }}>
                <Box
                  sx={{
                    height: '100%',
                    width: `${job.progress}%`,
                    backgroundColor: job.progress === 100 ? '#4caf50' : '#2196f3',
                    borderRadius: 1,
                    transition: 'width 0.3s ease',
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ minWidth: 30 }}>
                {job.progress}%
              </Typography>
            </Box>
          )}
        </TableCell>
      </TableRow>

      {/* Inline Log Viewer */}
      <TableRow>
        <TableCell colSpan={6} sx={{ p: 0, borderBottom: isExpanded ? '1px solid' : 'none' }}>
          <Collapse in={isExpanded} timeout="auto">
            <Box sx={{ p: 2, backgroundColor: '#f9f9f9' }}>
              <LogViewer jobId={job.id} maxHeight="500px" />
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

/**
 * Jobs Page Component
 */
export default function JobsPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [orderBy, setOrderBy] = useState<string>('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<JobStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<JobPriority | ''>('');

  // Fetch jobs with current filters
  const { jobs, loading, error, refetch } = useJobs({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    limit: rowsPerPage,
    offset: page * rowsPerPage,
    search: search || undefined,
  });

  // Set up real-time polling
  useRealTime({
    onRefresh: refetch,
    enabled: true,
  });

  // Handle filter changes
  const handleStatusChange = (status: JobStatus | '') => {
    setPage(0);
    setStatusFilter(status);
  };

  const handlePriorityChange = (priority: JobPriority | '') => {
    setPage(0);
    setPriorityFilter(priority);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPage(0);
    setSearch(event.target.value);
  };

  const handleResetFilters = () => {
    setPage(0);
    setStatusFilter('');
    setPriorityFilter('');
    setSearch('');
    setOrderBy('created_at');
    setOrder('desc');
  };

  // Handle sorting
  const handleSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Handle pagination
  const handleChangePage = (_event: unknown, newPage: number) => {
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
        <Box>
          <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 700 }}>
            Jobs
          </Typography>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
              Jobs
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
              Manage and monitor all jobs in the system
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={refetch}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
            >
              Create Job
            </Button>
          </Stack>
        </Box>

        {/* Error State */}
        {error && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={refetch}>
                Retry
              </Button>
            }
          >
            {error.message || String(error)}
          </Alert>
        )}

        {/* Filters Section */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Filters & Search
          </Typography>
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            {/* Search */}
            <TextField
              size="small"
              placeholder="Search jobs..."
              value={search}
              onChange={handleSearchChange}
              variant="outlined"
              label="Search"
              sx={{ flex: 1, minWidth: 150 }}
            />

            {/* Status Filter */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => handleStatusChange(e.target.value as JobStatus | '')}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="QUEUED">Queued</MenuItem>
                <MenuItem value="RUNNING">Running</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="FAILED">Failed</MenuItem>
                <MenuItem value="CANCELED">Canceled</MenuItem>
              </Select>
            </FormControl>

            {/* Priority Filter */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={priorityFilter}
                label="Priority"
                onChange={(e) => handlePriorityChange(e.target.value as JobPriority | '')}
              >
                <MenuItem value="">All Priorities</MenuItem>
                <MenuItem value="LOW">Low</MenuItem>
                <MenuItem value="NORMAL">Normal</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="CRITICAL">Critical</MenuItem>
              </Select>
            </FormControl>

            {/* Reset Button */}
            <Button
              variant="outlined"
              onClick={handleResetFilters}
            >
              Reset Filters
            </Button>
          </Stack>
        </Paper>

        {/* Jobs Table */}
        <Paper sx={{ overflow: 'auto' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>
                    <TableSortLabel
                      active={orderBy === 'name'}
                      direction={orderBy === 'name' ? order : 'asc'}
                      onClick={() => handleSort('name')}
                    >
                      Job Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    <TableSortLabel
                      active={orderBy === 'status'}
                      direction={orderBy === 'status' ? order : 'asc'}
                      onClick={() => handleSort('status')}
                    >
                      Status
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    <TableSortLabel
                      active={orderBy === 'priority'}
                      direction={orderBy === 'priority' ? order : 'asc'}
                      onClick={() => handleSort('priority')}
                    >
                      Priority
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    <TableSortLabel
                      active={orderBy === 'created_at'}
                      direction={orderBy === 'created_at' ? order : 'asc'}
                      onClick={() => handleSort('created_at')}
                    >
                      Created
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    <TableSortLabel
                      active={orderBy === 'updated_at'}
                      direction={orderBy === 'updated_at' ? order : 'asc'}
                      onClick={() => handleSort('updated_at')}
                    >
                      Updated
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Progress</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jobs.map((job) => (
                  <JobRow
                    key={job.id}
                    job={job}
                    isExpanded={expandedJobId === job.id}
                    onExpandClick={() =>
                      setExpandedJobId(expandedJobId === job.id ? null : job.id)
                    }
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={jobs.length >= rowsPerPage ? (page + 1) * rowsPerPage + 1 : (page * rowsPerPage) + jobs.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </Paper>

        {/* Empty State */}
        {jobs.length === 0 && !loading && !error && (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No jobs found
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Try adjusting your filters or create a new job to get started.
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card sx={{ backgroundColor: '#e3f2fd' }}>
          <CardContent>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              💡 Tip: Click the expand icon to view logs for any job
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Real-time log streaming, search, follow mode, and download capabilities available.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
