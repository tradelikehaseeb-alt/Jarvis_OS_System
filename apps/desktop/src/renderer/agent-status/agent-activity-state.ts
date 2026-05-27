/**
 * Hermes agent activity states (Phase 49).
 */
export type HermesActivityState = "idle" | "planning" | "completed" | "failed";

/**
 * OpenClaw agent activity states (Phase 49).
 */
export type OpenClawActivityState =
  | "idle"
  | "executing"
  | "waiting"
  | "completed"
  | "failed";

/**
 * Combined agent activity snapshot derived from the activity stream (Phase 49).
 */
export interface AgentActivityState {
  readonly hermes: HermesActivityState;
  readonly openClaw: OpenClawActivityState;
  readonly memoryUpdating: boolean;
}
