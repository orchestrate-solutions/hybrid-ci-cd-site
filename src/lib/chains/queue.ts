/**
 * Queue CodeUChain
 * 
 * State management for job queue operations using CodeUChain.
 * Handles fetching queue data, claiming jobs, and managing job lifecycle.
 */

import { Context, Chain, Link } from 'codeuchain';
import * as queueApi from '@/lib/api/queue';
import type { QueuedJob, QueueStats, ListQueuedJobsResponse } from '@/lib/api/queue';

/**
 * Fetch pending jobs from queue
 */
class FetchPendingJobsLink extends Link<any, any> {
  async call(ctx: Context<any>): Promise<Context<any>> {
    try {
      const params = ctx.get('queue_params') || { limit: 50, status: 'QUEUED' };
      const response = await queueApi.listPendingJobs(params);
      return ctx.insert('pending_jobs', response);
    } catch (error) {
      return ctx.insert('queue_error', (error as Error).message);
    }
  }
}

/**
 * Fetch queue statistics
 */
class FetchQueueStatsLink extends Link<any, any> {
  async call(ctx: Context<any>): Promise<Context<any>> {
    try {
      const stats = await queueApi.getQueueStats();
      return ctx.insert('queue_stats', stats);
    } catch (error) {
      return ctx.insert('queue_error', (error as Error).message);
    }
  }
}

/**
 * Aggregate queue data
 */
class AggregateQueueDataLink extends Link<any, any> {
  async call(ctx: Context<any>): Promise<Context<any>> {
    const pending_jobs = ctx.get('pending_jobs') || {};
    const queue_stats = ctx.get('queue_stats') || {};
    const queue_error = ctx.get('queue_error');

    if (queue_error) {
      return ctx.insert('queue_data', {
        error: queue_error,
        jobs: [],
        stats: {},
      });
    }

    return ctx.insert('queue_data', {
      jobs: pending_jobs.jobs || [],
      total: pending_jobs.total || 0,
      stats: queue_stats,
      last_updated: new Date().toISOString(),
    });
  }
}

/**
 * Queue chain for fetching and managing queue state
 */
export class QueueChain {
  private chain: Chain;

  constructor() {
    this.chain = new Chain();
    this.chain.add_link(new FetchPendingJobsLink(), 'fetch_jobs');
    this.chain.add_link(new FetchQueueStatsLink(), 'fetch_stats');
    this.chain.add_link(new AggregateQueueDataLink(), 'aggregate');

    this.chain.connect('fetch_jobs', 'aggregate', () => true);
    this.chain.connect('fetch_stats', 'aggregate', () => true);
  }

  async run(params?: any): Promise<any> {
    const ctx = new Context({ queue_params: params });
    const result = await this.chain.run(ctx);
    return result.get('queue_data');
  }
}

/**
 * Claim job link (agent operation)
 */
class ClaimJobLink extends Link<any, any> {
  async call(ctx: Context<any>): Promise<Context<any>> {
    try {
      const agentId = ctx.get('agent_id');
      if (!agentId) {
        throw new Error('agent_id required');
      }
      const claimResponse = await queueApi.claimJob(agentId);
      return ctx.insert('claimed_job', claimResponse);
    } catch (error) {
      return ctx.insert('claim_error', (error as Error).message);
    }
  }
}

/**
 * Job claim chain for agents
 */
export class JobClaimChain {
  private chain: Chain;

  constructor() {
    this.chain = new Chain();
    this.chain.add_link(new ClaimJobLink(), 'claim');
  }

  async run(agentId: string): Promise<any> {
    const ctx = new Context({ agent_id: agentId });
    const result = await this.chain.run(ctx);
    
    const error = result.get('claim_error');
    if (error) {
      throw new Error(error);
    }
    
    return result.get('claimed_job');
  }
}

/**
 * Start job execution link
 */
class StartJobLink extends Link<any, any> {
  async call(ctx: Context<any>): Promise<Context<any>> {
    try {
      const jobId = ctx.get('job_id');
      const agentId = ctx.get('agent_id');
      if (!jobId || !agentId) {
        throw new Error('job_id and agent_id required');
      }
      const job = await queueApi.startJob(jobId, agentId);
      return ctx.insert('started_job', job);
    } catch (error) {
      return ctx.insert('start_error', (error as Error).message);
    }
  }
}

/**
 * Job start chain
 */
export class JobStartChain {
  private chain: Chain;

  constructor() {
    this.chain = new Chain();
    this.chain.add_link(new StartJobLink(), 'start');
  }

  async run(jobId: string, agentId: string): Promise<QueuedJob> {
    const ctx = new Context({ job_id: jobId, agent_id: agentId });
    const result = await this.chain.run(ctx);
    
    const error = result.get('start_error');
    if (error) {
      throw new Error(error);
    }
    
    return result.get('started_job');
  }
}

/**
 * Complete job execution link
 */
class CompleteJobLink extends Link<any, any> {
  async call(ctx: Context<any>): Promise<Context<any>> {
    try {
      const jobId = ctx.get('job_id');
      const agentId = ctx.get('agent_id');
      const output = ctx.get('output');
      const logs = ctx.get('logs');

      if (!jobId || !agentId) {
        throw new Error('job_id and agent_id required');
      }

      const job = await queueApi.completeJob(jobId, agentId, { output, logs });
      return ctx.insert('completed_job', job);
    } catch (error) {
      return ctx.insert('complete_error', (error as Error).message);
    }
  }
}

/**
 * Job completion chain
 */
export class JobCompleteChain {
  private chain: Chain;

  constructor() {
    this.chain = new Chain();
    this.chain.add_link(new CompleteJobLink(), 'complete');
  }

  async run(
    jobId: string,
    agentId: string,
    output?: Record<string, unknown>,
    logs?: string
  ): Promise<QueuedJob> {
    const ctx = new Context({
      job_id: jobId,
      agent_id: agentId,
      output,
      logs,
    });
    const result = await this.chain.run(ctx);

    const error = result.get('complete_error');
    if (error) {
      throw new Error(error);
    }

    return result.get('completed_job');
  }
}
