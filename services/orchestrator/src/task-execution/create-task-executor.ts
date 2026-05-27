import type {
  AgentRegistryContract,
  AgentContext,
  AgentResult,
  AgentTask,
} from "@jarvis/agents-shared";
import type { TaskIntent } from "@jarvis/types";
import type {
  CreateTaskRequest,
  CreateTaskResponse,
  TaskStatusResponse,
  UserTask,
} from "@jarvis/types";

import {
  HERMES_AGENT_ID,
  OPENCLAW_AGENT_ID,
  createDefaultExecutionLifecycleManager,
  emitHermesPlanningActivities,
  emitOpenClawExecutionActivities,
  toExecutionLifecycleSnapshot,
  type ExecutionLifecycleManager,
} from "../execution";
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

export interface CreateTaskExecutionOptions {
  readonly lifecycleManager?: ExecutionLifecycleManager;
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

function intentRequiresExecutionHandshake(intent: TaskIntent): boolean {
  return intent.kind === "automate";
}

async function executeAgent(
  registry: AgentRegistryContract,
  agentId: string,
  task: UserTask,
  requestId: string,
  agentContext: AgentContext,
): Promise<AgentResult | undefined> {
  const agent = await registry.resolve(agentId);
  if (!agent) {
    return undefined;
  }
  return agent.execute(buildAgentTask(task, requestId), agentContext);
}

async function runExecutionHandshake(
  registry: AgentRegistryContract,
  lifecycle: ExecutionLifecycleManager,
  sessionId: string,
  task: UserTask,
  requestId: string,
  agentContext: AgentContext,
): Promise<{
  agentResult: AgentResult;
  planningResult?: AgentResult;
}> {
  lifecycle.transition(sessionId, "planning", "Hermes planning phase");

  const planningResult = await executeAgent(
    registry,
    HERMES_AGENT_ID,
    task,
    requestId,
    agentContext,
  );

  if (!planningResult) {
    return {
      agentResult: {
        taskId: task.id,
        requestId,
        agentId: HERMES_AGENT_ID,
        success: false,
        error: {
          code: "AGENT_NOT_FOUND",
          message: `Agent ${HERMES_AGENT_ID} is not registered for planning`,
        },
      },
    };
  }

  emitHermesPlanningActivities(lifecycle, sessionId, task.id, planningResult);

  if (!planningResult.success) {
    return { agentResult: planningResult, planningResult };
  }

  lifecycle.transition(sessionId, "executing", "OpenClaw execution phase");

  const executionResult = await executeAgent(
    registry,
    OPENCLAW_AGENT_ID,
    task,
    requestId,
    agentContext,
  );

  if (!executionResult) {
    return {
      agentResult: {
        taskId: task.id,
        requestId,
        agentId: OPENCLAW_AGENT_ID,
        success: false,
        error: {
          code: "AGENT_NOT_FOUND",
          message: `Agent ${OPENCLAW_AGENT_ID} is not registered for execution`,
        },
      },
      planningResult,
    };
  }

  emitOpenClawExecutionActivities(
    lifecycle,
    sessionId,
    task.id,
    executionResult,
  );

  return { agentResult: executionResult, planningResult };
}

/**
 * End-to-end create-task flow (Phase 14, 45):
 *
 * TaskRouter → ContextManager → WorkflowManager → CapabilityRouter →
 * ExecutionLifecycle → Agent.execute (→ SkillExecutor → Skill).
 */
export async function executeCreateTask(
  components: OrchestratorComponents,
  executableRegistry: AgentRegistryContract,
  input: CreateTaskExecutionInput,
  store: TaskStore,
  options: CreateTaskExecutionOptions = {},
): Promise<CreateTaskExecutionResult> {
  const lifecycle =
    options.lifecycleManager ?? createDefaultExecutionLifecycleManager();

  const taskId = `task-${Date.now()}`;
  const task = buildUserTask(taskId, input);
  const requestId = mockRequestId(taskId);
  const contextRef = mockContextRef(taskId);

  const session = lifecycle.startSession({
    taskId: task.id,
    requestId,
    userId: task.userId,
  });

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

  const agentContext: AgentContext = {
    contextRef,
    userId: task.userId,
    metadata: task.metadata,
  };

  let agentResult: AgentResult;
  let planningResult: AgentResult | undefined;
  let handshake = false;

  if (intentRequiresExecutionHandshake(task.intent)) {
    handshake = true;
    const handshakeResult = await runExecutionHandshake(
      executableRegistry,
      lifecycle,
      session.sessionId,
      task,
      requestId,
      agentContext,
    );
    agentResult = handshakeResult.agentResult;
    planningResult = handshakeResult.planningResult;
  } else {
    const selectedAgentId = routing.selectedAgentId;
    const initialState =
      selectedAgentId === HERMES_AGENT_ID ? "planning" : "executing";
    lifecycle.transition(
      session.sessionId,
      initialState,
      `Single-agent ${initialState}`,
    );

    const resolved = await executeAgent(
      executableRegistry,
      selectedAgentId,
      task,
      requestId,
      agentContext,
    );

    if (!resolved) {
      agentResult = {
        taskId: task.id,
        requestId,
        agentId: selectedAgentId,
        success: false,
        error: {
          code: "AGENT_NOT_FOUND",
          message: `Agent ${selectedAgentId} is not registered for execution`,
        },
      };
    } else {
      agentResult = resolved;
      if (selectedAgentId === HERMES_AGENT_ID) {
        emitHermesPlanningActivities(
          lifecycle,
          session.sessionId,
          task.id,
          agentResult,
        );
      } else if (selectedAgentId === OPENCLAW_AGENT_ID) {
        emitOpenClawExecutionActivities(
          lifecycle,
          session.sessionId,
          task.id,
          agentResult,
        );
      }
    }
  }

  if (agentResult.error?.code === "AGENT_NOT_FOUND") {
    lifecycle.transition(session.sessionId, "failed", agentResult.error.message);
    const failedStatus = buildTaskStatus(
      task,
      "failed",
      {
        stub: true,
        routing: {
          selectedAgentId: routing.selectedAgentId,
          reason: routing.reason,
        },
        executionLifecycle: toExecutionLifecycleSnapshot(
          lifecycle.getSession(session.sessionId)!,
          handshake
            ? {
                planningAgentId: HERMES_AGENT_ID,
                executionAgentId: OPENCLAW_AGENT_ID,
              }
            : undefined,
        ),
      },
      agentResult.error,
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

  const terminalState = agentResult.success ? "completed" : "failed";
  lifecycle.transition(
    session.sessionId,
    terminalState,
    agentResult.success ? "Task completed" : "Task failed",
  );

  const skillOutput = extractSkillOutput(agentResult.payload);
  const output: Readonly<Record<string, unknown>> = {
    stub: true,
    phase: 45,
    routing: {
      selectedAgentId: handshake ? OPENCLAW_AGENT_ID : routing.selectedAgentId,
      reason: routing.reason,
      policyId: routing.policyId,
      matches: routing.matches.length,
      handshake,
    },
    agent: {
      agentId: agentResult.agentId,
      requestId: agentResult.requestId,
      success: agentResult.success,
    },
    skill: skillOutput,
    agentPayload: agentResult.payload,
    ...(planningResult
      ? { planningPayload: planningResult.payload }
      : {}),
    executionLifecycle: toExecutionLifecycleSnapshot(
      lifecycle.getSession(session.sessionId)!,
      handshake
        ? {
            planningAgentId: HERMES_AGENT_ID,
            executionAgentId: OPENCLAW_AGENT_ID,
          }
        : undefined,
    ),
  };

  const taskStatus = buildTaskStatus(
    task,
    terminalState,
    output,
    agentResult.error,
  );

  const createTaskResponse: CreateTaskResponse = {
    taskId: task.id,
    status: terminalState,
    createdAt: task.createdAt,
    correlationId: task.correlationId,
  };

  const record = { createTaskResponse, taskStatus };
  store.save(record);
  return { record };
}
