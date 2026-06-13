import { ipcMain } from "electron";

import type {
  CreateTaskRequest,
  CreateTaskResponse,
  TaskStatusResponse,
} from "@jarvis/types";
import type { ApiHealth } from "@jarvis/api-runtime";

import {
  buildRuntimeHealthSnapshot,
  DEFAULT_EMBEDDED_API_PORT,
  getEmbeddedApiBaseUrl,
  getEmbeddedApiHealth,
  startEmbeddedApiRuntime,
} from "./api-runtime-lifecycle";
import {
  getDesktopStartupStatus,
  initializeDesktopRuntime,
  recoverDesktopRuntime,
  validateDesktopRuntime,
} from "./runtime-startup-lifecycle";
import { getHermesStartupStatus } from "./hermes-startup-status";
import {
  buildAggregatedRuntimeHealthResponse,
  getAggregatedRuntimeHealthSnapshot,
} from "./runtime-health-lifecycle";
import { executeRuntimeAction } from "./execute-runtime-action";
import {
  getProviderSettingsSnapshot,
  saveProviderApiKeyForUser,
  selectProviderForUser,
  selectProviderModelForUser,
  syncClientLocaleForUser,
  validateProviderApiKeyForUser,
} from "./provider-settings-lifecycle";

/** Fallback when external Python gateway is used explicitly. */
export const LEGACY_API_GATEWAY_URL = "http://127.0.0.1:8000";

const DEFAULT_RETRY_COUNT = 3;
const RETRY_BASE_DELAY_MS = 150;

export interface ApiErrorEnvelope {
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: Readonly<Record<string, unknown>>;
  };
}

export class JarvisApiTransportError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "JarvisApiTransportError";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function getApiBaseUrl(): string {
  const embedded = getEmbeddedApiBaseUrl();
  if (embedded) {
    return embedded;
  }
  if (process.env.JARVIS_API_URL) {
    return process.env.JARVIS_API_URL;
  }
  if (process.env.JARVIS_USE_LEGACY_API_GATEWAY === "true") {
    return LEGACY_API_GATEWAY_URL;
  }
  return `http://127.0.0.1:${DEFAULT_EMBEDDED_API_PORT}`;
}

function parseErrorBody(text: string, status: number): JarvisApiTransportError {
  try {
    const body = JSON.parse(text) as ApiErrorEnvelope;
    if (body.error) {
      return new JarvisApiTransportError(
        body.error.message,
        status,
        body.error.code,
      );
    }
  } catch {
    /* fall through */
  }

  return new JarvisApiTransportError(`API ${status}: ${text}`, status);
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getApiBaseUrl();
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw parseErrorBody(text, response.status);
  }

  return (await response.json()) as T;
}

async function apiFetchWithRetry<T>(
  path: string,
  init?: RequestInit,
  retries: number = DEFAULT_RETRY_COUNT,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await apiFetch<T>(path, init);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const transportError =
        error instanceof JarvisApiTransportError ? error : undefined;

      if (transportError && transportError.status < 500 && transportError.status !== 429) {
        throw transportError;
      }

      if (attempt < retries) {
        await sleep(RETRY_BASE_DELAY_MS * attempt);
      }
    }
  }

  throw lastError ?? new JarvisApiTransportError("API request failed", 500);
}

async function fetchApiHealth(): Promise<ApiHealth> {
  return apiFetchWithRetry<ApiHealth>("/health", { method: "GET" }, 2);
}

/**
 * Register IPC handlers — main process calls Jarvis API runtime (Phase 54).
 */
export function registerApiHandlers(): void {
  ipcMain.handle("jarvis:getApiUrl", () => getApiBaseUrl());

  ipcMain.handle("jarvis:checkApiHealth", async () => {
    try {
      return await fetchApiHealth();
    } catch (error) {
      const embedded = await getEmbeddedApiHealth();
      if (embedded) {
        return embedded;
      }

      const message = error instanceof Error ? error.message : "Health check failed";
      return {
        status: "down",
        service: "jarvis-api-runtime",
        orchestrator: "down",
        checkedAt: new Date().toISOString(),
        message,
      } satisfies ApiHealth & { message?: string };
    }
  });

  ipcMain.handle(
    "jarvis:createTask",
    (_event, body: CreateTaskRequest) =>
      apiFetchWithRetry<CreateTaskResponse>("/tasks", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  );

  ipcMain.handle("jarvis:getTaskStatus", (_event, taskId: string) =>
    apiFetchWithRetry<TaskStatusResponse>(
      `/tasks/${encodeURIComponent(taskId)}`,
      { method: "GET" },
    ),
  );

  ipcMain.handle("jarvis:getRuntimeHealth", () => buildRuntimeHealthSnapshot());

  ipcMain.handle("jarvis:executeRuntimeAction", (_event, request) =>
    executeRuntimeAction(request),
  );

  ipcMain.handle("jarvis:initializeRuntime", () => initializeDesktopRuntime());

  ipcMain.handle("jarvis:validateRuntime", () => validateDesktopRuntime());

  ipcMain.handle("jarvis:recoverRuntime", () => recoverDesktopRuntime());

  ipcMain.handle("jarvis:getStartupStatus", () => getDesktopStartupStatus());

  ipcMain.handle("jarvis:getHermesStartupStatus", () => getHermesStartupStatus());

  ipcMain.handle("jarvis:getAggregatedRuntimeHealth", () =>
    buildAggregatedRuntimeHealthResponse(),
  );

  ipcMain.handle("jarvis:getAggregatedRuntimeHealthSnapshot", () =>
    getAggregatedRuntimeHealthSnapshot(),
  );

  ipcMain.handle("jarvis:getProviderSettings", (_event, userId: string) =>
    getProviderSettingsSnapshot(userId),
  );

  ipcMain.handle("jarvis:saveProviderApiKey", (_event, request) =>
    saveProviderApiKeyForUser(request),
  );

  ipcMain.handle(
    "jarvis:validateProviderApiKey",
    (_event, payload: { userId: string; providerId: string; apiKey?: string }) =>
      validateProviderApiKeyForUser(
        payload.userId,
        payload.providerId,
        payload.apiKey,
      ),
  );

  ipcMain.handle("jarvis:selectProvider", (_event, request) =>
    selectProviderForUser(request),
  );

  ipcMain.handle("jarvis:selectProviderModel", (_event, request) =>
    selectProviderModelForUser(request),
  );

  ipcMain.handle("jarvis:syncClientLocale", (_event, request) =>
    syncClientLocaleForUser(request.userId, request),
  );
}

export async function initializeApiRuntime(): Promise<string> {
  const embeddedUrl = await startEmbeddedApiRuntime();
  console.info("[jarvis] api runtime initialized:", embeddedUrl);
  await initializeDesktopRuntime();
  return getEmbeddedApiBaseUrl() ?? embeddedUrl;
}
