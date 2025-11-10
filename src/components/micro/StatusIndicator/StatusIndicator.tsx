/**
 * StatusIndicator Component
 * 
 * Visual indicator for status with theming support.
 * Shows online, offline, idle, busy, or error states with optional pulsing.
 */

import React from 'react';

export type Status = 'online' | 'offline' | 'idle' | 'busy' | 'error';
export type IndicatorSize = 'sm' | 'md' | 'lg';

interface StatusIndicatorProps {
  /** Status to display */
  status: Status;
  /** Size of indicator */
  size?: IndicatorSize;
  /** Whether to show pulsing animation (for online/busy) */
  pulse?: boolean;
}

/**
 * Get status color configuration
 */
function getStatusColor(status: Status): string {
  const colors = {
    online: 'var(--semantic-success)',
    offline: 'var(--ui-border)',
    idle: 'var(--semantic-warning)',
    busy: 'var(--semantic-info)',
    error: 'var(--semantic-error)',
  };
  return colors[status];
}

/**
 * Get status label for accessibility
 */
function getStatusLabel(status: Status): string {
  const labels = {
    online: 'Status: Online',
    offline: 'Status: Offline',
    idle: 'Status: Idle',
    busy: 'Status: Busy',
    error: 'Status: Error',
  };
  return labels[status];
}

/**
 * Get size styles
 */
function getSizeClasses(size: IndicatorSize = 'md'): string {
  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };
  return sizes[size];
}

/**
 * StatusIndicator component
 */
export function StatusIndicator({
  status,
  size = 'md',
  pulse = false,
}: StatusIndicatorProps) {
  const shouldPulse = pulse && (status === 'online' || status === 'busy');
  const color = getStatusColor(status);
  const sizeClasses = getSizeClasses(size);

  return (
    <div
      data-testid="status-indicator"
      data-status={status}
      data-size={size}
      data-pulse={shouldPulse}
      aria-label={getStatusLabel(status)}
      className={`inline-block rounded-full ${sizeClasses} relative`}
      style={{ backgroundColor: color }}
    >
      {/* Pulse animation ring (for active statuses) */}
      {shouldPulse && (
        <div
          className={`absolute inset-0 rounded-full animate-pulse`}
          style={{
            backgroundColor: color,
            opacity: 0.3,
          }}
        />
      )}

      {/* Inner dot for visual layering */}
      <div
        className={`absolute inset-0 rounded-full`}
        style={{
          backgroundColor: color,
          boxShadow: `0 0 ${size === 'sm' ? '4px' : size === 'lg' ? '8px' : '6px'} ${color}99`,
        }}
      />
    </div>
  );
}
