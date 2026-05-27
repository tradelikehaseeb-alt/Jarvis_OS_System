import type { ProviderHealthSnapshot, ProviderTelemetry } from "@jarvis/types";
import {
  REAL_USER_SESSION_PROMPTS,
  type RealUserSessionPrompt,
} from "@jarvis/types";

import { DEFAULT_API_USER_ID } from "../task-execution/create-task-executor";
import { DEFAULT_CONNECTOR_CONFIGURATIONS } from "../llm-provider/connectors/default-provider-configurations";
import { GROQ_PROVIDER_ID } from "../llm-provider/connectors/default-provider-configurations";
import type { LiveProviderPromptResult, LiveProviderValidator } from "../live-provider/create-default-live-provider-runtime";
import {
  createDefaultLiveProviderRuntime,
  createTestLiveProviderRuntime,
} from "../live-provider/create-default-live-provider-runtime";

/** Active Jarvis user session (Phase 86). */
export interface JarvisUserSession {
  readonly sessionId: string;
  readonly userId: string;
  readonly conversationId: string;
  readonly providerHealth: readonly ProviderHealthSnapshot[];
  readonly startedAt: string;
  readonly state: "active" | "completed";
}

/** Prompt outcome with full desktop session validation (Phase 86). */
export interface JarvisUserSessionPromptResult extends LiveProviderPromptResult {
  readonly activityStreamUpdated: boolean;
  readonly memoryPersisted: boolean;
  readonly workspaceHistoryUpdated: boolean;
}

/** Completed real user session report (Phase 86). */
export interface JarvisUserSessionReport {
  readonly session: JarvisUserSession;
  readonly promptResults: readonly JarvisUserSessionPromptResult[];
  readonly telemetry: readonly ProviderTelemetry[];
  readonly allProvidersConfigured: boolean;
  readonly completedAt: string;
}

export interface StartUserSessionInput {
  readonly userId?: string;
  readonly conversationId?: string;
}

export interface ExecuteUserPromptInput {
  readonly prompt: string;
  readonly userId?: string;
  readonly providerId?: string;
  readonly conversationId?: string;
}

export interface RunUserSessionInput {
  readonly userId?: string;
  readonly providerId?: string;
  readonly conversationId?: string;
  readonly prompts?: readonly RealUserSessionPrompt[];
}

/** Real Jarvis user session runtime (Phase 86). */
export interface JarvisUserSessionRuntime {
  startUserSession(input?: StartUserSessionInput): Promise<JarvisUserSession>;
  configureProviders(userId?: string): Promise<readonly ProviderHealthSnapshot[]>;
  executeUserPrompt(input: ExecuteUserPromptInput): Promise<JarvisUserSessionPromptResult>;
  captureSessionTelemetry(): readonly ProviderTelemetry[];
  runUserSession(input?: RunUserSessionInput): Promise<JarvisUserSessionReport>;
}

export interface CreateDefaultJarvisUserSessionRuntimeOptions {
  readonly liveProviderRuntime?: LiveProviderValidator;
  readonly userId?: string;
  readonly providerId?: string;
}

let sessionCounter = 0;

function nextSessionId(): string {
  sessionCounter += 1;
  return `user-session-${sessionCounter}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function buildUserSessionPromptResult(
  base: LiveProviderPromptResult,
): JarvisUserSessionPromptResult {
  const { liveResult } = base;
  const memoryPersisted =
    liveResult.flowResult.steps.some((step) => step.step === "memory_persisted") ||
    liveResult.flowResult.streamEvents.includes("memory_saved");

  const activityStreamUpdated =
    liveResult.flowResult.uiProjection.activityEvents.length > 0 ||
    liveResult.flowResult.streamEvents.some(
      (event) =>
        event === "planning_started" ||
        event === "execution_started" ||
        event === "execution_completed",
    );

  return {
    ...base,
    activityStreamUpdated,
    memoryPersisted,
    workspaceHistoryUpdated: base.workspaceUpdated,
  };
}

class DefaultJarvisUserSessionRuntime implements JarvisUserSessionRuntime {
  private readonly liveProviderRuntime: LiveProviderValidator;
  private readonly defaultUserId: string;
  private readonly defaultProviderId: string;
  private activeSession: JarvisUserSession | undefined;
  private readonly telemetryLog: ProviderTelemetry[] = [];

  constructor(
    options: CreateDefaultJarvisUserSessionRuntimeOptions & {
      liveProviderRuntime: LiveProviderValidator;
    },
  ) {
    this.liveProviderRuntime = options.liveProviderRuntime;
    this.defaultUserId = options.userId ?? DEFAULT_API_USER_ID;
    this.defaultProviderId = options.providerId ?? GROQ_PROVIDER_ID;
  }

  static async create(
    options: CreateDefaultJarvisUserSessionRuntimeOptions = {},
  ): Promise<DefaultJarvisUserSessionRuntime> {
    const liveProviderRuntime =
      options.liveProviderRuntime ?? (await createDefaultLiveProviderRuntime());

    return new DefaultJarvisUserSessionRuntime({
      ...options,
      liveProviderRuntime,
    });
  }

  async startUserSession(input: StartUserSessionInput = {}): Promise<JarvisUserSession> {
    const userId = input.userId ?? this.defaultUserId;
    const providerHealth = await this.configureProviders(userId);

    const session: JarvisUserSession = {
      sessionId: nextSessionId(),
      userId,
      conversationId: input.conversationId ?? `conv-user-${Date.now()}`,
      providerHealth,
      startedAt: nowIso(),
      state: "active",
    };

    this.activeSession = session;
    this.telemetryLog.length = 0;
    return session;
  }

  configureProviders(userId?: string): Promise<readonly ProviderHealthSnapshot[]> {
    return this.liveProviderRuntime.getProviderHealth(userId ?? this.defaultUserId);
  }

  async executeUserPrompt(
    input: ExecuteUserPromptInput,
  ): Promise<JarvisUserSessionPromptResult> {
    const result = await this.liveProviderRuntime.executeLivePrompt({
      prompt: input.prompt,
      userId: input.userId ?? this.defaultUserId,
      providerId: input.providerId ?? this.defaultProviderId,
      conversationId:
        input.conversationId ?? this.activeSession?.conversationId,
    });

    const telemetry = this.liveProviderRuntime.captureProviderTelemetry(
      result.liveResult.session.sessionId,
    );
    this.telemetryLog.push(telemetry);

    return buildUserSessionPromptResult(result);
  }

  captureSessionTelemetry(): readonly ProviderTelemetry[] {
    return [...this.telemetryLog];
  }

  async runUserSession(input: RunUserSessionInput = {}): Promise<JarvisUserSessionReport> {
    const session = await this.startUserSession({
      userId: input.userId,
      conversationId: input.conversationId,
    });

    const prompts = input.prompts ?? REAL_USER_SESSION_PROMPTS;
    const promptResults: JarvisUserSessionPromptResult[] = [];

    for (const prompt of prompts) {
      promptResults.push(
        await this.executeUserPrompt({
          prompt,
          userId: session.userId,
          providerId: input.providerId ?? this.defaultProviderId,
          conversationId: session.conversationId,
        }),
      );
    }

    const completedSession: JarvisUserSession = {
      ...session,
      state: "completed",
    };
    this.activeSession = completedSession;

    return {
      session: completedSession,
      promptResults,
      telemetry: this.captureSessionTelemetry(),
      allProvidersConfigured:
        session.providerHealth.length === DEFAULT_CONNECTOR_CONFIGURATIONS.length,
      completedAt: nowIso(),
    };
  }
}

/** Factory for real Jarvis user session runtime (Phase 86). */
export async function createDefaultJarvisUserSessionRuntime(
  options: CreateDefaultJarvisUserSessionRuntimeOptions = {},
): Promise<JarvisUserSessionRuntime> {
  return DefaultJarvisUserSessionRuntime.create(options);
}

/** @internal test helper */
export async function createTestJarvisUserSessionRuntime(
  options: CreateDefaultJarvisUserSessionRuntimeOptions = {},
): Promise<JarvisUserSessionRuntime> {
  const liveProviderRuntime =
    options.liveProviderRuntime ?? (await createTestLiveProviderRuntime());

  return DefaultJarvisUserSessionRuntime.create({
    ...options,
    liveProviderRuntime,
  });
}
