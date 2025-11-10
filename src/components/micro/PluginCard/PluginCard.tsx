import React from 'react';
import { Star, Download, CheckCircle2, ArrowUp } from 'lucide-react';

export type PluginStatus = 'available' | 'installed' | 'update-available';

export interface Plugin {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  stars: number;
  downloads: number;
  verified: boolean;
  status: PluginStatus;
  installedVersion?: string;
}

interface PluginCardProps {
  plugin: Plugin;
  onInstall: (pluginId: string) => void;
}

export function PluginCard({ plugin, onInstall }: PluginCardProps) {
  const handleClick = () => {
    onInstall(plugin.id);
  };

  const getButtonLabel = () => {
    switch (plugin.status) {
      case 'available':
        return 'Install';
      case 'installed':
        return 'Configure';
      case 'update-available':
        return 'Update';
    }
  };

  const getButtonColor = () => {
    switch (plugin.status) {
      case 'available':
        return 'var(--brand-primary)';
      case 'installed':
        return 'var(--semantic-info)';
      case 'update-available':
        return 'var(--semantic-warning)';
    }
  };

  return (
    <div
      className="rounded-lg border p-4 transition-all hover:shadow-lg"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--ui-border)',
        boxShadow: `0 1px 3px var(--ui-shadow)`,
      }}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <h3
            className="truncate text-lg font-semibold"
            style={{ color: 'var(--text-primary)' }}
            data-testid="plugin-name"
          >
            {plugin.name}
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            by {plugin.author}
          </p>
        </div>
        {plugin.verified && (
          <div className="ml-2 flex items-center gap-1 rounded-full px-2 py-1" style={{ backgroundColor: 'rgba(76, 175, 80, 0.1)' }}>
            <CheckCircle2 size={14} style={{ color: 'var(--semantic-success)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--semantic-success)' }}>
              Verified
            </span>
          </div>
        )}
      </div>

      {/* Status Badge */}
      {plugin.status === 'update-available' && (
        <div className="mb-2 inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium" style={{ backgroundColor: 'rgba(255, 193, 7, 0.1)', color: 'var(--semantic-warning)' }}>
          <ArrowUp size={12} />
          Update Available
        </div>
      )}

      {/* Version and Downloads */}
      <div className="mb-3 flex items-center gap-4 text-sm">
        <span style={{ color: 'var(--text-secondary)' }}>v{plugin.version}</span>
        {plugin.installedVersion && plugin.status === 'update-available' && (
          <span style={{ color: 'var(--text-tertiary)' }}>installed: v{plugin.installedVersion}</span>
        )}
      </div>

      {/* Description */}
      <p
        className="mb-3 line-clamp-2 text-sm"
        style={{ color: 'var(--text-secondary)' }}
        data-testid="plugin-description"
      >
        {plugin.description}
      </p>

      {/* Stats */}
      <div className="mb-4 flex items-center gap-6 text-sm">
        <div className="flex items-center gap-1">
          <Star size={16} style={{ color: 'var(--semantic-warning)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>{plugin.stars}</span>
        </div>
        <div className="flex items-center gap-1">
          <Download size={16} style={{ color: 'var(--semantic-info)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>{plugin.downloads} downloads</span>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleClick}
        className="w-full rounded px-4 py-2 font-medium text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: getButtonColor() }}
      >
        {getButtonLabel()}
      </button>
    </div>
  );
}
