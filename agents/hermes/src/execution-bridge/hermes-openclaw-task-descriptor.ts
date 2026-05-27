import type { TaskIntent } from "@jarvis/types";

/**
 * OpenClaw task descriptor produced from a {@link HermesExecutionPlan} step (Phase 77).
 */
export interface HermesOpenClawTaskDescriptor {
  readonly taskId: string;
  readonly stepId: string;
  readonly index: number;
  readonly intent: TaskIntent;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
