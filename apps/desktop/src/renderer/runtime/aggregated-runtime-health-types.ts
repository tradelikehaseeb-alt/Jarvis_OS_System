/**
 * Serializable aggregated runtime health types for renderer IPC (Phase 74).
 */
export type AggregatedRuntimeStatus = "healthy" | "degraded" | "unavailable";

export type RuntimeComponentId =
  | "hermes"
  | "openclaw"
  | "speech"
  | "memory"
  | "api"
  | "orchestrator";

export type RuntimeRecoveryState =
  | "none"
  | "recovering"
  | "recovered"
  | "failed";

export interface RuntimeComponentHealth {
  readonly componentId: RuntimeComponentId;
  readonly label: string;
  readonly healthy: boolean;
  readonly state: string;
  readonly message?: string;
}

export type RuntimeStartupPhase =
  | "idle"
  | "bootstrapping"
  | "validating"
  | "recovering"
  | "ready"
  | "degraded"
  | "failed";

export interface AggregatedRuntimeHealth {
  readonly status: AggregatedRuntimeStatus;
  readonly components: readonly RuntimeComponentHealth[];
  readonly startupPhase: RuntimeStartupPhase;
  readonly recoveryState: RuntimeRecoveryState;
  readonly checkedAt: string;
  readonly healthyCount: number;
  readonly totalCount: number;
}

export interface RuntimeStartupProgress {
  readonly phase: RuntimeStartupPhase;
  readonly percent: number;
  readonly ready: boolean;
  readonly message?: string;
}

export interface AggregatedRuntimeHealthResponse {
  readonly health: AggregatedRuntimeHealth;
  readonly progress: RuntimeStartupProgress;
  readonly events: readonly AggregatedRuntimeHealthEvent[];
}

export type AggregatedRuntimeHealthEventKind =
  | "health_checked"
  | "component_state_change"
  | "recovery"
  | "activity";

export interface AggregatedRuntimeHealthEvent {
  readonly id: string;
  readonly kind: AggregatedRuntimeHealthEventKind;
  readonly componentId: RuntimeComponentId;
  readonly message: string;
  readonly timestamp: string;
  readonly healthy?: boolean;
}

/** Primary dashboard components shown in RuntimeHealthPanel. */
export const DASHBOARD_COMPONENT_IDS: readonly RuntimeComponentId[] = [
  "hermes",
  "openclaw",
  "speech",
  "memory",
] as const;
