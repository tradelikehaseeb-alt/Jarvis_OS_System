import type { UserTask, WorkflowStep } from "@jarvis/types";

/**
 * Input for routing a {@link UserTask} to a workflow pipeline.
 */
export interface TaskRouterInput {
  readonly task: UserTask;
}

/**
 * Output of task routing — workflow identity and ordered steps (contract only).
 */
export interface TaskRouterOutput {
  readonly workflowId: string;
  readonly steps: readonly WorkflowStep[];
}

/**
 * Routes incoming user tasks to the appropriate workflow (Phase 2 skeleton).
 * Implementation deferred to Phase 3+.
 */
export interface TaskRouter {
  readonly componentId: "task-router";
  route(input: TaskRouterInput): Promise<TaskRouterOutput>;
}
