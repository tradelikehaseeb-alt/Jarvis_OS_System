/**
 * Runtime health monitoring event kinds (Phase 56).
 */
export type RuntimeHealthEventKind = "checked" | "state_change" | "error";

/**
 * Timeline event emitted by {@link useRuntimeHealth} (Phase 56).
 */
export interface RuntimeHealthEvent {
  readonly id: string;
  readonly kind: RuntimeHealthEventKind;
  readonly message: string;
  readonly timestamp: string;
  readonly processId?: string;
  readonly aggregateStatus?: "healthy" | "degraded" | "unavailable";
}
