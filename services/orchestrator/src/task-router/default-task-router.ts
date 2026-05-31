import type { TaskRouter, TaskRouterInput, TaskRouterOutput } from "./contract";
import { buildWorkflowRouteMeta } from "../internal/stub-workflow";

/**
 * Routes tasks using intent detection (search → research, browse → automate, etc.).
 */
export class DefaultTaskRouter implements TaskRouter {
  readonly componentId = "task-router" as const;

  async route(input: TaskRouterInput): Promise<TaskRouterOutput> {
    const meta = buildWorkflowRouteMeta(input.task);
    return {
      workflowId: meta.workflowId,
      steps: meta.steps,
    };
  }
}
