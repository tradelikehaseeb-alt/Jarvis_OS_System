import type {
  CreateTaskRequest,
  CreateTaskResponse,
  TaskStatusResponse,
} from "@jarvis/types";

import {
  buildTaskIntentFromClassification,
  type IntentClassification,
} from "../intent";
/**
 * Renderer client for api-gateway via Electron preload (Phase 18).
 */
export class JarvisApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JarvisApiError";
  }
}

function getBridge(): Window["jarvis"] {
  if (typeof window === "undefined" || !window.jarvis) {
    throw new JarvisApiError("Jarvis desktop API is not available");
  }
  return window.jarvis;
}

export async function getApiUrl(): Promise<string> {
  return getBridge().getApiUrl();
}

export async function createTask(
  body: CreateTaskRequest,
): Promise<CreateTaskResponse> {
  return getBridge().createTask(body);
}

export async function getTaskStatus(
  taskId: string,
): Promise<TaskStatusResponse> {
  return getBridge().getTaskStatus(taskId);
}

export interface SubmitChatAsTaskOptions {
  readonly classification: IntentClassification;
}

/**
 * Chat helper — classify intent, POST /tasks, then fetch status (Phase 24).
 */
export async function submitChatAsTask(
  message: string,
  options: SubmitChatAsTaskOptions,
): Promise<{
  create: CreateTaskResponse;
  status: TaskStatusResponse;
  classification: IntentClassification;
}> {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new JarvisApiError("Message must not be empty");
  }

  const { classification } = options;
  const intent = buildTaskIntentFromClassification(trimmed, classification);

  const create = await createTask({
    intent,
    correlationId: `desktop-${Date.now()}`,
    metadata: {
      source: "desktop-chat",
      classifiedIntent: classification.intent,
      classificationRule: classification.ruleId,
    },
  });

  const status = await getTaskStatus(create.taskId);
  return { create, status, classification };
}