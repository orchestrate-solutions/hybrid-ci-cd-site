'use client';

/**
 * Alert Configuration Page
 * Setup and manage alert rules, notification channels, and quiet hours
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Skeleton,
  Alert,
  Tabs,
  Tab,
  Stack,
} from '@mui/material';
import {
  Add,
  Notifications,
  CheckCircle,
  WarningAmber,
  Settings,
  History,
} from '@mui/icons-material';
import { useAlertRules } from '@/lib/hooks/useAlertRules';
import AlertRuleBuilder from '@/components/dashboard/alerts/AlertRuleBuilder/AlertRuleBuilder';
import AlertHistoryTable from '@/components/dashboard/alerts/AlertHistoryTable/AlertHistoryTable';

interface TabPanel {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanel) {
  return (
    <div hidden={value !== index} style={{ width: '100%' }}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AlertConfigurationPage() {
  const {
    rules,
    history,
    templates,
    loading,
    error,
    fetchRules,
    fetchTemplates,
    fetchHistory,
    createRule,
    deleteRule,
    toggleRule,
    testAlert,
    acknowledgeAlert,
    getStats,
  } = useAlertRules();

  const [activeTab, setActiveTab] = useState(0);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedRule, setSelectedRule] = useState<any>(null);

  // Initialize
  useEffect(() => {
    fetchRules();
    fetchTemplates();
    fetchHistory();
  }, []);

  const stats = useMemo(() => {
    return getStats();
  }, [rules, history]);

  const handleCreateRule = async (rule: any) => {
    try {
      await createRule(rule);
      setShowBuilder(false);
      setSelectedRule(null);
      fetchRules();
    } catch (err) {
      console.error('Failed to create rule:', err);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (confirm('Delete this alert rule?')) {
      try {
        await deleteRule(ruleId);
      } catch (err) {
        console.error('Failed to delete rule:', err);
      }
    }
  };

  const handleTestAlert = async (ruleId: string, channel: string) => {
    try {
      await testAlert(ruleId, channel);
    } catch (err) {
      console.error('Failed to test alert:', err);
    }
  };

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" action={<Button onClick={fetchRules}>Retry</Button>}>
          Failed to load alerts: {error.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Alert Configuration
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Setup and manage operational alerts across your infrastructure
        </Typography>
      </Box>

      {/* Statistics */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          {
            title: 'Total Rules',
            value: stats.total_rules,
            icon: <Settings />,
            color: 'primary',
          },
          { title: 'Active Rules', value: stats.active_rules, icon: <CheckCircle />, color: 'success' },
          {
            title: 'Critical Rules',
            value: stats.critical_rules,
            icon: <WarningAmber />,
            color: 'error',
          },
          { title: 'Total Alerts', value: stats.total_alerts, icon: <History />, color: 'info' },
          {
            title: 'Unacknowledged',
            value: stats.unacknowledged,
            icon: <Notifications />,
            color: 'warning',
          },
        ].map((stat, idx) => (
          <Grid item xs={12} sm={6} md={4} lg={2.4} key={idx}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ color: `${stat.color}.main` }}>{stat.icon}</Box>
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

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)}>
            <Tab label="Alert Rules" />
            <Tab label="Alert History" />
            <Tab label="Notification Channels" />
            <Tab label="Quiet Hours" />
          </Tabs>
        </Box>

        <CardContent>
          {/* Tab 1: Rules */}
          <TabPanel value={activeTab} index={0}>
            {loading ? (
              <Skeleton variant="rectangular" height={200} />
            ) : (
              <>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle1">Your Alert Rules</Typography>
                  <Button
                    startIcon={<Add />}
                    variant="contained"
                    onClick={() => {
                      setSelectedRule(null);
                      setShowBuilder(true);
                    }}
                  >
                    New Rule
                  </Button>
                </Box>

                {showBuilder ? (
                  <AlertRuleBuilder
                    templates={templates}
                    initialRule={selectedRule}
                    onSave={handleCreateRule}
                    onCancel={() => {
                      setShowBuilder(false);
                      setSelectedRule(null);
                    }}
                  />
                ) : (
                  <Stack spacing={2}>
                    {rules.length === 0 ? (
                      <Typography sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                        No alert rules configured yet
                      </Typography>
                    ) : (
                      rules.map((rule) => (
                        <Card key={rule.id} sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="subtitle2">{rule.name}</Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {rule.description}
                            </Typography>
                            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                              <Chip
                                label={rule.severity}
                                size="small"
                                color={rule.severity === 'critical' ? 'error' : 'warning'}
                              />
                              <Chip
                                label={rule.enabled ? 'Enabled' : 'Disabled'}
                                size="small"
                                variant={rule.enabled ? 'filled' : 'outlined'}
                              />
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Button
                              size="small"
                              onClick={() => handleTestAlert(rule.id, rule.channels[0])}
                            >
                              Test
                            </Button>
                            <Button
                              size="small"
                              onClick={() => {
                                setSelectedRule(rule);
                                setShowBuilder(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              onClick={() => handleDeleteRule(rule.id)}
                              sx={{ color: 'error.main' }}
                            >
                              Delete
                            </Button>
                          </Box>
                        </Card>
                      ))
                    )}
                  </Stack>
                )}
              </>
            )}
          </TabPanel>

          {/* Tab 2: History */}
          <TabPanel value={activeTab} index={1}>
            <AlertHistoryTable
              alerts={history}
              onAcknowledge={acknowledgeAlert}
              loading={loading}
            />
          </TabPanel>

          {/* Tab 3: Notification Channels */}
          <TabPanel value={activeTab} index={2}>
            <Typography variant="body2" sx={{ color: 'text.secondary', py: 3, textAlign: 'center' }}>
              Notification channel configuration coming soon
            </Typography>
          </TabPanel>

          {/* Tab 4: Quiet Hours */}
          <TabPanel value={activeTab} index={3}>
            <Typography variant="body2" sx={{ color: 'text.secondary', py: 3, textAlign: 'center' }}>
              Quiet hours configuration coming soon
            </Typography>
          </TabPanel>
        </CardContent>
      </Card>
    </Container>
  );
}
