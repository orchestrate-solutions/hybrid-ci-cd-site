/**
 * JobsChain Storybook Story
 */

import type { Meta, StoryObj } from '@storybook/react';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField as MuiTextField,
} from '@mui/material';
import { JobsChain } from './jobs.ts';
import type { Job, FilterOptions, SortOptions } from './types.ts';

/**
 * JobsChainDemo Component
 */
function JobsChainDemo() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'name' | 'status' | 'created_at'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const chain = React.useMemo(() => new JobsChain(), []);

  // Load jobs when filters or sort changes
  useEffect(() => {
    const loadJobs = async () => {
      setLoading(true);
      try {
        const filters: FilterOptions = {
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
          search: searchQuery || undefined,
        };

        const sort: SortOptions = {
          field: sortField,
          direction: sortDirection,
        };

        const result = await chain.execute(filters, sort);
        setJobs(result);
      } catch (error) {
        console.error('Failed to load jobs:', error);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, [chain, statusFilter, priorityFilter, searchQuery, sortField, sortDirection]);

  const getStatusColor = (status: Job['status']) => {
    const colors: Record<Job['status'], 'success' | 'warning' | 'error' | 'info'> = {
      QUEUED: 'warning',
      RUNNING: 'info',
      COMPLETED: 'success',
      FAILED: 'error',
    };
    return colors[status];
  };

  const getPriorityColor = (priority: Job['priority']) => {
    const colors: Record<Job['priority'], string> = {
      LOW: '#4CAF50',
      NORMAL: '#2196F3',
      HIGH: '#FF9800',
      CRITICAL: '#F44336',
    };
    return colors[priority];
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ mb: 1, fontWeight: 800 }}>
          Jobs Chain Demo
        </Typography>
        <Typography variant="body2" color="textSecondary">
          CodeUChain orchestrating job fetching, filtering, and sorting
        </Typography>
      </Box>

      {/* Filters Section */}
      <Paper sx={{ p: 3, mb: 4, backgroundColor: '#F5F5F5' }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          Filters & Sort
        </Typography>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            {/* Status Filter */}
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="QUEUED">Queued</MenuItem>
                <MenuItem value="RUNNING">Running</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="FAILED">Failed</MenuItem>
              </Select>
            </FormControl>

            {/* Priority Filter */}
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={priorityFilter}
                label="Priority"
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Priorities</MenuItem>
                <MenuItem value="LOW">Low</MenuItem>
                <MenuItem value="NORMAL">Normal</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="CRITICAL">Critical</MenuItem>
              </Select>
            </FormControl>

            {/* Sort Field */}
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortField}
                label="Sort By"
                onChange={(e) => setSortField(e.target.value as any)}
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="status">Status</MenuItem>
                <MenuItem value="created_at">Created At</MenuItem>
              </Select>
            </FormControl>

            {/* Sort Direction */}
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Direction</InputLabel>
              <Select
                value={sortDirection}
                label="Direction"
                onChange={(e) => setSortDirection(e.target.value as any)}
              >
                <MenuItem value="asc">Ascending</MenuItem>
                <MenuItem value="desc">Descending</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {/* Search */}
          <MuiTextField
            label="Search by name"
            placeholder="e.g., Deploy"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
          />
        </Stack>
      </Paper>

      {/* Jobs Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#F5F5F5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  Status
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  Priority
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">No jobs found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => (
                  <TableRow key={job.id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 500 }}>{job.name}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={job.status}
                        color={getStatusColor(job.status)}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={job.priority}
                        size="small"
                        sx={{ backgroundColor: getPriorityColor(job.priority), color: '#FFF' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {new Date(job.created_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Stats */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="caption" color="textSecondary">
          Showing {jobs.length} job{jobs.length !== 1 ? 's' : ''}
        </Typography>
      </Box>
    </Box>
  );
}

// Storybook Meta
const meta = {
  title: 'State Management/JobsChain',
  component: JobsChainDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'CodeUChain orchestrating job state management: Fetching from API → Filtering by criteria → Sorting by field. Demonstrates immutable context flow and reactive state updates.',
      },
    },
  },
} satisfies Meta<typeof JobsChainDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default: Jobs with all features
 */
export const Default: Story = {
  render: () => <JobsChainDemo />,
};

/**
 * Only running jobs
 */
export const RunningJobs: Story = {
  render: () => {
    const [jobs, setJobs] = React.useState<Job[]>([]);

    React.useEffect(() => {
      const chain = new JobsChain();
      chain.execute({ status: 'RUNNING' }).then(setJobs);
    }, []);

    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>
          Running Jobs Only
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#F5F5F5' }}>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Priority</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>{job.name}</TableCell>
                  <TableCell>{job.priority}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  },
};

/**
 * Critical priority jobs
 */
export const CriticalPriority: Story = {
  render: () => {
    const [jobs, setJobs] = React.useState<Job[]>([]);

    React.useEffect(() => {
      const chain = new JobsChain();
      chain.execute({ priority: 'CRITICAL' }).then(setJobs);
    }, []);

    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>
          Critical Priority Jobs
        </Typography>
        {jobs.length === 0 ? (
          <Typography color="textSecondary">No critical priority jobs</Typography>
        ) : (
          <Stack spacing={2}>
            {jobs.map((job) => (
              <Paper key={job.id} sx={{ p: 2 }}>
                <Typography sx={{ fontWeight: 600 }}>{job.name}</Typography>
                <Typography variant="caption" color="textSecondary">
                  Status: {job.status}
                </Typography>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>
    );
  },
};
