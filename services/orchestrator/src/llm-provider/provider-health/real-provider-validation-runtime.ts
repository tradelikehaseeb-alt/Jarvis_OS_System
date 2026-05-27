import type { RealProviderValidationCommand } from "@jarvis/types";
import { REAL_PROVIDER_VALIDATION_COMMANDS } from "@jarvis/types";

import type { LiveExecutionRuntime } from "../../live-execution/live-execution-runtime";
import type { LiveExecutionResult } from "../../live-execution/live-execution-result";
import {
  createTestLiveExecutionRuntime,
  createDefaultLiveExecutionRuntime,
} from "../../live-execution/create-default-live-execution-runtime";
import { DEFAULT_API_USER_ID } from "../../task-execution/create-task-executor";
import { GROQ_PROVIDER_ID } from "../connectors/default-provider-configurations";

import type { ProviderHealthCheckResult } from "./provider-health-check-result";
import type { ProviderHealthValidationRuntime } from "./provider-health-validation-runtime";
import {
  createDefaultProviderHealthValidationRuntime,
  createTestProviderHealthValidationRuntime,
} from "./provider-health-validation-runtime";

/** Checklist for a single real provider validation command (Phase 85). */
export interface RealProviderCommandValidation {
  readonly command: RealProviderValidationCommand;
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
}

/** Full real provider validation report (Phase 85). */
export interface RealProviderValidationReport {
  readonly providerHealth: readonly ProviderHealthCheckResult[];
  readonly commandValidations: readonly RealProviderCommandValidation[];
  readonly providerCount: number;
  readonly allProvidersRegistered: boolean;
  readonly validatedAt: string;
}

export interface RealProviderValidationInput {
  readonly userId?: string;
  readonly providerId?: string;
  readonly commands?: readonly RealProviderValidationCommand[];
}

export interface RealProviderValidationRuntime {
  validateProviderHealth(userId?: string): Promise<readonly ProviderHealthCheckResult[]>;
  executeRealProviderValidation(
    input?: RealProviderValidationInput,
  ): Promise<RealProviderValidationReport>;
}

export interface CreateDefaultRealProviderValidationRuntimeOptions {
  readonly healthRuntime?: ProviderHealthValidationRuntime;
  readonly liveExecutionRuntime?: LiveExecutionRuntime;
  readonly userId?: string;
  readonly providerId?: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function buildCommandValidation(
  command: RealProviderValidationCommand,
  providerId: string,
  liveResult: LiveExecutionResult,
  latencyMs: number,
): RealProviderCommandValidation {
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
    liveResult.flowResult.streamEvents.length > 0 ||
    liveResult.timelineEventCount > 0;

  return {
    command,
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
  };
}

class DefaultRealProviderValidationRuntime implements RealProviderValidationRuntime {
  private readonly healthRuntime: ProviderHealthValidationRuntime;
  private readonly liveExecutionRuntime: LiveExecutionRuntime;
  private readonly defaultUserId: string;
  private readonly defaultProviderId: string;

  constructor(
    options: CreateDefaultRealProviderValidationRuntimeOptions & {
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
    options: CreateDefaultRealProviderValidationRuntimeOptions = {},
  ): Promise<DefaultRealProviderValidationRuntime> {
    const healthRuntime =
      options.healthRuntime ?? createDefaultProviderHealthValidationRuntime();
    const liveExecutionRuntime =
      options.liveExecutionRuntime ??
      (await createDefaultLiveExecutionRuntime());

    return new DefaultRealProviderValidationRuntime({
      ...options,
      healthRuntime,
      liveExecutionRuntime,
    });
  }

  validateProviderHealth(userId?: string): Promise<readonly ProviderHealthCheckResult[]> {
    return this.healthRuntime.validateAllProviders(userId ?? this.defaultUserId);
  }

  async executeRealProviderValidation(
    input: RealProviderValidationInput = {},
  ): Promise<RealProviderValidationReport> {
    const userId = input.userId ?? this.defaultUserId;
    const providerId = input.providerId ?? this.defaultProviderId;
    const commands = input.commands ?? REAL_PROVIDER_VALIDATION_COMMANDS;

    const providerHealth = await this.healthRuntime.validateAllProviders(userId);
    const commandValidations: RealProviderCommandValidation[] = [];

    for (const command of commands) {
      const startedAt = Date.now();
      const session = this.liveExecutionRuntime.startLiveExecution({
        userId,
        providerId,
        conversationId: `conv-real-provider-${Date.now()}`,
      });

      const liveResult = await this.liveExecutionRuntime.executeLiveTask({
        sessionId: session.sessionId,
        command,
      });

      this.liveExecutionRuntime.captureTelemetry(session.sessionId);

      commandValidations.push(
        buildCommandValidation(
          command,
          providerId,
          liveResult,
          Date.now() - startedAt,
        ),
      );
    }

    return {
      providerHealth,
      commandValidations,
      providerCount: providerHealth.length,
      allProvidersRegistered: providerHealth.length === 7,
      validatedAt: nowIso(),
    };
  }
}

/** Factory for real provider validation runtime (Phase 85). */
export async function createDefaultRealProviderValidationRuntime(
  options: CreateDefaultRealProviderValidationRuntimeOptions = {},
): Promise<RealProviderValidationRuntime> {
  return DefaultRealProviderValidationRuntime.create(options);
}

/** @internal test helper */
export async function createTestRealProviderValidationRuntime(
  options: CreateDefaultRealProviderValidationRuntimeOptions = {},
): Promise<RealProviderValidationRuntime> {
  const healthRuntime =
    options.healthRuntime ?? createTestProviderHealthValidationRuntime();
  const liveExecutionRuntime =
    options.liveExecutionRuntime ?? (await createTestLiveExecutionRuntime());

  return DefaultRealProviderValidationRuntime.create({
    ...options,
    healthRuntime,
    liveExecutionRuntime,
  });
}
