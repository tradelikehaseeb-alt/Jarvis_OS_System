import { contextBridge, ipcRenderer } from "electron";

import type {
  CreateTaskRequest,
  CreateTaskResponse,
  TaskStatusResponse,
} from "@jarvis/types";

/**
 * Renderer-safe API — delegates to main process IPC (Phase 18).
 */
export interface JarvisDesktopApi {
  getApiUrl(): Promise<string>;
  createTask(body: CreateTaskRequest): Promise<CreateTaskResponse>;
  getTaskStatus(taskId: string): Promise<TaskStatusResponse>;
}

const jarvisApi: JarvisDesktopApi = {
  getApiUrl: () => ipcRenderer.invoke("jarvis:getApiUrl"),
  createTask: (body) => ipcRenderer.invoke("jarvis:createTask", body),
  getTaskStatus: (taskId) => ipcRenderer.invoke("jarvis:getTaskStatus", taskId),
};

contextBridge.exposeInMainWorld("jarvis", jarvisApi);
