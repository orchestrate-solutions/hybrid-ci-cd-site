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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TablePagination,
  CircularProgress,
  Alert,
  Chip,
  Button,
  Typography,
} from '@mui/material';
import { listAgents, pauseAgent, resumeAgent } from '@/lib/api/agents';
import type { Agent, AgentStatus } from '@/lib/types/agents';

const statusColors: Record<AgentStatus, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
  IDLE: 'success',
  RUNNING: 'primary',
  PAUSED: 'warning',
  OFFLINE: 'error',
  ERROR: 'error',
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [statusFilter, setStatusFilter] = useState<AgentStatus | 'ALL'>('ALL');

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await listAgents({
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });

      setAgents(response.agents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, statusFilter]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleStatusFilterChange = (event: any) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handlePauseAgent = async (agentId: string) => {
    try {
      await pauseAgent(agentId);
      fetchAgents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause agent');
    }
  };

  const handleResumeAgent = async (agentId: string) => {
    try {
      await resumeAgent(agentId);
      fetchAgents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume agent');
    }
  };

  if (loading && agents.length === 0) {
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
        <Typography variant="h4">Agents</Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
          <Button size="small" onClick={fetchAgents} sx={{ ml: 1 }}>
            Retry
          </Button>
        </Alert>
      )}

      {/* Filters */}
      <Box display="flex" gap={2} mb={2} flexWrap="wrap" data-testid="agents-filters">
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            label="Status"
            data-testid="filter-status"
          >
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="IDLE">Idle</MenuItem>
            <MenuItem value="RUNNING">Running</MenuItem>
            <MenuItem value="PAUSED">Paused</MenuItem>
            <MenuItem value="OFFLINE">Offline</MenuItem>
            <MenuItem value="ERROR">Error</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Table */}
      {agents.length === 0 ? (
        <Alert severity="info">No agents found.</Alert>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table data-testid="agents-table">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Pool ID</TableCell>
                  <TableCell>CPU</TableCell>
                  <TableCell>Memory</TableCell>
                  <TableCell>Last Heartbeat</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {agents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell>{agent.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={agent.status}
                        color={statusColors[agent.status]}
                        data-testid="status-badge"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{agent.pool_id}</TableCell>
                    <TableCell>{agent.cpu_cores}</TableCell>
                    <TableCell>{agent.memory_gb}GB</TableCell>
                    <TableCell>{new Date(agent.last_heartbeat).toLocaleString()}</TableCell>
                    <TableCell>
                      {agent.status === 'PAUSED' ? (
                        <Button
                          size="small"
                          onClick={() => handleResumeAgent(agent.id)}
                          variant="outlined"
                          color="success"
                        >
                          Resume
                        </Button>
                      ) : agent.status === 'IDLE' ? (
                        <Button
                          size="small"
                          onClick={() => handlePauseAgent(agent.id)}
                          variant="outlined"
                          color="warning"
                        >
                          Pause
                        </Button>
                      ) : null}
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
    </Box>
  );
}
