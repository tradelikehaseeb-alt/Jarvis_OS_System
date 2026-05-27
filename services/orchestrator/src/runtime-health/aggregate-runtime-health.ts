import type { RuntimeProcessManager } from "@jarvis/runtime-process";

import type { AggregatedRuntimeHealth } from "./aggregated-runtime-health";
import type {
  RuntimeComponentHealth,
  RuntimeComponentId,
  RuntimeRecoveryState,
} from "./runtime-component-health";
import type { RuntimeStartupManager } from "../runtime-startup/runtime-startup-manager";
import type { RuntimeStartupPhase } from "../runtime-startup/runtime-startup-state";

export interface AggregateRuntimeHealthInput {
  readonly processManager?: RuntimeProcessManager;
  readonly startupManager?: RuntimeStartupManager;
  readonly speechHealthy?: boolean;
  readonly speechMessage?: string;
  readonly memoryHealthy?: boolean;
  readonly memoryMessage?: string;
  readonly checkedAt?: string;
}

const PROCESS_TO_COMPONENT: Record<string, RuntimeComponentId> = {
  "hermes-runtime": "hermes",
  "openclaw-runtime": "openclaw",
  "api-runtime": "api",
  orchestrator: "orchestrator",
};

const COMPONENT_LABELS: Record<RuntimeComponentId, string> = {
  hermes: "Hermes",
  openclaw: "OpenClaw",
  speech: "Speech",
  memory: "Memory",
  api: "API Runtime",
  orchestrator: "Orchestrator",
};

const DASHBOARD_COMPONENT_ORDER: readonly RuntimeComponentId[] = [
  "hermes",
  "openclaw",
  "speech",
  "memory",
  "api",
  "orchestrator",
];

function deriveRecoveryState(
  phase: RuntimeStartupPhase,
  recovered: boolean,
): RuntimeRecoveryState {
  if (phase === "recovering") {
    return "recovering";
  }
  if (phase === "failed") {
    return "failed";
  }
  if (recovered) {
    return "recovered";
  }
  return "none";
}

function deriveAggregateStatus(
  components: readonly RuntimeComponentHealth[],
): AggregatedRuntimeHealth["status"] {
  if (components.length === 0) {
    return "unavailable";
  }

  const healthyCount = components.filter((component) => component.healthy).length;
  if (healthyCount === components.length) {
    return "healthy";
  }
  if (healthyCount === 0) {
    return "unavailable";
  }
  return "degraded";
}

/**
 * Pure aggregation over process manager + startup manager probes (Phase 74).
 */
export function aggregateRuntimeHealth(
  input: AggregateRuntimeHealthInput,
): AggregatedRuntimeHealth {
  const byComponent = new Map<RuntimeComponentId, RuntimeComponentHealth>();
  const startupState = input.startupManager?.getStartupStatus();
  const startupPhase = startupState?.phase ?? "idle";

  if (input.processManager) {
    const health = input.processManager.getHealth();
    for (const entry of health.processes) {
      const componentId = PROCESS_TO_COMPONENT[entry.processId];
      if (!componentId) {
        continue;
      }

      const process = input.processManager.getProcess(entry.processId);
      byComponent.set(componentId, {
        componentId,
        label: COMPONENT_LABELS[componentId],
        healthy: entry.healthy,
        state: process?.state ?? entry.state,
        message: entry.message ?? process?.lastError,
      });
    }
  }

  byComponent.set("speech", {
    componentId: "speech",
    label: COMPONENT_LABELS.speech,
    healthy:
      input.speechHealthy ??
      (startupState?.failedProcesses.includes("speech-runtime") !== true),
    state: input.speechHealthy === false ? "failed" : "running",
    message: input.speechMessage,
  });

  byComponent.set("memory", {
    componentId: "memory",
    label: COMPONENT_LABELS.memory,
    healthy: input.memoryHealthy ?? true,
    state: input.memoryHealthy === false ? "failed" : "running",
    message: input.memoryMessage,
  });

  const components = DASHBOARD_COMPONENT_ORDER.map(
    (componentId) =>
      byComponent.get(componentId) ?? {
        componentId,
        label: COMPONENT_LABELS[componentId],
        healthy: false,
        state: "stopped",
        message: "Unavailable",
      },
  );

  const healthyCount = components.filter((component) => component.healthy).length;

  return {
    status: deriveAggregateStatus(components),
    components,
    startupPhase,
    recoveryState: deriveRecoveryState(startupPhase, startupState?.recovered ?? false),
    checkedAt: input.checkedAt ?? new Date().toISOString(),
    healthyCount,
    totalCount: components.length,
  };
}
