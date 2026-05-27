import type { AggregatedRuntimeHealthResponse } from "./aggregated-runtime-health-response";
import {
  createDefaultRuntimeHealthRuntime,
} from "@jarvis/orchestrator";

import {
  getRuntimeProcessManager,
} from "./api-runtime-lifecycle";
import { getRuntimeStartupManager } from "./runtime-startup-lifecycle";

export type { AggregatedRuntimeHealthResponse } from "./aggregated-runtime-health-response";

let healthRuntime: ReturnType<typeof createDefaultRuntimeHealthRuntime> | undefined;

export function getRuntimeHealthRuntime() {
  if (!healthRuntime) {
    healthRuntime = createDefaultRuntimeHealthRuntime({
      processManager: getRuntimeProcessManager(),
      startupManager: getRuntimeStartupManager(),
      getMemoryHealth: () => ({
        healthy: true,
        message: "Local memory available",
      }),
      getSpeechHealth: () => ({
        healthy: true,
        message: "Speech runtime available in renderer",
      }),
    });
  }
  return healthRuntime;
}

export async function buildAggregatedRuntimeHealthResponse(): Promise<AggregatedRuntimeHealthResponse> {
  const runtime = getRuntimeHealthRuntime();
  const previousCount = runtime.getEvents().length;
  const health = await runtime.refresh();

  return {
    health,
    progress: runtime.getStartupProgress(),
    events: runtime.getEvents().slice(previousCount),
  };
}

export function getAggregatedRuntimeHealthSnapshot(): AggregatedRuntimeHealthResponse {
  const runtime = getRuntimeHealthRuntime();
  return {
    health: runtime.getRuntimeHealth(),
    progress: runtime.getStartupProgress(),
    events: [],
  };
}

export function resetRuntimeHealthRuntimeForTests(): void {
  healthRuntime = undefined;
}
