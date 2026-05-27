import type { ActivityEvent } from "../activity/activity-event";
import type { AgentActivityState } from "./agent-activity-state";
import type { AgentStatusEvent, AgentStatusEventKind } from "./agent-status-event";
import {
  HERMES_STATUS_LABELS,
  OPENCLAW_STATUS_LABELS,
  type AgentStatus,
} from "./agent-status";

let agentEventCounter = 0;

function nextAgentEventId(kind: string): string {
  agentEventCounter += 1;
  return `agent-status-${kind}-${agentEventCounter}`;
}

function reduceActivityState(
  events: readonly ActivityEvent[],
  isStreaming: boolean,
): AgentActivityState {
  let hermes: AgentActivityState["hermes"] = "idle";
  let openClaw: AgentActivityState["openClaw"] = "idle";
  let memoryUpdating = false;
  let planningDone = false;
  let executionStarted = false;

  for (const event of events) {
    switch (event.kind) {
      case "planning_started":
        hermes = "planning";
        break;
      case "planning_completed":
        hermes = "completed";
        planningDone = true;
        if (!executionStarted) {
          openClaw = "waiting";
        }
        break;
      case "execution_started":
        executionStarted = true;
        openClaw = "executing";
        break;
      case "execution_completed":
        openClaw = "completed";
        break;
      case "memory_saved":
      case "conversation_updated":
        memoryUpdating = event.status === "active";
        if (planningDone && !executionStarted) {
          openClaw = "waiting";
        }
        break;
      case "failed":
        if (hermes === "planning") {
          hermes = "failed";
        } else if (
          openClaw === "executing" ||
          openClaw === "waiting" ||
          openClaw === "idle"
        ) {
          openClaw = "failed";
        } else {
          hermes = "failed";
          openClaw = "failed";
        }
        break;
      default:
        break;
    }
  }

  const active = events.find((event) => event.status === "active");
  if (isStreaming) {
    if (active?.kind === "planning_started" || hermes === "idle") {
      hermes = hermes === "completed" ? "completed" : "planning";
    }
    if (active?.kind === "execution_started") {
      openClaw = "executing";
    }
    if (
      active?.kind === "memory_saved" ||
      active?.kind === "conversation_updated"
    ) {
      memoryUpdating = true;
    }
  }

  return { hermes, openClaw, memoryUpdating };
}

function buildDisplayMessage(
  state: AgentActivityState,
  isStreaming: boolean,
  error?: string,
): string {
  if (error) {
    return error;
  }

  if (state.memoryUpdating) {
    return "Memory updating…";
  }

  if (state.hermes === "planning") {
    return HERMES_STATUS_LABELS.planning;
  }

  if (state.openClaw === "executing") {
    return OPENCLAW_STATUS_LABELS.executing;
  }

  if (state.openClaw === "waiting") {
    return OPENCLAW_STATUS_LABELS.waiting;
  }

  if (
    !isStreaming &&
    (state.hermes === "completed" || state.openClaw === "completed")
  ) {
    return "Completed";
  }

  if (state.hermes === "idle" && state.openClaw === "idle" && isStreaming) {
    return "Jarvis is thinking…";
  }

  return "Jarvis is ready";
}

export function deriveAgentStatusEvents(
  events: readonly ActivityEvent[],
): AgentStatusEvent[] {
  const agentEvents: AgentStatusEvent[] = [];

  const push = (
    kind: AgentStatusEventKind,
    agent: AgentStatusEvent["agent"],
    message: string,
    timestamp: string,
  ): void => {
    agentEvents.push({
      id: nextAgentEventId(kind),
      kind,
      agent,
      message,
      timestamp,
    });
  };

  for (const event of events) {
    switch (event.kind) {
      case "planning_started":
        push(
          "hermes_planning",
          "hermes",
          HERMES_STATUS_LABELS.planning,
          event.timestamp,
        );
        break;
      case "planning_completed":
        push(
          "hermes_completed",
          "hermes",
          HERMES_STATUS_LABELS.completed,
          event.timestamp,
        );
        break;
      case "execution_started":
        push(
          "openclaw_executing",
          "openclaw",
          OPENCLAW_STATUS_LABELS.executing,
          event.timestamp,
        );
        break;
      case "memory_saved":
      case "conversation_updated":
        push(
          "memory_updating",
          "memory",
          "Memory updating…",
          event.timestamp,
        );
        break;
      case "execution_completed":
        push(
          "openclaw_completed",
          "openclaw",
          OPENCLAW_STATUS_LABELS.completed,
          event.timestamp,
        );
        push("task_completed", "system", "Completed", event.timestamp);
        break;
      case "failed":
        push(
          "task_failed",
          "system",
          event.message ?? "Error",
          event.timestamp,
        );
        break;
      default:
        break;
    }
  }

  return agentEvents;
}

/**
 * Derive Hermes/OpenClaw agent status from activity stream events (Phase 49).
 */
export function deriveAgentStatus(
  events: readonly ActivityEvent[],
  isStreaming: boolean,
): AgentStatus {
  const activity = reduceActivityState(events, isStreaming);
  const failedEvent = events.find((event) => event.kind === "failed");
  const error = failedEvent?.message;

  const isActive =
    isStreaming ||
    activity.hermes === "planning" ||
    activity.openClaw === "executing" ||
    activity.openClaw === "waiting" ||
    activity.memoryUpdating;

  return {
    ...activity,
    displayMessage: buildDisplayMessage(activity, isStreaming, error),
    error,
    isActive,
  };
}
