import type { ApiHealth } from "@jarvis/api-runtime";
import {
  buildProbesFromProcessManager,
  createDefaultRuntimeStartupManager,
  type RuntimeStartupEvent,
  type RuntimeStartupManager,
  type RuntimeStartupState,
} from "@jarvis/orchestrator";

import {
  getEmbeddedApiBaseUrl,
  getEmbeddedApiHealth,
  getRuntimeProcessManager,
  initializeRuntimeProcesses,
} from "./api-runtime-lifecycle";

export interface RuntimeStartupResponse {
  readonly state: RuntimeStartupState;
  readonly events: readonly RuntimeStartupEvent[];
  readonly apiBaseUrl?: string;
}

let startupManager: RuntimeStartupManager | undefined;

async function checkApiRuntimeHealth(): Promise<boolean> {
  const embedded = await getEmbeddedApiHealth();
  if (embedded) {
    return embedded.status === "ok" && embedded.orchestrator === "ok";
  }

  const baseUrl =
    getEmbeddedApiBaseUrl() ??
    process.env.JARVIS_API_URL ??
    "http://127.0.0.1:8000";

  try {
    const response = await fetch(`${baseUrl}/health`);
    if (!response.ok) {
      return false;
    }
    const health = (await response.json()) as ApiHealth;
    return health.status === "ok" && health.orchestrator === "ok";
  } catch {
    return false;
  }
}

export function getRuntimeStartupManager(): RuntimeStartupManager {
  if (!startupManager) {
    const processManager = getRuntimeProcessManager();
    startupManager = createDefaultRuntimeStartupManager({
      processManager,
      startProcesses: async () => {
        await initializeRuntimeProcesses();
      },
      healthProbes: buildProbesFromProcessManager(processManager, [
        {
          probeId: "speech-runtime",
          label: "Speech Runtime",
          check: async () => ({
            healthy: true,
            message: "Speech runtime available in renderer",
          }),
        },
        {
          probeId: "api-health",
          label: "API Health",
          check: async () => ({
            healthy: await checkApiRuntimeHealth(),
            message: "Jarvis API /health probe",
          }),
        },
      ]),
    });
  }

  return startupManager;
}

function buildResponse(
  state: RuntimeStartupState,
  events: readonly RuntimeStartupEvent[],
): RuntimeStartupResponse {
  return {
    state,
    events,
    apiBaseUrl:
      getEmbeddedApiBaseUrl() ??
      process.env.JARVIS_API_URL ??
      "http://127.0.0.1:8000",
  };
}

export async function initializeDesktopRuntime(): Promise<RuntimeStartupResponse> {
  const manager = getRuntimeStartupManager();
  const previousEventCount = manager.getEvents().length;
  const state = await manager.initializeRuntime();
  const events = manager.getEvents().slice(previousEventCount);
  return buildResponse(state, events);
}

export async function validateDesktopRuntime(): Promise<RuntimeStartupResponse> {
  const manager = getRuntimeStartupManager();
  const previousEventCount = manager.getEvents().length;
  const state = await manager.validateRuntime();
  const events = manager.getEvents().slice(previousEventCount);
  return buildResponse(state, events);
}

export async function recoverDesktopRuntime(): Promise<RuntimeStartupResponse> {
  const manager = getRuntimeStartupManager();
  const previousEventCount = manager.getEvents().length;
  const state = await manager.recoverRuntime();
  const events = manager.getEvents().slice(previousEventCount);
  return buildResponse(state, events);
}

export function getDesktopStartupStatus(): RuntimeStartupResponse {
  const manager = getRuntimeStartupManager();
  return buildResponse(manager.getStartupStatus(), []);
}

export function resetRuntimeStartupManagerForTests(): void {
  startupManager = undefined;
}
