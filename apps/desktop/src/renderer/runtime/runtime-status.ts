import type { RuntimeProcessState } from "./runtime-process-state";

/**
 * UI-facing runtime process status (Phase 56).
 */
export interface RuntimeStatus {
  readonly processId: string;
  readonly label: string;
  readonly displayName: string;
  readonly state: RuntimeProcessState;
  readonly healthy: boolean;
  readonly restartCount: number;
  readonly lastError?: string;
  readonly startedAt?: string;
  readonly stoppedAt?: string;
}
