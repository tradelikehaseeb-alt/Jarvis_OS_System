import type { JarvisExecutionFlow } from "../e2e/jarvis-execution-flow";
import { createDefaultJarvisExecutionFlow } from "../e2e/create-default-jarvis-execution-flow";
import type { JarvisExecutionFlowResult } from "../e2e/jarvis-execution-flow-result";
import {
  classifyChatIntent,
  type IntentClassification,
} from "../e2e/intent-adapter";
import {
  createDefaultProviderSettingsRuntime,
  createTestProviderSettingsRuntime,
  type ProviderSettingsRuntime,
} from "../llm-provider";
import type { CreateTaskExecutionOptions } from "../task-execution/create-task-executor";
import { DEFAULT_API_USER_ID } from "../task-execution/create-task-executor";
import { isLiveExecutionValidationCommand } from "@jarvis/types";

import type { LiveExecutionResult } from "./live-execution-result";
import type {
  ExecuteLiveTaskInput,
  LiveExecutionRuntime,
  LiveExecutionSubscriber,
  LiveExecutionUpdate,
  StartLiveExecutionInput,
} from "./live-execution-runtime";
import type { LiveExecutionSession } from "./live-execution-session";
import type {
  LiveExecutionTelemetry,
  LiveExecutionTelemetrySpan,
} from "./live-execution-telemetry";

export interface CreateDefaultLiveExecutionRuntimeOptions {
  readonly flow?: JarvisExecutionFlow;
  readonly providerSettingsRuntime?: ProviderSettingsRuntime;
  readonly taskExecutionOptions?: CreateTaskExecutionOptions;
  readonly userId?: string;
}

interface SessionRecord {
  session: LiveExecutionSession;
  telemetry: LiveExecutionTelemetry;
  subscribers: Map<string, LiveExecutionSubscriber>;
}

let sessionCounter = 0;

function nextSessionId(): string {
  sessionCounter += 1;
  return `live-exec-${sessionCounter}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function extractWorkspaceResponse(
  flowResult: JarvisExecutionFlowResult,
): string | undefined {
  return flowResult.uiProjection.agentStatus.displayMessage;
}

function countTimelineEvents(flowResult: JarvisExecutionFlowResult): number {
  const timeline = flowResult.record.taskStatus.output?.executionTimeline as
    | { events?: readonly unknown[] }
    | undefined;
  return timeline?.events?.length ?? flowResult.uiProjection.activityEvents.length;
}

function classifyLiveExecutionIntent(message: string): IntentClassification {
  if (isLiveExecutionValidationCommand(message)) {
    return {
      intent: "automate",
      ruleId: "live-execution-validation",
      reason: "Live execution validation command",
      confidence: 1,
    };
  }

  return classifyChatIntent(message);
}

class DefaultLiveExecutionRuntime implements LiveExecutionRuntime {
  private readonly sessions = new Map<string, SessionRecord>();
  private readonly flow: JarvisExecutionFlow;
  private readonly providerSettingsRuntime: ProviderSettingsRuntime;
  private readonly defaultUserId: string;

  constructor(options: CreateDefaultLiveExecutionRuntimeOptions & { flow: JarvisExecutionFlow }) {
    this.providerSettingsRuntime =
      options.providerSettingsRuntime ?? createDefaultProviderSettingsRuntime();
    this.defaultUserId = options.userId ?? DEFAULT_API_USER_ID;
    this.flow = options.flow;
  }

  static async create(
    options: CreateDefaultLiveExecutionRuntimeOptions = {},
  ): Promise<DefaultLiveExecutionRuntime> {
    const providerSettingsRuntime =
      options.providerSettingsRuntime ?? createDefaultProviderSettingsRuntime();
    const flow =
      options.flow ??
      (await createDefaultJarvisExecutionFlow({
        deps: {
          classifyIntent: classifyLiveExecutionIntent,
          taskExecutionOptions: {
            providerSettingsRuntime,
            ...options.taskExecutionOptions,
          },
        },
      }));

    return new DefaultLiveExecutionRuntime({
      ...options,
      flow,
      providerSettingsRuntime,
    });
  }

  startLiveExecution(input: StartLiveExecutionInput = {}): LiveExecutionSession {
    const userId = input.userId ?? this.defaultUserId;
    const providerId =
      input.providerId ??
      this.providerSettingsRuntime.resolveProviderId(userId, input.metadata);

    const session: LiveExecutionSession = {
      sessionId: nextSessionId(),
      userId,
      conversationId: input.conversationId ?? `conv-live-${Date.now()}`,
      providerId,
      state: "idle",
      startedAt: nowIso(),
      stub: true,
    };

    this.sessions.set(session.sessionId, {
      session,
      telemetry: {
        sessionId: session.sessionId,
        providerId: session.providerId,
        stub: true,
        spans: [
          {
            spanId: `${session.sessionId}-start`,
            name: "live_execution.session_started",
            startedAt: session.startedAt,
            attributes: { providerId: session.providerId },
          },
        ],
        streamEvents: [],
      },
      subscribers: new Map(),
    });

    this.emitUpdate(session.sessionId, {
      sessionId: session.sessionId,
      kind: "session_started",
      timestamp: nowIso(),
      message: `Live session started with provider ${providerId}`,
      detail: { providerId },
    });

    return session;
  }

  async executeLiveTask(input: ExecuteLiveTaskInput): Promise<LiveExecutionResult> {
    const record = this.sessions.get(input.sessionId);
    if (!record) {
      throw new Error(`Unknown live execution session: ${input.sessionId}`);
    }

    const { session } = record;
    record.session = { ...session, state: "running" };

    const providerStatus = await this.providerSettingsRuntime.getProviderStatus(
      session.userId,
      session.providerId,
    );

    this.emitUpdate(session.sessionId, {
      sessionId: session.sessionId,
      kind: "provider_resolved",
      timestamp: nowIso(),
      message: providerStatus.message,
      detail: {
        providerId: providerStatus.providerId,
        stub: providerStatus.stub,
        valid: providerStatus.valid,
      },
    });

    this.pushSpan(session.sessionId, {
      spanId: `${session.sessionId}-provider`,
      name: "live_execution.provider_resolved",
      startedAt: nowIso(),
      endedAt: nowIso(),
      attributes: {
        providerId: providerStatus.providerId,
        stub: providerStatus.stub,
      },
    });

    const flowResult = await this.flow.executeFlow({
      rawInput: input.command,
      userId: session.userId,
      conversationId: session.conversationId,
      skipSpeechNormalization: input.skipSpeechNormalization ?? true,
      metadata: {
        ...input.metadata,
        llmProviderId: session.providerId,
        liveExecutionSessionId: session.sessionId,
        source: "live-execution",
      },
    });

    for (const eventType of flowResult.streamEvents) {
      record.telemetry = {
        ...record.telemetry,
        streamEvents: [...record.telemetry.streamEvents, eventType],
      };

      if (eventType === "planning_started" || eventType === "planning_completed") {
        this.emitUpdate(session.sessionId, {
          sessionId: session.sessionId,
          kind: "planning",
          timestamp: nowIso(),
          message: eventType,
        });
      }

      if (eventType === "execution_started" || eventType === "execution_completed") {
        this.emitUpdate(session.sessionId, {
          sessionId: session.sessionId,
          kind: "executing",
          timestamp: nowIso(),
          message: eventType,
        });
      }
    }

    const success = flowResult.record.taskStatus.status === "completed";
    const stub = Boolean(
      (flowResult.record.taskStatus.output?.llmProvider as { stub?: boolean } | undefined)
        ?.stub ?? providerStatus.stub,
    );

    const completedSession: LiveExecutionSession = {
      ...record.session,
      state: success ? "completed" : "failed",
      taskId: flowResult.record.createTaskResponse.taskId,
      stub,
    };
    record.session = completedSession;

    const workspaceResponse = extractWorkspaceResponse(flowResult);

    const result: LiveExecutionResult = {
      session: completedSession,
      command: input.command,
      flowResult,
      providerStatus,
      success,
      stub,
      timelineEventCount: countTimelineEvents(flowResult),
      workspaceResponse,
    };

    this.pushSpan(session.sessionId, {
      spanId: `${session.sessionId}-task`,
      name: "live_execution.task_completed",
      startedAt: session.startedAt,
      endedAt: nowIso(),
      attributes: {
        taskId: completedSession.taskId,
        success,
        stub,
        command: input.command,
      },
    });

    record.telemetry = {
      ...record.telemetry,
      stub,
      command: input.command,
      taskId: completedSession.taskId,
    };

    this.emitUpdate(session.sessionId, {
      sessionId: session.sessionId,
      kind: success ? "completed" : "failed",
      timestamp: nowIso(),
      message: workspaceResponse ?? (success ? "Completed" : "Failed"),
      detail: { taskId: completedSession.taskId, stub },
    });

    if (result.timelineEventCount > 0) {
      this.emitUpdate(session.sessionId, {
        sessionId: session.sessionId,
        kind: "timeline",
        timestamp: nowIso(),
        message: `${result.timelineEventCount} timeline events`,
      });
    }

    if (workspaceResponse) {
      this.emitUpdate(session.sessionId, {
        sessionId: session.sessionId,
        kind: "workspace",
        timestamp: nowIso(),
        message: workspaceResponse,
      });
    }

    return result;
  }

  streamLiveUpdates(
    sessionId: string,
    subscriber: LiveExecutionSubscriber,
  ): () => void {
    const record = this.sessions.get(sessionId);
    if (!record) {
      throw new Error(`Unknown live execution session: ${sessionId}`);
    }

    record.subscribers.set(subscriber.subscriberId, subscriber);
    return () => {
      record.subscribers.delete(subscriber.subscriberId);
    };
  }

  captureTelemetry(sessionId: string): LiveExecutionTelemetry {
    const record = this.sessions.get(sessionId);
    if (!record) {
      throw new Error(`Unknown live execution session: ${sessionId}`);
    }

    return record.telemetry;
  }

  getSession(sessionId: string): LiveExecutionSession | undefined {
    return this.sessions.get(sessionId)?.session;
  }

  private emitUpdate(sessionId: string, update: LiveExecutionUpdate): void {
    const record = this.sessions.get(sessionId);
    if (!record) {
      return;
    }

    for (const subscriber of record.subscribers.values()) {
      subscriber.onUpdate(update);
    }
  }

  private pushSpan(
    sessionId: string,
    span: LiveExecutionTelemetrySpan,
  ): void {
    const record = this.sessions.get(sessionId);
    if (!record) {
      return;
    }

    record.telemetry = {
      ...record.telemetry,
      spans: [...record.telemetry.spans, span],
    };
  }
}

/** Factory for live execution runtime (Phase 84). */
export async function createDefaultLiveExecutionRuntime(
  options: CreateDefaultLiveExecutionRuntimeOptions = {},
): Promise<LiveExecutionRuntime> {
  return DefaultLiveExecutionRuntime.create(options);
}

/** @internal test helper */
export async function createTestLiveExecutionRuntime(
  options: CreateDefaultLiveExecutionRuntimeOptions = {},
): Promise<LiveExecutionRuntime> {
  const providerSettingsRuntime =
    options.providerSettingsRuntime ?? createTestProviderSettingsRuntime();

  return DefaultLiveExecutionRuntime.create({
    ...options,
    providerSettingsRuntime,
  });
}
