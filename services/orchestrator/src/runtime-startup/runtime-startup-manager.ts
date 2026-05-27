import type { RuntimeRecoveryResult } from "./runtime-recovery-handler";
import type { RuntimeStartupEvent } from "./runtime-startup-event";
import type { RuntimeStartupState } from "./runtime-startup-state";

/**
 * Runtime startup manager contract (Phase 73).
 */
export interface RuntimeStartupManager {
  initializeRuntime(): Promise<RuntimeStartupState>;
  validateRuntime(): Promise<RuntimeStartupState>;
  recoverRuntime(): Promise<RuntimeStartupState>;
  getStartupStatus(): RuntimeStartupState;
  getEvents(): readonly RuntimeStartupEvent[];
}

export interface RuntimeStartupOperationResult {
  readonly state: RuntimeStartupState;
  readonly events: readonly RuntimeStartupEvent[];
  readonly recovery?: RuntimeRecoveryResult;
}
