import type { ProviderHealthSnapshot, ProviderTelemetry } from "@jarvis/types";
import {
  REAL_PROVIDER_VALIDATION_COMMANDS,
  type RealProviderValidationCommand,
} from "@jarvis/types";

import type { LiveExecutionResult } from "../live-execution/live-execution-result";
import type { LiveExecutionRuntime } from "../live-execution/live-execution-runtime";
import {
  createDefaultLiveExecutionRuntime,
  createTestLiveExecutionRuntime,
} from "../live-execution/create-default-live-execution-runtime";
import { DEFAULT_API_USER_ID } from "../task-execution/create-task-executor";
import { GROQ_PROVIDER_ID } from "../llm-provider/connectors/default-provider-configurations";
import type { ProviderHealthValidationRuntime } from "../llm-provider/provider-health/provider-health-validation-runtime";
import {
  createDefaultProviderHealthValidationRuntime,
  createTestProviderHealthValidationRuntime,
} from "../llm-provider/provider-health/provider-health-validation-runtime";

import { toProviderHealthSnapshot, toProviderHealthSnapshots } from "./provider-health-snapshot-mapper";
import { toProviderTelemetry } from "./provider-telemetry-mapper";

/** Input for a single live provider prompt (Phase 85). */
export interface ExecuteLivePromptInput {
  readonly prompt: string;
  readonly userId?: string;
  readonly providerId?: string;
  readonly conversationId?: string;
}

/** Outcome of executing a live provider prompt (Phase 85). */
export interface LiveProviderPromptResult {
  readonly prompt: string;
  readonly providerId: string;
  readonly success: boolean;
  readonly stub: boolean;
  readonly providerResponseReceived: boolean;
  readonly hermesPlanCreated: boolean;
  readonly openClawTriggered: boolean;
  readonly timelineUpdated: boolean;
  readonly workspaceUpdated: boolean;
  readonly telemetryCaptured: boolean;
  readonly latencyMs: number;
  readonly liveResult: LiveExecutionResult;
  readonly telemetry: ProviderTelemetry;
}

/** Validation report for all real provider scenarios (Phase 85). */
export interface LiveProviderValidationReport {
  readonly providerHealth: readonly ProviderHealthSnapshot[];
  readonly promptResults: readonly LiveProviderPromptResult[];
  readonly providerCount: number;
  readonly allProvidersRegistered: boolean;
  readonly validatedAt: string;
}

export interface LiveProviderValidationInput {
  readonly userId?: string;
  readonly providerId?: string;
  readonly prompts?: readonly RealProviderValidationCommand[];
}

/** Live provider validation and execution runtime (Phase 85). */
export interface LiveProviderValidator {
  validateProviderConnection(
    providerId: string,
    userId?: string,
  ): Promise<ProviderHealthSnapshot>;
  getProviderHealth(userId?: string): Promise<readonly ProviderHealthSnapshot[]>;
  executeLivePrompt(input: ExecuteLivePromptInput): Promise<LiveProviderPromptResult>;
  captureProviderTelemetry(sessionId: string): ProviderTelemetry;
  runValidationScenarios(
    input?: LiveProviderValidationInput,
  ): Promise<LiveProviderValidationReport>;
}

export interface CreateDefaultLiveProviderRuntimeOptions {
  readonly healthRuntime?: ProviderHealthValidationRuntime;
  readonly liveExecutionRuntime?: LiveExecutionRuntime;
  readonly userId?: string;
  readonly providerId?: string;
}

function buildPromptResult(
  prompt: string,
  providerId: string,
  liveResult: LiveExecutionResult,
  telemetry: ProviderTelemetry,
  latencyMs: number,
): LiveProviderPromptResult {
  const llmProvider = liveResult.flowResult.record.taskStatus.output?.llmProvider as
    | { content?: string; stub?: boolean }
    | undefined;

  const providerResponseReceived =
    Boolean(llmProvider?.content && llmProvider.content.length > 0) ||
    liveResult.success;

  const hermesPlanCreated = liveResult.flowResult.steps.some(
    (step) => step.step === "hermes_planning",
  );

  const openClawTriggered = liveResult.flowResult.steps.some(
    (step) => step.step === "openclaw_execution",
  );

  const telemetryCaptured =
    telemetry.streamEvents.length > 0 || telemetry.spans.length > 0;

  return {
    prompt,
    providerId,
    success: liveResult.success,
    stub: liveResult.stub,
    providerResponseReceived,
    hermesPlanCreated,
    openClawTriggered,
    timelineUpdated: liveResult.timelineEventCount > 0,
    workspaceUpdated: Boolean(liveResult.workspaceResponse),
    telemetryCaptured,
    latencyMs,
    liveResult,
    telemetry,
  };
}

class DefaultLiveProviderRuntime implements LiveProviderValidator {
  private readonly healthRuntime: ProviderHealthValidationRuntime;
  private readonly liveExecutionRuntime: LiveExecutionRuntime;
  private readonly defaultUserId: string;
  private readonly defaultProviderId: string;

  constructor(
    options: CreateDefaultLiveProviderRuntimeOptions & {
      liveExecutionRuntime: LiveExecutionRuntime;
    },
  ) {
    this.healthRuntime =
      options.healthRuntime ?? createDefaultProviderHealthValidationRuntime();
    this.liveExecutionRuntime = options.liveExecutionRuntime;
    this.defaultUserId = options.userId ?? DEFAULT_API_USER_ID;
    this.defaultProviderId = options.providerId ?? GROQ_PROVIDER_ID;
  }

  static async create(
    options: CreateDefaultLiveProviderRuntimeOptions = {},
  ): Promise<DefaultLiveProviderRuntime> {
    const healthRuntime =
      options.healthRuntime ?? createDefaultProviderHealthValidationRuntime();
    const liveExecutionRuntime =
      options.liveExecutionRuntime ??
      (await createDefaultLiveExecutionRuntime());

    return new DefaultLiveProviderRuntime({
      ...options,
      healthRuntime,
      liveExecutionRuntime,
    });
  }

  async validateProviderConnection(
    providerId: string,
    userId?: string,
  ): Promise<ProviderHealthSnapshot> {
    const result = await this.healthRuntime.validateProviderHealth(
      providerId,
      userId ?? this.defaultUserId,
    );
    return toProviderHealthSnapshot(result);
  }

  async getProviderHealth(userId?: string): Promise<readonly ProviderHealthSnapshot[]> {
    const results = await this.healthRuntime.validateAllProviders(
      userId ?? this.defaultUserId,
    );
    return toProviderHealthSnapshots(results);
  }

  async executeLivePrompt(input: ExecuteLivePromptInput): Promise<LiveProviderPromptResult> {
    const userId = input.userId ?? this.defaultUserId;
    const providerId = input.providerId ?? this.defaultProviderId;
    const startedAt = Date.now();

    const session = this.liveExecutionRuntime.startLiveExecution({
      userId,
      providerId,
      conversationId: input.conversationId ?? `conv-live-provider-${Date.now()}`,
    });

    const liveResult = await this.liveExecutionRuntime.executeLiveTask({
      sessionId: session.sessionId,
      command: input.prompt,
    });

    const telemetry = this.captureProviderTelemetry(session.sessionId);

    return buildPromptResult(
      input.prompt,
      providerId,
      liveResult,
      telemetry,
      Date.now() - startedAt,
    );
  }

  captureProviderTelemetry(sessionId: string): ProviderTelemetry {
    return toProviderTelemetry(this.liveExecutionRuntime.captureTelemetry(sessionId));
  }

  async runValidationScenarios(
    input: LiveProviderValidationInput = {},
  ): Promise<LiveProviderValidationReport> {
    const userId = input.userId ?? this.defaultUserId;
    const providerId = input.providerId ?? this.defaultProviderId;
    const prompts = input.prompts ?? REAL_PROVIDER_VALIDATION_COMMANDS;

    const providerHealth = await this.getProviderHealth(userId);
    const promptResults: LiveProviderPromptResult[] = [];

    for (const prompt of prompts) {
      promptResults.push(
        await this.executeLivePrompt({
          prompt,
          userId,
          providerId,
        }),
      );
    }

    return {
      providerHealth,
      promptResults,
      providerCount: providerHealth.length,
      allProvidersRegistered: providerHealth.length === 7,
      validatedAt: new Date().toISOString(),
    };
  }
}

/** Factory for live provider validation runtime (Phase 85). */
export async function createDefaultLiveProviderRuntime(
  options: CreateDefaultLiveProviderRuntimeOptions = {},
): Promise<LiveProviderValidator> {
  return DefaultLiveProviderRuntime.create(options);
}

/** @internal test helper */
export async function createTestLiveProviderRuntime(
  options: CreateDefaultLiveProviderRuntimeOptions = {},
): Promise<LiveProviderValidator> {
  const healthRuntime =
    options.healthRuntime ?? createTestProviderHealthValidationRuntime();
  const liveExecutionRuntime =
    options.liveExecutionRuntime ?? (await createTestLiveExecutionRuntime());

  return DefaultLiveProviderRuntime.create({
    ...options,
    healthRuntime,
    liveExecutionRuntime,
  });
}
