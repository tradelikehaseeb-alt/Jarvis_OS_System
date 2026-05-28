import type { AgentActivityState } from "./agent-activity-state";

/**
 * Live agent status summary for Desktop UI (Phase 49).
 */
export interface AgentStatus extends AgentActivityState {
  readonly displayMessage: string;
  readonly error?: string;
  readonly isActive: boolean;
}

export const HERMES_STATUS_LABELS: Readonly<
  Record<AgentActivityState["hermes"], string>
> = {
  idle: "Ready",
  planning: "Understanding request…",
  completed: "Request understood",
  failed: "Request failed",
};

export const OPENCLAW_STATUS_LABELS: Readonly<
  Record<AgentActivityState["openClaw"], string>
> = {
  idle: "Ready",
  executing: "Performing task…",
  waiting: "Preparing next step…",
  completed: "Task complete",
  failed: "Task failed",
};
