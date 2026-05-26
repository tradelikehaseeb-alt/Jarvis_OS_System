/**
 * Hermes structured plan as displayed in Desktop Chat (Phase 23).
 *
 * Mirrors {@link HermesStructuredPlan} from agent output — UI-only view model.
 */
export interface HermesPlanView {
  readonly goal: string;
  readonly steps: readonly string[];
  /** Agent that produced the plan (expected `hermes`). */
  readonly agentId: string;
}

/** Optional metadata for the collapsible planning details panel. */
export interface HermesPlanningDetails {
  readonly taskStatus?: string;
  readonly intentKind?: string;
  readonly reasoningSummary?: string;
  readonly adapterId?: string;
  readonly stub?: boolean;
  readonly routingReason?: string;
}

/** Assistant chat message carrying a Hermes plan (Phase 23). */
export interface HermesPlanMessageData {
  readonly plan: HermesPlanView;
  readonly details?: HermesPlanningDetails;
}
