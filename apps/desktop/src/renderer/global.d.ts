import type {
  CreateTaskRequest,
  CreateTaskResponse,
  TaskStatusResponse,
} from "@jarvis/types";
import type { ApiHealth } from "@jarvis/api-runtime";

/** Mirrors preload bridge (Phase 54). */
export interface JarvisDesktopApi {
  getApiUrl(): Promise<string>;
  checkApiHealth(): Promise<ApiHealth>;
  createTask(body: CreateTaskRequest): Promise<CreateTaskResponse>;
  getTaskStatus(taskId: string): Promise<TaskStatusResponse>;
}

declare global {
  interface Window {
    jarvis: JarvisDesktopApi;
  }
}

export {};
