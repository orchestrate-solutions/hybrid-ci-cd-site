/**
 * RollbackModal Component
 * Modal dialog for confirming deployment rollback with reason input
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box,
  CircularProgress,
} from '@mui/material';
import { WarningAmber as WarningIcon } from '@mui/icons-material';

interface RollbackModalProps {
  /** Whether modal is open */
  open: boolean;
  /** Deployment ID to rollback */
  deploymentId: string;
  /** Callback when rollback is confirmed with reason */
  onConfirm: (deploymentId: string, reason: string) => Promise<void> | void;
  /** Callback when rollback is cancelled */
  onCancel: () => void;
  /** Optional deployment version for display */
  version?: string;
}

/**
 * RollbackModal component
 * Displays confirmation dialog with reason input for deployment rollback
 */
export function RollbackModal({
  open,
  deploymentId,
  onConfirm,
  onCancel,
  version,
}: RollbackModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on modal open
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setReason('');
      setError(null);
      setLoading(false);
    }
  }, [open]);

  const handleConfirm = async () => {
    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      setError('Please provide a reason for the rollback');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onConfirm(deploymentId, trimmedReason);
      setReason('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to rollback deployment';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && reason.trim()) {
      handleConfirm();
    }
  };

  const isConfirmDisabled = !reason.trim() || loading;

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      aria-labelledby="rollback-dialog-title"
    >
      <DialogTitle id="rollback-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon sx={{ color: 'warning.main' }} />
        Rollback Deployment
      </DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Warning message */}
          <Alert severity="warning" icon={<WarningIcon />}>
            This action will rollback the deployment. This operation cannot be easily undone.
          </Alert>

          {/* Confirmation text */}
          <DialogContentText>
            Are you sure you want to rollback {version ? `version ${version}` : 'this deployment'}?
            Please provide a reason for the rollback below.
          </DialogContentText>

          {/* Reason input */}
          <TextField
            inputRef={inputRef}
            fullWidth
            multiline
            rows={4}
            label="Reason for Rollback"
            placeholder="Reason for rollback"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            inputProps={{
              maxLength: 500,
              'data-testid': 'rollback-reason-input',
            }}
            helperText={`${reason.length}/500 characters`}
            variant="outlined"
            focused
          />

          {/* Error message */}
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onCancel}
          disabled={loading}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isConfirmDisabled}
          variant="contained"
          color="error"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {loading && <CircularProgress size={16} />}
          Confirm Rollback
        </Button>
      </DialogActions>
    </Dialog>
  );
}
