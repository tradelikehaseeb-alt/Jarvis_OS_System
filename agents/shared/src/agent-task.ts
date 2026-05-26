import type { TaskIntent } from "@jarvis/types";

/**
 * Work unit passed to an agent by the orchestrator.
 * Aligned with {@link UserTask} / {@link AgentRequest} from @jarvis/types.
 */
export interface AgentTask {
  readonly taskId: string;
  readonly requestId: string;
  readonly userId: string;
  readonly intent: TaskIntent;
  readonly workflowStepId?: string;
  readonly correlationId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
