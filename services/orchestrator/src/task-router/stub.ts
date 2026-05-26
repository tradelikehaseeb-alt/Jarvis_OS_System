import type { TaskRouter, TaskRouterInput, TaskRouterOutput } from "./contract";
import { buildStubWorkflowMeta } from "../internal/stub-workflow";

/**
 * Routes every task to the static stub workflow (Phase 4).
 */
export class TaskRouterStub implements TaskRouter {
  readonly componentId = "task-router" as const;

  async route(input: TaskRouterInput): Promise<TaskRouterOutput> {
    return buildStubWorkflowMeta(input.task);
  }
}
