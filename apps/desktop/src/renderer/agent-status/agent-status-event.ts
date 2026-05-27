/**
 * Agent status event kinds for the thinking flow UI (Phase 49).
 */
export type AgentStatusEventKind =
  | "hermes_planning"
  | "hermes_completed"
  | "openclaw_executing"
  | "openclaw_waiting"
  | "openclaw_completed"
  | "memory_updating"
  | "task_completed"
  | "task_failed";

export type AgentStatusEventSource = "hermes" | "openclaw" | "memory" | "system";

/**
 * Agent-level status event derived from activity stream (Phase 49).
 */
export interface AgentStatusEvent {
  readonly id: string;
  readonly kind: AgentStatusEventKind;
  readonly agent: AgentStatusEventSource;
  readonly message: string;
  readonly timestamp: string;
}
