/**
 * Relay Management CodeUChain
 * Orchestrates relay data fetching and metrics aggregation
 */

import { Context, Chain, Link } from "codeuchain";
import { relayApi, Relay, RelayMetrics } from "@/lib/api/relay";

/**
 * Link: Fetch all relays
 */
class FetchRelaysLink extends Link<Record<string, any>, Record<string, any>> {
  async call(
    ctx: Context<Record<string, any>>
  ): Promise<Context<Record<string, any>>> {
    const relays = await relayApi.listRelays();
    return ctx.insert("relays", relays);
  }
}

/**
 * Link: Fetch relay metrics
 */
class FetchRelayMetricsLink extends Link<Record<string, any>, Record<string, any>> {
  async call(
    ctx: Context<Record<string, any>>
  ): Promise<Context<Record<string, any>>> {
    const metrics = await relayApi.getRelayMetrics();
    return ctx.insert("metrics", metrics);
  }
}

/**
 * Link: Aggregate relay data
 */
class AggregateRelayDataLink extends Link<Record<string, any>, Record<string, any>> {
  async call(
    ctx: Context<Record<string, any>>
  ): Promise<Context<Record<string, any>>> {
    const relays = ctx.get("relays") || [];
    const metrics = ctx.get("metrics") || {};

    const aggregated = {
      relays,
      metrics,
      stats: {
        total: relays.length,
        healthy: (relays as Relay[]).filter((r) => r.status === "HEALTHY")
          .length,
        degraded: (relays as Relay[]).filter((r) => r.status === "DEGRADED")
          .length,
        offline: (relays as Relay[]).filter((r) => r.status === "OFFLINE")
          .length,
      },
    };

    return ctx.insert("relay_data", aggregated);
  }
}

/**
 * Relay Dashboard Chain
 */
export class RelayChain {
  private chain: Chain;

  constructor() {
    this.chain = new Chain();
    this.chain.add_link(new FetchRelaysLink(), "fetch_relays");
    this.chain.add_link(new FetchRelayMetricsLink(), "fetch_metrics");
    this.chain.add_link(new AggregateRelayDataLink(), "aggregate");

    this.chain.connect("fetch_relays", "aggregate", () => true);
    this.chain.connect("fetch_metrics", "aggregate", () => true);
  }

  async run(): Promise<any> {
    const ctx = new Context({});
    const result = await this.chain.run(ctx);
    return result.get("relay_data");
  }
}
