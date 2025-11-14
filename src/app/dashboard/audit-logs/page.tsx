'use client';

/**
 * Audit Logs Page
 * Full audit trail management with real-time monitoring
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  Skeleton,
  Stack,
  Chip,
} from '@mui/material';
import {
  Refresh,
  Download,
  FileJson,
  CheckCircle,
  Edit,
  Delete,
  AlertTriangle,
} from '@mui/icons-material';
import { useAuditLogs } from '@/lib/hooks/useAuditLogs';
import { auditApi } from '@/lib/api/audit';
import AuditTable from '@/components/dashboard/audit/AuditTable/AuditTable';
import ChangeDetailsModal from '@/components/dashboard/audit/ChangeDetailsModal/ChangeDetailsModal';

export default function AuditLogsPage() {
  const {
    logs,
    loading,
    error,
    filterByAction,
    filterByDateRange,
    getPaginated,
    getCountByAction,
    getSensitiveChanges,
    exportAsCSV,
    exportAsJSON,
    refetch,
  } = useAuditLogs();

  const [selectedLog, setSelectedLog] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [autoRefresh, setAutoRefresh] = useState<number | null>(null);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetch();
    }, autoRefresh * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  // Initial fetch
  useEffect(() => {
    refetch();
  }, []);

  const handleDateRangeChange = () => {
    if (startDate && endDate) {
      filterByDateRange(startDate, endDate);
    }
  };

  const statistics = useMemo(() => {
    return {
      total: logs.length,
      creates: getCountByAction('create'),
      updates: getCountByAction('update'),
      deletes: getCountByAction('delete'),
      sensitive: getSensitiveChanges().length,
    };
  }, [logs, getCountByAction, getSensitiveChanges]);

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" action={<Button onClick={refetch}>Retry</Button>}>
          Failed to load audit logs: {error.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Audit Trail
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Comprehensive audit log of all system changes with full forensic capability
        </Typography>
      </Box>

      {/* High Sensitivity Warning */}
      {statistics.sensitive > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }} role="alert">
          <AlertTriangle sx={{ mr: 1, display: 'inline' }} />
          {statistics.sensitive} high-sensitivity change{statistics.sensitive !== 1 ? 's' : ''}{' '}
          detected. Review with caution.
        </Alert>
      )}

      {/* Statistics Grid */}
      <Grid container spacing={2} sx={{ mb: 4 }} className="stats-grid">
        {[
          { title: 'Total Changes', value: statistics.total, icon: <CheckCircle /> },
          { title: 'Created', value: statistics.creates, icon: <CheckCircle /> },
          { title: 'Updated', value: statistics.updates, icon: <Edit /> },
          { title: 'Deleted', value: statistics.deletes, icon: <Delete /> },
          { title: 'High Sensitivity', value: statistics.sensitive, icon: <AlertTriangle /> },
        ].map((stat) => (
          <Grid item xs={12} sm={6} md={4} lg={2.4} key={stat.title}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ color: 'primary.main' }}>{stat.icon}</Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {stat.title}
                    </Typography>
                    <Typography variant="h6">{stat.value}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Controls */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
          {/* Date Range Filters */}
          <TextField
            type="date"
            label="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ flex: 1 }}
          />
          <TextField
            type="date"
            label="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ flex: 1 }}
          />
          <Button
            variant="outlined"
            onClick={handleDateRangeChange}
            sx={{ alignSelf: 'flex-end' }}
          >
            Filter
          </Button>
        </Stack>

        {/* Action Buttons */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            startIcon={<Refresh />}
            onClick={refetch}
            variant="outlined"
            size="small"
          >
            Refresh
          </Button>
          <Button
            startIcon={<Download />}
            onClick={exportAsCSV}
            variant="outlined"
            size="small"
          >
            Export as CSV
          </Button>
          <Button
            startIcon={<FileJson />}
            onClick={exportAsJSON}
            variant="outlined"
            size="small"
          >
            Export as JSON
          </Button>

          {/* Auto-Refresh Control */}
          <Box sx={{ ml: 'auto' }}>
            <select
              value={autoRefresh || ''}
              onChange={(e) => setAutoRefresh(e.target.value ? parseInt(e.target.value) : null)}
              style={{
                padding: '6px 10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
              }}
            >
              <option value="">Off</option>
              <option value="5">5 seconds</option>
              <option value="10">10 seconds</option>
              <option value="30">30 seconds</option>
              <option value="60">1 minute</option>
            </select>
          </Box>
        </Stack>
      </Card>

      {/* Loading State */}
      {loading && <Skeleton variant="rectangular" height={400} />}

      {/* Audit Table */}
      {!loading && (
        <AuditTable logs={logs} onSelectLog={setSelectedLog} />
      )}

      {/* Change Details Modal */}
      <ChangeDetailsModal
        log={selectedLog}
        open={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
      />
    </Container>
  );
}
