import type { RuntimeStartupPhase } from "./runtime-startup-state";

/**
 * Startup timeline event kinds (Phase 73).
 */
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

/**
 * Startup timeline event emitted during bootstrap, validation, and recovery.
 */
export interface RuntimeStartupEvent {
  readonly id: string;
  readonly kind: RuntimeStartupEventKind;
  readonly message: string;
  readonly timestamp: string;
  readonly phase?: RuntimeStartupPhase;
  readonly processId?: string;
}
