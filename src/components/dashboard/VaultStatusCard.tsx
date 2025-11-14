import { Card, CardContent, Box, Typography, Button, Chip, Stack } from '@mui/material';
import { CheckCircle, ErrorOutline, Cloud } from '@mui/icons-material';
import { VaultConfig } from '@/lib/api/vault';

interface VaultStatusCardProps {
  vault: VaultConfig;
  onTest?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const providerIcons: Record<string, JSX.Element> = {
  aws_secrets_manager: <Cloud sx={{ color: '#FF9900' }} />,
  azure_keyvault: <Cloud sx={{ color: '#0078D4' }} />,
  gcp_secret_manager: <Cloud sx={{ color: '#4285F4' }} />,
};

const providerLabels: Record<string, string> = {
  aws_secrets_manager: 'AWS Secrets Manager',
  azure_keyvault: 'Azure Key Vault',
  gcp_secret_manager: 'GCP Secret Manager',
};

export function VaultStatusCard({ vault, onTest, onEdit, onDelete }: VaultStatusCardProps) {
  const statusColor = vault.is_connected ? '#4caf50' : '#f44336';
  const statusLabel = vault.is_connected ? 'Connected' : 'Disconnected';
  const statusIcon = vault.is_connected ? <CheckCircle /> : <ErrorOutline />;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={2}>
          {/* Header */}
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1} flex={1}>
              {providerIcons[vault.provider]}
              <Box flex={1}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {vault.name}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {providerLabels[vault.provider]} • {vault.region}
                </Typography>
              </Box>
            </Box>
            <Chip
              icon={statusIcon}
              label={statusLabel}
              size="small"
              sx={{
                backgroundColor: statusColor,
                color: 'white',
              }}
            />
          </Box>

          {/* Status Details */}
          <Box
            sx={{
              p: 1.5,
              backgroundColor: '#f5f5f5',
              borderRadius: 1,
            }}
          >
            <Stack spacing={1}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="textSecondary">
                  Status:
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {vault.is_active ? 'Active' : 'Inactive'}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="textSecondary">
                  Last Sync:
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {vault.last_sync ? new Date(vault.last_sync).toLocaleString() : 'Never'}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Actions */}
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            {onTest && (
              <Button size="small" variant="outlined" onClick={onTest}>
                Test
              </Button>
            )}
            {onEdit && (
              <Button size="small" variant="outlined" onClick={onEdit}>
                Edit
              </Button>
            )}
            {onDelete && (
              <Button size="small" variant="outlined" color="error" onClick={onDelete}>
                Delete
              </Button>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
