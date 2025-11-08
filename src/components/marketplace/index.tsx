/**
 * Marketplace Micro-Components
 * Single-responsibility, testable, composable UI blocks
 */

'use client';

import { ConfigCategory } from '@/lib/types/marketplace';

/**
 * SearchInput - Reusable search field with clear button
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search configs...',
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
      />
      <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ✕
        </button>
      )}
    </div>
  );
}

/**
 * CategoryFilter - Single category button
 */
export function CategoryButton({
  category,
  isActive,
  count,
  onClick,
}: {
  category: ConfigCategory;
  isActive: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
        ${
          isActive
            ? 'bg-blue-600 text-white dark:bg-blue-500'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
        }
      `}
    >
      {category.replace('-', ' ')} <span className="text-xs opacity-75">({count})</span>
    </button>
  );
}

/**
 * SortOptions - Dropdown for sorting
 */
export function SortDropdown({
  value,
  onChange,
}: {
  value: 'trending' | 'downloads' | 'recently-updated' | 'stars' | 'quality';
  onChange: (value: 'trending' | 'downloads' | 'recently-updated' | 'stars' | 'quality') => void;
}) {
  const options = [
    { value: 'trending', label: '🔥 Trending' },
    { value: 'downloads', label: '📥 Most Downloaded' },
    { value: 'stars', label: '⭐ Most Starred' },
    { value: 'recently-updated', label: '📅 Recently Updated' },
    { value: 'quality', label: '✓ Highest Quality' },
  ] as const;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as typeof value)}
      className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm font-medium focus:outline-none focus:border-blue-500"
    >
      {options.map(({ value: v, label }) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}

/**
 * ConfigTypeFilter - Toggle between config types
 */
export function ConfigTypeFilter({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (types: string[]) => void;
}) {
  const types = ['tool', 'schema', 'iac', 'llm', 'automation'];

  return (
    <div className="flex gap-2 flex-wrap">
      {types.map((type) => (
        <button
          key={type}
          onClick={() => {
            if (selected.includes(type)) {
              onChange(selected.filter((t) => t !== type));
            } else {
              onChange([...selected, type]);
            }
          }}
          className={`
            px-3 py-1.5 rounded text-sm font-medium transition-colors
            ${
              selected.includes(type)
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }
          `}
        >
          {type}
        </button>
      ))}
    </div>
  );
}

/**
 * QualityBadge - Visual indicator of config quality
 */
export function QualityBadge({ score }: { score: number }) {
  const getColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (score >= 75) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const getLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'New';
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${getColor(score)}`}>
      {getLabel(score)} ({score})
    </span>
  );
}

/**
 * EmptyState - Show when no configs found
 */
export function EmptyState({ query, category }: { query?: string; category?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-4xl mb-3">📦</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No configs found</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
        {query ? `No results for "${query}"` : 'Try adjusting your filters'}
        {category ? ` in ${category}` : ''}
      </p>
      <button className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
        Browse all configs
      </button>
    </div>
  );
}

/**
 * LoadingCard - Skeleton loader for config cards
 */
export function LoadingCard() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900 animate-pulse">
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
      <div className="flex gap-2">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
      </div>
      <div className="flex gap-4 text-xs pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-10" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-10" />
      </div>
    </div>
  );
}

/**
 * StatCard - Display marketplace statistics
 */
export function StatCard({ icon, label, value }: { icon: string; label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}
