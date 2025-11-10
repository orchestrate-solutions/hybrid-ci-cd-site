'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TablePagination,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from '@mui/material';
import { listDeployments, rollbackDeployment } from '@/lib/api/deployments';
import type { Deployment, DeploymentStatus, DeploymentEnvironment } from '@/lib/types/deployments';

const statusColors: Record<DeploymentStatus, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
  PENDING: 'warning',
  IN_PROGRESS: 'primary',
  COMPLETED: 'success',
  FAILED: 'error',
  ROLLED_BACK: 'error',
  CANCELED: 'default',
};

const environmentColors: Record<DeploymentEnvironment, 'default' | 'primary' | 'info' | 'error'> = {
  DEVELOPMENT: 'info',
  STAGING: 'primary',
  PRODUCTION: 'error',
};

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [statusFilter, setStatusFilter] = useState<DeploymentStatus | 'ALL'>('ALL');
  const [environmentFilter, setEnvironmentFilter] = useState<DeploymentEnvironment | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [rollbackDialog, setRollbackDialog] = useState<{ open: boolean; deployment: Deployment | null }>({
    open: false,
    deployment: null,
  });

  const fetchDeployments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await listDeployments({
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        environment: environmentFilter === 'ALL' ? undefined : environmentFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      setDeployments(response.deployments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deployments');
      setDeployments([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, statusFilter, environmentFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);

  const handleStatusFilterChange = (event: any) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleEnvironmentFilterChange = (event: any) => {
    setEnvironmentFilter(event.target.value);
    setPage(0);
  };

  const handleSort = (column: 'name' | 'status' | 'created_at') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setPage(0);
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRollback = (deployment: Deployment) => {
    setRollbackDialog({ open: true, deployment });
  };

  const confirmRollback = async () => {
    if (!rollbackDialog.deployment) return;

    try {
      await rollbackDeployment(rollbackDialog.deployment.id);
      setRollbackDialog({ open: false, deployment: null });
      fetchDeployments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rollback deployment');
    }
  };

  const resetFilters = () => {
    setStatusFilter('ALL');
    setEnvironmentFilter('ALL');
    setPage(0);
  };

  if (loading && deployments.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Deployments</Typography>
        <Button variant="contained" color="primary">
          Create Deployment
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
          <Button size="small" onClick={fetchDeployments} sx={{ ml: 1 }}>
            Retry
          </Button>
        </Alert>
      )}

      {/* Filters */}
      <Box display="flex" gap={2} mb={2} flexWrap="wrap" data-testid="deployments-filters">
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            label="Status"
            data-testid="filter-status"
          >
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
            <MenuItem value="FAILED">Failed</MenuItem>
            <MenuItem value="ROLLED_BACK">Rolled Back</MenuItem>
            <MenuItem value="CANCELED">Canceled</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Environment</InputLabel>
          <Select
            value={environmentFilter}
            onChange={handleEnvironmentFilterChange}
            label="Environment"
            data-testid="filter-environment"
          >
            <MenuItem value="ALL">All Environments</MenuItem>
            <MenuItem value="DEVELOPMENT">Development</MenuItem>
            <MenuItem value="STAGING">Staging</MenuItem>
            <MenuItem value="PRODUCTION">Production</MenuItem>
          </Select>
        </FormControl>

        {(statusFilter !== 'ALL' || environmentFilter !== 'ALL') && (
          <Button variant="outlined" onClick={resetFilters}>
            Reset Filters
          </Button>
        )}
      </Box>

      {/* Table */}
      {deployments.length === 0 ? (
        <Alert severity="info">No deployments found. {error ? 'Try adjusting your filters.' : ''}</Alert>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table data-testid="deployments-table">
              <TableHead>
                <TableRow>
                  <TableCell
                    onClick={() => handleSort('name')}
                    sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell
                    onClick={() => handleSort('status')}
                    sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell>Environment</TableCell>
                  <TableCell
                    onClick={() => handleSort('created_at')}
                    sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Created {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {deployments.map((deployment) => (
                  <TableRow key={deployment.id}>
                    <TableCell>{deployment.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={deployment.status}
                        color={statusColors[deployment.status]}
                        data-testid="status-badge"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={deployment.environment}
                        color={environmentColors[deployment.environment]}
                        data-testid="environment-badge"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{new Date(deployment.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => handleRollback(deployment)}
                        disabled={deployment.status !== 'COMPLETED'}
                        data-testid="deployment-rollback"
                      >
                        Rollback
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            component="div"
            count={-1}
            page={page}
            onPageChange={handlePageChange}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[25, 50, 100]}
            data-testid="pagination"
          />
        </>
      )}

      {/* Rollback Dialog */}
      <Dialog
        open={rollbackDialog.open}
        onClose={() => setRollbackDialog({ open: false, deployment: null })}
      >
        <DialogTitle>Confirm Rollback</DialogTitle>
        <DialogContent>
          Are you sure you want to rollback deployment "{rollbackDialog.deployment?.name}"?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRollbackDialog({ open: false, deployment: null })}>Cancel</Button>
          <Button onClick={confirmRollback} color="error" variant="contained">
            Rollback
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
