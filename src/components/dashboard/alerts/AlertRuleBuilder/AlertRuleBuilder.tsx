'use client';

/**
 * AlertRuleBuilder Component
 * Form for creating and editing alert rules
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Typography,
  Alert,
  Chip,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Add, Delete, Send } from '@mui/icons-material';
import type { AlertTemplate } from '@/lib/api/alerts';

interface AlertRuleBuilderProps {
  templates?: AlertTemplate[];
  onSave: (rule: any) => Promise<void>;
  onTest?: (ruleId: string, channel: string) => Promise<void>;
  onCancel?: () => void;
  initialRule?: any;
}

interface Condition {
  field: string;
  operator: string;
  value: string | number;
}

export default function AlertRuleBuilder({
  templates = [],
  onSave,
  onTest,
  onCancel,
  initialRule,
}: AlertRuleBuilderProps) {
  const [name, setName] = useState(initialRule?.name || '');
  const [description, setDescription] = useState(initialRule?.description || '');
  const [severity, setSeverity] = useState(initialRule?.severity || 'high');
  const [enabled, setEnabled] = useState(initialRule?.enabled ?? true);
  const [conditions, setConditions] = useState<Condition[]>(initialRule?.conditions || []);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(initialRule?.channels || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTest, setShowTest] = useState(false);
  const [testChannel, setTestChannel] = useState('email');

  const operators = ['>', '<', '==', '!=', 'contains', 'matches'];
  const fields = ['queue_depth', 'message_age', 'error_rate', 'latency', 'throughput'];
  const channels = ['email', 'slack', 'pagerduty', 'webhook'];

  const handleAddCondition = () => {
    setConditions([...conditions, { field: 'queue_depth', operator: '>', value: '' }]);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleConditionChange = (index: number, key: string, value: any) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [key]: value };
    setConditions(updated);
  };

  const handleChannelToggle = (channel: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    );
  };

  const handleApplyTemplate = (template: AlertTemplate) => {
    setName(template.name);
    setDescription(template.description);
    setSeverity(template.severity);
    setSelectedChannels(template.channels);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Rule name is required');
      return;
    }

    if (conditions.length === 0) {
      setError('At least one condition is required');
      return;
    }

    if (selectedChannels.length === 0) {
      setError('At least one notification channel is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const rule = {
        name,
        description,
        severity,
        enabled,
        condition: conditions.length === 1 ? conditions[0] : { AND: conditions },
        channels: selectedChannels,
      };

      await onSave(rule);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rule');
    } finally {
      setLoading(false);
    }
  };

  const handleTestAlert = async () => {
    if (onTest) {
      try {
        await onTest('test_rule', testChannel);
        setShowTest(false);
        setError(null);
      } catch (err) {
        setError('Failed to send test alert');
      }
    }
  };

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          {initialRule ? 'Edit Alert Rule' : 'Create Alert Rule'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Basic Info */}
        <Stack spacing={2} sx={{ mb: 3 }}>
          <TextField
            label="Rule Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., High Queue Depth"
            fullWidth
            required
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What triggers this alert?"
            multiline
            rows={2}
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel>Severity</InputLabel>
            <Select value={severity} label="Severity" onChange={(e) => setSeverity(e.target.value)}>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={<Checkbox checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />}
            label="Enable this rule"
          />
        </Stack>

        {/* Templates */}
        {templates.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Use Template
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {templates.map((template) => (
                <Chip
                  key={template.id}
                  label={template.name}
                  onClick={() => handleApplyTemplate(template)}
                  variant="outlined"
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Conditions */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2">Conditions</Typography>
            <Button
              startIcon={<Add />}
              size="small"
              onClick={handleAddCondition}
              variant="outlined"
            >
              Add Condition
            </Button>
          </Box>

          <Stack spacing={2}>
            {conditions.map((condition, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 50px',
                  gap: 1,
                  alignItems: 'center',
                }}
              >
                <FormControl fullWidth size="small">
                  <InputLabel>Field</InputLabel>
                  <Select
                    value={condition.field}
                    label="Field"
                    onChange={(e) => handleConditionChange(idx, 'field', e.target.value)}
                  >
                    {fields.map((f) => (
                      <MenuItem key={f} value={f}>
                        {f}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Operator</InputLabel>
                  <Select
                    value={condition.operator}
                    label="Operator"
                    onChange={(e) => handleConditionChange(idx, 'operator', e.target.value)}
                  >
                    {operators.map((op) => (
                      <MenuItem key={op} value={op}>
                        {op}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  size="small"
                  type="number"
                  value={condition.value}
                  onChange={(e) => handleConditionChange(idx, 'value', e.target.value)}
                  placeholder="Value"
                />

                <Button
                  size="small"
                  onClick={() => handleRemoveCondition(idx)}
                  sx={{ justifySelf: 'center' }}
                >
                  <Delete fontSize="small" />
                </Button>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Channels */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Notification Channels
          </Typography>
          <FormGroup row>
            {channels.map((channel) => (
              <FormControlLabel
                key={channel}
                control={
                  <Checkbox
                    checked={selectedChannels.includes(channel)}
                    onChange={() => handleChannelToggle(channel)}
                  />
                }
                label={channel.charAt(0).toUpperCase() + channel.slice(1)}
              />
            ))}
          </FormGroup>
        </Box>

        {/* Actions */}
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
          {onCancel && (
            <Button onClick={onCancel} variant="outlined">
              Cancel
            </Button>
          )}

          <Button
            startIcon={<Send />}
            onClick={() => setShowTest(true)}
            variant="outlined"
            disabled={selectedChannels.length === 0}
          >
            Test
          </Button>

          <Button onClick={handleSubmit} variant="contained" loading={loading} disabled={loading}>
            {initialRule ? 'Update' : 'Create'} Rule
          </Button>
        </Stack>
      </CardContent>

      {/* Test Alert Dialog */}
      <Dialog open={showTest} onClose={() => setShowTest(false)}>
        <DialogTitle>Test Alert</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Channel</InputLabel>
            <Select value={testChannel} label="Channel" onChange={(e) => setTestChannel(e.target.value)}>
              {selectedChannels.map((ch) => (
                <MenuItem key={ch} value={ch}>
                  {ch}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTest(false)}>Cancel</Button>
          <Button onClick={handleTestAlert} variant="contained">
            Send Test
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
