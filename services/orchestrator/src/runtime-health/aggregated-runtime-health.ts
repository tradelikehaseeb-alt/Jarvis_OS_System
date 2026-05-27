import type {
  RuntimeComponentHealth,
  RuntimeRecoveryState,
} from "./runtime-component-health";
import type { RuntimeStartupPhase } from "../runtime-startup/runtime-startup-state";

export type AggregatedRuntimeStatus = "healthy" | "degraded" | "unavailable";

/**
 * Aggregated runtime health across managed components (Phase 74).
 */
export interface AggregatedRuntimeHealth {
  readonly status: AggregatedRuntimeStatus;
  readonly components: readonly RuntimeComponentHealth[];
  readonly startupPhase: RuntimeStartupPhase;
  readonly recoveryState: RuntimeRecoveryState;
  readonly checkedAt: string;
  readonly healthyCount: number;
  readonly totalCount: number;
}
