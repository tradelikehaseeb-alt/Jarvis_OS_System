import type {
  AgentRegistryContract,
  AgentContext,
  AgentResult,
  AgentTask,
} from "@jarvis/agents-shared";
import type { HermesOpenClawTaskDescriptor } from "@jarvis/hermes";
import type { TaskIntent } from "@jarvis/types";
import type {
  CreateTaskRequest,
  CreateTaskResponse,
  TaskStatusResponse,
  UserTask,
} from "@jarvis/types";

import {
  createDefaultLocalMemoryRuntime,
  type LocalMemoryRuntime,
} from "@jarvis/local-memory";

import {
  HERMES_AGENT_ID,
  OPENCLAW_AGENT_ID,
  createDefaultExecutionLifecycleManager,
  emitHermesPlanningActivities,
  emitOpenClawExecutionActivities,
  toExecutionLifecycleSnapshot,
  type ExecutionLifecycleManager,
} from "../execution";
import {
  createDefaultMemoryPersistenceManager,
  createLocalBackedMemoryPersistenceManager,
  type MemoryPersistenceManager,
} from "../memory";
import {
  createDefaultActivityRuntime,
  type ActivityStreamRuntime,
} from "../activity";
import {
  createDefaultTimelineRuntime,
  type TimelineRuntime,
} from "../timeline";
import {
  createDefaultTaskChainRuntime,
  type TaskChainExecuteResult,
  type TaskChainRuntime,
} from "../task-chain";
import {
  createDefaultAdaptiveExecutionRuntime,
  DEFAULT_STUB_ADAPTIVE_RULES,
  toTaskChainOutputFromAdaptive,
  type AdaptiveExecuteResult,
  type AdaptiveExecutionRuntime,
  type AdaptiveExecutionRule,
} from "../adaptive-execution";
import {
  createDefaultLearningRuntime,
  type LearningInsights,
  type LearningRuntime,
  type LearningSignal,
} from "../execution-learning";
import {
  createDefaultFeedbackRuntime,
  parseUserFeedbackFromMetadata,
  type FeedbackInsight,
  type FeedbackRuntime,
  type FeedbackSignal,
} from "../user-feedback";
import {
  createDefaultProviderSettingsRuntime,
  type LlmProviderResponse,
  type LlmProviderRuntime,
  type LlmProviderValidation,
  type ProviderSettingsRuntime,
} from "../llm-provider";
import {
  completeExecutionStream,
  createDefaultStreamManager,
  publishStreamFailed,
  type StreamManager,
} from "../streaming";
import type { ConversationHistoryRuntime } from "../conversation-history";
import {
  buildAgentContextWithInjection,
  createDefaultContextRuntimeBundle,
  createDefaultContextRankingRuntime,
  type ContextRankingRuntime,
  type ContextRuntime,
} from "../context";
import { createDefaultMemoryRecallRuntime } from "../memory-recall/create-default-memory-recall-runtime";
import type { MemoryRecallRuntime } from "../memory-recall/memory-recall-runtime";
import { buildTaskMemoryRecallView } from "../memory-intelligence/build-task-memory-recall-view";
import { SafeExecutionFallbackRuntime } from "../runtime-hardening/safe-execution-fallback-runtime";
import {
  createDefaultOrchestratorExecutionSafetyRuntime,
  createDefaultWorkflowExecutionEngine,
  type WorkflowDefinition,
} from "../execution-runtime";
import {
  createDefaultAgentWorkforceRuntime,
  type WorkforceCoordinationResult,
} from "../agent-workforce";
import {
  createDefaultProductivityWorkflowRuntime,
  type ProductivityWorkflowResult,
} from "../productivity-automation";
import type { OrchestratorComponents } from "../orchestrator";
import { mockContextRef, mockRequestId } from "../internal/mock-ids";
import { extractSkillOutput } from "./extract-skill-output";
import type { TaskExecutionRecord, TaskStore } from "../storage";

/** Shared safe execution evaluator (Phase 94). */
const safeExecutionFallbackRuntime = new SafeExecutionFallbackRuntime();

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
  readonly memoryPersistenceManager?: MemoryPersistenceManager;
  readonly streamManager?: StreamManager;
  readonly activityStreamRuntime?: ActivityStreamRuntime;
  readonly timelineRuntime?: TimelineRuntime;
  readonly contextRuntime?: ContextRuntime;
  readonly conversationHistoryRuntime?: ConversationHistoryRuntime;
  readonly contextRankingRuntime?: ContextRankingRuntime;
  readonly memoryRecallRuntime?: MemoryRecallRuntime;
  readonly localMemoryRuntime?: LocalMemoryRuntime;
  readonly taskChainRuntime?: TaskChainRuntime;
  readonly adaptiveExecutionRuntime?: AdaptiveExecutionRuntime;
  readonly learningRuntime?: LearningRuntime;
  readonly feedbackRuntime?: FeedbackRuntime;
  readonly llmProviderRuntime?: LlmProviderRuntime;
  readonly providerSettingsRuntime?: ProviderSettingsRuntime;
}

function resolveConversationId(
  userId: string,
  metadata?: Readonly<Record<string, unknown>>,
): string {
  const fromMetadata = metadata?.conversationId;
  if (typeof fromMetadata === "string" && fromMetadata.trim().length > 0) {
    return fromMetadata.trim();
  }
  return `conv-${userId}`;
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

function buildUserTaskFromDescriptor(
  descriptor: HermesOpenClawTaskDescriptor,
  userId: string,
  correlationId?: string,
): UserTask {
  const now = new Date().toISOString();
  return {
    id: descriptor.taskId,
    userId,
    intent: descriptor.intent,
    createdAt: now,
    correlationId,
    metadata: descriptor.metadata,
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
  const agentTask = buildAgentTask(task, requestId);
  const enrichedTask: AgentTask = {
    ...agentTask,
    metadata: {
      ...agentTask.metadata,
      ...agentContext.metadata,
    },
  };
  return agent.execute(enrichedTask, agentContext);
}

async function runExecutionHandshake(
  registry: AgentRegistryContract,
  lifecycle: ExecutionLifecycleManager,
  sessionId: string,
  task: UserTask,
  requestId: string,
  agentContext: AgentContext,
  chainOptions: {
    readonly adaptiveExecutionRuntime: AdaptiveExecutionRuntime;
    readonly timelineId: string;
    readonly learnedRules?: readonly AdaptiveExecutionRule[];
  },
): Promise<{
  agentResult: AgentResult;
  planningResult?: AgentResult;
  taskChainResult?: TaskChainExecuteResult;
  adaptiveResult?: AdaptiveExecuteResult;
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

  const adaptiveResult =
    await chainOptions.adaptiveExecutionRuntime.executeAdaptively({
      chainId: `chain-${task.id}`,
      executionId: `adaptive-${task.id}`,
      parentTaskId: task.id,
      requestId,
      userId: task.userId,
      correlationId: task.correlationId,
      planningResult,
      agentContext,
      sessionId,
      timelineId: chainOptions.timelineId,
      rules: chainOptions.learnedRules,
    });

  const chainResult = toTaskChainOutputFromAdaptive(adaptiveResult);
  const taskChainResult: TaskChainExecuteResult = {
    chainId: chainResult.chainId,
    success: chainResult.success,
    plan: chainResult.plan,
    tasks: adaptiveResult.tasks,
    events: chainResult.events,
    executionResults: adaptiveResult.executionResults,
    stub: chainResult.stub,
  };

  const executionResult =
    adaptiveResult.executionResults[adaptiveResult.executionResults.length - 1];

  if (!executionResult) {
    const fallbackResult = await executeAgent(
      registry,
      OPENCLAW_AGENT_ID,
      task,
      requestId,
      agentContext,
    );

    if (!fallbackResult) {
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
        taskChainResult,
        adaptiveResult,
      };
    }

    emitOpenClawExecutionActivities(
      lifecycle,
      sessionId,
      task.id,
      fallbackResult,
    );

    return {
      agentResult: fallbackResult,
      planningResult,
      taskChainResult,
      adaptiveResult,
    };
  }

  emitOpenClawExecutionActivities(
    lifecycle,
    sessionId,
    task.id,
    executionResult,
  );

  return {
    agentResult: executionResult,
    planningResult,
    taskChainResult,
    adaptiveResult,
  };
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
  const stream =
    options.streamManager ?? createDefaultStreamManager();
  const activityRuntime =
    options.activityStreamRuntime ??
    createDefaultActivityRuntime({ streamManager: stream });
  const timelineRuntime =
    options.timelineRuntime ??
    createDefaultTimelineRuntime({ activityRuntime });
  const sharedLocalMemory =
    options.localMemoryRuntime ??
    (!options.memoryPersistenceManager && !options.contextRuntime
      ? createDefaultLocalMemoryRuntime({ useFileBackend: false })
      : undefined);
  const memory =
    options.memoryPersistenceManager ??
    (sharedLocalMemory
      ? createLocalBackedMemoryPersistenceManager(undefined, stream, {
          runtime: sharedLocalMemory,
          useFileBackend: false,
        })
      : createDefaultMemoryPersistenceManager(undefined, stream));
  const contextBundle = options.contextRuntime
    ? undefined
    : createDefaultContextRuntimeBundle({
        localMemoryRuntime: sharedLocalMemory,
        useFileBackend: false,
        conversationHistory: options.conversationHistoryRuntime,
      });
  const contextRuntime =
    options.contextRuntime ?? contextBundle!.contextRuntime;
  const contextRankingRuntime =
    options.contextRankingRuntime ??
    contextBundle?.contextRankingRuntime ??
    createDefaultContextRankingRuntime();
  const memoryRecallRuntime =
    options.memoryRecallRuntime ??
    contextBundle?.memoryRecallRuntime ??
    createDefaultMemoryRecallRuntime({
      contextRuntime,
      contextRankingRuntime,
    });

  const taskId = `task-${Date.now()}`;
  const task = buildUserTask(taskId, input);
  const requestId = mockRequestId(taskId);
  const contextRef = mockContextRef(taskId);
  const conversationId = resolveConversationId(task.userId, task.metadata);
  const streamSessionId = `stream-${taskId}`;

  const session = lifecycle.startSession({
    taskId: task.id,
    requestId,
    userId: task.userId,
  });

  const memoryContext = {
    userId: task.userId,
    taskId: task.id,
    sessionId: session.sessionId,
    conversationId,
  };

  const streamContext = {
    ...memoryContext,
    streamSessionId,
  };

  const detachMemory = memory.attachLifecycle(lifecycle, memoryContext);
  const detachActivity = activityRuntime.startStream({
    ...streamContext,
    lifecycle,
  });
  const timelineId = streamSessionId;
  timelineRuntime.startTimeline({
    timelineId,
    streamSessionId,
    taskId: task.id,
  });

  memory.persistConversationTurn({
    conversationId,
    userId: task.userId,
    role: "user",
    message: task.intent.description,
    taskId: task.id,
    intentKind: task.intent.kind,
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

  const { agentContext, contextRecord, recalledMemories } =
    buildAgentContextWithInjection({
    contextRef,
    userId: task.userId,
    conversationId,
    taskId: task.id,
    intentDescription: task.intent.description,
    metadata: task.metadata,
    contextRuntime,
    contextRankingRuntime,
    memoryRecallRuntime,
  });

  let agentResult: AgentResult;
  let planningResult: AgentResult | undefined;
  let taskChainResult: TaskChainExecuteResult | undefined;
  let adaptiveResult: AdaptiveExecuteResult | undefined;
  let learningInsights: LearningInsights | undefined;
  let learningSignals: readonly LearningSignal[] = [];
  let feedbackInsights: FeedbackInsight | undefined;
  let feedbackSignals: readonly FeedbackSignal[] = [];
  let llmProviderResponse: LlmProviderResponse | undefined;
  let llmProviderValidation: LlmProviderValidation | undefined;
  let learnedRules: readonly AdaptiveExecutionRule[] = DEFAULT_STUB_ADAPTIVE_RULES;
  let handshake = false;
  const workflowEngine = createDefaultWorkflowExecutionEngine();
  const agentWorkforceRuntime = createDefaultAgentWorkforceRuntime();
  const productivityWorkflowRuntime = createDefaultProductivityWorkflowRuntime();
  const executionSafetyRuntime = createDefaultOrchestratorExecutionSafetyRuntime();
  const executionStartedAt = new Date().toISOString();
  let executionStepCount = 0;
  const workflowDefinition: WorkflowDefinition | undefined =
    workflowEngine.buildWorkflowFromIntent(task.intent);

  let workforceResult: WorkforceCoordinationResult | undefined;
  if (agentWorkforceRuntime.shouldCoordinate(task.intent.description, task.intent.kind)) {
    workforceResult = await agentWorkforceRuntime.coordinate({
      description: task.intent.description,
      intentKind: task.intent.kind,
      userId: task.userId,
      conversationId,
      sharedContextRef: contextRef,
    });
  }

  let productivityResult: ProductivityWorkflowResult | undefined;
  if (productivityWorkflowRuntime.shouldActivate(task.intent.description, task.intent.kind)) {
    productivityResult = await productivityWorkflowRuntime.run({
      description: task.intent.description,
      intentKind: task.intent.kind,
      userId: task.userId,
      conversationId,
    });
  }

  const executeOpenClawStep = async (
    descriptor: HermesOpenClawTaskDescriptor,
    stepRequestId: string,
    stepContext: AgentContext,
  ) => {
    executionStepCount += 1;
    const safety = executionSafetyRuntime.beforeStep({
      stepCount: executionStepCount,
      startedAt: executionStartedAt,
      actionKey: descriptor.stepId,
    });

    if (!safety.allowed) {
      return {
        taskId: task.id,
        requestId: stepRequestId,
        agentId: OPENCLAW_AGENT_ID,
        success: false,
        payload: {
          stub: true,
          executionSafety: safety,
        },
        error: {
          code: "EXECUTION_SAFETY_BLOCKED",
          message: safety.message,
        },
      } satisfies AgentResult;
    }

    return executeAgent(
      executableRegistry,
      OPENCLAW_AGENT_ID,
      buildUserTaskFromDescriptor(
        descriptor,
        task.userId,
        task.correlationId,
      ),
      stepRequestId,
      stepContext,
    );
  };

  const taskChainRuntime =
    options.taskChainRuntime ??
    createDefaultTaskChainRuntime({
      executeOpenClawStep,
      lifecycle,
      timelineRuntime,
    });

  const adaptiveExecutionRuntime =
    options.adaptiveExecutionRuntime ??
    createDefaultAdaptiveExecutionRuntime({
      taskChainRuntime,
      executeOpenClawStep,
      lifecycle,
      timelineRuntime,
    });

  const learningRuntime =
    options.learningRuntime ??
    (sharedLocalMemory
      ? createDefaultLearningRuntime({ localMemoryRuntime: sharedLocalMemory })
      : undefined);

  const feedbackRuntime =
    options.feedbackRuntime ??
    (sharedLocalMemory
      ? createDefaultFeedbackRuntime({
          localMemoryRuntime: sharedLocalMemory,
          learningRuntime,
        })
      : undefined);

  const providerSettingsRuntime =
    options.providerSettingsRuntime ?? createDefaultProviderSettingsRuntime();

  let enrichedAgentContext = agentContext;

  if (intentRequiresExecutionHandshake(task.intent)) {
    const llmProviderId = providerSettingsRuntime.resolveProviderId(
      task.userId,
      task.metadata,
    );
    const providerStatus = await providerSettingsRuntime.getProviderStatus(
      task.userId,
      llmProviderId,
    );
    llmProviderValidation = {
      valid: providerStatus.valid,
      stub: providerStatus.stub,
      providerId: providerStatus.providerId,
      kind: providerStatus.kind,
      message: providerStatus.message,
    };

    const llmExecutor = options.llmProviderRuntime ?? providerSettingsRuntime;
    llmProviderResponse = await llmExecutor.executePrompt({
      providerId: llmProviderId,
      model: providerStatus.selectedModel,
      prompt: `Hermes planning context for: ${task.intent.description}`,
      userId: task.userId,
      taskId: task.id,
      systemPrompt:
        "You are the Jarvis planning assistant. Provide concise execution planning context.",
      metadata: task.metadata,
      providerApiKey: providerSettingsRuntime.resolveApiKeyForExecution(
        task.userId,
        llmProviderId,
      ),
    });
    enrichedAgentContext = {
      ...agentContext,
      metadata: {
        ...agentContext.metadata,
        llmProviderId,
        llmPlanningContext: llmProviderResponse.content,
        llmProviderStub: llmProviderResponse.stub,
      },
    };
  }

  const pendingUserFeedback = parseUserFeedbackFromMetadata(task.metadata);

  if (
    feedbackRuntime &&
    pendingUserFeedback?.taskId &&
    pendingUserFeedback.taskId !== task.id
  ) {
    feedbackRuntime.recordFeedback({
      userId: task.userId,
      taskId: pendingUserFeedback.taskId,
      rating: pendingUserFeedback.rating,
      comment: pendingUserFeedback.comment,
      intentKind: task.intent.kind,
    });
  }

  if (learningRuntime && intentRequiresExecutionHandshake(task.intent)) {
    learningSignals = learningRuntime.evaluateLearning({
      userId: task.userId,
      intentKind: task.intent.kind,
    });
    learnedRules = learningRuntime.applyLearning({
      baseRules: DEFAULT_STUB_ADAPTIVE_RULES,
      signals: learningSignals,
    });

    if (feedbackRuntime) {
      feedbackSignals = feedbackRuntime.evaluateFeedback({
        userId: task.userId,
        intentKind: task.intent.kind,
      });
      learnedRules = feedbackRuntime.applyFeedback({
        baseRules: learnedRules,
        signals: feedbackSignals,
      });
    }
  }

  if (intentRequiresExecutionHandshake(task.intent)) {
    handshake = true;
    const handshakeResult = await runExecutionHandshake(
      executableRegistry,
      lifecycle,
      session.sessionId,
      task,
      requestId,
      enrichedAgentContext,
      { adaptiveExecutionRuntime, timelineId, learnedRules },
    );
    agentResult = handshakeResult.agentResult;
    planningResult = handshakeResult.planningResult;
    taskChainResult = handshakeResult.taskChainResult;
    adaptiveResult = handshakeResult.adaptiveResult;

    if (learningRuntime && adaptiveResult) {
      learningRuntime.recordExecutionOutcome({
        userId: task.userId,
        taskId: task.id,
        intentKind: task.intent.kind,
        adaptiveResult,
        conversationId,
        sessionId: session.sessionId,
      });
    }

    if (learningRuntime) {
      learningInsights = learningRuntime.getLearningInsights({
        userId: task.userId,
        intentKind: task.intent.kind,
      });
    }

    if (feedbackRuntime) {
      if (
        pendingUserFeedback &&
        (!pendingUserFeedback.taskId || pendingUserFeedback.taskId === task.id)
      ) {
        feedbackRuntime.recordFeedback({
          userId: task.userId,
          taskId: task.id,
          rating: pendingUserFeedback.rating,
          comment: pendingUserFeedback.comment,
          intentKind: task.intent.kind,
          executionSuccess: agentResult.success,
          conversationId,
          sessionId: session.sessionId,
        });
      }

      feedbackInsights = feedbackRuntime.generateInsights({
        userId: task.userId,
        intentKind: task.intent.kind,
        learningRuntime,
      });
      feedbackSignals = feedbackInsights.signals;
    }
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
    const lifecycleSnapshot = toExecutionLifecycleSnapshot(
      lifecycle.getSession(session.sessionId)!,
      handshake
        ? {
            planningAgentId: HERMES_AGENT_ID,
            executionAgentId: OPENCLAW_AGENT_ID,
          }
        : undefined,
    );
    memory.persistExecutionSession(
      lifecycle.getSession(session.sessionId)!,
      conversationId,
    );
    const summary = memory.generateSummary({
      userId: task.userId,
      taskId: task.id,
      conversationId,
    });
    detachMemory();
    detachActivity();
    activityRuntime.stopStream(streamSessionId);
    timelineRuntime.completeTimeline(
      timelineId,
      false,
      agentResult.error.message,
    );
    publishStreamFailed(stream, streamContext, agentResult.error.message);

    const activityEvents = activityRuntime.getEvents(streamSessionId);
    const timelineEvents = timelineRuntime.getEvents(timelineId);
    const failedStatus = buildTaskStatus(
      task,
      "failed",
      {
        stub: true,
        routing: {
          selectedAgentId: routing.selectedAgentId,
          reason: routing.reason,
        },
        executionLifecycle: lifecycleSnapshot,
        memory: {
          summary: summary.text,
          recentActivity: memory.getRecentActivity(task.userId, 5),
          historyCount: memory.queryHistory({ userId: task.userId }).length,
        },
        stream: {
          streamSessionId,
          activeSessions: stream.getActiveSessions().length,
        },
        activityStream: {
          streamSessionId,
          events: activityEvents,
        },
        executionTimeline: {
          timelineId,
          events: timelineEvents,
        },
        streamEvents: activityEvents.map((event) => ({
          type: event.type,
          message: event.message,
          timestamp: event.timestamp,
        })),
        context: {
          contextId: contextRecord.contextId,
          source: contextRecord.source,
          turnCount: contextRecord.turns.length,
          summary: contextRecord.summary,
        },
        memoryRecall: buildTaskMemoryRecallView(recalledMemories),
        stability: {
          mode: "degraded",
          message: "Execution failed — safe mode available",
          degraded: true,
        },
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

  const finalSession = lifecycle.getSession(session.sessionId)!;
  memory.persistExecutionSession(finalSession, conversationId);
  const summary = memory.generateSummary({
    userId: task.userId,
    taskId: task.id,
    conversationId,
  });
  memory.persistConversationTurn({
    conversationId,
    userId: task.userId,
    role: "assistant",
    message: summary.text,
    taskId: task.id,
    intentKind: task.intent.kind,
  });
  detachMemory();
  detachActivity();
  completeExecutionStream(stream, streamContext, agentResult.success);
  activityRuntime.stopStream(streamSessionId);
  timelineRuntime.completeTimeline(
    timelineId,
    agentResult.success,
    agentResult.success ? "Task completed" : "Task failed",
  );

  const activityEvents = activityRuntime.getEvents(streamSessionId);
  const timelineEvents = timelineRuntime.getEvents(timelineId);
  const skillOutput = extractSkillOutput(agentResult.payload);
  const executionStability = safeExecutionFallbackRuntime.computeDecision({
    providerId: llmProviderResponse?.providerId ?? llmProviderValidation?.providerId,
    providerHealthy:
      (llmProviderValidation?.valid ?? true) && !(llmProviderResponse?.stub ?? false),
    offline: false,
    lastProgressAt: finalSession.updatedAt,
  });
  const output: Readonly<Record<string, unknown>> = {
    stub: true,
    phase: 47,
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
    ...(taskChainResult
      ? {
          taskChain: {
            chainId: taskChainResult.chainId,
            success: taskChainResult.success,
            stepCount: taskChainResult.executionResults.length,
            stub: taskChainResult.stub,
            plan: taskChainResult.plan,
            events: taskChainResult.events,
          },
        }
      : {}),
    ...(adaptiveResult
      ? {
          adaptiveExecution: {
            executionId: adaptiveResult.executionId,
            success: adaptiveResult.success,
            stepCount: adaptiveResult.executionResults.length,
            stub: adaptiveResult.stub,
            plan: adaptiveResult.plan,
            decisions: adaptiveResult.decisions,
            events: adaptiveResult.events,
          },
        }
      : {}),
    ...(learningInsights
      ? {
          learningInsights,
          learning: {
            signals: learningSignals,
            appliedRules: learnedRules,
          },
        }
      : {}),
    ...(feedbackInsights
      ? {
          feedbackInsights,
          feedback: {
            signals: feedbackSignals,
            appliedRules: learnedRules,
          },
        }
      : {}),
    ...(llmProviderResponse
      ? {
          llmProvider: {
            providerId: llmProviderResponse.providerId,
            kind: llmProviderResponse.kind,
            stub: llmProviderResponse.stub,
            success: llmProviderResponse.success,
            model: llmProviderResponse.model,
            validated: llmProviderValidation?.valid ?? false,
            streamed: llmProviderResponse.streamed,
            contentPreview: llmProviderResponse.content.slice(0, 240),
          },
        }
      : {}),
    executionLifecycle: toExecutionLifecycleSnapshot(
      finalSession,
      handshake
        ? {
            planningAgentId: HERMES_AGENT_ID,
            executionAgentId: OPENCLAW_AGENT_ID,
          }
        : undefined,
    ),
    memory: {
      summary: summary.text,
      conversationId,
      recentActivity: memory.getRecentActivity(task.userId, 5),
      historyCount: memory.queryHistory({ userId: task.userId }).length,
    },
    stream: {
      streamSessionId,
      activeSessions: stream.getActiveSessions().length,
    },
    activityStream: {
      streamSessionId,
      events: activityEvents,
    },
    executionTimeline: {
      timelineId,
      events: timelineEvents,
    },
    streamEvents: activityEvents.map((event) => ({
      type: event.type,
      message: event.message,
      timestamp: event.timestamp,
    })),
    context: {
      contextId: contextRecord.contextId,
      source: contextRecord.source,
      turnCount: contextRecord.turns.length,
      summary: contextRecord.summary,
    },
    memoryRecall: buildTaskMemoryRecallView(recalledMemories),
    ...(workflowDefinition
      ? {
          executionRuntime: {
            workflow: {
              workflowId: workflowDefinition.workflowId,
              stepCount: workflowDefinition.steps.length,
              progress: workflowEngine.summarizeProgress(
                workflowDefinition,
                adaptiveResult?.executionResults.length ??
                  taskChainResult?.executionResults.length ??
                  0,
              ),
            },
            browserState:
              agentResult.payload?.browserState ??
              agentResult.payload?.browserRuntime?.browserState,
            permissionRequired: Boolean(
              agentResult.payload?.browserRuntime?.permissionRequired,
            ),
          },
        }
      : {}),
    ...(workforceResult
      ? {
          workforce: {
            sessionId: workforceResult.sessionId,
            success: workforceResult.success,
            summary: workforceResult.summary,
            activities: workforceResult.activities,
            workerCount: workforceResult.plan.items.length,
            parallel: workforceResult.plan.parallel,
          },
        }
      : {}),
    ...(productivityResult
      ? {
          productivity: {
            sessionId: productivityResult.sessionId,
            success: productivityResult.success,
            summary: productivityResult.summary,
            activities: productivityResult.activities,
            suggestions: productivityResult.suggestions,
            taskCount: productivityResult.taskPlan?.tasks.length ?? 0,
          },
        }
      : {}),
    stability: {
      mode: executionStability.mode,
      message: executionStability.message,
      degraded: executionStability.mode !== "normal",
    },
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
