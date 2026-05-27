/**
 * Desktop runtime startup lifecycle phase (Phase 73).
 */
export type RuntimeStartupPhase =
  | "idle"
  | "bootstrapping"
  | "validating"
  | "recovering"
  | "ready"
  | "degraded"
  | "failed";

/**
 * Aggregate startup status for Jarvis desktop runtime initialization.
 */
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
