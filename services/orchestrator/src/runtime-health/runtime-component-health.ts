/**
 * Key Jarvis runtime components surfaced in the Desktop health dashboard (Phase 74).
 */
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

/**
 * Health snapshot for a single runtime component.
 */
export interface RuntimeComponentHealth {
  readonly componentId: RuntimeComponentId;
  readonly label: string;
  readonly healthy: boolean;
  readonly state: string;
  readonly message?: string;
}
