import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControlLabel,
  Checkbox,
  Stack,
  Chip,
  MenuItem,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { WebhookRule, WebhookCondition } from '../../lib/api/webhook';

interface WebhookRuleEditorProps {
  open: boolean;
  rule?: WebhookRule | null;
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
  loading?: boolean;
  error?: string | null;
}

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'matches_regex', label: 'Matches Regex' },
];

const EVENT_TYPES = [
  'webhook.created',
  'webhook.delivered',
  'webhook.failed',
  'job.queued',
  'job.started',
  'job.completed',
  'deployment.started',
  'deployment.completed',
];

export function WebhookRuleEditor({
  open,
  rule,
  onSave,
  onClose,
  loading = false,
  error = null,
}: WebhookRuleEditorProps) {
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    enabled: rule?.enabled ?? true,
    event_types: rule?.event_types || [],
    routing_target: rule?.routing_target || '',
    conditions: rule?.conditions || [],
  });

  const [conditionForm, setConditionForm] = useState({
    field: '',
    operator: 'equals',
    value: '',
  });

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        alert('Rule name is required');
        return;
      }
      if (formData.event_types.length === 0) {
        alert('At least one event type must be selected');
        return;
      }
      if (!formData.routing_target.trim()) {
        alert('Routing target is required');
        return;
      }

      await onSave({
        name: formData.name,
        enabled: formData.enabled,
        event_types: formData.event_types,
        routing_target: formData.routing_target,
        conditions: formData.conditions,
      });

      // Reset form
      setFormData({
        name: '',
        enabled: true,
        event_types: [],
        routing_target: '',
        conditions: [],
      });
      onClose();
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const toggleEventType = (eventType: string) => {
    setFormData(prev => ({
      ...prev,
      event_types: prev.event_types.includes(eventType)
        ? prev.event_types.filter(e => e !== eventType)
        : [...prev.event_types, eventType],
    }));
  };

  const addCondition = () => {
    if (!conditionForm.field || !conditionForm.value) {
      alert('Field and value are required for condition');
      return;
    }

    const newCondition: WebhookCondition = {
      field: conditionForm.field,
      operator: conditionForm.operator as any,
      value: conditionForm.value,
    };

    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition],
    }));

    setConditionForm({ field: '', operator: 'equals', value: '' });
  };

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {rule ? 'Edit Webhook Rule' : 'Create Webhook Rule'}
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={3}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* Rule Name */}
          <TextField
            label="Rule Name"
            placeholder="e.g., Notify deployment team"
            value={formData.name}
            onChange={(e) =>
              setFormData(prev => ({ ...prev, name: e.target.value }))
            }
            fullWidth
            disabled={loading}
          />

          {/* Event Types */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Event Types *
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              {EVENT_TYPES.map(eventType => (
                <Chip
                  key={eventType}
                  label={eventType}
                  onClick={() => toggleEventType(eventType)}
                  variant={
                    formData.event_types.includes(eventType)
                      ? 'filled'
                      : 'outlined'
                  }
                  color={
                    formData.event_types.includes(eventType)
                      ? 'primary'
                      : 'default'
                  }
                  disabled={loading}
                />
              ))}
            </Stack>
          </Box>

          {/* Routing Target */}
          <TextField
            label="Routing Target"
            placeholder="e.g., https://your-webhook.example.com"
            value={formData.routing_target}
            onChange={(e) =>
              setFormData(prev => ({ ...prev, routing_target: e.target.value }))
            }
            fullWidth
            disabled={loading}
            helperText="Where events will be delivered"
          />

          {/* Conditions */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Conditions (Optional)
            </Typography>

            {/* Display existing conditions */}
            {formData.conditions.length > 0 && (
              <Stack spacing={1} sx={{ mb: 2 }}>
                {formData.conditions.map((condition, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 1.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="body2">
                      {condition.field} {condition.operator} "{condition.value}"
                    </Typography>
                    <Button
                      size="small"
                      variant="text"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => removeCondition(index)}
                      disabled={loading}
                    >
                      Remove
                    </Button>
                  </Box>
                ))}
              </Stack>
            )}

            {/* Add condition form */}
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <TextField
                label="Field"
                placeholder="e.g., status"
                value={conditionForm.field}
                onChange={(e) =>
                  setConditionForm(prev => ({
                    ...prev,
                    field: e.target.value,
                  }))
                }
                size="small"
                disabled={loading}
                sx={{ flex: 1 }}
              />
              <TextField
                select
                label="Operator"
                value={conditionForm.operator}
                onChange={(e) =>
                  setConditionForm(prev => ({
                    ...prev,
                    operator: e.target.value,
                  }))
                }
                size="small"
                disabled={loading}
                sx={{ minWidth: 120 }}
              >
                {OPERATORS.map(op => (
                  <MenuItem key={op.value} value={op.value}>
                    {op.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Value"
                placeholder="e.g., failed"
                value={conditionForm.value}
                onChange={(e) =>
                  setConditionForm(prev => ({
                    ...prev,
                    value: e.target.value,
                  }))
                }
                size="small"
                disabled={loading}
                sx={{ flex: 1 }}
              />
              <Button
                variant="outlined"
                onClick={addCondition}
                disabled={loading || !conditionForm.field || !conditionForm.value}
                sx={{ minWidth: 40 }}
              >
                <AddIcon />
              </Button>
            </Stack>
          </Box>

          {/* Enabled toggle */}
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.enabled}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, enabled: e.target.checked }))
                }
                disabled={loading}
              />
            }
            label="Enabled"
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          {loading ? 'Saving...' : 'Save Rule'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
