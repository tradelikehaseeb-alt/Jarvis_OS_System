import type { UserTask, WorkflowStep } from "@jarvis/types";

import { mockWorkflowId } from "./mock-ids";

/**
 * Legacy static workflow steps for NODE_ENV=test stub component mode only.
 */
export function buildStubWorkflowSteps(_task: UserTask): readonly WorkflowStep[] {
  return [
    {
      stepId: "stub-plan",
      order: 0,
      name: "Plan (stub)",
      agentId: "hermes",
      dependsOn: [],
    },
    {
      stepId: "stub-execute",
      order: 1,
      name: "Execute (stub)",
      agentId: "openclaw-gateway",
      dependsOn: ["stub-plan"],
    },
  ] as const;
}

export function buildStubWorkflowMeta(task: UserTask): {
  readonly workflowId: string;
  readonly steps: readonly WorkflowStep[];
} {
  return {
    workflowId: mockWorkflowId(task.id),
    steps: buildStubWorkflowSteps(task),
  };
}
