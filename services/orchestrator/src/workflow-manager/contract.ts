import type { UserTask, WorkflowStep } from "@jarvis/types";

/**
 * A composed workflow ready for execution.
 */
export interface Workflow {
  readonly workflowId: string;
  readonly taskId: string;
  readonly steps: readonly WorkflowStep[];
}

/**
 * Input to materialize a workflow from a user task.
 */
export interface WorkflowManagerBuildInput {
  readonly task: UserTask;
  readonly workflowId: string;
}

/**
 * Builds and validates workflow definitions from tasks (Phase 2 skeleton).
 */
export interface WorkflowManager {
  readonly componentId: "workflow-manager";
  build(input: WorkflowManagerBuildInput): Promise<Workflow>;
}
