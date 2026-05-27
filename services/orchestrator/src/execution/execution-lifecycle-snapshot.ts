import type { ExecutionSession } from "./execution-session";

/**
 * Serializable lifecycle snapshot attached to task output (Phase 45).
 */
export interface ExecutionLifecycleSnapshot {
  readonly sessionId: string;
  readonly state: ExecutionSession["state"];
  readonly activityCount: number;
  readonly activities: ExecutionSession["activities"];
  readonly events: ExecutionSession["events"];
  readonly handshake?: {
    readonly planningAgentId: string;
    readonly executionAgentId: string;
  };
}

export function toExecutionLifecycleSnapshot(
  session: ExecutionSession,
  handshake?: ExecutionLifecycleSnapshot["handshake"],
): ExecutionLifecycleSnapshot {
  return {
    sessionId: session.sessionId,
    state: session.state,
    activityCount: session.activities.length,
    activities: session.activities,
    events: session.events,
    ...(handshake ? { handshake } : {}),
  };
}
