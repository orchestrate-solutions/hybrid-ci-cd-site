/**
 * Marketplace Data Service
 * Handles config discovery, caching, filtering
 * Uses CodeUChain for data transformation pipeline
 */

import { configDiscoveryChain } from '@/lib/chains/configDiscoveryChain';
import type {
  ConfigRecord,
  ConfigPreview,
  ConfigCategory,
  ContributionType,
  MarketplaceFilters,
  MarketplaceStats,
} from '@/lib/types/marketplace';

/**
 * In-memory cache (in production: Redis)
 */
class ConfigCache {
  private cache: Map<string, ConfigRecord> = new Map();
  private previews: Map<string, ConfigPreview> = new Map();
  private stats: MarketplaceStats | null = null;
  private lastUpdated = 0;
  private TTL = 5 * 60 * 1000; // 5 minutes

  get(id: string): ConfigRecord | undefined {
    return this.cache.get(id);
  }

  set(id: string, config: ConfigRecord): void {
    this.cache.set(id, config);
    this.lastUpdated = Date.now();
  }

  getPreview(id: string): ConfigPreview | undefined {
    return this.previews.get(id);
  }

  setPreview(id: string, preview: ConfigPreview): void {
    this.previews.set(id, preview);
  }

  getAll(): ConfigRecord[] {
    return Array.from(this.cache.values());
  }

  isStale(): boolean {
    return Date.now() - this.lastUpdated > this.TTL;
  }

  clear(): void {
    this.cache.clear();
    this.previews.clear();
    this.stats = null;
  }
}

/**
 * Marketplace Service - Main data access layer
 */
export class MarketplaceService {
  private cache = new ConfigCache();
  private mockConfigs: ConfigPreview[] = [];

  constructor() {
    this.initializeMockData();
  }

  /**
   * Initialize with mock data for demo
   */
  private initializeMockData(): void {
    const categories: ConfigCategory[] = ['ci-cd', 'cloud-providers', 'monitoring', 'ai-llm'];
    const types: ContributionType[] = ['tool', 'schema', 'iac', 'llm'];

    for (let i = 1; i <= 12; i++) {
      const category = categories[i % categories.length];
      const type = types[i % types.length];

      this.mockConfigs.push({
        id: `config-${i}`,
        name: this.getMockName(category, type),
        description: this.getMockDescription(category),
        category,
        type,
        tags: this.getMockTags(category),
        author: {
          name: `Author ${i}`,
          github_username: `user${i}`,
          avatar_url: `https://i.pravatar.cc/40?img=${i}`,
          reputation_tier: ['contributor', 'builder', 'expert', 'legend'][i % 4] as any,
        },
        metrics: {
          stars: Math.floor(Math.random() * 500),
          forks: Math.floor(Math.random() * 100),
          downloads: Math.floor(Math.random() * 1000),
        },
        is_trending: i % 3 === 0,
        is_featured: i % 5 === 0,
        quality_score: 50 + Math.floor(Math.random() * 50),
      });
    }
  }

  private getMockName(category: ConfigCategory, type: ContributionType): string {
    const names: Record<ConfigCategory, string[]> = {
      'ci-cd': ['GitHub Actions Pro', 'Jenkins Integration', 'CircleCI Booster'],
      'cloud-providers': ['AWS CloudFormation', 'Azure Terraform', 'GCP Deployment'],
      monitoring: ['Prometheus Stack', 'Datadog Config', 'New Relic Setup'],
      'ai-llm': ['GPT-4 Code Review', 'Claude Log Analyzer', 'LLaMA Pipeline'],
      security: ['Snyk Security Scan', 'Trivy Image Scanner', 'OWASP Checker'],
      iac: ['EKS Cluster', 'VPC Setup', 'RDS Database'],
      databases: ['PostgreSQL Config', 'MongoDB Sharding', 'Redis Cache'],
      messaging: ['Kafka Setup', 'RabbitMQ Cluster', 'SQS Integration'],
      'api-gateways': ['Kong Config', 'AWS API Gateway', 'Nginx Setup'],
      logging: ['ELK Stack', 'Splunk Config', 'Loki Setup'],
      observability: ['Grafana Dashboards', 'Jaeger Tracing', 'OpenTelemetry'],
      plugins: ['Custom Dashboard', 'Widget Pack', 'Theme Plugin'],
      schemas: ['Canary Deployment', 'Blue-Green Strategy', 'Rolling Update'],
      automations: ['Auto Remediation', 'Cost Optimizer', 'Compliance Checker'],
      layouts: ['Minimalist View', 'Full Dashboard', 'Mobile Optimized'],
      other: ['Generic Tool', 'Utility Config', 'Helper Script'],
    };

    return names[category]?.[Math.floor(Math.random() * 3)] || 'Config';
  }

  private getMockDescription(category: ConfigCategory): string {
    const descriptions: Record<ConfigCategory, string> = {
      'ci-cd': 'Streamline your CI/CD pipeline with automated workflows',
      'cloud-providers': 'Deploy infrastructure across cloud providers',
      monitoring: 'Real-time monitoring and alerting setup',
      'ai-llm': 'Integrate AI and LLM capabilities into your workflows',
      security: 'Security scanning and vulnerability detection',
      iac: 'Infrastructure as Code templates and modules',
      databases: 'Database configuration and optimization',
      messaging: 'Message queue and event streaming setup',
      'api-gateways': 'API gateway configuration and management',
      logging: 'Centralized logging and log analysis',
      observability: 'Observability stack setup and dashboards',
      plugins: 'Extend platform functionality with plugins',
      schemas: 'Reusable workflow and deployment schemas',
      automations: 'Automated remediation and optimization',
      layouts: 'Custom dashboard layouts and themes',
      other: 'Additional tools and configurations',
    };
    return descriptions[category];
  }

  private getMockTags(category: ConfigCategory): string[] {
    const tagMap: Record<ConfigCategory, string[]> = {
      'ci-cd': ['github-actions', 'ci', 'cd', 'automation'],
      'cloud-providers': ['aws', 'azure', 'gcp', 'cloud'],
      monitoring: ['prometheus', 'monitoring', 'alerting'],
      'ai-llm': ['llm', 'ai', 'openai', 'anthropic'],
      security: ['security', 'scanning', 'cve'],
      iac: ['terraform', 'iac', 'infrastructure'],
      databases: ['database', 'postgresql', 'mysql'],
      messaging: ['kafka', 'messaging', 'queue'],
      'api-gateways': ['api', 'gateway', 'routing'],
      logging: ['logging', 'elk', 'logs'],
      observability: ['observability', 'tracing', 'metrics'],
      plugins: ['plugin', 'extension', 'custom'],
      schemas: ['schema', 'workflow', 'deployment'],
      automations: ['automation', 'remediation', 'optimization'],
      layouts: ['layout', 'dashboard', 'ui'],
      other: ['utility', 'helper', 'tool'],
    };
    return tagMap[category]?.slice(0, 3) || [];
  }

  /**
   * Get all configs with optional filtering
   */
  async getConfigs(filters?: MarketplaceFilters): Promise<ConfigPreview[]> {
    let results = [...this.mockConfigs];

    if (filters) {
      if (filters.category) {
        results = results.filter((c) => c.category === filters.category);
      }
      if (filters.type) {
        results = results.filter((c) => c.type === filters.type);
      }
      if (filters.tags?.length) {
        results = results.filter((c) => filters.tags?.some((tag) => c.tags.includes(tag)));
      }
      if (filters.minStars !== undefined) {
        results = results.filter((c) => c.metrics.stars >= filters.minStars!);
      }
      if (filters.minQualityScore !== undefined) {
        results = results.filter((c) => c.quality_score >= filters.minQualityScore!);
      }
      if (filters.author) {
        results = results.filter((c) => c.author.github_username?.includes(filters.author!));
      }

      // Sorting
      if (filters.sortBy) {
        results = this.sortConfigs(results, filters.sortBy);
      }
    }

    return results;
  }

  /**
   * Search configs by query
   */
  async searchConfigs(query: string): Promise<ConfigPreview[]> {
    const q = query.toLowerCase();
    return this.mockConfigs.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.tags.some((t) => t.includes(q)) ||
        c.author.name.toLowerCase().includes(q)
    );
  }

  /**
   * Get trending configs
   */
  async getTrending(): Promise<ConfigPreview[]> {
    return this.mockConfigs
      .filter((c) => c.is_trending)
      .sort((a, b) => b.metrics.downloads - a.metrics.downloads)
      .slice(0, 5);
  }

  /**
   * Get featured configs
   */
  async getFeatured(): Promise<ConfigPreview[]> {
    return this.mockConfigs.filter((c) => c.is_featured);
  }

  /**
   * Get configs by category with counts
   */
  async getCategoryCounts(): Promise<Record<ConfigCategory, number>> {
    const counts: Record<ConfigCategory, number> = {} as any;
    this.mockConfigs.forEach((c) => {
      counts[c.category] = (counts[c.category] ?? 0) + 1;
    });
    return counts;
  }

  /**
   * Get marketplace statistics
   */
  async getStats(): Promise<MarketplaceStats> {
    const categories = await this.getCategoryCounts();
    return {
      total_configs: this.mockConfigs.length,
      total_downloads: this.mockConfigs.reduce((sum, c) => sum + c.metrics.downloads, 0),
      total_users: Math.floor(this.mockConfigs.length * 0.7),
      featured_configs: this.mockConfigs.filter((c) => c.is_featured).length,
      trending_this_week: this.mockConfigs.filter((c) => c.is_trending).length,
      new_this_week: Math.floor(this.mockConfigs.length * 0.15),
      by_category: categories,
    };
  }

  /**
   * Load real configs from GitHub (future implementation)
   * This would replace mock data with discovered configs from GitHub API
   * 
   * Usage:
   * ```typescript
   * const service = new MarketplaceService();
   * await service.loadFromGitHub();
   * const configs = await service.getConfigs();
   * ```
   */
  async loadFromGitHub(): Promise<void> {
    try {
      console.log('[MarketplaceService] Loading configs from GitHub...');
      
      // Import GitHub service
      const { githubService } = await import('./githubService');
      
      // Discover configs
      const discoveries = await githubService.discoverConfigs();
      console.log(`[MarketplaceService] Discovered ${discoveries.length} configs from GitHub`);
      
      // Process each discovery through the pipeline
      for (const discovery of discoveries) {
        try {
          // Fetch manifest content
          const manifestContent = await githubService.getManifestContent(
            discovery.owner,
            discovery.repo
          );
          
          if (!manifestContent) {
            console.warn(`[MarketplaceService] No manifest found for ${discovery.owner}/${discovery.repo}`);
            continue;
          }
          
          // Get contributor count
          const contributorCount = await githubService.getContributorCount(
            discovery.owner,
            discovery.repo
          );
          
          // Build ConfigMetrics
          const metrics = githubService.buildMetrics(discovery.metrics, contributorCount);
          
          // Create ConfigSource
          const source: any = {
            owner: discovery.owner,
            repo: discovery.repo,
            path: discovery.path,
            github_url: `https://github.com/${discovery.owner}/${discovery.repo}`,
            manifest_url: discovery.manifest_url,
            ref: 'main', // Could detect from repo
          };
          
          // Parse and process through discovery chain
          const result = await configDiscoveryChain.process({
            id: `github-${discovery.owner}-${discovery.repo}`,
            type: 'yaml',
            content: manifestContent,
            source,
            github_metrics: discovery.metrics,
          });
          
          if (result.valid) {
            const preview = result.preview;
            // Override metrics with GitHub data
            preview.metrics = {
              stars: metrics.stars,
              forks: metrics.forks,
              downloads: 0,
            };
            
            this.mockConfigs.push(preview);
            console.log(`[MarketplaceService] Added: ${preview.name} from ${discovery.owner}/${discovery.repo}`);
          } else {
            console.warn(`[MarketplaceService] Invalid config from ${discovery.owner}/${discovery.repo}:`, result.errors);
          }
        } catch (err) {
          console.error(`[MarketplaceService] Error processing ${discovery.owner}/${discovery.repo}:`, err);
        }
      }
      
      console.log(`[MarketplaceService] GitHub sync complete: ${this.mockConfigs.length} configs total`);
    } catch (err) {
      console.error('[MarketplaceService] GitHub sync failed:', err);
      throw err;
    }
  }

  /**
   * Sort configs by specified criteria
   */
  private sortConfigs(configs: ConfigPreview[], sortBy: string): ConfigPreview[] {
    const sorted = [...configs];
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
      case 'recently-updated':
        return sorted; // Would sort by date in real implementation
      default:
        return sorted;
    }
  }
}

/**
 * Singleton instance
 */
export const marketplaceService = new MarketplaceService();
