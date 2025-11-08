/**
 * ConfigCard - Micro-component for displaying a single config in marketplace
 * Reusable, single-responsibility, heavily testable
 */

'use client';

import { ConfigCategory, ConfigPreview, ReputationTier } from '@/lib/types/marketplace';

interface Props {
  config: ConfigPreview;
  onClick?: () => void;
  isHighlighted?: boolean;
}

const CATEGORY_COLORS: Record<ConfigCategory, string> = {
  'ci-cd': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'cloud-providers': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  monitoring: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  security: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  iac: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  databases: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  messaging: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  'api-gateways': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  logging: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  'ai-llm': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  observability: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  plugins: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
  schemas: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  automations: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
  layouts: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  other: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
};

const TIER_ICONS: Record<ReputationTier, string> = {
  contributor: '🌱',
  builder: '⚡',
  expert: '⭐',
  legend: '👑',
};

export function ConfigCard({ config, onClick, isHighlighted }: Props) {
  return (
    <button
      onClick={onClick}
      className={`
        group relative flex flex-col gap-3 rounded-lg border-2 p-4 text-left
        transition-all duration-200
        ${
          isHighlighted
            ? 'border-blue-500 bg-blue-50 shadow-md dark:border-blue-400 dark:bg-blue-950'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600'
        }
      `}
    >
      {/* Header: Title + Badges */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {config.name}
          </h3>
          {config.is_trending && (
            <div className="text-xs font-medium text-orange-600 dark:text-orange-400">🔥 Trending</div>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{config.description}</p>

      {/* Category & Type */}
      <div className="flex gap-2 flex-wrap">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${CATEGORY_COLORS[config.category]}`}>
          {config.category.replace('-', ' ')}
        </span>
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          {config.type}
        </span>
      </div>

      {/* Tags */}
      {config.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {config.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              #{tag}
            </span>
          ))}
          {config.tags.length > 3 && (
            <span className="text-xs px-2 py-1 text-gray-500 dark:text-gray-400">+{config.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Metrics */}
      <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
        <span>⭐ {config.metrics.stars}</span>
        <span>🔄 {config.metrics.forks}</span>
        <span>📥 {config.metrics.downloads}</span>
        {config.quality_score >= 80 && <span className="text-green-600 dark:text-green-400">✓ High Quality</span>}
      </div>

      {/* Author */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        {config.author.avatar_url && (
          <img
            src={config.author.avatar_url}
            alt={config.author.name}
            className="w-5 h-5 rounded-full"
          />
        )}
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{config.author.name}</span>
        <span className="text-xs">{TIER_ICONS[config.author.reputation_tier]}</span>
      </div>

      {/* Featured Badge */}
      {config.is_featured && (
        <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded">
          ★ Featured
        </div>
      )}
    </button>
  );
}
