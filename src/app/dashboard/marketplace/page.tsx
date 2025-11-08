'use client';

import { useEffect, useState, useMemo } from 'react';
import { ConfigCard } from '@/components/marketplace/ConfigCard';
import {
  SearchInput,
  CategoryButton,
  SortDropdown,
  ConfigTypeFilter,
  EmptyState,
  LoadingCard,
  StatCard,
} from '@/components/marketplace';
import { marketplaceService } from '@/lib/services/marketplaceService';
import type { ConfigPreview, ConfigCategory, MarketplaceFilters, MarketplaceStats } from '@/lib/types/marketplace';

export default function MarketplacePage() {
  const [configs, setConfigs] = useState<ConfigPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ConfigCategory | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'trending' | 'downloads' | 'recently-updated' | 'stars' | 'quality'>('trending');

  // Category counts for filter buttons
  const [categoryCounts, setCategoryCounts] = useState<Record<ConfigCategory, number>>({} as any);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [allConfigs, stats, counts] = await Promise.all([
          marketplaceService.getConfigs(),
          marketplaceService.getStats(),
          marketplaceService.getCategoryCounts(),
        ]);
        setConfigs(allConfigs);
        setStats(stats);
        setCategoryCounts(counts);
      } catch (err) {
        console.error('Failed to load marketplace data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Apply filters and search
  const filteredConfigs = useMemo(() => {
    const filters: MarketplaceFilters = {
      category: selectedCategory ?? undefined,
      type: selectedTypes.length === 1 ? (selectedTypes[0] as any) : undefined,
      sortBy,
    };

    let results = configs;

    // Apply category filter
    if (selectedCategory) {
      results = results.filter((c) => c.category === selectedCategory);
    }

    // Apply type filter
    if (selectedTypes.length > 0) {
      results = results.filter((c) => selectedTypes.includes(c.type));
    }

    // Apply search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.tags.some((t) => t.includes(q))
      );
    }

    // Apply sorting
    const sorted = [...results];
    switch (sortBy) {
      case 'trending':
        return sorted.sort((a, b) => {
          const aScore = a.metrics.downloads + a.metrics.stars * 10;
          const bScore = b.metrics.downloads + b.metrics.stars * 10;
          return bScore - aScore;
        });
      case 'downloads':
        return sorted.sort((a, b) => b.metrics.downloads - a.metrics.downloads);
      case 'stars':
        return sorted.sort((a, b) => b.metrics.stars - a.metrics.stars);
      case 'quality':
        return sorted.sort((a, b) => b.quality_score - a.quality_score);
      default:
        return sorted;
    }
  }, [configs, selectedCategory, selectedTypes, searchQuery, sortBy]);

  const mainCategories: ConfigCategory[] = ['ci-cd', 'cloud-providers', 'monitoring', 'ai-llm', 'iac', 'security'];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Config Marketplace</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover, install, and share DevOps configurations built by the community
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard icon="📦" label="Total Configs" value={stats.total_configs} />
            <StatCard icon="📥" label="Total Downloads" value={stats.total_downloads.toLocaleString()} />
            <StatCard icon="👥" label="Community Members" value={stats.total_users.toLocaleString()} />
            <StatCard icon="🔥" label="Trending This Week" value={stats.trending_this_week} />
          </div>
        )}

        {/* Search & Filters */}
        <div className="mb-8 space-y-6">
          {/* Search Bar */}
          <SearchInput value={searchQuery} onChange={setSearchQuery} />

          {/* Main category filters */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${
                    selectedCategory === null
                      ? 'bg-blue-600 text-white dark:bg-blue-500'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }
                `}
              >
                All Categories
              </button>
              {mainCategories.map((cat) => (
                <CategoryButton
                  key={cat}
                  category={cat}
                  isActive={selectedCategory === cat}
                  count={categoryCounts[cat] ?? 0}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                />
              ))}
            </div>
          </div>

          {/* Type & Sort */}
          <div className="flex gap-6 flex-wrap items-end">
            <div className="flex-1 min-w-64 space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
              <ConfigTypeFilter selected={selectedTypes} onChange={setSelectedTypes} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by</label>
              <SortDropdown value={sortBy} onChange={setSortBy} />
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-6 flex justify-between items-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing <span className="font-semibold">{filteredConfigs.length}</span> of{' '}
            <span className="font-semibold">{configs.length}</span> configs
          </p>
          {(searchQuery || selectedCategory || selectedTypes.length > 0) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
                setSelectedTypes([]);
              }}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Config Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        ) : filteredConfigs.length === 0 ? (
          <EmptyState query={searchQuery} category={selectedCategory} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredConfigs.map((config) => (
              <ConfigCard
                key={config.id}
                config={config}
                onClick={() => {
                  // In real implementation: navigate to config detail page
                  console.log('Clicked config:', config.id);
                }}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Can't find what you're looking for? <br />
            <a href="/docs/contributing" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
              Learn how to contribute your config
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
