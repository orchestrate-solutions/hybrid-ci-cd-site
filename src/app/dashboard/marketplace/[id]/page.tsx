'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { marketplaceService } from '@/lib/services/marketplaceService';
import type { ConfigPreview } from '@/lib/types/marketplace';

interface ConfigDetails extends ConfigPreview {
  fullDescription?: string;
  installation_url?: string;
  documentation_url?: string;
  github_url?: string;
}

export default function ConfigDetailPage() {
  const params = useParams();
  const router = useRouter();
  const configId = params.id as string;

  const [config, setConfig] = useState<ConfigDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [installedCount, setInstalledCount] = useState(0);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        
        // Fetch from marketplace service
        const configs = await marketplaceService.getConfigs();
        const found = configs.find((c) => c.id === configId);

        if (!found) {
          setError('Config not found');
          return;
        }

        setConfig({
          ...found,
          fullDescription: `${found.description}\n\nFull configuration details would be loaded from the GitHub manifest file. This includes:\n\n- Complete setup instructions\n- Dependencies and requirements\n- Usage examples\n- Configuration options\n- Troubleshooting guide`,
          github_url: `https://github.com/example/configs-${configId}`,
          documentation_url: `/docs/config/${configId}`,
          installation_url: `/dashboard/marketplace/${configId}/install`,
        });

        // Simulate loading installation count
        setInstalledCount(Math.floor(Math.random() * 150));
      } catch (err) {
        console.error('Failed to load config:', err);
        setError('Failed to load configuration');
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [configId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'Configuration not found'}</p>
        <button
          onClick={() => router.push('/dashboard/marketplace')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500"
        >
          Back to Marketplace
        </button>
      </div>
    );
  }

  const CATEGORY_COLORS: Record<string, string> = {
    'ci-cd': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'cloud-providers': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    monitoring: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    security: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'ai-llm': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  };

  const TIER_ICONS: Record<string, string> = {
    contributor: '🌱',
    builder: '🎯',
    expert: '⭐',
    legend: '👑',
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push('/dashboard/marketplace')}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 mb-4 text-sm font-medium"
          >
            ← Back to Marketplace
          </button>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{config.name}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{config.description}</p>

          {/* Quick Stats */}
          <div className="flex gap-6 flex-wrap items-center text-sm">
            <span className={`px-3 py-1 rounded-full font-medium ${CATEGORY_COLORS[config.category] || 'bg-gray-100'}`}>
              {config.category.replace('-', ' ')}
            </span>
            <span className="text-gray-600 dark:text-gray-400">⭐ {config.metrics.stars} stars</span>
            <span className="text-gray-600 dark:text-gray-400">🔄 {config.metrics.forks} forks</span>
            <span className="text-gray-600 dark:text-gray-400">📥 {installedCount} installations</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2">
            {/* Description */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">About</h2>
              <div className="prose dark:prose-invert max-w-none">
                {config.fullDescription?.split('\n').map((line, i) => (
                  <p key={i} className="text-gray-700 dark:text-gray-300 mb-3">
                    {line}
                  </p>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Tags</h3>
              <div className="flex gap-2 flex-wrap">
                {config.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Stars</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{config.metrics.stars}</p>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Forks</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{config.metrics.forks}</p>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Downloads</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{config.metrics.downloads}</p>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Quality Score</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{config.quality_score}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Author Card */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6 bg-gray-50 dark:bg-gray-900">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Author</h3>
              <div className="flex items-center gap-3 mb-4">
                {config.author.avatar_url && (
                  <img
                    src={config.author.avatar_url}
                    alt={config.author.name}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{config.author.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">@{config.author.github_username}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">{TIER_ICONS[config.author.reputation_tier]}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">{config.author.reputation_tier}</span>
              </div>
            </div>

            {/* Install Card */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <button
                onClick={() => alert('Installation workflow coming soon!')}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors mb-3"
              >
                + Install Config
              </button>
              <button
                onClick={() => window.open(config.github_url, '_blank')}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
              >
                View on GitHub
              </button>
            </div>

            {/* Info Card */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Info</h4>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">Type</dt>
                  <dd className="text-gray-900 dark:text-white capitalize">{config.type}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">Installations</dt>
                  <dd className="text-gray-900 dark:text-white">{installedCount}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">Quality</dt>
                  <dd className="text-gray-900 dark:text-white">{config.quality_score}%</dd>
                </div>
                {config.is_trending && (
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400">Status</dt>
                    <dd className="text-orange-600 dark:text-orange-400 font-medium">🔥 Trending</dd>
                  </div>
                )}
                {config.is_featured && (
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400">Featured</dt>
                    <dd className="text-yellow-600 dark:text-yellow-400 font-medium">★ Featured</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
