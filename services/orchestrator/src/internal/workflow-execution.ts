import type {
  AgentContext,
  AgentRegistryContract,
  AgentTask,
} from "@jarvis/agents-shared";
import type { UserTask } from "@jarvis/types";
import type { WorkflowStep } from "@jarvis/types";

import type { Workflow } from "../workflow-manager/contract";
import { OPENCLAW_AGENT_ID, HERMES_AGENT_ID } from "../execution/agent-ids";

export interface WorkflowStepResult {
  readonly stepId: string;
  readonly agentId: string;
  readonly success: boolean;
  readonly payload?: Readonly<Record<string, unknown>>;
  readonly error?: { readonly code: string; readonly message: string };
}

export interface WorkflowExecutionResult {
  readonly workflowId: string;
  readonly success: boolean;
  readonly stepsCompleted: number;
  readonly failedStepId?: string;
  readonly stepResults: readonly WorkflowStepResult[];
  readonly message: string;
}

function sortSteps(steps: readonly WorkflowStep[]): readonly WorkflowStep[] {
  return [...steps].sort((a, b) => a.order - b.order);
}

function dependenciesMet(
  step: WorkflowStep,
  completed: ReadonlySet<string>,
): boolean {
  const deps = step.dependsOn ?? [];
  return deps.every((dep) => completed.has(dep));
}

function buildAgentTask(
  task: UserTask,
  requestId: string,
  step: WorkflowStep,
): AgentTask {
  return {
    taskId: task.id,
    requestId,
    userId: task.userId,
    intent: task.intent,
    correlationId: task.correlationId,
    workflowStepId: step.stepId,
    metadata: {
      ...task.metadata,
      workflowStepId: step.stepId,
      skillId: step.skillId,
    },
  };
}

/**
 * Runs workflow steps sequentially; stops on first failure and reports the failing step.
 */
export async function runWorkflowSteps(
  workflow: Workflow,
  task: UserTask,
  requestId: string,
  agentContext: AgentContext,
  agents: AgentRegistryContract,
): Promise<WorkflowExecutionResult> {
  const ordered = sortSteps(workflow.steps);
  const completed = new Set<string>();
  const stepResults: WorkflowStepResult[] = [];

  for (const step of ordered) {
    if (!dependenciesMet(step, completed)) {
      return {
        workflowId: workflow.workflowId,
        success: false,
        stepsCompleted: stepResults.length,
        failedStepId: step.stepId,
        stepResults,
        message: `Step ${step.stepId} blocked — dependencies not satisfied`,
      };
    }

    const agentId = step.agentId ?? HERMES_AGENT_ID;
    const agent = await agents.resolve(agentId);

    if (!agent) {
      const failure: WorkflowStepResult = {
        stepId: step.stepId,
        agentId,
        success: false,
        error: {
          code: "AGENT_NOT_REGISTERED",
          message: `Agent ${agentId} is not registered`,
        },
      };
      stepResults.push(failure);
      return {
        workflowId: workflow.workflowId,
        success: false,
        stepsCompleted: stepResults.length,
        failedStepId: step.stepId,
        stepResults,
        message: failure.error?.message ?? `Workflow step ${step.stepId} failed`,
      };
    }

    const agentTask = buildAgentTask(task, requestId, step);
    const result = await agent.execute(agentTask, {
      ...agentContext,
      metadata: {
        ...agentContext.metadata,
        workflowId: workflow.workflowId,
        workflowStepId: step.stepId,
        skillId: step.skillId,
        routedAgentId: agentId,
        executionAgent:
          agentId === OPENCLAW_AGENT_ID ? OPENCLAW_AGENT_ID : HERMES_AGENT_ID,
      },
    });

    const stepSuccess = result.success === true;
    stepResults.push({
      stepId: step.stepId,
      agentId: result.agentId,
      success: stepSuccess,
      payload: result.payload as Readonly<Record<string, unknown>> | undefined,
      error: result.error,
    });

    if (!stepSuccess) {
      return {
        workflowId: workflow.workflowId,
        success: false,
        stepsCompleted: stepResults.length,
        failedStepId: step.stepId,
        stepResults,
        message:
          result.error?.message ??
          `Workflow step ${step.stepId} failed on agent ${result.agentId}`,
      };
    }

    completed.add(step.stepId);
  }

  return {
    workflowId: workflow.workflowId,
    success: true,
    stepsCompleted: stepResults.length,
    stepResults,
    message: `Workflow ${workflow.workflowId} completed (${stepResults.length} steps)`,
  };
}
