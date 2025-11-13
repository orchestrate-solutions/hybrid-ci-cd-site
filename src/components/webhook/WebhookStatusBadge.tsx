/**
 * WebhookStatusBadge Component
 * Displays webhook rule status with color coding
 */

import { Chip, ChipProps } from "@mui/material";

interface WebhookStatusBadgeProps {
  status: "SUCCESS" | "FAILED" | "PENDING";
  size?: "small" | "medium";
}

export function WebhookStatusBadge({
  status,
  size = "medium",
}: WebhookStatusBadgeProps) {
  const statusConfig: Record<
    string,
    { label: string; color: ChipProps["color"]; variant: ChipProps["variant"] }
  > = {
    SUCCESS: { label: "Success", color: "success", variant: "filled" },
    FAILED: { label: "Failed", color: "error", variant: "filled" },
    PENDING: { label: "Pending", color: "warning", variant: "filled" },
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
