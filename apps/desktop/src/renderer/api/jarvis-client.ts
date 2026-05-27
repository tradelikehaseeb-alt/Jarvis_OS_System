import type {
  CreateTaskRequest,
  CreateTaskResponse,
  TaskStatusResponse,
} from "@jarvis/types";
import type { ApiHealth } from "@jarvis/api-runtime";

import {
  buildTaskIntentFromClassification,
  type IntentClassification,
} from "../intent";
import {
  createInitialApiLifecycle,
  type ApiRequestLifecycle,
} from "./api-request-lifecycle";
import {
  isApiHealthy,
  nextLifecycle,
  notifyLifecycle,
  parseApiError,
  type ApiLifecycleListener,
} from "./api-communication";

/**
 * Renderer client for Jarvis API runtime via Electron preload (Phase 54).
 */
export class JarvisApiError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
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

export async function checkApiHealth(): Promise<ApiHealth> {
  return getBridge().checkApiHealth();
}

export async function createTask(
  body: CreateTaskRequest,
  onLifecycle?: ApiLifecycleListener,
): Promise<CreateTaskResponse> {
  notifyLifecycle(onLifecycle, nextLifecycle("creating_task", 1));
  try {
    const result = await getBridge().createTask(body);
    notifyLifecycle(onLifecycle, nextLifecycle("completed", 1));
    return result;
  } catch (error) {
    const message = parseApiError(error);
    notifyLifecycle(onLifecycle, nextLifecycle("failed", 1, message));
    throw new JarvisApiError(message);
  }
}

export async function getTaskStatus(
  taskId: string,
  onLifecycle?: ApiLifecycleListener,
): Promise<TaskStatusResponse> {
  notifyLifecycle(onLifecycle, nextLifecycle("fetching_status", 1));
  try {
    const result = await getBridge().getTaskStatus(taskId);
    notifyLifecycle(onLifecycle, nextLifecycle("completed", 1));
    return result;
  } catch (error) {
    const message = parseApiError(error);
    notifyLifecycle(onLifecycle, nextLifecycle("failed", 1, message));
    throw new JarvisApiError(message);
  }
}

export interface SubmitChatAsTaskOptions {
  readonly classification: IntentClassification;
  readonly onLifecycle?: ApiLifecycleListener;
  readonly skipHealthCheck?: boolean;
}

/**
 * Chat helper — health check, classify intent, POST /tasks, fetch status (Phase 54).
 */
export async function submitChatAsTask(
  message: string,
  options: SubmitChatAsTaskOptions,
): Promise<{
  create: CreateTaskResponse;
  status: TaskStatusResponse;
  classification: IntentClassification;
  lifecycle: ApiRequestLifecycle;
}> {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new JarvisApiError("Message must not be empty");
  }

  const { classification, onLifecycle, skipHealthCheck = false } = options;
  let lifecycle = createInitialApiLifecycle();

  const emit = (state: ApiRequestLifecycle["state"], attempt: number, lastError?: string) => {
    lifecycle = nextLifecycle(state, attempt, lastError);
    notifyLifecycle(onLifecycle, lifecycle);
  };

  try {
    if (!skipHealthCheck) {
      emit("checking_health", 1);
      const health = await checkApiHealth();
      if (!isApiHealthy(health)) {
        throw new JarvisApiError(
          `API runtime unhealthy (${health.status}, orchestrator ${health.orchestrator})`,
        );
      }
    }

    const intent = buildTaskIntentFromClassification(trimmed, classification);

    emit("creating_task", 1);
    const create = await getBridge().createTask({
      intent,
      correlationId: `desktop-${Date.now()}`,
      metadata: {
        source: "desktop-chat",
        classifiedIntent: classification.intent,
        classificationRule: classification.ruleId,
      },
    });

    emit("fetching_status", 1);
    const status = await getBridge().getTaskStatus(create.taskId);

    emit("completed", 1);
    return { create, status, classification, lifecycle };
  } catch (error) {
    const messageText = parseApiError(error);
    emit("failed", lifecycle.attempt || 1, messageText);
    throw error instanceof JarvisApiError
      ? error
      : new JarvisApiError(messageText);
  }
}
