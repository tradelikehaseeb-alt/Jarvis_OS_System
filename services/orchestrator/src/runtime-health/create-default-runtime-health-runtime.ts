import type { RuntimeProcessManager } from "@jarvis/runtime-process";

import type { ActivityStreamRuntime } from "../activity/activity-stream-runtime";
import type { RuntimeStartupManager } from "../runtime-startup/runtime-startup-manager";

import { aggregateRuntimeHealth } from "./aggregate-runtime-health";
import type { AggregatedRuntimeHealth } from "./aggregated-runtime-health";
import type { RuntimeComponentId } from "./runtime-component-health";
import type { RuntimeHealthEvent } from "./runtime-health-event";
import type {
  RuntimeHealthRuntime,
  RuntimeHealthSubscriber,
} from "./runtime-health-runtime";
import type { RuntimeStartupProgress } from "./runtime-startup-progress";
import { startupPhaseToPercent } from "./runtime-startup-progress";

export interface CreateDefaultRuntimeHealthRuntimeOptions {
  readonly startupManager?: RuntimeStartupManager;
  readonly processManager?: RuntimeProcessManager;
  readonly getMemoryHealth?: () =>
    | { readonly healthy: boolean; readonly message?: string }
    | Promise<{ readonly healthy: boolean; readonly message?: string }>;
  readonly getSpeechHealth?: () =>
    | { readonly healthy: boolean; readonly message?: string }
    | Promise<{ readonly healthy: boolean; readonly message?: string }>;
  readonly activityRuntime?: ActivityStreamRuntime;
}

let eventCounter = 0;

function nextEventId(): string {
  eventCounter += 1;
  return `runtime-health-${eventCounter}`;
}

function activitySourceToComponent(
  source: string | undefined,
): RuntimeComponentId | undefined {
  if (source === "hermes" || source === "openclaw" || source === "orchestrator") {
    return source === "orchestrator" ? "orchestrator" : source;
  }
  return undefined;
}

class DefaultRuntimeHealthRuntime implements RuntimeHealthRuntime {
  private readonly subscribers = new Map<string, RuntimeHealthSubscriber>();
  private readonly events: RuntimeHealthEvent[] = [];
  private lastHealth: AggregatedRuntimeHealth | null = null;
  private readonly activityUnsubscribe?: () => void;

  constructor(private readonly options: CreateDefaultRuntimeHealthRuntimeOptions) {
    if (options.activityRuntime) {
      this.activityUnsubscribe = options.activityRuntime.subscribe({
        subscriberId: "runtime-health-runtime",
        onEvent: (activityEvent) => {
          const componentId = activitySourceToComponent(activityEvent.source);
          if (!componentId) {
            return;
          }

          this.emit({
            id: nextEventId(),
            kind: "activity",
            componentId,
            message: activityEvent.message ?? activityEvent.type,
            timestamp: activityEvent.timestamp,
            healthy: activityEvent.type !== "failed",
          });
        },
      });
    }
  }

  getRuntimeHealth(): AggregatedRuntimeHealth {
    return this.lastHealth ?? this.aggregateRuntimeHealth();
  }

  subscribeRuntimeHealth(subscriber: RuntimeHealthSubscriber): () => void {
    this.subscribers.set(subscriber.subscriberId, subscriber);
    return () => {
      this.subscribers.delete(subscriber.subscriberId);
    };
  }

  aggregateRuntimeHealth(): AggregatedRuntimeHealth {
    const memoryResult = this.options.getMemoryHealth?.();
    const speechResult = this.options.getSpeechHealth?.();

    const memory =
      memoryResult instanceof Promise
        ? { healthy: true, message: "Memory probe async — use refresh()" }
        : (memoryResult ?? { healthy: true, message: "Memory available" });

    const speech =
      speechResult instanceof Promise
        ? { healthy: true, message: "Speech probe async — use refresh()" }
        : (speechResult ?? { healthy: true, message: "Speech available" });

    const aggregated = aggregateRuntimeHealth({
      processManager: this.options.processManager,
      startupManager: this.options.startupManager,
      memoryHealthy: memory.healthy,
      memoryMessage: memory.message,
      speechHealthy: speech.healthy,
      speechMessage: speech.message,
    });

    this.lastHealth = aggregated;
    return aggregated;
  }

  getStartupProgress(): RuntimeStartupProgress {
    const state = this.options.startupManager?.getStartupStatus();
    const phase = state?.phase ?? "idle";

    return {
      phase,
      percent: startupPhaseToPercent(phase),
      ready: state?.ready ?? false,
      message: state?.message,
    };
  }

  async refresh(): Promise<AggregatedRuntimeHealth> {
    const memoryResult = this.options.getMemoryHealth
      ? await Promise.resolve(this.options.getMemoryHealth())
      : { healthy: true, message: "Memory available" };
    const speechResult = this.options.getSpeechHealth
      ? await Promise.resolve(this.options.getSpeechHealth())
      : { healthy: true, message: "Speech available" };

    const aggregated = aggregateRuntimeHealth({
      processManager: this.options.processManager,
      startupManager: this.options.startupManager,
      memoryHealthy: memoryResult.healthy,
      memoryMessage: memoryResult.message,
      speechHealthy: speechResult.healthy,
      speechMessage: speechResult.message,
    });

    this.lastHealth = aggregated;
    this.emit({
      id: nextEventId(),
      kind: "health_checked",
      componentId: "orchestrator",
      message: `Runtime health: ${aggregated.healthyCount}/${aggregated.totalCount} healthy`,
      timestamp: aggregated.checkedAt,
      healthy: aggregated.status === "healthy",
    });

    return aggregated;
  }

  getEvents(): readonly RuntimeHealthEvent[] {
    return this.events;
  }

  /** @internal test teardown */
  dispose(): void {
    this.activityUnsubscribe?.();
    this.subscribers.clear();
  }

  private emit(event: RuntimeHealthEvent): void {
    this.events.push(event);
    for (const subscriber of this.subscribers.values()) {
      subscriber.onEvent(event);
    }
  }
}

/**
 * Factory for default runtime health aggregation runtime (Phase 74).
 */
export function createDefaultRuntimeHealthRuntime(
  options: CreateDefaultRuntimeHealthRuntimeOptions = {},
): RuntimeHealthRuntime {
  return new DefaultRuntimeHealthRuntime(options);
}
