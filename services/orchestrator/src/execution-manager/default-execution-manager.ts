import type { AgentRegistryContract } from "@jarvis/agents-shared";
import {
  createDefaultLocalMemoryRuntime,
  type LocalMemoryRuntime,
} from "@jarvis/local-memory";
import type { AgentTask } from "@jarvis/agents-shared";

import {
  runWorkflowSteps,
  type WorkflowExecutionResult,
} from "../internal/workflow-execution";
import type {
  ExecutionManager,
  ExecutionManagerResult,
  ExecutionManagerStartInput,
  ExecutionManagerWorkflowInput,
  ExecutionStatus,
} from "./contract";

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Tracks workflow execution, dispatches real agents, persists results to local-memory.
 */
export class DefaultExecutionManager implements ExecutionManager {
  readonly componentId = "execution-manager" as const;

  private readonly statusByTask = new Map<string, ExecutionStatus>();

  constructor(
    private readonly options: {
      readonly agents?: AgentRegistryContract;
      readonly localMemory?: LocalMemoryRuntime;
    } = {},
  ) {}

  private memory(): LocalMemoryRuntime {
    return (
      this.options.localMemory ??
      createDefaultLocalMemoryRuntime({
        useFileBackend: process.env.NODE_ENV !== "test",
      })
    );
  }

  private persistExecution(
    taskId: string,
    record: Readonly<Record<string, unknown>>,
  ): void {
    this.memory().saveMemory({
      recordId: `exec-${taskId}-${Date.now()}`,
      type: "execution",
      userId:
        typeof record.userId === "string" ? record.userId : "unknown-user",
      taskId,
      timestamp: nowIso(),
      content: record,
      schemaVersion: 1,
    });
  }

  async start(input: ExecutionManagerStartInput): Promise<ExecutionManagerResult> {
    const { handle, agentRequest } = input;
    const taskId = agentRequest.task.id;
    const startedAt = nowIso();

    const status: ExecutionStatus = {
      taskId,
      executionId: handle.executionId,
      status: "running",
      startedAt,
      agentId: agentRequest.agentId,
      stepId: handle.step.stepId,
    };
    this.statusByTask.set(taskId, status);

    const agents = this.options.agents;
    if (!agents) {
      const endedAt = nowIso();
      const failed: ExecutionStatus = {
        ...status,
        status: "failed",
        endedAt,
        error: {
          code: "AGENT_REGISTRY_UNAVAILABLE",
          message: "No agent registry wired for execution manager",
        },
      };
      this.statusByTask.set(taskId, failed);
      return {
        handle,
        agentResponse: {
          requestId: agentRequest.requestId,
          agentId: agentRequest.agentId,
          success: false,
          error: failed.error,
        },
        taskResult: {
          taskId,
          status: "failed",
          output: { executionId: handle.executionId, failedStepId: handle.step.stepId },
        },
      };
    }

    const agent = await agents.resolve(agentRequest.agentId);
    if (!agent) {
      const endedAt = nowIso();
      const failed: ExecutionStatus = {
        ...status,
        status: "failed",
        endedAt,
        error: {
          code: "AGENT_NOT_REGISTERED",
          message: `Agent ${agentRequest.agentId} is not registered`,
        },
      };
      this.statusByTask.set(taskId, failed);
      return {
        handle,
        agentResponse: {
          requestId: agentRequest.requestId,
          agentId: agentRequest.agentId,
          success: false,
          error: failed.error,
        },
        taskResult: {
          taskId,
          status: "failed",
          output: { executionId: handle.executionId, failedStepId: handle.step.stepId },
        },
      };
    }

    const agentTask: AgentTask = {
      taskId: agentRequest.task.id,
      requestId: agentRequest.requestId,
      userId: agentRequest.task.userId,
      metadata: {
        ...agentRequest.task.metadata,
        workflowStepId: handle.step.stepId,
      },
    };

    const agentResult = await agent.execute(agentTask, {
      contextRef: `ctx-${taskId}`,
      userId: agentRequest.task.userId,
      metadata: agentRequest.task.metadata,
    });

    const endedAt = nowIso();
    const completed: ExecutionStatus = {
      ...status,
      status: agentResult.success ? "completed" : "failed",
      endedAt,
      agentId: agentResult.agentId,
      error: agentResult.error,
    };
    this.statusByTask.set(taskId, completed);

    this.persistExecution(taskId, {
      userId: agentRequest.task.userId,
      executionId: handle.executionId,
      stepId: handle.step.stepId,
      agentId: agentResult.agentId,
      success: agentResult.success,
      payload: agentResult.payload,
      startedAt,
      endedAt,
    });

    return {
      handle,
      agentResponse: {
        requestId: agentRequest.requestId,
        agentId: agentResult.agentId,
        success: agentResult.success,
        payload: agentResult.payload,
        error: agentResult.error,
      },
      taskResult: {
        taskId,
        status: agentResult.success ? "completed" : "failed",
        output: {
          executionId: handle.executionId,
          stepId: handle.step.stepId,
          agentId: agentResult.agentId,
          payload: agentResult.payload,
        },
      },
    };
  }

  async executeWorkflow(
    input: ExecutionManagerWorkflowInput,
  ): Promise<WorkflowExecutionResult> {
    const { workflow, task, requestId, agentContext } = input;
    const startedAt = nowIso();

    this.statusByTask.set(task.id, {
      taskId: task.id,
      executionId: `wf-run-${task.id}`,
      status: "running",
      startedAt,
      workflowId: workflow.workflowId,
    });

    const agents = this.options.agents;
    if (!agents) {
      const result: WorkflowExecutionResult = {
        workflowId: workflow.workflowId,
        success: false,
        stepsCompleted: 0,
        failedStepId: workflow.steps[0]?.stepId,
        stepResults: [],
        message: "No agent registry wired for workflow execution",
      };
      this.statusByTask.set(task.id, {
        taskId: task.id,
        executionId: `wf-run-${task.id}`,
        status: "failed",
        startedAt,
        endedAt: nowIso(),
        workflowId: workflow.workflowId,
        error: { code: "AGENT_REGISTRY_UNAVAILABLE", message: result.message },
      });
      return result;
    }

    const result = await runWorkflowSteps(
      workflow,
      task,
      requestId,
      agentContext,
      agents,
    );

    const endedAt = nowIso();
    this.statusByTask.set(task.id, {
      taskId: task.id,
      executionId: `wf-run-${task.id}`,
      status: result.success ? "completed" : "failed",
      startedAt,
      endedAt,
      workflowId: workflow.workflowId,
      stepId: result.failedStepId,
      error: result.success
        ? undefined
        : {
            code: "WORKFLOW_STEP_FAILED",
            message: result.message,
          },
    });

    this.persistExecution(task.id, {
      userId: task.userId,
      workflowId: workflow.workflowId,
      success: result.success,
      stepsCompleted: result.stepsCompleted,
      failedStepId: result.failedStepId,
      stepResults: result.stepResults,
      startedAt,
      endedAt,
    });

    return result;
  }

  async getStatus(taskId: string): Promise<ExecutionStatus | undefined> {
    return this.statusByTask.get(taskId);
  }
}
