/**
 * DeploymentConfirmationModal Component
 * Shows final review of deployment configuration with cost/time estimates
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Typography,
  Stack,
  Divider,
  Paper,
  Chip,
} from '@mui/material';
import { Warning, CheckCircle } from '@mui/icons-material';
import type { DeploymentConfig, ResourceEstimate } from '../../../lib/api/relayDeploy';

interface DeploymentConfirmationModalProps {
  isOpen: boolean;
  config: DeploymentConfig;
  estimates: ResourceEstimate;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * DeploymentConfirmationModal Component
 */
export function DeploymentConfirmationModal({
  isOpen,
  config,
  estimates,
  onConfirm,
  onCancel,
}: DeploymentConfirmationModalProps) {
  const isHighCost = estimates.estimated_cost_monthly > 200;

  return (
    <Dialog open={isOpen} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
        Confirm Deployment Configuration
      </DialogTitle>

      <DialogContent dividers sx={{ maxHeight: '70vh', overflow: 'auto' }}>
        {/* High Cost Warning */}
        {isHighCost && (
          <Alert severity="warning" icon={<Warning />} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
              High monthly cost
            </Typography>
            This deployment will cost approximately ${estimates.estimated_cost_monthly.toFixed(2)}/month
          </Alert>
        )}

        {/* Configuration Summary */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Configuration Summary
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 500 }}>Provider</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={config.provider.toUpperCase()}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 500 }}>Region</TableCell>
                  <TableCell align="right">{config.region}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 500 }}>Infrastructure</TableCell>
                  <TableCell align="right">{config.infrastructure_type}</TableCell>
                </TableRow>
                {config.instance_type && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 500 }}>Instance Type</TableCell>
                    <TableCell align="right">{config.instance_type}</TableCell>
                  </TableRow>
                )}
                {config.instance_count && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 500 }}>Instance Count</TableCell>
                    <TableCell align="right">{config.instance_count}</TableCell>
                  </TableRow>
                )}
                {config.relay_name && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 500 }}>Relay Name</TableCell>
                    <TableCell align="right">{config.relay_name}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Cost & Time Estimates */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Deployment Estimates
          </Typography>

          <Stack spacing={2}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                backgroundColor: (theme) =>
                  theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50],
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ color: 'textSecondary' }}>
                  Estimated Monthly Cost
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: (theme) => theme.palette.primary.main }}>
                  ${estimates.estimated_cost_monthly.toFixed(2)}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: 'textSecondary' }}>
                Based on current pricing in {config.region}
              </Typography>
            </Paper>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                backgroundColor: (theme) =>
                  theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50],
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ color: 'textSecondary' }}>
                  Estimated Deployment Time
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  ~{estimates.estimated_deployment_time_minutes} minutes
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: 'textSecondary' }}>
                Actual time may vary based on resource availability
              </Typography>
            </Paper>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                backgroundColor: (theme) =>
                  theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50],
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: 'textSecondary' }}>
                  Resources to Create
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {estimates.resource_count}
                </Typography>
              </Box>
            </Paper>
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Resource Breakdown */}
        {estimates.breakdown && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
              Resource Breakdown
            </Typography>

            <Stack spacing={1}>
              {Object.entries(estimates.breakdown).map(([key, value]) => (
                <Box
                  key={key}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 1,
                    backgroundColor: (theme) =>
                      theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50],
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {key.replace(/_/g, ' ')}
                  </Typography>
                  <Chip label={value} size="small" variant="outlined" />
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* Security Groups */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Ingress Rules
          </Typography>
          <Stack spacing={0.5}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle sx={{ fontSize: '1rem', color: 'success.main' }} />
              <Typography variant="body2">Port 22 (SSH) - Restricted</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle sx={{ fontSize: '1rem', color: 'success.main' }} />
              <Typography variant="body2">Port 443 (HTTPS) - Restricted</Typography>
            </Box>
          </Stack>
        </Box>

        {/* Auto Scaling */}
        {config.auto_scaling_min !== undefined && config.auto_scaling_max !== undefined && (
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Auto Scaling Configuration
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Paper
                variant="outlined"
                sx={{
                  flex: 1,
                  p: 1,
                  textAlign: 'center',
                  backgroundColor: (theme) =>
                    theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50],
                }}
              >
                <Typography variant="caption" sx={{ color: 'textSecondary', display: 'block' }}>
                  Min
                </Typography>
                <Typography variant="h6">{config.auto_scaling_min}</Typography>
              </Paper>
              <Paper
                variant="outlined"
                sx={{
                  flex: 1,
                  p: 1,
                  textAlign: 'center',
                  backgroundColor: (theme) =>
                    theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50],
                }}
              >
                <Typography variant="caption" sx={{ color: 'textSecondary', display: 'block' }}>
                  Max
                </Typography>
                <Typography variant="h6">{config.auto_scaling_max}</Typography>
              </Paper>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onCancel} variant="outlined">
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="contained" color="primary">
          Deploy Now
        </Button>
      </DialogActions>
    </Dialog>
  );
}
