import type {
  CreateTaskRequest,
  CreateTaskResponse,
  TaskStatusResponse,
} from "@jarvis/types";
import type { ApiHealth } from "@jarvis/api-runtime";

import type { JarvisDesktopApi } from "../global";
import { createMockJarvisApi } from "../test/mock-jarvis-api";

const DEFAULT_API_URL = "http://127.0.0.1:8787";

function isTestEnvironment(): boolean {
  if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
    return true;
  }
  if (typeof import.meta !== "undefined") {
    const env = import.meta as ImportMeta & {
      env?: { MODE?: string; NODE_ENV?: string };
    };
    return env.env?.MODE === "test" || env.env?.NODE_ENV === "test";
  }
  return false;
}

function resolveApiBaseUrl(): string {
  if (typeof window !== "undefined" && window.jarvis?.getApiUrl) {
    return DEFAULT_API_URL;
  }
  return (
    (typeof process !== "undefined" && process.env.JARVIS_API_URL) ||
    DEFAULT_API_URL
  );
}

function resolveInternalHeaders(): Record<string, string> {
  const token =
    (typeof process !== "undefined" && process.env.JARVIS_INTERNAL_TOKEN) ||
    undefined;
  if (!token) {
    return { "Content-Type": "application/json" };
  }
  return {
    "Content-Type": "application/json",
    "X-Jarvis-Internal-Token": token,
    Authorization: `Bearer ${token}`,
  };
}

async function apiFetch<T>(baseUrl: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    ...init,
    headers: {
      ...resolveInternalHeaders(),
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API ${response.status}: ${text}`);
  }
  return (await response.json()) as T;
}

/**
 * Real HTTP Jarvis API for renderer tests and optional direct fetch usage.
 */
export function createRealJarvisApi(baseUrl = resolveApiBaseUrl()): JarvisDesktopApi {
  const normalized = baseUrl.replace(/\/$/, "");

  return {
    getApiUrl: async () => normalized,
    checkApiHealth: async () =>
      apiFetch<ApiHealth>(normalized, "/health", { method: "GET" }),
    getRuntimeHealth: async () => ({
      health: {
        status: "healthy",
        processCount: 1,
        runningCount: 1,
        failedCount: 0,
        checkedAt: new Date().toISOString(),
      },
      processes: [],
    }),
    executeRuntimeAction: async () => undefined,
    initializeRuntime: async () => ({
      state: {
        phase: "ready",
        ready: true,
        initialized: true,
        validated: true,
        recovered: false,
        processCount: 1,
        healthyProcessCount: 1,
        failedProcesses: [],
        message: "API connected",
        updatedAt: new Date().toISOString(),
      },
      events: [],
      apiBaseUrl: normalized,
    }),
    validateRuntime: async () => ({
      state: {
        phase: "ready",
        ready: true,
        initialized: true,
        validated: true,
        recovered: false,
        processCount: 1,
        healthyProcessCount: 1,
        failedProcesses: [],
        message: "Validated",
        updatedAt: new Date().toISOString(),
      },
      events: [],
      apiBaseUrl: normalized,
    }),
    recoverRuntime: async () => ({
      state: {
        phase: "ready",
        ready: true,
        initialized: true,
        validated: true,
        recovered: true,
        processCount: 1,
        healthyProcessCount: 1,
        failedProcesses: [],
        message: "Recovered",
        updatedAt: new Date().toISOString(),
      },
      events: [],
      apiBaseUrl: normalized,
    }),
    getStartupStatus: async () => ({
      state: {
        phase: "ready",
        ready: true,
        initialized: true,
        validated: true,
        recovered: false,
        processCount: 1,
        healthyProcessCount: 1,
        failedProcesses: [],
        message: "Ready",
        updatedAt: new Date().toISOString(),
      },
      events: [],
      apiBaseUrl: normalized,
    }),
    getAggregatedRuntimeHealth: async () => ({
      health: {
        status: "healthy",
        components: [],
        startupPhase: "ready",
        recoveryState: "none",
        checkedAt: new Date().toISOString(),
        healthyCount: 1,
        totalCount: 1,
      },
      progress: {
        phase: "ready",
        percent: 100,
        ready: true,
        message: "Ready",
      },
      events: [],
    }),
    getAggregatedRuntimeHealthSnapshot: async () => ({
      health: {
        status: "healthy",
        components: [],
        startupPhase: "ready",
        recoveryState: "none",
        checkedAt: new Date().toISOString(),
        healthyCount: 1,
        totalCount: 1,
      },
      progress: {
        phase: "ready",
        percent: 100,
        ready: true,
        message: "Ready",
      },
      events: [],
    }),
    createTask: async (body: CreateTaskRequest) =>
      apiFetch<CreateTaskResponse>(normalized, "/tasks", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    getTaskStatus: async (taskId: string) =>
      apiFetch<TaskStatusResponse>(
        normalized,
        `/tasks/${encodeURIComponent(taskId)}`,
        { method: "GET" },
      ),
    getProviderSettings: async () => ({
      settings: {
        userId: "desktop-user",
        selectedProviderId: "groq",
        selectedModels: {},
        updatedAt: new Date().toISOString(),
      },
      providers: [],
    }),
    saveProviderApiKey: async () => ({
      valid: true,
      providerId: "groq",
      stub: false,
      message: "ok",
    }),
    validateProviderApiKey: async () => ({
      valid: true,
      providerId: "groq",
      stub: false,
      message: "ok",
    }),
    selectProvider: async () => ({
      userId: "desktop-user",
      selectedProviderId: "groq",
      selectedModels: {},
      updatedAt: new Date().toISOString(),
    }),
    selectProviderModel: async () => ({
      userId: "desktop-user",
      selectedProviderId: "groq",
      selectedModels: {},
      updatedAt: new Date().toISOString(),
    }),
  };
}

/**
 * Auto-select mock API in test, real HTTP in production renderer builds.
 */
export function createJarvisApi(): JarvisDesktopApi {
  if (isTestEnvironment()) {
    return createMockJarvisApi();
  }
  return createRealJarvisApi();
}

export { createMockJarvisApi, isTestEnvironment };
