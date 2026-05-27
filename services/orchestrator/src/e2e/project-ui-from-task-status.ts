import type { TaskStatusResponse } from "@jarvis/types";

import type {
  JarvisExecutionFlowUiProjection,
  JarvisFlowActivityProjection,
  JarvisFlowAgentStatusProjection,
} from "./jarvis-execution-flow-result";
import type { StreamEventType } from "../streaming";

function projectActivityFromLifecycle(
  status: TaskStatusResponse,
): JarvisFlowActivityProjection[] {
  const output = status.output;
  if (!output?.executionLifecycle) {
    if (status.status === "failed") {
      return [{ kind: "failed", label: "Error", status: "error" }];
    }
    return [];
  }

  const lifecycle = output.executionLifecycle as {
    state?: string;
    activities?: readonly { kind?: string; source?: string }[];
  };

  const events: JarvisFlowActivityProjection[] = [];

  if (
    lifecycle.activities?.some(
      (a) => a.source === "hermes" && a.kind === "plan_generated",
    )
  ) {
    events.push({
      kind: "planning_completed",
      label: "Planning completed",
      status: "complete",
    });
  }

  if (lifecycle.state === "planning" || lifecycle.state === "executing") {
    events.push({
      kind: lifecycle.state === "planning" ? "planning_started" : "execution_started",
      label:
        lifecycle.state === "planning"
          ? "Planning started"
          : "Execution started",
      status: "active",
    });
  }

  if (lifecycle.state === "completed") {
    events.push({
      kind: "execution_completed",
      label: "Execution completed",
      status: "complete",
    });
  }

  if (lifecycle.state === "failed") {
    events.push({ kind: "failed", label: "Error", status: "error" });
  }

  if (output.memory) {
    events.push({
      kind: "memory_saved",
      label: "Memory saved",
      status: "complete",
    });
    events.push({
      kind: "conversation_updated",
      label: "Conversation updated",
      status: "complete",
    });
  }

  return events;
}

function projectAgentStatus(
  status: TaskStatusResponse,
  streamEvents: readonly StreamEventType[],
): JarvisFlowAgentStatusProjection {
  const output = status.output;
  const lifecycle = output?.executionLifecycle as
    | { state?: string; handshake?: { planningAgentId: string; executionAgentId: string } }
    | undefined;

  const hasPlanning = streamEvents.includes("planning_started");
  const hasPlanningDone = streamEvents.includes("planning_completed");
  const hasExecution = streamEvents.includes("execution_started");
  const hasExecutionDone = streamEvents.includes("execution_completed");
  const hasMemory = streamEvents.some(
    (t) => t === "memory_saved" || t === "conversation_updated",
  );
  const hasFailed = streamEvents.includes("failed") || status.status === "failed";

  let hermes = "idle";
  if (hasFailed && hasPlanning && !hasPlanningDone) {
    hermes = "failed";
  } else if (hasPlanningDone) {
    hermes = "completed";
  } else if (hasPlanning) {
    hermes = "planning";
  }

  let openClaw = "idle";
  if (hasFailed && (hasExecution || lifecycle?.handshake)) {
    openClaw = "failed";
  } else if (hasExecutionDone) {
    openClaw = "completed";
  } else if (hasExecution) {
    openClaw = "executing";
  } else if (hasPlanningDone && lifecycle?.handshake && !hasExecutionDone) {
    openClaw = hasExecution ? "executing" : "waiting";
  }

  let displayMessage = "Jarvis is ready";
  if (hasFailed) {
    displayMessage = status.error?.message ?? "Error";
  } else if (hasMemory && status.status === "completed") {
    displayMessage = "Completed";
  } else if (hermes === "planning") {
    displayMessage = "Hermes planning…";
  } else if (openClaw === "executing") {
    displayMessage = "OpenClaw executing…";
  } else if (openClaw === "waiting") {
    displayMessage = "OpenClaw waiting…";
  } else if (status.status === "completed") {
    displayMessage = "Completed";
  }

  return {
    hermes,
    openClaw,
    displayMessage,
    memoryUpdating: hasMemory && status.status !== "completed",
    error: hasFailed ? (status.error?.message ?? displayMessage) : undefined,
  };
}

/**
 * Build Desktop-aligned UI projection from task status + collected stream events.
 */
export function projectUiFromTaskStatus(
  status: TaskStatusResponse,
  streamEvents: readonly StreamEventType[],
): JarvisExecutionFlowUiProjection {
  return {
    activityEvents: projectActivityFromLifecycle(status),
    agentStatus: projectAgentStatus(status, streamEvents),
    streamEventTypes: [...streamEvents],
  };
}
