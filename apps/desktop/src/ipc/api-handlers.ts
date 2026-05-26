import { ipcMain } from "electron";

import type {
  CreateTaskRequest,
  CreateTaskResponse,
  TaskStatusResponse,
} from "@jarvis/types";

/** Default API gateway URL (override with JARVIS_API_URL). */
export const DEFAULT_API_URL = "http://127.0.0.1:8000";

export function getApiBaseUrl(): string {
  return process.env.JARVIS_API_URL ?? DEFAULT_API_URL;
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
    throw new Error(`API ${response.status}: ${text}`);
  }

  return (await response.json()) as T;
}

/**
 * Register IPC handlers — main process calls api-gateway (Phase 18).
 * Avoids renderer CORS when loading from file://.
 */
export function registerApiHandlers(): void {
  ipcMain.handle("jarvis:getApiUrl", () => getApiBaseUrl());

  ipcMain.handle(
    "jarvis:createTask",
    (_event, body: CreateTaskRequest) =>
      apiFetch<CreateTaskResponse>("/tasks", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  );

  ipcMain.handle("jarvis:getTaskStatus", (_event, taskId: string) =>
    apiFetch<TaskStatusResponse>(`/tasks/${encodeURIComponent(taskId)}`),
  );
}
