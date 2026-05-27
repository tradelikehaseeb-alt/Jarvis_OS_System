import type { RuntimeStartupEvent } from "./runtime-startup-event";

/**
 * Recovery context for failed or degraded runtime startup (Phase 73).
 */
export interface RuntimeRecoveryContext {
  readonly failedProcesses: readonly string[];
  readonly reason: string;
}

export type RuntimeRecoveryAction =
  | "restart_processes"
  | "retry_bootstrap"
  | "none";

/**
 * Recovery outcome from {@link RuntimeRecoveryHandler}.
 */
export interface RuntimeRecoveryResult {
  readonly action: RuntimeRecoveryAction;
  readonly processIds: readonly string[];
  readonly message: string;
  readonly recovered: boolean;
  readonly event: RuntimeStartupEvent;
}

/**
 * Recovery handler contract — deterministic restart/retry decisions.
 */
export interface RuntimeRecoveryHandler {
  recover(context: RuntimeRecoveryContext): Promise<RuntimeRecoveryResult>;
}
