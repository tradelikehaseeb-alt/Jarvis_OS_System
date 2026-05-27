import type { AggregatedRuntimeHealth } from "./aggregated-runtime-health";
import type { RuntimeHealthEvent } from "./runtime-health-event";
import type { RuntimeStartupProgress } from "./runtime-startup-progress";

/**
 * Subscriber for live runtime health events (Phase 74).
 */
export interface RuntimeHealthSubscriber {
  readonly subscriberId: string;
  onEvent(event: RuntimeHealthEvent): void;
}

/**
 * Runtime health aggregation and subscription contract (Phase 74).
 */
export interface RuntimeHealthRuntime {
  getRuntimeHealth(): AggregatedRuntimeHealth;
  subscribeRuntimeHealth(subscriber: RuntimeHealthSubscriber): () => void;
  aggregateRuntimeHealth(): AggregatedRuntimeHealth;
  getStartupProgress(): RuntimeStartupProgress;
  refresh(): Promise<AggregatedRuntimeHealth>;
  getEvents(): readonly RuntimeHealthEvent[];
}
