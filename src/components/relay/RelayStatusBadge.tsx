/**
 * RelayStatusBadge Component
 * Displays relay health status with color coding
 */

import { Chip, ChipProps } from "@mui/material";
import { Relay } from "@/lib/api/relay";

interface RelayStatusBadgeProps {
  status: Relay["status"];
  size?: "small" | "medium";
}

export function RelayStatusBadge({
  status,
  size = "medium",
}: RelayStatusBadgeProps) {
  const statusConfig: Record<
    Relay["status"],
    { label: string; color: ChipProps["color"]; variant: ChipProps["variant"] }
  > = {
    HEALTHY: { label: "Healthy", color: "success", variant: "filled" },
    DEGRADED: { label: "Degraded", color: "warning", variant: "filled" },
    OFFLINE: { label: "Offline", color: "error", variant: "filled" },
  };

  const config = statusConfig[status];

  return (
    <Chip
      label={config.label}
      color={config.color}
      variant={config.variant}
      size={size}
    />
  );
}
