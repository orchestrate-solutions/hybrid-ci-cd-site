'use client';

/**
 * ChangeDetailsModal Component
 * Displays before/after values with sensitive data redaction
 */

import React, { useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Alert,
} from '@mui/material';
import { Lock, ContentCopy, Warning } from '@mui/icons-material';
import type { AuditLog } from '@/lib/api/audit';

interface ChangeDetailsModalProps {
  log: AuditLog | null;
  open: boolean;
  onClose: () => void;
}

const SENSITIVE_FIELDS = [
  'password',
  'api_key',
  'token',
  'secret',
  'private_key',
  'webhook_secret',
];

export default function ChangeDetailsModal({
  log,
  open,
  onClose,
}: ChangeDetailsModalProps) {
  const isSensitiveField = (key: string): boolean => {
    return SENSITIVE_FIELDS.some((field) => key.toLowerCase().includes(field));
  };

  const getRedactedValue = (value: any): { text: string; sensitive: boolean } => {
    if (value === null || value === undefined) {
      return { text: 'N/A', sensitive: false };
    }
    if (typeof value === 'string' && value.length > 0) {
      return { text: '***' + value.slice(-4), sensitive: true };
    }
    return { text: '***', sensitive: true };
  };

  const changes = useMemo(() => {
    if (!log) return [];

    const before = log.before || {};
    const after = log.after || {};
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    return Array.from(allKeys).map((key) => ({
      key,
      before: before[key],
      after: after[key],
      isSensitive: isSensitiveField(key),
    }));
  }, [log]);

  const handleCopyJSON = async () => {
    if (!log) return;
    const json = JSON.stringify(log, null, 2);
    await navigator.clipboard.writeText(json);
  };

  if (!log) return null;

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

  const beforeRedacted = getRedactedValue(
    log.before && Object.keys(log.before).length > 0 ? log.before : null
  );
  const afterRedacted = getRedactedValue(
    log.after && Object.keys(log.after).length > 0 ? log.after : null
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h6">Change Details</Typography>
          <Chip
            label={log.action}
            color={getActionColor(log.action)}
            size="small"
            variant="outlined"
            className={`action-${log.action}`}
          />
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
            icon={log.sensitivity === 'high' ? <Warning /> : undefined}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 3, typography: 'body2', color: 'text.secondary' }}>
          <Box>
            <strong>User:</strong> {log.user_email || log.user_id}
          </Box>
          <Box>
            <strong>Timestamp:</strong> {new Date(log.timestamp).toLocaleString()}
          </Box>
          <Box>
            <strong>Resource:</strong> {log.resource_type}/{log.resource_id}
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {log.sensitivity === 'high' && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Lock sx={{ mr: 1, display: 'inline' }} />
            This change involves sensitive data. Some values are redacted for security.
          </Alert>
        )}

        {changes.length > 0 ? (
          <Paper sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>Field</TableCell>
                  <TableCell>Before</TableCell>
                  <TableCell>After</TableCell>
                  {changes.some((c) => c.isSensitive) && <TableCell>Status</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {changes.map((change, idx) => {
                  const beforeVal = getRedactedValue(change.before);
                  const afterVal = getRedactedValue(change.after);

                  return (
                    <TableRow key={idx}>
                      <TableCell sx={{ fontWeight: 500, wordBreak: 'break-word' }}>
                        {change.key}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                          color: beforeVal.sensitive ? '#d32f2f' : 'inherit',
                        }}
                      >
                        {beforeVal.text === 'N/A' ? (
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            N/A
                          </Typography>
                        ) : (
                          beforeVal.text
                        )}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                          color: afterVal.sensitive ? '#d32f2f' : 'inherit',
                          backgroundColor: change.isSensitive ? '#fff3e0' : 'inherit',
                        }}
                      >
                        {afterVal.text === 'N/A' ? (
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            N/A
                          </Typography>
                        ) : (
                          afterVal.text
                        )}
                      </TableCell>
                      {changes.some((c) => c.isSensitive) && (
                        <TableCell align="center">
                          {change.isSensitive && (
                            <Lock
                              sx={{ color: '#d32f2f', fontSize: '1rem' }}
                              data-testid="redacted-icon"
                            />
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Paper>
        ) : (
          <Typography sx={{ py: 2 }}>No changes recorded</Typography>
        )}

        {/* JSON Display */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Raw Data (Sensitive Fields Redacted)
          </Typography>
          <Paper
            sx={{
              p: 2,
              backgroundColor: '#f5f5f5',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              overflow: 'auto',
              maxHeight: '200px',
            }}
          >
            <pre>{JSON.stringify(log, null, 2)}</pre>
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          startIcon={<ContentCopy />}
          onClick={handleCopyJSON}
          size="small"
        >
          Export as JSON
        </Button>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
