/**
 * LoadingSpinner Microcomponent
 *
 * A simple, accessible loading spinner for indicating async operations.
 * Uses MUI CircularProgress with consistent sizing and theming.
 */

import React from 'react';
import { CircularProgress, Box, BoxProps } from '@mui/material';

export interface LoadingSpinnerProps extends Omit<BoxProps, 'children'> {
  /** Size of the spinner */
  size?: 'small' | 'medium' | 'large';
  /** Custom pixel size (overrides size prop) */
  pixelSize?: number;
  /** Show with a label beneath */
  label?: string;
  /** Thickness of the spinner line */
  thickness?: number;
  /** Variant of spinner */
  variant?: 'circular' | 'indeterminate';
}

/**
 * Map size prop to pixel values
 */
const SIZE_MAP = {
  small: 24,
  medium: 40,
  large: 56,
} as const;

/**
 * LoadingSpinner Component
 *
 * Displays a centered circular progress indicator with optional label.
 * Perfect for loading states, async operations, and page transitions.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <LoadingSpinner />
 *
 * // With label
 * <LoadingSpinner size="large" label="Loading data..." />
 *
 * // Custom sizing
 * <LoadingSpinner pixelSize={32} />
 * ```
 */
export function LoadingSpinner({
  size = 'medium',
  pixelSize,
  label,
  thickness = 3.6,
  variant = 'indeterminate',
  sx,
  ...props
}: LoadingSpinnerProps) {
  const spinnerSize = pixelSize || SIZE_MAP[size];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        py: label ? 3 : 2,
        ...sx,
      }}
      data-testid="loading-spinner"
      {...props}
    >
      <CircularProgress
        size={spinnerSize}
        thickness={thickness}
        variant={variant}
        data-testid="spinner-circle"
      />
      {label && (
        <Box
          component="span"
          sx={{
            fontSize: '0.875rem',
            color: 'text.secondary',
            fontWeight: 500,
            textAlign: 'center',
            maxWidth: '200px',
          }}
          data-testid="spinner-label"
        >
          {label}
        </Box>
      )}
    </Box>
  );
}
