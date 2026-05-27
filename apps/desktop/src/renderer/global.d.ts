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
  getAggregatedRuntimeHealth(): Promise<AggregatedRuntimeHealthResponse>;
  getAggregatedRuntimeHealthSnapshot(): Promise<AggregatedRuntimeHealthResponse>;
  createTask(body: CreateTaskRequest): Promise<CreateTaskResponse>;
  getTaskStatus(taskId: string): Promise<TaskStatusResponse>;
}

declare global {
  interface Window {
    jarvis: JarvisDesktopApi;
  }
}

export {};
