import type { RuntimeComponentId } from "./runtime-component-health";

/**
 * Orchestrator runtime health event kinds (Phase 74).
 */
export type RuntimeHealthEventKind =
  | "health_checked"
  | "component_state_change"
  | "recovery"
  | "activity";

/**
 * Health timeline event for runtime aggregation and subscriptions.
 */
export interface RuntimeHealthEvent {
  readonly id: string;
  readonly kind: RuntimeHealthEventKind;
  readonly componentId: RuntimeComponentId;
  readonly message: string;
  readonly timestamp: string;
  readonly healthy?: boolean;
}
