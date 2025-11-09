/**
 * GitHub Service - Config Discovery & Metrics Aggregation
 *
 * Discovers configs from GitHub repos by searching for .hybrid-cicd/manifest.yaml
 * Aggregates metrics (stars, forks, watchers, contributors) for reputation calculation
 * Implements caching with TTL to respect API rate limits
 */

import type { ConfigRecord, ConfigSource, ConfigMetrics } from '@/lib/types/marketplace';

interface GitHubRepoMetrics {
  stars: number;
  forks: number;
  watchers: number;
  open_issues: number;
  created_at: string;
  updated_at: string;
  language: string | null;
  topics: string[];
}

interface DiscoveryResult {
  owner: string;
  repo: string;
  path: string;
  manifest_url: string;
  raw_manifest_url: string;
  metrics: GitHubRepoMetrics;
}

/**
 * Cache implementation with TTL
 */
class GitHubCache {
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes

  get(key: string): unknown | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.TTL_MS) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: unknown): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * GitHub Service - Singleton
 */
class GitHubServiceImpl {
  private cache = new GitHubCache();
  private token: string | null = null;
  private baseURL = 'https://api.github.com';

  constructor(token?: string) {
    this.token = token || process.env.GITHUB_TOKEN || null;
  }

  /**
   * Get authorization header
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Fetch from GitHub API with error handling
   */
  private async fetch(path: string): Promise<unknown> {
    const url = `${this.baseURL}${path}`;

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        console.error(`[GitHubService] API error for ${path}:`, response.status, response.statusText);
        throw new Error(`GitHub API error: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error(`[GitHubService] Fetch error for ${path}:`, err);
      throw err;
    }
  }

  /**
   * Discover configs by searching for manifest files
   * Returns list of repos with .hybrid-cicd/manifest.yaml
   */
  async discoverConfigs(): Promise<DiscoveryResult[]> {
    const cacheKey = 'discover-configs';
    const cached = this.cache.get(cacheKey) as DiscoveryResult[] | null;
    if (cached) return cached;

    try {
      console.log('[GitHubService] Discovering configs with manifest files...');

      // Search for repos with .hybrid-cicd/manifest.yaml
      // This requires a file search through GitHub's search API
      // For now, we'll implement discovery through repository code search
      const query = 'filename:.hybrid-cicd/manifest.yaml';
      const searchUrl = `/search/code?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=30`;

      const searchResult = (await this.fetch(searchUrl)) as { items?: Array<any> } | null;
      const results: DiscoveryResult[] = [];

      for (const item of (searchResult?.items || []) as any[]) {
        // Parse repository and file path from search result
        const [owner, repo] = item.repository.full_name.split('/');
        const manifestPath = item.path;

        // Fetch repository metrics
        const metrics = await this.getRepoMetrics(owner, repo);

        results.push({
          owner,
          repo,
          path: manifestPath,
          manifest_url: item.html_url,
          raw_manifest_url: `https://raw.githubusercontent.com/${owner}/${repo}/main/${manifestPath}`,
          metrics,
        });
      }

      console.log(`[GitHubService] Discovered ${results.length} configs`);
      this.cache.set(cacheKey, results);
      return results;
    } catch (err) {
      console.error('[GitHubService] Discovery failed:', err);
      return [];
    }
  }

  /**
   * Get repository metrics (stars, forks, etc.)
   */
  async getRepoMetrics(owner: string, repo: string): Promise<GitHubRepoMetrics> {
    const cacheKey = `repo-metrics:${owner}/${repo}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const repoData = await this.fetch(`/repos/${owner}/${repo}`);

      const metrics: GitHubRepoMetrics = {
        stars: repoData.stargazers_count ?? 0,
        forks: repoData.forks_count ?? 0,
        watchers: repoData.watchers_count ?? 0,
        open_issues: repoData.open_issues_count ?? 0,
        created_at: repoData.created_at ?? '',
        updated_at: repoData.updated_at ?? '',
        language: repoData.language ?? null,
        topics: repoData.topics ?? [],
      };

      this.cache.set(cacheKey, metrics);
      return metrics;
    } catch (err) {
      console.error(`[GitHubService] Failed to fetch metrics for ${owner}/${repo}:`, err);
      return {
        stars: 0,
        forks: 0,
        watchers: 0,
        open_issues: 0,
        created_at: '',
        updated_at: '',
        language: null,
        topics: [],
      };
    }
  }

  /**
   * Fetch manifest file content from GitHub
   */
  async getManifestContent(owner: string, repo: string, path: string = '.hybrid-cicd/manifest.yaml'): Promise<string | null> {
    const cacheKey = `manifest:${owner}/${repo}/${path}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const url = `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`;
      const response = await fetch(url);

      if (!response.ok) {
        console.warn(`[GitHubService] Manifest not found: ${url}`);
        return null;
      }

      const content = await response.text();
      this.cache.set(cacheKey, content);
      return content;
    } catch (err) {
      console.error(`[GitHubService] Failed to fetch manifest from ${owner}/${repo}:`, err);
      return null;
    }
  }

  /**
   * Get repository contributors count
   */
  async getContributorCount(owner: string, repo: string): Promise<number> {
    const cacheKey = `contributors:${owner}/${repo}`;
    const cached = this.cache.get(cacheKey);
    if (cached !== null) return cached;

    try {
      const headers = this.getHeaders();
      // Contributors endpoint returns array with each contributor
      // We use head request with per_page=1 to get total count from Link header
      const response = await fetch(
        `${this.baseURL}/repos/${owner}/${repo}/contributors?per_page=1`,
        { headers, method: 'HEAD' }
      );

      // Parse Link header for total count (GitHub returns Link header with page info)
      const linkHeader = response.headers.get('Link');
      if (!linkHeader) return 1; // No contributors

      // Extract last page number from Link header
      // Format: <...&page=N>; rel="last"
      const match = linkHeader.match(/&page=(\d+).*rel="last"/);
      const count = match ? parseInt(match[1], 10) : 1;

      this.cache.set(cacheKey, count);
      return count;
    } catch (err) {
      console.error(`[GitHubService] Failed to fetch contributor count for ${owner}/${repo}:`, err);
      return 0;
    }
  }

  /**
   * Build ConfigMetrics from GitHub metrics
   */
  buildMetrics(githubMetrics: GitHubRepoMetrics, contributorCount: number): ConfigMetrics {
    return {
      stars: githubMetrics.stars,
      forks: githubMetrics.forks,
      issues: githubMetrics.open_issues,
      watchers: githubMetrics.watchers,
      downloads: 0, // Will be updated from platform tracking
      installations: 0, // Will be updated from platform tracking
      last_updated: new Date(githubMetrics.updated_at),
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Test connectivity to GitHub API
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/zen`, {
        headers: this.getHeaders(),
      });
      return response.ok;
    } catch (err) {
      console.error('[GitHubService] Connection test failed:', err);
      return false;
    }
  }
}

/**
 * Singleton instance
 */
export const githubService = new GitHubServiceImpl();

/**
 * Export type for testing/mocking
 */
export type { GitHubRepoMetrics, DiscoveryResult };
export { GitHubServiceImpl };
