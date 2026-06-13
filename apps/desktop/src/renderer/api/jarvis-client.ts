import type {
  CreateTaskRequest,
  CreateTaskResponse,
  TaskStatusResponse,
} from "@jarvis/types";
import type { ApiHealth } from "@jarvis/api-runtime";

import {
  buildTaskIntentFromClassification,
  type IntentClassification,
} from "@jarvis/types";
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

const TERMINAL_TASK_STATUSES = new Set<TaskStatusResponse["status"]>([
  "completed",
  "failed",
  "cancelled",
]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Poll until background orchestration reaches a terminal state. */
export async function pollTaskUntilTerminal(
  taskId: string,
  options: {
    readonly intervalMs?: number;
    readonly maxAttempts?: number;
    readonly onLifecycle?: ApiLifecycleListener;
  } = {},
): Promise<TaskStatusResponse> {
  const intervalMs = options.intervalMs ?? 500;
  const maxAttempts = options.maxAttempts ?? 240;
  let status = await getTaskStatus(taskId, options.onLifecycle);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (TERMINAL_TASK_STATUSES.has(status.status)) {
      return status;
    }
    await sleep(intervalMs);
    status = await getTaskStatus(taskId, options.onLifecycle);
  }

  return status;
}

export interface SubmitChatAsTaskOptions {
  readonly classification: IntentClassification;
  readonly onLifecycle?: ApiLifecycleListener;
  readonly skipHealthCheck?: boolean;
  /** Workspace conversation id — must match desktop session for memory recall. */
  readonly conversationId?: string;
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

  const { classification, onLifecycle, skipHealthCheck = false, conversationId } =
    options;
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
        ...(conversationId?.trim()
          ? { conversationId: conversationId.trim() }
          : {}),
      },
    });

    emit("fetching_status", 1);
    const status = await pollTaskUntilTerminal(create.taskId, {
      onLifecycle: (lifecycle) => notifyLifecycle(onLifecycle, lifecycle),
    });

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
