import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
} from '@mui/material';
import {
  Info as InfoIcon,
  Warning as WarningIcon,
  ErrorOutline as ErrorOutlineIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Permission {
  id: string;
  name: string;
  description: string;
  riskLevel: RiskLevel;
}

interface PluginPermissionsProps {
  permissions: Permission[];
  onApprove: (approvedPermissions: string[]) => void;
  onReject: () => void;
}

function getRiskColor(level: RiskLevel): 'success' | 'warning' | 'error' {
  switch (level) {
    case 'low':
      return 'success';
    case 'medium':
      return 'warning';
    case 'high':
    case 'critical':
      return 'error';
  }
}

function getRiskIcon(level: RiskLevel): React.ReactNode {
  switch (level) {
    case 'low':
      return <CheckCircleIcon />;
    case 'medium':
      return <InfoIcon />;
    case 'high':
      return <WarningIcon />;
    case 'critical':
      return <ErrorOutlineIcon />;
  }
}

export function PluginPermissions({
  permissions,
  onApprove,
  onReject,
}: PluginPermissionsProps) {
  const [checkedPermissions, setCheckedPermissions] = useState<Set<string>>(
    new Set(permissions.map(p => p.id))
  );

  const handleToggle = (permissionId: string) => {
    const newChecked = new Set(checkedPermissions);
    if (newChecked.has(permissionId)) {
      newChecked.delete(permissionId);
    } else {
      newChecked.add(permissionId);
    }
    setCheckedPermissions(newChecked);
  };

  const handleApprove = () => {
    onApprove(Array.from(checkedPermissions));
  };

  if (permissions.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Permissions
          </Typography>
          <Typography variant="body2" color="textSecondary">
            No permissions required
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="plugin-permissions-card">
      <CardContent>
        <Typography variant="h6" component="h2" gutterBottom>
          Required Permissions
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Review and approve the permissions this plugin requires:
        </Typography>

        {/* Permissions List */}
        <List sx={{ mb: 3 }} data-testid="plugin-permissions">
          {permissions.map(permission => (
            <ListItem
              key={permission.id}
              data-testid="permission-item"
              secondaryAction={
                <Chip
                  data-testid={`risk-badge-${permission.riskLevel}`}
                  icon={getRiskIcon(permission.riskLevel)}
                  label={permission.riskLevel.charAt(0).toUpperCase() + permission.riskLevel.slice(1)}
                  color={getRiskColor(permission.riskLevel)}
                  size="small"
                  variant="outlined"
                />
              }
              sx={{
                mb: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <ListItemIcon>
                <Checkbox
                  checked={checkedPermissions.has(permission.id)}
                  onChange={() => handleToggle(permission.id)}
                  inputProps={{
                    'aria-label': `Grant permission: ${permission.name}`,
                  }}
                />
              </ListItemIcon>
              <ListItemText
                data-testid="permission-description"
                primary={permission.name}
                secondary={permission.description}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>

      {/* Action Buttons */}
      <CardActions sx={{ gap: 1 }}>
        <Button
          variant="contained"
          color="success"
          onClick={handleApprove}
          fullWidth
        >
          Approve Permissions
        </Button>
        <Button
          variant="outlined"
          onClick={onReject}
          fullWidth
        >
          Reject
        </Button>
      </CardActions>
    </Card>
  );
}
