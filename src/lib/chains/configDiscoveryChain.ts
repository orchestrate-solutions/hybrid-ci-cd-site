/**
 * Config Discovery Chain - CodeUChain implementation
 * Orchestrates parsing, validating, and enriching config data
 * Follows immutable context pattern for deterministic data flow
 */

import { Context, Link, Chain } from 'codeuchain';
import type { ConfigRecord, ConfigMetrics, ConfigPreview } from './marketplace';

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
class ParseConfigLink extends Link<{ raw: RawConfigInput }, { raw: RawConfigInput; parsed: Record<string, any> }> {
  async call(ctx: Context<{ raw: RawConfigInput }>) {
    // In real implementation, use yaml parser
    const raw = ctx.get('raw');
    try {
      // Simplified - in real code: import('js-yaml').load(raw.yaml_content)
      const parsed = JSON.parse(raw.yaml_content); // Mock
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
  { raw: RawConfigInput; parsed: Record<string, any> },
  { raw: RawConfigInput; parsed: Record<string, any>; valid: boolean; errors: string[] }
> {
  async call(ctx: Context<{ raw: RawConfigInput; parsed: Record<string, any> }>) {
    const parsed = ctx.get('parsed') ?? {};
    const errors: string[] = [];

    // Required fields
    const required = ['metadata', 'type'];
    for (const field of required) {
      if (!parsed[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate metadata
    if (parsed.metadata) {
      if (!parsed.metadata.id) errors.push('metadata.id is required');
      if (!parsed.metadata.name) errors.push('metadata.name is required');
      if (!parsed.metadata.category) errors.push('metadata.category is required');
    }

    const valid = errors.length === 0;
    console.log(`[ValidateConfigLink] Config ${ctx.get('raw').id} valid: ${valid}`);

    return ctx
      .insert('valid', valid)
      .insert('errors', errors);
  }
}

/**
 * Step 3: Enrich with GitHub metrics
 */
class EnrichMetricsLink extends Link<
  { raw: RawConfigInput; parsed: Record<string, any>; valid: boolean; errors: string[] },
  { raw: RawConfigInput; parsed: Record<string, any>; valid: boolean; errors: string[]; metrics: ConfigMetrics }
> {
  async call(ctx: Context<{ raw: RawConfigInput; parsed: Record<string, any>; valid: boolean; errors: string[] }>) {
    const raw = ctx.get('raw');

    const metrics: ConfigMetrics = {
      stars: raw.github_metrics.stars ?? 0,
      forks: raw.github_metrics.forks ?? 0,
      issues: raw.github_metrics.issues ?? 0,
      watchers: raw.github_metrics.watchers ?? 0,
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
  { raw: RawConfigInput; parsed: Record<string, any>; valid: boolean; errors: string[]; metrics: ConfigMetrics },
  { raw: RawConfigInput; parsed: Record<string, any>; valid: boolean; errors: string[]; metrics: ConfigMetrics; record: ConfigRecord }
> {
  async call(
    ctx: Context<{ raw: RawConfigInput; parsed: Record<string, any>; valid: boolean; errors: string[]; metrics: ConfigMetrics }>
  ) {
    const raw = ctx.get('raw');
    const parsed = ctx.get('parsed') ?? {};
    const metrics = ctx.get('metrics');

    if (!ctx.get('valid')) {
      throw new Error(`Cannot build record for invalid config: ${ctx.get('errors').join(', ')}`);
    }

    const record: ConfigRecord = {
      id: raw.id,
      name: parsed.metadata?.name ?? 'Unnamed',
      description: parsed.metadata?.description ?? '',
      category: parsed.metadata?.category ?? 'other',
      type: parsed.type ?? 'tool',
      tags: parsed.metadata?.tags ?? [],
      source: {
        type: 'github',
        owner: raw.source_repo.split('/')[0],
        repo: raw.source_repo.split('/')[1],
        path: raw.source_path,
        ref: parsed.metadata?.ref ?? 'main',
        commit_sha: parsed.metadata?.commit_sha ?? '',
        last_updated: new Date(),
      },
      author: {
        id: raw.author_info.github_username,
        github_username: raw.author_info.github_username,
        name: raw.author_info.name,
        avatar_url: raw.author_info.avatar_url,
        reputation_tier: 'contributor',
        total_contributions: 1,
      },
      metrics,
      sharing: parsed.metadata?.sharing ?? 'public',
      license: parsed.metadata?.license ?? 'MIT',
      allow_forks: parsed.metadata?.allow_forks !== false,
      attribution_required: parsed.metadata?.attribution_required !== false,
      lineage: {
        parent_config_id: parsed.metadata?.parent_config_id,
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
  { raw: RawConfigInput; parsed: Record<string, any>; valid: boolean; errors: string[]; metrics: ConfigMetrics; record: ConfigRecord },
  { raw: RawConfigInput; parsed: Record<string, any>; valid: boolean; errors: string[]; metrics: ConfigMetrics; record: ConfigRecord; preview: ConfigPreview }
> {
  async call(
    ctx: Context<{ raw: RawConfigInput; parsed: Record<string, any>; valid: boolean; errors: string[]; metrics: ConfigMetrics; record: ConfigRecord }>
  ) {
    const record = ctx.get('record');

    const preview: ConfigPreview = {
      id: record.id,
      name: record.name,
      description: record.description,
      category: record.category,
      type: record.type,
      tags: record.tags,
      author: {
        name: record.author.name,
        github_username: record.author.github_username,
        avatar_url: record.author.avatar_url,
        reputation_tier: record.author.reputation_tier,
      },
      metrics: {
        stars: record.metrics.stars,
        forks: record.metrics.forks,
        downloads: record.metrics.downloads,
      },
      is_trending: record.metrics.downloads > 100,
      is_featured: record.is_featured,
      quality_score: record.quality_score,
    };

    console.log('[CreatePreviewLink] Created preview for:', record.id);
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
      record: result.toDict().record as ConfigRecord,
      preview: result.toDict().preview as ConfigPreview,
      valid: result.toDict().valid as boolean,
      errors: result.toDict().errors as string[],
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
