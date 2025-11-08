/**
 * Marketplace Types - Schemas for configs, contributions, and reputation
 * Follows federated content model: configs live in user repos, platform indexes
 */

/**
 * Config categories (from DEVOPS_WEBHOOKS_AND_TOOLS.md taxonomy)
 */
export type ConfigCategory =
  | 'ci-cd'
  | 'cloud-providers'
  | 'monitoring'
  | 'security'
  | 'iac'
  | 'databases'
  | 'messaging'
  | 'api-gateways'
  | 'logging'
  | 'ai-llm'
  | 'observability'
  | 'plugins'
  | 'schemas'
  | 'automations'
  | 'layouts'
  | 'other';

export type SharingOption = 'public' | 'unlisted' | 'private';
export type LicenseType = 'MIT' | 'Apache-2.0' | 'GPL-3.0' | 'Custom';
export type ContributionType = 'tool' | 'schema' | 'iac' | 'llm' | 'automation';
export type ReputationTier = 'contributor' | 'builder' | 'expert' | 'legend';

/**
 * Source reference - points to external repo (no replication)
 */
export interface ConfigSource {
  type: 'github' | 'gitlab' | 'bitbucket';
  owner: string;
  repo: string;
  path: string;
  ref: string; // branch/tag/commit
  commit_sha: string;
  last_updated: Date;
}

/**
 * User metadata (minimal - federated identity)
 */
export interface ConfigAuthor {
  id: string;
  github_username?: string;
  name: string;
  avatar_url?: string;
  reputation_tier: ReputationTier;
  total_contributions: number;
}

/**
 * GitHub metrics (aggregated from GitHub API)
 */
export interface ConfigMetrics {
  stars: number;
  forks: number;
  issues: number;
  watchers: number;
  downloads: number; // platform-tracked
  installations: number; // platform-tracked
  last_updated: Date;
}

/**
 * Reputation badges earned by contributors
 */
export interface Badge {
  id: string;
  name: 'pioneer' | 'innovator' | 'curator' | 'architect' | 'security-champion' | 'ai-pioneer' | 'automation-wizard';
  title: string;
  description: string;
  icon: string;
  earned_at: Date;
}

/**
 * Contribution lineage (forks, derivatives)
 */
export interface ContributionLineage {
  parent_config_id?: string;
  parent_author?: string;
  children: string[]; // IDs of configs forked from this one
  improvements_from_children: string[]; // Descriptions of improvements contributed back
}

/**
 * Core config record (what platform indexes)
 */
export interface ConfigRecord {
  id: string; // UUID
  name: string;
  description: string;
  category: ConfigCategory;
  type: ContributionType;
  tags: string[]; // e.g., ['github-actions', 'llm', 'python']
  source: ConfigSource;
  author: ConfigAuthor;
  metrics: ConfigMetrics;
  sharing: SharingOption;
  license: LicenseType;
  allow_forks: boolean;
  attribution_required: boolean;
  lineage: ContributionLineage;
  created_at: Date;
  updated_at: Date;
  is_featured: boolean;
  quality_score: number; // 0-100, based on metrics, reviews, maintenance
}

/**
 * Config preview (for marketplace display)
 */
export interface ConfigPreview {
  id: string;
  name: string;
  description: string;
  category: ConfigCategory;
  type: ContributionType;
  tags: string[];
  author: {
    name: string;
    github_username?: string;
    avatar_url?: string;
    reputation_tier: ReputationTier;
  };
  metrics: {
    stars: number;
    forks: number;
    downloads: number;
  };
  is_trending: boolean;
  is_featured: boolean;
  quality_score: number;
}

/**
 * Search/filter parameters
 */
export interface MarketplaceFilters {
  category?: ConfigCategory;
  type?: ContributionType;
  tags?: string[];
  minStars?: number;
  minQualityScore?: number;
  sharing?: SharingOption;
  sortBy?: 'trending' | 'downloads' | 'recently-updated' | 'stars' | 'quality';
  author?: string;
  license?: LicenseType;
}

/**
 * Marketplace statistics
 */
export interface MarketplaceStats {
  total_configs: number;
  total_downloads: number;
  total_users: number;
  featured_configs: number;
  trending_this_week: number;
  new_this_week: number;
  by_category: Record<ConfigCategory, number>;
}

/**
 * User reputation profile (for profile pages)
 */
export interface UserReputation {
  id: string;
  github_username: string;
  name: string;
  avatar_url: string;
  bio?: string;
  tier: ReputationTier;
  badges: Badge[];
  total_contributions: number;
  contributions_by_type: Record<ContributionType, number>;
  total_downloads: number;
  total_forks: number;
  featured_configs: number;
  total_impact_score: number; // Composite of all metrics
  joined_at: Date;
  last_active: Date;
}
