/**
 * ToolBadge Component
 * 
 * Displays tool information with verified status, category, and version.
 * Themeable badge for showcasing integrated tools.
 */

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export type ToolCategory = 'ci' | 'deployment' | 'monitoring' | 'security' | 'other';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface ToolBadgeProps {
  /** Tool name */
  name: string;
  /** Tool version */
  version: string;
  /** Tool category */
  category: ToolCategory;
  /** Whether tool is verified by orchestrate */
  verified?: boolean;
  /** Badge size */
  size?: BadgeSize;
}

/**
 * Get category color and label
 */
function getCategoryConfig(category: ToolCategory) {
  const configs = {
    ci: { label: 'CI/CD', bgColor: 'bg-blue-100 dark:bg-blue-900', textColor: 'text-blue-700 dark:text-blue-300' },
    deployment: {
      label: 'Deployment',
      bgColor: 'bg-green-100 dark:bg-green-900',
      textColor: 'text-green-700 dark:text-green-300',
    },
    monitoring: {
      label: 'Monitoring',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      textColor: 'text-purple-700 dark:text-purple-300',
    },
    security: {
      label: 'Security',
      bgColor: 'bg-red-100 dark:bg-red-900',
      textColor: 'text-red-700 dark:text-red-300',
    },
    other: {
      label: 'Other',
      bgColor: 'bg-gray-100 dark:bg-gray-700',
      textColor: 'text-gray-700 dark:text-gray-300',
    },
  };
  return configs[category];
}

/**
 * Get size classes
 */
function getSizeClasses(size: BadgeSize = 'md') {
  const sizes = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2',
  };
  return sizes[size];
}

/**
 * ToolBadge component
 */
export function ToolBadge({
  name,
  version,
  category,
  verified = false,
  size = 'md',
}: ToolBadgeProps) {
  const categoryConfig = getCategoryConfig(category);
  const sizeClasses = getSizeClasses(size);

  return (
    <span
      data-testid="tool-badge"
      data-category={category}
      data-size={size}
      className={`
        inline-flex items-center rounded-full border
        bg-[var(--bg-secondary)] border-[var(--ui-border)]
        text-[var(--text-primary)]
        ${sizeClasses}
      `}
    >
      {/* Category badge */}
      <span
        data-testid="category-badge"
        className={`
          px-2 py-0.5 rounded-full font-semibold
          ${categoryConfig.bgColor} ${categoryConfig.textColor}
          ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs'}
        `}
      >
        {categoryConfig.label}
      </span>

      {/* Tool info */}
      <div className="flex items-center gap-1">
        <span className="font-medium">{name}</span>
        <span className="text-[var(--text-tertiary)]">v{version}</span>
      </div>

      {/* Verified badge */}
      {verified && (
        <span
          data-testid="verified-badge"
          className="flex items-center ml-1"
          title="Verified tool"
        >
          <CheckCircle2 size={size === 'sm' ? 12 : size === 'lg' ? 18 : 14} color="var(--semantic-success)" />
        </span>
      )}
    </span>
  );
}
