/**
 * Desktop API request lifecycle states (Phase 54).
 */
export type ApiRequestState =
  | "idle"
  | "checking_health"
  | "creating_task"
  | "fetching_status"
  | "retrying"
  | "completed"
  | "failed";

export interface ApiRequestLifecycle {
  readonly state: ApiRequestState;
  readonly attempt: number;
  readonly lastError?: string;
}

export function createInitialApiLifecycle(): ApiRequestLifecycle {
  return {
    state: "idle",
    attempt: 0,
  };
}
