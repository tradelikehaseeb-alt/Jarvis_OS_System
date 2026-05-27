/**
 * Task chain lifecycle event kinds (Phase 77).
 */
export type TaskChainEventKind =
  | "chain_started"
  | "step_started"
  | "step_completed"
  | "chain_completed"
  | "chain_failed";

/**
 * Event emitted while executing a Hermes-derived OpenClaw task chain.
 */
export interface TaskChainEvent {
  readonly eventId: string;
  readonly chainId: string;
  readonly kind: TaskChainEventKind;
  readonly stepIndex?: number;
  readonly stepId?: string;
  readonly message?: string;
  readonly timestamp: string;
  readonly stub?: boolean;
}

export const TASK_CHAIN_EVENT_LABELS: Readonly<
  Record<TaskChainEventKind, string>
> = {
  chain_started: "Task chain started",
  step_started: "Task chain step started",
  step_completed: "Task chain step completed",
  chain_completed: "Task chain completed",
  chain_failed: "Task chain failed",
};
