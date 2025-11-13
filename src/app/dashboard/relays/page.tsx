/**
 * Relay Management Page
 * Task 2A.1 - Manage relay registration, health monitoring, and API keys
 */

"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Skeleton,
  Stack,
  Typography,
  Alert,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Add as AddIcon, Settings as SettingsIcon } from "@mui/icons-material";
import { useRelays } from "@/lib/hooks/useRelays";
import { RelayCard } from "@/components/relay/RelayCard";
import { RegisterRelayDialog } from "@/components/relay/RegisterRelayDialog";

export default function RelayManagementPage() {
  const [registerOpen, setRegisterOpen] = useState(false);
  const [selectedRelayId, setSelectedRelayId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [testingRelayId, setTestingRelayId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);

  const {
    relays,
    metrics,
    stats,
    loading,
    error,
    deleteRelay,
    testRelay,
    registerRelay,
  } = useRelays({ pollInterval: 5000 });

  const handleTestRelay = async (relayId: string) => {
    setTestingRelayId(relayId);
    try {
      const result = await testRelay(relayId);
      setTestResult(result);
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : "Test failed",
      });
    } finally {
      setTestingRelayId(null);
    }
  };

  const handleDeleteRelay = async (relayId: string) => {
    if (window.confirm("Are you sure you want to delete this relay?")) {
      try {
        await deleteRelay(relayId);
      } catch (err) {
        console.error("Failed to delete relay:", err);
      }
    }
  };

  const selectedRelay = relays.find((r) => r.id === selectedRelayId);

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Relay Management
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
              Register and monitor relays that forward webhooks to your infrastructure
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setRegisterOpen(true)}
          >
            Register Relay
          </Button>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" onClose={() => window.location.reload()}>
            {error.message}
          </Alert>
        )}

        {/* Metrics Cards */}
        <Grid container spacing={2}>
          {loading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Grid item xs={12} sm={6} md={3} key={i}>
                  <Skeleton variant="rectangular" height={100} />
                </Grid>
              ))}
            </>
          ) : (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" variant="body2">
                      Total Relays
                    </Typography>
                    <Typography variant="h5" sx={{ mt: 1 }}>
                      {stats.total}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderLeft: 4, borderColor: "success.main" }}>
                  <CardContent>
                    <Typography color="textSecondary" variant="body2">
                      Healthy
                    </Typography>
                    <Typography variant="h5" color="success.main" sx={{ mt: 1 }}>
                      {stats.healthy}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderLeft: 4, borderColor: "warning.main" }}>
                  <CardContent>
                    <Typography color="textSecondary" variant="body2">
                      Degraded
                    </Typography>
                    <Typography variant="h5" color="warning.main" sx={{ mt: 1 }}>
                      {stats.degraded}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderLeft: 4, borderColor: "error.main" }}>
                  <CardContent>
                    <Typography color="textSecondary" variant="body2">
                      Offline
                    </Typography>
                    <Typography variant="h5" color="error.main" sx={{ mt: 1 }}>
                      {stats.offline}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}
        </Grid>

        {/* Relays Grid */}
        {loading ? (
          <Grid container spacing={2}>
            {[1, 2, 3].map((i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton variant="rectangular" height={250} />
              </Grid>
            ))}
          </Grid>
        ) : relays.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: "center", py: 5 }}>
              <SettingsIcon
                sx={{ fontSize: 48, color: "text.secondary", mb: 1 }}
              />
              <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
                No relays registered yet
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Register your first relay to get started with webhook forwarding
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setRegisterOpen(true)}
              >
                Register Relay
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {relays.map((relay) => (
              <Grid item xs={12} sm={6} md={4} key={relay.id}>
                <RelayCard
                  relay={relay}
                  onDelete={() => handleDeleteRelay(relay.id)}
                  onTest={() => handleTestRelay(relay.id)}
                  onViewDetails={() => {
                    setSelectedRelayId(relay.id);
                    setDetailsOpen(true);
                  }}
                  isLoading={testingRelayId === relay.id}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Stack>

      {/* Dialogs */}
      <RegisterRelayDialog
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSuccess={() => {
          setRegisterOpen(false);
        }}
      />

      {/* Relay Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Relay Details</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedRelay ? (
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Relay ID
                </Typography>
                <Typography variant="body2">{selectedRelay.id}</Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="textSecondary">
                  Name
                </Typography>
                <Typography variant="body2">{selectedRelay.name}</Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="textSecondary">
                  Status
                </Typography>
                <Typography variant="body2">{selectedRelay.status}</Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="textSecondary">
                  Version
                </Typography>
                <Typography variant="body2">{selectedRelay.version}</Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="textSecondary">
                  Last Heartbeat
                </Typography>
                <Typography variant="body2">{selectedRelay.last_heartbeat}</Typography>
              </Box>

              {testResult && (
                <Alert severity={testResult.success ? "success" : "error"}>
                  {testResult.message}
                  {testResult.latency_ms && (
                    <Box sx={{ mt: 1 }}>Latency: {testResult.latency_ms}ms</Box>
                  )}
                </Alert>
              )}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
