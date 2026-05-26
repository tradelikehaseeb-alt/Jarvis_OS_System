import type { TaskIntent } from "./task-intent";

/**
 * User-submitted work unit entering the orchestrator from the API gateway.
 */
export interface UserTask {
  /** Stable task identifier (UUID). */
  readonly id: string;
  /** Owner of the task. */
  readonly userId: string;
  /** Parsed or raw user intent. */
  readonly intent: TaskIntent;
  /** ISO-8601 creation timestamp. */
  readonly createdAt: string;
  /** Optional idempotency or session correlation. */
  readonly correlationId?: string;
  /** Extensible metadata (no PII by convention). */
  readonly metadata?: Readonly<Record<string, unknown>>;
}
