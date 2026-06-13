import { contextBridge, ipcRenderer } from "electron";

import type {
  CreateTaskRequest,
  CreateTaskResponse,
  TaskStatusResponse,
} from "@jarvis/types";
import type { ApiHealth } from "@jarvis/api-runtime";

import type { RuntimeHealthSnapshot } from "./ipc/runtime-health-snapshot";
import type {
  RuntimeActionRequest,
  RuntimeActionResponse,
} from "./ipc/runtime-action";
import type { RuntimeStartupResponse } from "./ipc/runtime-startup-lifecycle";
import type { HermesStartupStatus } from "./ipc/hermes-startup-status";
import type {
  SpeechInitStatus,
  SpeechIpcResponse,
  SpeechSpeakRequest,
  SpeechTranscribeRequest,
} from "./ipc/speech-types";
import type { SpeechPlaybackStreamPayload } from "./ipc/speech-playback-runtime";
import type { AggregatedRuntimeHealthResponse } from "./ipc/aggregated-runtime-health-response";
import type {
  ApiKeyValidationResult,
  ProviderSettings,
  ProviderSettingsSnapshot,
  SaveProviderApiKeyRequest,
  SelectProviderModelRequest,
  SelectProviderRequest,
  SyncClientLocaleRequest,
} from "./ipc/provider-settings-types";
import type { JarvisClientLocale } from "@jarvis/provider-runtime";

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
  getHermesStartupStatus(): Promise<HermesStartupStatus>;
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
  syncClientLocale(request: SyncClientLocaleRequest): Promise<JarvisClientLocale>;
  speechInit(): Promise<SpeechInitStatus>;
  speechTranscribe(request: SpeechTranscribeRequest): Promise<SpeechIpcResponse>;
  speechSpeak(request: SpeechSpeakRequest): Promise<SpeechIpcResponse>;
  onSpeechPlaybackStream(
    handler: (payload: SpeechPlaybackStreamPayload) => void,
  ): () => void;
  onSpeechPlaybackStop(handler: () => void): () => void;
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
  getHermesStartupStatus: () =>
    ipcRenderer.invoke("jarvis:getHermesStartupStatus"),
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
  syncClientLocale: (request) =>
    ipcRenderer.invoke("jarvis:syncClientLocale", request),
  speechInit: () => ipcRenderer.invoke("speech:init"),
  speechTranscribe: (request) => ipcRenderer.invoke("speech:transcribe", request),
  speechSpeak: (request) => ipcRenderer.invoke("speech:speak", request),
  onSpeechPlaybackStream: (handler) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: SpeechPlaybackStreamPayload) => {
      handler(payload);
    };
    ipcRenderer.on("speech:playback-stream", listener);
    return () => {
      ipcRenderer.removeListener("speech:playback-stream", listener);
    };
  },
  onSpeechPlaybackStop: (handler) => {
    const listener = () => handler();
    ipcRenderer.on("speech:playback-stop", listener);
    return () => {
      ipcRenderer.removeListener("speech:playback-stop", listener);
    };
  },
};

contextBridge.exposeInMainWorld("jarvis", jarvisApi);
