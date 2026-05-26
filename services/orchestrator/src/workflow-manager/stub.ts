import type { WorkflowManager, WorkflowManagerBuildInput } from "./contract";
import type { Workflow } from "./contract";
import { buildStubWorkflowMeta } from "../internal/stub-workflow";

/**
 * Builds static workflows from tasks — no planning logic (Phase 4 stub).
 */
export class WorkflowManagerStub implements WorkflowManager {
  readonly componentId = "workflow-manager" as const;

  async build(input: WorkflowManagerBuildInput): Promise<Workflow> {
    const { workflowId, steps } = buildStubWorkflowMeta(input.task);
    return {
      workflowId: input.workflowId || workflowId,
      taskId: input.task.id,
      steps,
    };
  }
}
