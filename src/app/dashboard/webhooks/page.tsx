'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Stack,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  Skeleton,
  Container,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useWebhooks } from '../../../lib/hooks/useWebhooks';
import { WebhookRuleEditor } from '../../../components/webhook/WebhookRuleEditor';
import { WebhookEventTable } from '../../../components/webhook/WebhookEventTable';
import { WebhookStatusBadge } from '../../../components/webhook/WebhookStatusBadge';
import { webhookApi } from '../../../lib/api/webhook';

function TabPanel(props: any) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`webhook-tabpanel-${index}`}
      aria-labelledby={`webhook-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function WebhooksDashboard() {
  const { rules, stats, computedStats, loading, error, deleteRule, toggleRule, testRule, createRule, updateRule, fetchRules } =
    useWebhooks();
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedRuleDetails, setSelectedRuleDetails] = useState(null);
  const [events, setEvents] = useState([]);
  const [testingRuleId, setTestingRuleId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState(null);
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);

  const handleCreateRule = () => {
    setSelectedRule(null);
    setEditorOpen(true);
  };

  const handleEditRule = (rule: any) => {
    setSelectedRule(rule);
    setEditorOpen(true);
  };

  const handleSaveRule = async (data: any) => {
    try {
      setEditorLoading(true);
      setEditorError(null);
      if (selectedRule) {
        await updateRule(selectedRule.id, data);
      } else {
        await createRule(data);
      }
      await fetchRules();
      setEditorOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save rule';
      setEditorError(message);
    } finally {
      setEditorLoading(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (confirm('Are you sure you want to delete this webhook rule?')) {
      try {
        await deleteRule(ruleId);
      } catch (err) {
        alert(`Failed to delete rule: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  };

  const handleToggleRule = async (rule: any) => {
    try {
      await toggleRule(rule.id, rule.enabled);
    } catch (err) {
      alert(`Failed to toggle rule: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleTestRule = async (rule: any) => {
    try {
      setTestingRuleId(rule.id);
      const result = await testRule(rule.id);
      setTestResult(result);
    } catch (err) {
      alert(`Failed to test rule: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setTestingRuleId(null);
    }
  };

  const handleViewDetails = async (rule: any) => {
    try {
      setSelectedRuleDetails(rule);
      const ruleEvents = await webhookApi.getRuleEvents(rule.id);
      setEvents(ruleEvents);
      setDetailsOpen(true);
    } catch (err) {
      alert(`Failed to load rule details: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
            Webhook Configuration
          </Typography>
          <Typography color="textSecondary">
            Manage webhook rules and event routing
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateRule}
          disabled={loading}
        >
          Create Rule
        </Button>
      </Stack>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => {}}>
          {error.message}
        </Alert>
      )}

      {/* Metrics Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              {loading ? (
                <Skeleton height={40} />
              ) : (
                <>
                  <Typography color="textSecondary" variant="body2">
                    Total Rules
                  </Typography>
                  <Typography variant="h4" sx={{ mt: 1 }}>
                    {computedStats.total}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              {loading ? (
                <Skeleton height={40} />
              ) : (
                <>
                  <Typography color="textSecondary" variant="body2">
                    Enabled
                  </Typography>
                  <Typography variant="h4" sx={{ mt: 1, color: 'success.main' }}>
                    {computedStats.enabled}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              {loading ? (
                <Skeleton height={40} />
              ) : (
                <>
                  <Typography color="textSecondary" variant="body2">
                    Disabled
                  </Typography>
                  <Typography variant="h4" sx={{ mt: 1, color: 'warning.main' }}>
                    {computedStats.disabled}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              {loading ? (
                <Skeleton height={40} />
              ) : (
                <>
                  <Typography color="textSecondary" variant="body2">
                    Success Rate
                  </Typography>
                  <Typography variant="h4" sx={{ mt: 1 }}>
                    {computedStats.successRate}%
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs: Rules & Events */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
            <Tab label={`Rules (${computedStats.total})`} id="webhook-tab-0" />
            <Tab label="Recent Events" id="webhook-tab-1" />
          </Tabs>
        </Box>

        {/* Rules Tab */}
        <TabPanel value={tabValue} index={0}>
          {loading ? (
            <Stack spacing={2}>
              {[1, 2, 3].map(i => (
                <Skeleton key={i} variant="rectangular" height={120} sx={{ borderRadius: 1 }} />
              ))}
            </Stack>
          ) : rules.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <ScheduleIcon sx={{ fontSize: 48, color: 'action.disabled', mb: 1 }} />
              <Typography color="textSecondary" sx={{ mb: 2 }}>
                No webhook rules configured yet
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleCreateRule}
              >
                Create First Rule
              </Button>
            </Box>
          ) : (
            <Stack spacing={2} sx={{ p: 2 }}>
              {rules.map(rule => (
                <Card key={rule.id} variant="outlined">
                  <CardHeader
                    title={rule.name}
                    subheader={`${rule.event_types.length} event type${rule.event_types.length !== 1 ? 's' : ''}`}
                    avatar={
                      rule.enabled ? (
                        <CheckCircleIcon sx={{ color: 'success.main' }} />
                      ) : (
                        <CancelIcon sx={{ color: 'action.disabled' }} />
                      )
                    }
                    action={
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<PlayArrowIcon />}
                          onClick={() => handleTestRule(rule)}
                          disabled={testingRuleId === rule.id}
                        >
                          Test
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditRule(rule)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          Delete
                        </Button>
                      </Stack>
                    }
                    sx={{ pb: 0 }}
                  />
                  <CardContent sx={{ pt: 0 }}>
                    <Stack spacing={1}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                          Event Types
                        </Typography>
                        <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
                          {rule.event_types.map(eventType => (
                            <Typography
                              key={eventType}
                              variant="caption"
                              sx={{
                                px: 1,
                                py: 0.5,
                                bgcolor: 'action.hover',
                                borderRadius: 0.5,
                                fontFamily: 'monospace',
                              }}
                            >
                              {eventType}
                            </Typography>
                          ))}
                        </Stack>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2">Routing Target</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          {rule.routing_target}
                        </Typography>
                      </Box>
                      {rule.conditions && rule.conditions.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                            Conditions ({rule.conditions.length})
                          </Typography>
                          <Stack spacing={0.5}>
                            {rule.conditions.map((cond, idx) => (
                              <Typography key={idx} variant="caption" sx={{ fontFamily: 'monospace' }}>
                                • {cond.field} {cond.operator} "{cond.value}"
                              </Typography>
                            ))}
                          </Stack>
                        </Box>
                      )}
                      <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
                        <Typography variant="caption">
                          <strong>Success:</strong> {rule.success_count || 0}
                        </Typography>
                        <Typography variant="caption">
                          <strong>Failed:</strong> {rule.failure_count || 0}
                        </Typography>
                        {rule.last_triggered && (
                          <Typography variant="caption">
                            <strong>Last Triggered:</strong> {new Date(rule.last_triggered).toLocaleString()}
                          </Typography>
                        )}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </TabPanel>

        {/* Events Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            <WebhookEventTable events={events} loading={loading} />
          </Box>
        </TabPanel>
      </Card>

      {/* Rule Editor Dialog */}
      <WebhookRuleEditor
        open={editorOpen}
        rule={selectedRule}
        onSave={handleSaveRule}
        onClose={() => setEditorOpen(false)}
        loading={editorLoading}
        error={editorError}
      />

      {/* Test Result Dialog */}
      <Dialog open={testResult !== null} onClose={() => setTestResult(null)}>
        <DialogTitle>Test Result</DialogTitle>
        <DialogContent>
          {testResult && (
            <Stack spacing={1}>
              <Box>
                <Typography variant="subtitle2">Status</Typography>
                <WebhookStatusBadge status={testResult.status} />
              </Box>
              <Box>
                <Typography variant="subtitle2">Latency</Typography>
                <Typography variant="body2">{testResult.latency_ms}ms</Typography>
              </Box>
              {testResult.error_message && (
                <Box>
                  <Typography variant="subtitle2">Error</Typography>
                  <Typography variant="body2" color="error">
                    {testResult.error_message}
                  </Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
}
