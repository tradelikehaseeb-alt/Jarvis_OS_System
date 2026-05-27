import type { HermesActivityState, OpenClawActivityState } from "./agent-activity-state";
import { HERMES_STATUS_LABELS, OPENCLAW_STATUS_LABELS } from "./agent-status";

export interface AgentStatusBadgeProps {
  readonly agent: "hermes" | "openclaw";
  readonly state: HermesActivityState | OpenClawActivityState;
}

function badgeClass(
  agent: AgentStatusBadgeProps["agent"],
  state: string,
): string {
  return `agent-status-badge agent-status-badge--${agent} agent-status-badge--${state}`;
}

/**
 * Compact badge for a single agent state (Phase 49).
 */
export function AgentStatusBadge({ agent, state }: AgentStatusBadgeProps) {
  const label =
    agent === "hermes"
      ? HERMES_STATUS_LABELS[state as HermesActivityState]
      : OPENCLAW_STATUS_LABELS[state as OpenClawActivityState];

  return (
    <span
      className={badgeClass(agent, state)}
      data-testid={`agent-status-badge-${agent}`}
      data-state={state}
    >
      {label}
    </span>
  );
}
