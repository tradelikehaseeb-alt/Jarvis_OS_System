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
  idle: "Hermes idle",
  planning: "Hermes planning…",
  completed: "Hermes planning complete",
  failed: "Hermes failed",
};

export const OPENCLAW_STATUS_LABELS: Readonly<
  Record<AgentActivityState["openClaw"], string>
> = {
  idle: "OpenClaw idle",
  executing: "OpenClaw executing…",
  waiting: "OpenClaw waiting…",
  completed: "OpenClaw execution complete",
  failed: "OpenClaw failed",
};
