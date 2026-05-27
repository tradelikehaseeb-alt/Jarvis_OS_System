import type { RuntimeProcessState } from "./runtime-process-state";

/**
 * Per-process health entry in a manager report (Phase 55).
 */
export interface RuntimeProcessHealthEntry {
  readonly processId: string;
  readonly label: string;
  readonly state: RuntimeProcessState;
  readonly healthy: boolean;
  readonly message?: string;
}

/**
 * Aggregate health for all managed runtime processes (Phase 55).
 */
export interface RuntimeHealth {
  readonly status: "healthy" | "degraded" | "unavailable";
  readonly processCount: number;
  readonly runningCount: number;
  readonly failedCount: number;
  readonly checkedAt: string;
  readonly processes: readonly RuntimeProcessHealthEntry[];
}
