import type {
  Workflow,
  WorkflowManager,
  WorkflowManagerBuildInput,
} from "./contract";
import { buildWorkflowRouteMeta } from "../internal/stub-workflow";

/**
 * Materializes workflows from task intent and router-aligned step plans.
 */
export class DefaultWorkflowManager implements WorkflowManager {
  readonly componentId = "workflow-manager" as const;

  async build(input: WorkflowManagerBuildInput): Promise<Workflow> {
    const meta = buildWorkflowRouteMeta(input.task);
    return {
      workflowId: input.workflowId || meta.workflowId,
      taskId: input.task.id,
      steps: meta.steps,
    };
  }
}
