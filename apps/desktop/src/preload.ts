import { contextBridge, ipcRenderer } from "electron";

import type {
  CreateTaskRequest,
  CreateTaskResponse,
  TaskStatusResponse,
} from "@jarvis/types";
import type { ApiHealth } from "@jarvis/api-runtime";

import type { RuntimeHealthSnapshot } from "./runtime-health-snapshot";
import type {
  RuntimeActionRequest,
  RuntimeActionResponse,
} from "./runtime-action";
import type { RuntimeStartupResponse } from "./runtime-startup-snapshot";
import type { AggregatedRuntimeHealthResponse } from "./aggregated-runtime-health-response";
import type {
  ApiKeyValidationResult,
  ProviderSettings,
  ProviderSettingsSnapshot,
  SaveProviderApiKeyRequest,
  SelectProviderModelRequest,
  SelectProviderRequest,
} from "./ipc/provider-settings-types";

/**
 * Renderer-safe API — delegates to main process IPC (Phase 54).
 */
export interface JarvisDesktopApi {
  getApiUrl(): Promise<string>;
  checkApiHealth(): Promise<ApiHealth>;
  getRuntimeHealth(): Promise<RuntimeHealthSnapshot>;
  executeRuntimeAction(
    request: RuntimeActionRequest,
  ): Promise<RuntimeActionResponse>;
  initializeRuntime(): Promise<RuntimeStartupResponse>;
  validateRuntime(): Promise<RuntimeStartupResponse>;
  recoverRuntime(): Promise<RuntimeStartupResponse>;
  getStartupStatus(): Promise<RuntimeStartupResponse>;
  getAggregatedRuntimeHealth(): Promise<AggregatedRuntimeHealthResponse>;
  getAggregatedRuntimeHealthSnapshot(): Promise<AggregatedRuntimeHealthResponse>;
  createTask(body: CreateTaskRequest): Promise<CreateTaskResponse>;
  getTaskStatus(taskId: string): Promise<TaskStatusResponse>;
  getProviderSettings(userId: string): Promise<ProviderSettingsSnapshot>;
  saveProviderApiKey(
    request: SaveProviderApiKeyRequest,
  ): Promise<ApiKeyValidationResult>;
  validateProviderApiKey(payload: {
    userId: string;
    providerId: string;
    apiKey?: string;
  }): Promise<ApiKeyValidationResult>;
  selectProvider(request: SelectProviderRequest): Promise<ProviderSettings>;
  selectProviderModel(
    request: SelectProviderModelRequest,
  ): Promise<ProviderSettings>;
}

const jarvisApi: JarvisDesktopApi = {
  getApiUrl: () => ipcRenderer.invoke("jarvis:getApiUrl"),
  checkApiHealth: () => ipcRenderer.invoke("jarvis:checkApiHealth"),
  getRuntimeHealth: () => ipcRenderer.invoke("jarvis:getRuntimeHealth"),
  executeRuntimeAction: (request) =>
    ipcRenderer.invoke("jarvis:executeRuntimeAction", request),
  initializeRuntime: () => ipcRenderer.invoke("jarvis:initializeRuntime"),
  validateRuntime: () => ipcRenderer.invoke("jarvis:validateRuntime"),
  recoverRuntime: () => ipcRenderer.invoke("jarvis:recoverRuntime"),
  getStartupStatus: () => ipcRenderer.invoke("jarvis:getStartupStatus"),
  getAggregatedRuntimeHealth: () =>
    ipcRenderer.invoke("jarvis:getAggregatedRuntimeHealth"),
  getAggregatedRuntimeHealthSnapshot: () =>
    ipcRenderer.invoke("jarvis:getAggregatedRuntimeHealthSnapshot"),
  createTask: (body) => ipcRenderer.invoke("jarvis:createTask", body),
  getTaskStatus: (taskId) => ipcRenderer.invoke("jarvis:getTaskStatus", taskId),
  getProviderSettings: (userId) =>
    ipcRenderer.invoke("jarvis:getProviderSettings", userId),
  saveProviderApiKey: (request) =>
    ipcRenderer.invoke("jarvis:saveProviderApiKey", request),
  validateProviderApiKey: (payload) =>
    ipcRenderer.invoke("jarvis:validateProviderApiKey", payload),
  selectProvider: (request) => ipcRenderer.invoke("jarvis:selectProvider", request),
  selectProviderModel: (request) =>
    ipcRenderer.invoke("jarvis:selectProviderModel", request),
};

contextBridge.exposeInMainWorld("jarvis", jarvisApi);
