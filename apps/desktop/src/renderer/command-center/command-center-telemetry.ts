import {
  getHermesExecutionMode,
  getHermesSkillCategory,
  resolveHermesToolsets,
} from "@jarvis/types";

import type { AgentStatus } from "../agent-status/agent-status";

export interface PipelineTelemetryView {
  readonly activeNode: string;
  readonly routingPath: string;
  readonly openClawCluster: string;
  readonly toolsets: readonly string[];
}

/**
 * Derive orchestrator-facing telemetry labels for the command center HUD.
 */
export function buildPipelineTelemetryView(input: {
  readonly lastUserQuery?: string;
  readonly loading: boolean;
  readonly isStreaming: boolean;
  readonly agentStatus: AgentStatus;
}): PipelineTelemetryView {
  const query = input.lastUserQuery?.trim() ?? "";
  const executionMode = query ? getHermesExecutionMode(query) : "fast";
  const skillCategory = query ? getHermesSkillCategory(query) : "general";
  const toolsets = resolveHermesToolsets(skillCategory)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  const hermesActive =
    input.agentStatus.hermes === "planning" ||
    input.agentStatus.hermes === "completed" ||
    input.loading ||
    input.isStreaming;
  const openClawActive =
    input.agentStatus.openClaw === "executing" ||
    input.agentStatus.openClaw === "waiting" ||
    input.agentStatus.openClaw === "completed";

  let activeNode = "Jarvis Core";
  if (openClawActive && !hermesActive) {
    activeNode = "OpenClaw (Execution)";
  } else if (hermesActive) {
    activeNode = "Hermes (The Brain)";
  }

  const routingPath =
    executionMode === "skills"
      ? `skills · ${skillCategory}`
      : `fast · ${skillCategory}`;

  const openClawCluster = openClawActive
    ? "Connected"
    : input.isStreaming
      ? "Standby"
      : "Idle";

  return {
    activeNode,
    routingPath,
    openClawCluster,
    toolsets,
  };
}
