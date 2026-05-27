/**
 * Serializable runtime startup types for renderer IPC (Phase 73).
 */
export type RuntimeStartupPhase =
  | "idle"
  | "bootstrapping"
  | "validating"
  | "recovering"
  | "ready"
  | "degraded"
  | "failed";

export interface RuntimeStartupState {
  readonly phase: RuntimeStartupPhase;
  readonly ready: boolean;
  readonly initialized: boolean;
  readonly validated: boolean;
  readonly recovered: boolean;
  readonly processCount: number;
  readonly healthyProcessCount: number;
  readonly failedProcesses: readonly string[];
  readonly message?: string;
  readonly updatedAt: string;
}

export type RuntimeStartupEventKind =
  | "bootstrap_started"
  | "bootstrap_completed"
  | "validation_started"
  | "validation_completed"
  | "recovery_started"
  | "recovery_completed"
  | "ready"
  | "degraded"
  | "failed";

export interface RuntimeStartupEvent {
  readonly id: string;
  readonly kind: RuntimeStartupEventKind;
  readonly message: string;
  readonly timestamp: string;
  readonly phase?: RuntimeStartupPhase;
  readonly processId?: string;
}

export interface RuntimeStartupResponse {
  readonly state: RuntimeStartupState;
  readonly events: readonly RuntimeStartupEvent[];
  readonly apiBaseUrl?: string;
}
