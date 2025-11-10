/**
 * Field Skeleton Placeholder
 *
 * A simple skeleton/placeholder for fields in loading state.
 * Shows a greyed-out box where content will appear.
 */

import React from 'react';
import { Skeleton, Box, BoxProps } from '@mui/material';

export interface FieldSkeletonProps extends Omit<BoxProps, 'children'> {
  /** Height of the skeleton */
  height?: number | string;
  /** Width of the skeleton */
  width?: number | string;
  /** Show label skeleton */
  showLabel?: boolean;
  /** Show helper text skeleton */
  showHelperText?: boolean;
  /** Variant of skeleton animation */
  variant?: 'text' | 'circular' | 'rectangular';
}

/**
 * FieldSkeleton Component
 *
 * Displays a placeholder skeleton for fields during loading.
 * Includes optional label and helper text skeletons.
 */
export function FieldSkeleton({
  height = 56,
  width = '100%',
  showLabel = true,
  showHelperText = true,
  variant = 'rectangular',
  sx,
  ...props
}: FieldSkeletonProps) {
  return (
    <Box sx={{ width, ...sx }} data-testid="field-skeleton" {...props}>
      {showLabel && (
        <Skeleton
          variant="text"
          width="40%"
          height={16}
          sx={{ mb: 1 }}
          data-testid="field-skeleton-label"
        />
      )}
      <Skeleton
        variant={variant}
        width={width}
        height={height}
        sx={{ mb: showHelperText ? 0.75 : 0 }}
        data-testid="field-skeleton-main"
      />
      {showHelperText && (
        <Skeleton
          variant="text"
          width="60%"
          height={12}
          sx={{ mt: 0.75 }}
          data-testid="field-skeleton-helper"
        />
      )}
    </Box>
  );
}
