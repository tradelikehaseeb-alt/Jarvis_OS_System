import type { ApiHealth } from "@jarvis/api-runtime";

import type { ApiRequestLifecycle, ApiRequestState } from "./api-request-lifecycle";

export interface ApiErrorDetails {
  readonly code?: string;
  readonly status?: number;
}

/**
 * Parse IPC/API transport errors into user-facing messages (Phase 54).
 */
export function parseApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Request failed";
}

export function extractApiErrorDetails(error: unknown): ApiErrorDetails {
  if (!(error instanceof Error)) {
    return {};
  }

  const match = error.message.match(/^API (\d+):/);
  return {
    status: match ? Number(match[1]) : undefined,
  };
}

export type ApiLifecycleListener = (lifecycle: ApiRequestLifecycle) => void;

export function notifyLifecycle(
  listener: ApiLifecycleListener | undefined,
  lifecycle: ApiRequestLifecycle,
): void {
  listener?.(lifecycle);
}

export function nextLifecycle(
  state: ApiRequestState,
  attempt: number,
  lastError?: string,
): ApiRequestLifecycle {
  return {
    state,
    attempt,
    ...(lastError ? { lastError } : {}),
  };
}

export function isApiHealthy(health: ApiHealth): boolean {
  return health.status === "ok" && health.orchestrator === "ok";
}
