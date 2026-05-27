import { contextBridge, ipcRenderer } from "electron";

import type {
  CreateTaskRequest,
  CreateTaskResponse,
  TaskStatusResponse,
} from "@jarvis/types";
import type { ApiHealth } from "@jarvis/api-runtime";

/**
 * Renderer-safe API — delegates to main process IPC (Phase 54).
 */
export interface JarvisDesktopApi {
  getApiUrl(): Promise<string>;
  checkApiHealth(): Promise<ApiHealth>;
  createTask(body: CreateTaskRequest): Promise<CreateTaskResponse>;
  getTaskStatus(taskId: string): Promise<TaskStatusResponse>;
}

const jarvisApi: JarvisDesktopApi = {
  getApiUrl: () => ipcRenderer.invoke("jarvis:getApiUrl"),
  checkApiHealth: () => ipcRenderer.invoke("jarvis:checkApiHealth"),
  createTask: (body) => ipcRenderer.invoke("jarvis:createTask", body),
  getTaskStatus: (taskId) => ipcRenderer.invoke("jarvis:getTaskStatus", taskId),
};

contextBridge.exposeInMainWorld("jarvis", jarvisApi);
