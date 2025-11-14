'use client';

import { useState } from 'react';
import { Box, Grid, Typography, Button, Tab, Tabs, Dialog, CircularProgress, Stack } from '@mui/material';
import { Add, CheckCircle, ErrorOutline } from '@mui/icons-material';
import { useVaultConfig } from '@/lib/hooks/useVaultConfig';
import { VaultStatusCard } from '@/components/dashboard/VaultStatusCard';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function VaultsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ connected: boolean; message: string } | null>(null);
  const [showTestResult, setShowTestResult] = useState(false);

  const { vaults, loading, error, testConnection } = useVaultConfig();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleTestConnection = async (vaultId: string) => {
    setTestingId(vaultId);
    try {
      const result = await testConnection(vaultId);
      setTestResult(result);
      setShowTestResult(true);
    } finally {
      setTestingId(null);
    }
  };

  if (error && !loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" mb={3}>
          Vault Settings
        </Typography>
        <Box sx={{ p: 2, backgroundColor: '#ffebee', borderRadius: 1, color: '#c62828' }}>
          <ErrorOutline sx={{ mr: 1, verticalAlign: 'middle' }} />
          <Typography variant="body1">{error.message}</Typography>
        </Box>
      </Box>
    );
  }

  const connectedVaults = vaults.filter((v) => v.is_connected);
  const disconnectedVaults = vaults.filter((v) => !v.is_connected);

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Vault Settings</Typography>
        <Button variant="contained" startIcon={<Add />}>
          Add Vault
        </Button>
      </Box>

      {loading && vaults.length === 0 ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="vault tabs">
            <Tab label={`Configured (${vaults.length})`} id="tab-0" aria-controls="tabpanel-0" />
            <Tab
              label={`Connected (${connectedVaults.length})`}
              id="tab-1"
              aria-controls="tabpanel-1"
            />
            <Tab
              label={`Disconnected (${disconnectedVaults.length})`}
              id="tab-2"
              aria-controls="tabpanel-2"
            />
          </Tabs>

          {/* All Vaults Tab */}
          <TabPanel value={tabValue} index={0}>
            {vaults.length === 0 ? (
              <Typography color="textSecondary" sx={{ p: 2 }}>
                No vaults configured. Create one to get started.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {vaults.map((vault) => (
                  <Grid item xs={12} sm={6} md={4} key={vault.id}>
                    <VaultStatusCard
                      vault={vault}
                      onTest={() => handleTestConnection(vault.id)}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          {/* Connected Vaults Tab */}
          <TabPanel value={tabValue} index={1}>
            {connectedVaults.length === 0 ? (
              <Typography color="textSecondary" sx={{ p: 2 }}>
                No connected vaults.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {connectedVaults.map((vault) => (
                  <Grid item xs={12} sm={6} md={4} key={vault.id}>
                    <VaultStatusCard
                      vault={vault}
                      onTest={() => handleTestConnection(vault.id)}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          {/* Disconnected Vaults Tab */}
          <TabPanel value={tabValue} index={2}>
            {disconnectedVaults.length === 0 ? (
              <Typography color="textSecondary" sx={{ p: 2 }}>
                All vaults are connected.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {disconnectedVaults.map((vault) => (
                  <Grid item xs={12} sm={6} md={4} key={vault.id}>
                    <VaultStatusCard
                      vault={vault}
                      onTest={() => handleTestConnection(vault.id)}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>
        </Box>
      )}

      {/* Test Connection Dialog */}
      <Dialog open={showTestResult} onClose={() => setShowTestResult(false)}>
        <Box sx={{ p: 3, minWidth: 400 }}>
          <Stack spacing={2} alignItems="center">
            {testResult?.connected ? (
              <>
                <CheckCircle sx={{ fontSize: 48, color: '#4caf50' }} />
                <Typography variant="h6">Connection Successful</Typography>
              </>
            ) : (
              <>
                <ErrorOutline sx={{ fontSize: 48, color: '#f44336' }} />
                <Typography variant="h6">Connection Failed</Typography>
              </>
            )}
            <Typography variant="body2" textAlign="center">
              {testResult?.message}
            </Typography>
            <Button variant="contained" onClick={() => setShowTestResult(false)}>
              Close
            </Button>
          </Stack>
        </Box>
      </Dialog>
    </Box>
  );
}
