import type { RuntimeProcessState } from "./runtime-process-state";

/**
 * Managed Jarvis runtime process snapshot (Phase 55).
 */
export interface RuntimeProcess {
  readonly processId: string;
  readonly label: string;
  readonly state: RuntimeProcessState;
  readonly startedAt?: string;
  readonly stoppedAt?: string;
  readonly lastError?: string;
  readonly restartCount: number;
}
