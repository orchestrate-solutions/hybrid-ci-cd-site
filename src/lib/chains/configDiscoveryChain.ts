/**
 * Config Discovery Chain - CodeUChain implementation
 * Orchestrates parsing, validating, and enriching config data
 * Follows immutable context pattern for deterministic data flow
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Context, Link, Chain } from 'codeuchain';
import type { ConfigRecord, ConfigMetrics, ConfigPreview, ConfigCategory, ContributionType } from '../types/marketplace';

/**
 * Input: Raw config data from filesystem/GitHub
 */
interface RawConfigInput {
  id: string;
  yaml_content: string;
  source_repo: string;
  source_path: string;
  github_metrics: Record<string, number>;
  author_info: {
    github_username: string;
    name: string;
    avatar_url?: string;
  };
}

/**
 * Step 1: Parse YAML manifest
 */
class ParseConfigLink extends Link<{ raw: RawConfigInput }, { raw: RawConfigInput; parsed: Record<string, unknown> }> {
  async call(ctx: Context<{ raw: RawConfigInput }>) {
    // In real implementation, use yaml parser
    const raw = ctx.get('raw') || { id: 'unknown', yaml_content: '{}' };
    try {
      // Simplified - in real code: import('js-yaml').load(raw.yaml_content)
      const parsed = JSON.parse(raw.yaml_content) as Record<string, unknown>; // Mock
      console.log('[ParseConfigLink] Successfully parsed config:', raw.id);
      return ctx.insert('parsed', parsed);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to parse config ${raw.id}: ${errMsg}`);
    }
  }
}

/**
 * Step 2: Validate against schema
 */
class ValidateConfigLink extends Link<
  { raw: RawConfigInput; parsed: Record<string, unknown> },
  { raw: RawConfigInput; parsed: Record<string, unknown>; valid: boolean; errors: string[] }
> {
  async call(ctx: Context<{ raw: RawConfigInput; parsed: Record<string, unknown> }>) {
    const parsed = (ctx.get('parsed') || {}) as Record<string, unknown>;
    const errors: string[] = [];

    // Required fields
    const required = ['metadata', 'type'];
    for (const field of required) {
      if (!parsed[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate metadata
    const metadata = parsed.metadata as Record<string, unknown> | undefined;
    if (metadata) {
      if (!metadata.id) errors.push('metadata.id is required');
      if (!metadata.name) errors.push('metadata.name is required');
      if (!metadata.category) errors.push('metadata.category is required');
    }

    const valid = errors.length === 0;
    const raw = ctx.get('raw');
    console.log(`[ValidateConfigLink] Config ${raw?.id || 'unknown'} valid: ${valid}`);

    return ctx
      .insert('valid', valid)
      .insert('errors', errors);
  }
}

/**
 * Step 3: Enrich with GitHub metrics
 */
class EnrichMetricsLink extends Link<
  { raw: RawConfigInput; parsed: Record<string, unknown>; valid: boolean; errors: string[] },
  { raw: RawConfigInput; parsed: Record<string, unknown>; valid: boolean; errors: string[]; metrics: ConfigMetrics }
> {
  async call(ctx: Context<{ raw: RawConfigInput; parsed: Record<string, unknown>; valid: boolean; errors: string[] }>) {
    const raw = ctx.get('raw');

    const metrics: ConfigMetrics = {
      stars: (raw?.github_metrics.stars as number) ?? 0,
      forks: (raw?.github_metrics.forks as number) ?? 0,
      issues: (raw?.github_metrics.issues as number) ?? 0,
      watchers: (raw?.github_metrics.watchers as number) ?? 0,
      downloads: 0, // Platform will track via events
      installations: 0,
      last_updated: new Date(),
    };

    console.log('[EnrichMetricsLink] Enriched with GitHub metrics:', metrics);
    return ctx.insert('metrics', metrics);
  }
}

/**
 * Step 4: Build config record
 */
class BuildRecordLink extends Link<
  { raw: RawConfigInput; parsed: Record<string, unknown>; valid: boolean; errors: string[]; metrics: ConfigMetrics },
  { raw: RawConfigInput; parsed: Record<string, unknown>; valid: boolean; errors: string[]; metrics: ConfigMetrics; record: ConfigRecord }
> {
  async call(
    ctx: Context<{ raw: RawConfigInput; parsed: Record<string, unknown>; valid: boolean; errors: string[]; metrics: ConfigMetrics }>
  ) {
    const raw = ctx.get('raw');
    const parsed = (ctx.get('parsed') || {}) as Record<string, unknown>;
    const metrics = ctx.get('metrics');

    if (!ctx.get('valid')) {
      const errors = ctx.get('errors') || [];
      throw new Error(`Cannot build record for invalid config: ${(errors as string[]).join(', ')}`);
    }

    const metadata = parsed.metadata as Record<string, unknown> | undefined;
    
    // Helper to validate category
    const isValidCategory = (cat: unknown): cat is ConfigCategory => {
      const valid = ['ci-cd', 'cloud-providers', 'monitoring', 'security', 'iac', 'databases', 'messaging', 'api-gateways', 'logging', 'ai-llm', 'observability', 'plugins', 'schemas', 'automations', 'layouts', 'other'];
      return typeof cat === 'string' && valid.includes(cat);
    };
    
    // Helper to validate type
    const isValidType = (t: unknown): t is ContributionType => {
      const valid = ['tool', 'schema', 'iac', 'llm', 'automation'];
      return typeof t === 'string' && valid.includes(t);
    };
    
    const category: ConfigCategory = isValidCategory(metadata?.category) ? metadata.category : 'other';
    const type: ContributionType = isValidType(parsed.type) ? parsed.type : 'tool';
    const record: ConfigRecord = {
      id: raw?.id ?? 'unknown',
      name: (metadata?.name as string) ?? 'Unnamed',
      description: (metadata?.description as string) ?? '',
      category,
      type,
      tags: (metadata?.tags as string[]) ?? [],
      source: {
        type: 'github',
        owner: raw?.source_repo.split('/')[0] ?? 'unknown',
        repo: raw?.source_repo.split('/')[1] ?? 'unknown',
        path: raw?.source_path ?? '',
        ref: (metadata?.ref as string) ?? 'main',
        commit_sha: (metadata?.commit_sha as string) ?? '',
        last_updated: new Date(),
      },
      author: {
        id: raw?.author_info.github_username ?? 'unknown',
        github_username: raw?.author_info.github_username ?? 'unknown',
        name: raw?.author_info.name ?? 'Unknown',
        avatar_url: raw?.author_info.avatar_url,
        reputation_tier: 'contributor',
        total_contributions: 1,
      },
      metrics: metrics || { stars: 0, forks: 0, issues: 0, watchers: 0, downloads: 0, installations: 0, last_updated: new Date() },
      sharing: (metadata?.sharing as any) ?? 'public',
      license: (metadata?.license as any) ?? 'MIT',
      allow_forks: (metadata?.allow_forks as boolean) !== false,
      attribution_required: (metadata?.attribution_required as boolean) !== false,
      lineage: {
        parent_config_id: metadata?.parent_config_id as string | undefined,
        children: [],
        improvements_from_children: [],
      },
      created_at: new Date(),
      updated_at: new Date(),
      is_featured: false,
      quality_score: 50, // Will be calculated by separate service
    };

    console.log('[BuildRecordLink] Built config record:', record.id);
    return ctx.insert('record', record);
  }
}

/**
 * Step 5: Create marketplace preview
 */
class CreatePreviewLink extends Link<
  { raw: RawConfigInput; parsed: Record<string, unknown>; valid: boolean; errors: string[]; metrics: ConfigMetrics; record: ConfigRecord },
  { raw: RawConfigInput; parsed: Record<string, unknown>; valid: boolean; errors: string[]; metrics: ConfigMetrics; record: ConfigRecord; preview: ConfigPreview }
> {
  async call(
    ctx: Context<{ raw: RawConfigInput; parsed: Record<string, unknown>; valid: boolean; errors: string[]; metrics: ConfigMetrics; record: ConfigRecord }>
  ) {
    const record = ctx.get('record');

    const preview: ConfigPreview = {
      id: record?.id ?? 'unknown',
      name: record?.name ?? 'Unnamed',
      description: record?.description ?? '',
      category: record?.category ?? 'other',
      type: record?.type ?? 'tool',
      tags: record?.tags ?? [],
      author: {
        name: record?.author.name ?? 'Unknown',
        github_username: record?.author.github_username ?? 'unknown',
        avatar_url: record?.author.avatar_url,
        reputation_tier: record?.author.reputation_tier ?? 'contributor',
      },
      metrics: {
        stars: record?.metrics.stars ?? 0,
        forks: record?.metrics.forks ?? 0,
        downloads: record?.metrics.downloads ?? 0,
      },
      is_trending: (record?.metrics.downloads ?? 0) > 100,
      is_featured: record?.is_featured ?? false,
      quality_score: record?.quality_score ?? 50,
    };

    console.log('[CreatePreviewLink] Created preview for:', record?.id ?? 'unknown');
    return ctx.insert('preview', preview);
  }
}

/**
 * Config Discovery Chain - Main orchestrator
 * Processes raw config data through validation and enrichment pipeline
 */
export class ConfigDiscoveryChain {
  private chain: Chain;

  constructor() {
    this.chain = new Chain();
    
    // Add links in sequence
    this.chain.addLink(new ParseConfigLink(), 'parse');
    this.chain.addLink(new ValidateConfigLink(), 'validate');
    this.chain.addLink(new EnrichMetricsLink(), 'enrich');
    this.chain.addLink(new BuildRecordLink(), 'build');
    this.chain.addLink(new CreatePreviewLink(), 'preview');

    // Define execution flow (sequential)
    this.chain.connect('parse', 'validate', () => true);
    this.chain.connect('validate', 'enrich', (ctx) => ctx.get('valid') === true);
    this.chain.connect('enrich', 'build', () => true);
    this.chain.connect('build', 'preview', () => true);
  }

  /**
   * Process raw config through discovery chain
   * Returns full context with all intermediate steps
   */
  async process(input: RawConfigInput) {
    const initialContext = new Context({ raw: input });
    const result = await this.chain.run(initialContext);

    return {
      record: result.get('record') as ConfigRecord,
      preview: result.get('preview') as ConfigPreview,
      valid: result.get('valid') ?? false as boolean,
      errors: result.get('errors') ?? [] as string[],
    };
  }

  /**
   * Batch process multiple configs
   */
  async processBatch(inputs: RawConfigInput[]) {
    const results = await Promise.all(inputs.map((input) => this.process(input)));
    return {
      successful: results.filter((r) => r.valid),
      failed: results.filter((r) => !r.valid),
      total: results.length,
    };
  }
}

/**
 * Singleton instance - reuse across application
 */
export const configDiscoveryChain = new ConfigDiscoveryChain();
