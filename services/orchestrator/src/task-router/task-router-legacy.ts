import type { TaskRouter, TaskRouterInput, TaskRouterOutput } from "./contract";
import { buildStubWorkflowMeta } from "../internal/stub-workflow-legacy";

/** Legacy stub router — test-only when `ORCHESTRATOR_FORCE_STUB_COMPONENTS=true`. */
export class TaskRouterStub implements TaskRouter {
  readonly componentId = "task-router" as const;

  async route(input: TaskRouterInput): Promise<TaskRouterOutput> {
    return buildStubWorkflowMeta(input.task);
  }
}
