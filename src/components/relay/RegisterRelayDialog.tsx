/**
 * RegisterRelayDialog Component
 * Modal for registering new relays with validation
 */

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Box,
  TextField as MuiTextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { relayApi, RegisterRelayRequest } from "@/lib/api/relay";

interface RegisterRelayDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (result: any) => void;
}

export function RegisterRelayDialog({
  open,
  onClose,
  onSuccess,
}: RegisterRelayDialogProps) {
  const [formData, setFormData] = useState<RegisterRelayRequest>({
    name: "",
    endpoint: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any>(null);

  const handleChange = (field: keyof RegisterRelayRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError("Relay name is required");
      return;
    }
    if (!formData.endpoint.trim()) {
      setError("Endpoint is required");
      return;
    }

    setLoading(true);
    try {
      const result = await relayApi.registerRelay(formData);
      setSuccess(result);
      onSuccess?.(result);

      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({ name: "", endpoint: "", description: "" });
        setSuccess(null);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register relay");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Register New Relay</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}

          {success ? (
            <Box sx={{ p: 2, bgcolor: "success.light", borderRadius: 1 }}>
              <Typography color="success.dark" variant="body2" sx={{ mb: 1 }}>
                ✓ Relay registered successfully!
              </Typography>
              <Typography variant="caption" component="div" sx={{ mb: 1 }}>
                Relay ID: <strong>{success.relay_id}</strong>
              </Typography>
              <Typography variant="caption" component="div" sx={{ mb: 2 }}>
                Save your API key:
              </Typography>
              <MuiTextField
                fullWidth
                size="small"
                value={success.api_key}
                InputProps={{ readOnly: true }}
                variant="outlined"
              />
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: "block" }}>
                This key will only be shown once. Store it securely.
              </Typography>
            </Box>
          ) : (
            <>
              <MuiTextField
                label="Relay Name"
                placeholder="e.g., Production Relay"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                disabled={loading}
                fullWidth
                size="small"
              />

              <MuiTextField
                label="Endpoint URL"
                placeholder="e.g., https://relay.example.com"
                value={formData.endpoint}
                onChange={(e) => handleChange("endpoint", e.target.value)}
                disabled={loading}
                fullWidth
                size="small"
                type="url"
              />

              <MuiTextField
                label="Description (optional)"
                placeholder="Optional description"
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                disabled={loading}
                fullWidth
                size="small"
                multiline
                rows={2}
              />
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {success ? "Done" : "Cancel"}
        </Button>
        {!success && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !formData.name.trim() || !formData.endpoint.trim()}
          >
            {loading ? <CircularProgress size={20} /> : "Register"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
