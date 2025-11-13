/**
 * RelayCard Component
 * Displays relay information with health status and actions
 */

import {
  Card,
  CardContent,
  CardActions,
  Box,
  Typography,
  Button,
  Stack,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { Relay } from "@/lib/api/relay";
import { RelayStatusBadge } from "./RelayStatusBadge";
import { formatDistanceToNow } from "date-fns";

interface RelayCardProps {
  relay: Relay;
  onDelete?: (relayId: string) => void;
  onTest?: (relayId: string) => void;
  onViewDetails?: (relayId: string) => void;
  isLoading?: boolean;
}

export function RelayCard({
  relay,
  onDelete,
  onTest,
  onViewDetails,
  isLoading = false,
}: RelayCardProps) {
  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderLeft: 4,
        borderColor:
          relay.status === "HEALTHY"
            ? "success.main"
            : relay.status === "DEGRADED"
              ? "warning.main"
              : "error.main",
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "start",
            mb: 2,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="div">
              {relay.name}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              ID: {relay.id.substring(0, 8)}...
            </Typography>
          </Box>
          <RelayStatusBadge status={relay.status} size="small" />
        </Box>

        <Stack spacing={1}>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body2" color="textSecondary">
              Version:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {relay.version}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body2" color="textSecondary">
              Last Heartbeat:
            </Typography>
            <Tooltip title={relay.last_heartbeat}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {formatDistanceToNow(new Date(relay.last_heartbeat), {
                  addSuffix: true,
                })}
              </Typography>
            </Tooltip>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body2" color="textSecondary">
              Created:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {formatDistanceToNow(new Date(relay.created_at), {
                addSuffix: true,
              })}
            </Typography>
          </Box>

          {relay.endpoint && (
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="textSecondary">
                Endpoint:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.75rem" }}>
                {relay.endpoint}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>

      <CardActions sx={{ pt: 0 }}>
        <Tooltip title="View details">
          <IconButton
            size="small"
            onClick={() => onViewDetails?.(relay.id)}
            disabled={isLoading}
          >
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Test connectivity">
          <IconButton
            size="small"
            onClick={() => onTest?.(relay.id)}
            disabled={isLoading}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Delete relay">
          <IconButton
            size="small"
            color="error"
            onClick={() => onDelete?.(relay.id)}
            disabled={isLoading}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
}
