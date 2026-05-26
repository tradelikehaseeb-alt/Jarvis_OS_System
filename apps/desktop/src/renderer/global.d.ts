import type {
  CreateTaskRequest,
  CreateTaskResponse,
  TaskStatusResponse,
} from "@jarvis/types";

/** Mirrors preload bridge (Phase 18). */
export interface JarvisDesktopApi {
  getApiUrl(): Promise<string>;
  createTask(body: CreateTaskRequest): Promise<CreateTaskResponse>;
  getTaskStatus(taskId: string): Promise<TaskStatusResponse>;
}

declare global {
  interface Window {
    jarvis: JarvisDesktopApi;
  }
}

export {};
