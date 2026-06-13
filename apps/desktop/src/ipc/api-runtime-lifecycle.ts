import { ensureElectronMemoryBackend } from "../ensure-electron-memory-backend";

import type { ApiHealth } from "@jarvis/api-runtime";
import {
  createDefaultJarvisApiServer,
  type JarvisApiServer,
} from "@jarvis/api-runtime";
import { createDefaultOrchestratorService } from "@jarvis/orchestrator";
import {
  createDefaultRuntimeProcessManager,
  DEFAULT_RUNTIME_PROCESS_IDS,
  type RuntimeProcessManager,
} from "@jarvis/runtime-process";

/** Default embedded Jarvis API runtime port (Phase 54). */
export const DEFAULT_EMBEDDED_API_PORT = 8787;

let embeddedServer: JarvisApiServer | undefined;
let embeddedBaseUrl: string | undefined;
let processManager: RuntimeProcessManager | undefined;

function useEmbeddedRuntime(): boolean {
  if (process.env.JARVIS_USE_EMBEDDED_API_RUNTIME === "false") {
    return false;
  }
  return !process.env.JARVIS_API_URL;
}

function getProcessManager(): RuntimeProcessManager {
  if (!processManager) {
    processManager = createDefaultRuntimeProcessManager({
      processHandlers: {
        "api-runtime": {
          start: async () => {
            await startEmbeddedApiRuntimeInternal();
          },
          stop: async () => {
            await stopEmbeddedApiRuntimeInternal();
          },
        },
      },
    });
  }
  return processManager;
}

async function startEmbeddedApiRuntimeInternal(): Promise<string> {
  if (process.env.JARVIS_API_URL) {
    embeddedBaseUrl = process.env.JARVIS_API_URL;
    return embeddedBaseUrl;
  }

  if (embeddedBaseUrl) {
    return embeddedBaseUrl;
  }

  if (!useEmbeddedRuntime()) {
    embeddedBaseUrl =
      process.env.JARVIS_API_URL ??
      `http://127.0.0.1:${DEFAULT_EMBEDDED_API_PORT}`;
    return embeddedBaseUrl;
  }

  ensureElectronMemoryBackend();

  const port = Number(process.env.JARVIS_API_RUNTIME_PORT ?? DEFAULT_EMBEDDED_API_PORT);
  const orchestrator = await createDefaultOrchestratorService();
  embeddedServer = await createDefaultJarvisApiServer({ port, orchestrator });
  const started = await embeddedServer.start();
  embeddedBaseUrl = started.url;
  console.info("[jarvis] embedded API listening at", embeddedBaseUrl);
  return embeddedBaseUrl;
}

async function stopEmbeddedApiRuntimeInternal(): Promise<void> {
  await embeddedServer?.stop();
  embeddedServer = undefined;
  embeddedBaseUrl = undefined;
}

/**
 * Start embedded {@link JarvisApiServer} when no external API URL is configured.
 */
export async function startEmbeddedApiRuntime(): Promise<string> {
  return startEmbeddedApiRuntimeInternal();
}

export function getEmbeddedApiBaseUrl(): string | undefined {
  return embeddedBaseUrl;
}

export async function stopEmbeddedApiRuntime(): Promise<void> {
  await stopEmbeddedApiRuntimeInternal();
}

export async function getEmbeddedApiHealth(): Promise<ApiHealth | null> {
  if (!embeddedServer) {
    return null;
  }

  const response = await embeddedServer.handleRequest({
    method: "GET",
    path: "/health",
    params: {},
    query: {},
    body: undefined,
    headers: {},
  });

  return (response.body ?? null) as ApiHealth | null;
}

/**
 * Initialize runtime processes via the process manager (Phase 55).
 * Preserves embedded API runtime behavior when no external URL is configured.
 */
export async function initializeRuntimeProcesses(): Promise<string> {
  const manager = getProcessManager();
  await manager.startProcess("api-runtime");
  await manager.startProcess("orchestrator");
  await manager.startProcess("hermes-runtime");
  await manager.startProcess("openclaw-runtime");
  return getEmbeddedApiBaseUrl() ?? process.env.JARVIS_API_URL ?? `http://127.0.0.1:${DEFAULT_EMBEDDED_API_PORT}`;
}

export function getRuntimeProcessManager(): RuntimeProcessManager {
  return getProcessManager();
}

export function getRuntimeProcessHealth() {
  return getProcessManager().getHealth();
}

export function getRuntimeActiveProcesses() {
  return getProcessManager().getActiveProcesses();
}

/** Serializable runtime health snapshot for renderer IPC (Phase 56). */
export function buildRuntimeHealthSnapshot() {
  const manager = getProcessManager();
  const health = manager.getHealth();

  const processes = DEFAULT_RUNTIME_PROCESS_IDS.map((processId) => {
    const process = manager.getProcess(processId);
    const healthEntry = health.processes.find((entry) => entry.processId === processId);

    return {
      processId,
      label: process?.label ?? healthEntry?.label ?? processId,
      state: process?.state ?? healthEntry?.state ?? "stopped",
      healthy: healthEntry?.healthy ?? process?.state === "running",
      restartCount: process?.restartCount ?? 0,
      lastError: process?.lastError ?? healthEntry?.message,
      startedAt: process?.startedAt,
      stoppedAt: process?.stoppedAt,
    };
  });

  return {
    health: {
      status: health.status,
      processCount: health.processCount,
      runningCount: health.runningCount,
      failedCount: health.failedCount,
      checkedAt: health.checkedAt,
    },
    processes,
  };
}
