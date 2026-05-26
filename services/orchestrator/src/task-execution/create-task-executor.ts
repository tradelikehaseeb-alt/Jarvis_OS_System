import type {
  AgentRegistryContract,
  AgentContext,
  AgentTask,
} from "@jarvis/agents-shared";
import type {
  CreateTaskRequest,
  CreateTaskResponse,
  TaskStatusResponse,
  UserTask,
} from "@jarvis/types";

import type { OrchestratorComponents } from "../orchestrator";
import { mockContextRef, mockRequestId } from "../internal/mock-ids";
import { extractSkillOutput } from "./extract-skill-output";
import type { TaskExecutionRecord, TaskStore } from "../storage";

/** API gateway user id for stub lifecycle (no auth). */
export const DEFAULT_API_USER_ID = "user-api-stub" as const;

export interface CreateTaskExecutionInput extends CreateTaskRequest {
  readonly userId?: string;
}

export interface CreateTaskExecutionResult {
  readonly record: TaskExecutionRecord;
}

function buildUserTask(
  taskId: string,
  input: CreateTaskExecutionInput,
): UserTask {
  const now = new Date().toISOString();
  return {
    id: taskId,
    userId: input.userId ?? DEFAULT_API_USER_ID,
    intent: input.intent,
    createdAt: now,
    correlationId: input.correlationId,
    metadata: input.metadata,
  };
}

function buildAgentTask(task: UserTask, requestId: string): AgentTask {
  return {
    taskId: task.id,
    requestId,
    userId: task.userId,
    intent: task.intent,
    correlationId: task.correlationId,
    metadata: task.metadata,
  };
}

function buildTaskStatus(
  task: UserTask,
  status: TaskStatusResponse["status"],
  output: Readonly<Record<string, unknown>>,
  error?: TaskStatusResponse["error"],
): TaskStatusResponse {
  return {
    taskId: task.id,
    status,
    progressPercent: status === "completed" ? 100 : undefined,
    output,
    error,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * End-to-end create-task flow (Phase 14):
 *
 * TaskRouter → ContextManager → WorkflowManager → CapabilityRouter →
 * AgentRegistry → Agent.execute (→ SkillExecutor → Skill).
 */
export async function executeCreateTask(
  components: OrchestratorComponents,
  executableRegistry: AgentRegistryContract,
  input: CreateTaskExecutionInput,
  store: TaskStore,
): Promise<CreateTaskExecutionResult> {
  const taskId = `task-${Date.now()}`;
  const task = buildUserTask(taskId, input);
  const requestId = mockRequestId(taskId);
  const contextRef = mockContextRef(taskId);

  await components.taskRouter.route({ task });
  await components.contextManager.create({ task });
  await components.workflowManager.build({
    task,
    workflowId: `wf-${taskId}`,
  });

  const routing = await components.capabilityRouter.route(
    { taskId: task.id, intent: task.intent },
    components.agentRegistry,
  );

  const agent = await executableRegistry.resolve(routing.selectedAgentId);
  if (!agent) {
    const failedStatus = buildTaskStatus(
      task,
      "failed",
      {
        stub: true,
        routing: {
          selectedAgentId: routing.selectedAgentId,
          reason: routing.reason,
        },
      },
      {
        code: "AGENT_NOT_FOUND",
        message: `Agent ${routing.selectedAgentId} is not registered for execution`,
      },
    );
    const createTaskResponse: CreateTaskResponse = {
      taskId: task.id,
      status: "failed",
      createdAt: task.createdAt,
      correlationId: task.correlationId,
    };
    const record = { createTaskResponse, taskStatus: failedStatus };
    store.save(record);
    return { record };
  }

  const agentContext: AgentContext = {
    contextRef,
    userId: task.userId,
    metadata: task.metadata,
  };

  const agentResult = await agent.execute(
    buildAgentTask(task, requestId),
    agentContext,
  );

  const skillOutput = extractSkillOutput(agentResult.payload);
  const output: Readonly<Record<string, unknown>> = {
    stub: true,
    phase: 14,
    routing: {
      selectedAgentId: routing.selectedAgentId,
      reason: routing.reason,
      policyId: routing.policyId,
      matches: routing.matches.length,
    },
    agent: {
      agentId: agentResult.agentId,
      requestId: agentResult.requestId,
      success: agentResult.success,
    },
    skill: skillOutput,
    agentPayload: agentResult.payload,
  };

  const terminalStatus = agentResult.success ? "completed" : "failed";
  const taskStatus = buildTaskStatus(
    task,
    terminalStatus,
    output,
    agentResult.error,
  );

  const createTaskResponse: CreateTaskResponse = {
    taskId: task.id,
    status: terminalStatus,
    createdAt: task.createdAt,
    correlationId: task.correlationId,
  };

  const record = { createTaskResponse, taskStatus };
  store.save(record);
  return { record };
}
