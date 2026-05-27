import { contextBridge, ipcRenderer } from "electron";

import type {
  CreateTaskRequest,
  CreateTaskResponse,
  TaskStatusResponse,
} from "@jarvis/types";
import type { ApiHealth } from "@jarvis/api-runtime";

import type { RuntimeHealthSnapshot } from "./runtime-health-snapshot";

/**
 * Renderer-safe API — delegates to main process IPC (Phase 54).
 */
export interface JarvisDesktopApi {
  getApiUrl(): Promise<string>;
  checkApiHealth(): Promise<ApiHealth>;
  getRuntimeHealth(): Promise<RuntimeHealthSnapshot>;
  createTask(body: CreateTaskRequest): Promise<CreateTaskResponse>;
  getTaskStatus(taskId: string): Promise<TaskStatusResponse>;
}

const jarvisApi: JarvisDesktopApi = {
  getApiUrl: () => ipcRenderer.invoke("jarvis:getApiUrl"),
  checkApiHealth: () => ipcRenderer.invoke("jarvis:checkApiHealth"),
  getRuntimeHealth: () => ipcRenderer.invoke("jarvis:getRuntimeHealth"),
  createTask: (body) => ipcRenderer.invoke("jarvis:createTask", body),
  getTaskStatus: (taskId) => ipcRenderer.invoke("jarvis:getTaskStatus", taskId),
};

contextBridge.exposeInMainWorld("jarvis", jarvisApi);
