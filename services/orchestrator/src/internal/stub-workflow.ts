import type { UserTask, WorkflowStep } from "@jarvis/types";

import { mockWorkflowId } from "./mock-ids";

/**
 * Static workflow steps returned by router/workflow stubs (no agent execution).
 */
export function buildStubWorkflowSteps(task: UserTask): readonly WorkflowStep[] {
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
