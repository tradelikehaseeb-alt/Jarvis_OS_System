import { useMemo } from "react";

import type { ActivityEvent } from "../activity/activity-event";
import type { AgentStatusEvent } from "./agent-status-event";
import { deriveAgentStatus, deriveAgentStatusEvents } from "./derive-agent-status";
import type { AgentStatus } from "./agent-status";

export interface UseAgentStatusOptions {
  readonly events: readonly ActivityEvent[];
  readonly isStreaming: boolean;
}

export interface UseAgentStatusResult {
  readonly status: AgentStatus;
  readonly events: readonly AgentStatusEvent[];
  readonly loading: boolean;
}

/**
 * Consumes activity stream events and exposes Hermes/OpenClaw status (Phase 49).
 */
export function useAgentStatus(
  options: UseAgentStatusOptions,
): UseAgentStatusResult {
  const { events, isStreaming } = options;

  const status = useMemo(
    () => deriveAgentStatus(events, isStreaming),
    [events, isStreaming],
  );

  const agentEvents = useMemo(
    () => deriveAgentStatusEvents(events),
    [events],
  );

  return {
    status,
    events: agentEvents,
    loading: isStreaming || status.isActive,
  };
}
