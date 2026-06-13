import type {
  CreateTaskRequest,
  CreateTaskResponse,
  TaskStatusResponse,
} from "@jarvis/types";
import type { ApiHealth } from "@jarvis/api-runtime";

import type { RuntimeHealthSnapshot } from "../ipc/runtime-health-snapshot";
import type {
  RuntimeActionRequest,
  RuntimeActionResponse,
} from "../ipc/runtime-action";
import type { RuntimeStartupResponse } from "./runtime/runtime-startup-types";
import type { AggregatedRuntimeHealthResponse } from "./runtime/aggregated-runtime-health-types";
import type {
  ApiKeyValidationResult,
  ProviderSettings,
  ProviderSettingsSnapshot,
  SaveProviderApiKeyRequest,
  SelectProviderModelRequest,
  SelectProviderRequest,
  SyncClientLocaleRequest,
  JarvisClientLocale,
} from "./providers/provider-settings-types";

/** Mirrors preload bridge (Phase 54). */
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
  getHermesStartupStatus(): Promise<{
    connected: boolean;
    label: string;
    detail: string;
    adapterId: string;
    agentRoot: string;
  }>;
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
  speechInit(): Promise<{
    ready: boolean;
    sttEngine: string;
    ttsEngine: string;
    ttsVoice: string;
    groqConfigured: boolean;
    message: string;
  }>;
  speechTranscribe(request: {
    audioBase64: string;
    mimeType?: string;
    requestId?: string;
  }): Promise<{
    output: string;
    error?: { code: string; message: string };
    audioBase64?: string;
    mimeType?: string;
    confidence?: number;
    isWakeWord?: boolean;
  }>;
  speechSpeak(request: {
    text: string;
    requestId?: string;
    voice?: string;
  }): Promise<{
    output: string;
    error?: { code: string; message: string };
    audioBase64?: string;
    mimeType?: string;
  }>;
  onSpeechPlaybackStream(
    handler: (payload: {
      requestId: string;
      audioBase64: string;
      mimeType: string;
      providerId: string;
    }) => void,
  ): () => void;
  onSpeechPlaybackStop(handler: () => void): () => void;
}

declare global {
  interface Window {
    jarvis: JarvisDesktopApi;
  }
}

export {};
