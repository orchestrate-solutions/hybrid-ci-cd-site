/**
 * ConfigCard Component
 * 
 * Displays a configuration card with status indicator, title, description,
 * and optional edit/delete actions. Themeable with CSS variables.
 */

import React from 'react';
import { Edit2, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';

export type ConfigStatus = 'active' | 'inactive' | 'warning' | 'error';

interface ConfigCardProps {
  /** Card title */
  title: string;
  /** Card description */
  description: string;
  /** Status indicator */
  status: ConfigStatus;
  /** Edit handler (shows button if provided) */
  onEdit?: () => void;
  /** Delete handler (shows button if provided) */
  onDelete?: () => void;
  /** Compact layout variant */
  compact?: boolean;
}

/**
 * Get status icon and color based on status
 */
function getStatusConfig(status: ConfigStatus) {
  const configs = {
    active: { icon: CheckCircle2, color: 'var(--semantic-success)', label: 'Active' },
    inactive: { icon: AlertCircle, color: 'var(--ui-border)', label: 'Inactive' },
    warning: { icon: AlertCircle, color: 'var(--semantic-warning)', label: 'Warning' },
    error: { icon: AlertCircle, color: 'var(--semantic-error)', label: 'Error' },
  };
  return configs[status];
}

/**
 * ConfigCard component
 */
export function ConfigCard({
  title,
  description,
  status,
  onEdit,
  onDelete,
  compact = false,
}: ConfigCardProps) {
  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  return (
    <div
      data-testid="config-card"
      data-status={status}
      data-compact={compact}
      className={`
        rounded-lg border transition-all duration-200
        ${compact ? 'p-3' : 'p-4'}
        ${
          status === 'active'
            ? 'border-[var(--semantic-success)] bg-[var(--bg-primary)]'
            : status === 'error'
              ? 'border-[var(--semantic-error)] bg-[var(--bg-tertiary)]'
              : status === 'warning'
                ? 'border-[var(--semantic-warning)] bg-[var(--bg-secondary)]'
                : 'border-[var(--ui-border)] bg-[var(--bg-secondary)]'
        }
        hover:shadow-md hover:border-[var(--brand-primary)]
      `}
    >
      {/* Header with status indicator and title */}
      <div className="flex items-start gap-3 mb-2">
        {/* Status indicator */}
        <div
          data-testid="status-indicator"
          aria-label={`Status: ${statusConfig.label}`}
          className="flex-shrink-0 mt-1"
        >
          <StatusIcon
            size={compact ? 16 : 20}
            color={statusConfig.color}
            className="transition-colors"
          />
        </div>

        {/* Title and actions */}
        <div className="flex-1 min-w-0">
          <h3
            className={`
              font-semibold text-[var(--text-primary)] truncate
              ${compact ? 'text-sm' : 'text-base'}
            `}
          >
            {title}
          </h3>
        </div>

        {/* Action buttons */}
        {(onEdit || onDelete) && (
          <div className="flex gap-1 flex-shrink-0">
            {onEdit && (
              <button
                data-testid="btn-edit"
                onClick={onEdit}
                className={`
                  p-1.5 rounded hover:bg-[var(--bg-secondary)]
                  text-[var(--text-secondary)] hover:text-[var(--brand-primary)]
                  transition-colors
                  ${compact ? 'hidden sm:block' : ''}
                `}
                aria-label="Edit configuration"
              >
                <Edit2 size={16} />
              </button>
            )}
            {onDelete && (
              <button
                data-testid="btn-delete"
                onClick={onDelete}
                className={`
                  p-1.5 rounded hover:bg-[var(--bg-secondary)]
                  text-[var(--text-secondary)] hover:text-[var(--semantic-error)]
                  transition-colors
                  ${compact ? 'hidden sm:block' : ''}
                `}
                aria-label="Delete configuration"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      <p
        className={`
          text-[var(--text-secondary)] line-clamp-2
          ${compact ? 'text-xs' : 'text-sm'}
        `}
      >
        {description}
      </p>

      {/* Status label for clarity */}
      {status !== 'active' && !compact && (
        <div className="mt-2 pt-2 border-t border-[var(--ui-divider)]">
          <span
            className={`
              inline-block text-xs font-medium px-2 py-1 rounded
              ${
                status === 'error'
                  ? 'bg-[var(--semantic-error)]/10 text-[var(--semantic-error)]'
                  : status === 'warning'
                    ? 'bg-[var(--semantic-warning)]/10 text-[var(--semantic-warning)]'
                    : 'bg-[var(--ui-border)]/20 text-[var(--text-secondary)]'
              }
            `}
          >
            {statusConfig.label}
          </span>
        </div>
      )}
    </div>
  );
}
