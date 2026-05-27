import type {
  AggregatedRuntimeHealth,
  RuntimeHealthEvent,
  RuntimeStartupProgress,
} from "@jarvis/orchestrator";

export interface AggregatedRuntimeHealthResponse {
  readonly health: AggregatedRuntimeHealth;
  readonly progress: RuntimeStartupProgress;
  readonly events: readonly RuntimeHealthEvent[];
}
