import type { RuntimeHealthSnapshot } from "./runtime-health-snapshot";
import type { RuntimeStatus } from "./runtime-status";

const DISPLAY_NAMES: Record<string, string> = {
  "api-runtime": "API Runtime",
  orchestrator: "Orchestrator",
  "hermes-runtime": "Hermes Runtime",
  "openclaw-runtime": "OpenClaw Runtime",
};

export const RUNTIME_PROCESS_ORDER = [
  "api-runtime",
  "orchestrator",
  "hermes-runtime",
  "openclaw-runtime",
] as const;

/**
 * Maps process manager snapshot to ordered UI statuses (Phase 56).
 */
export function deriveRuntimeStatuses(
  snapshot: RuntimeHealthSnapshot,
): readonly RuntimeStatus[] {
  const byId = new Map(snapshot.processes.map((process) => [process.processId, process]));

  return RUNTIME_PROCESS_ORDER.map((processId) => {
    const process = byId.get(processId);
    return {
      processId,
      label: process?.label ?? processId,
      displayName: DISPLAY_NAMES[processId] ?? processId,
      state: process?.state ?? "stopped",
      healthy: process?.healthy ?? false,
      restartCount: process?.restartCount ?? 0,
      lastError: process?.lastError,
      startedAt: process?.startedAt,
      stoppedAt: process?.stoppedAt,
    };
  });
}

export function aggregateStatusLabel(
  status: RuntimeHealthSnapshot["health"]["status"],
): string {
  switch (status) {
    case "healthy":
      return "Healthy";
    case "degraded":
      return "Degraded";
    case "unavailable":
      return "Unavailable";
  }
}
