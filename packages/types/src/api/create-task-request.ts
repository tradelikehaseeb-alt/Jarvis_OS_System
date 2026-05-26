import type { TaskIntent } from "../contracts/task-intent";

/**
 * HTTP body for creating a new user task via the API gateway.
 * Maps to `POST /tasks` (Phase 4+).
 */
export interface CreateTaskRequest {
  /** Declared user intent — forwarded to orchestrator as {@link UserTask.intent}. */
  readonly intent: TaskIntent;
  /** Optional idempotency key from the client. */
  readonly correlationId?: string;
  /** Client metadata (no secrets). */
  readonly metadata?: Readonly<Record<string, unknown>>;
}
