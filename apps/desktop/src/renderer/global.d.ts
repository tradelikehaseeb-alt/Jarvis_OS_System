import type {
  CreateTaskRequest,
  CreateTaskResponse,
  TaskStatusResponse,
} from "@jarvis/types";
import type { ApiHealth } from "@jarvis/api-runtime";

import type { RuntimeHealthSnapshot } from "../ipc/runtime-health-snapshot";

/** Mirrors preload bridge (Phase 54). */
export interface JarvisDesktopApi {
  getApiUrl(): Promise<string>;
  checkApiHealth(): Promise<ApiHealth>;
  getRuntimeHealth(): Promise<RuntimeHealthSnapshot>;
  createTask(body: CreateTaskRequest): Promise<CreateTaskResponse>;
  getTaskStatus(taskId: string): Promise<TaskStatusResponse>;
}

declare global {
  interface Window {
    jarvis: JarvisDesktopApi;
  }
}

export {};
