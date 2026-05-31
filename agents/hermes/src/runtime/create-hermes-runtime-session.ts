import type { HermesAdapter } from "../../adapter/src/hermes-adapter";

import type { HermesGatewayRequest } from "../gateway/hermes-gateway-request";
import type { HermesGatewayResponse } from "../gateway/hermes-gateway-response";
import {
  validationFromHermesRuntimeHealth,
  type HermesGatewayRuntimeWiring,
} from "../gateway/hermes-gateway-runtime-wiring";
import {
  DEFAULT_HERMES_PROVIDER_ID,
  validateProviderConnection,
  type ProviderRuntime,
} from "@jarvis/provider-runtime";

import type { HermesPlanningHandshake } from "./hermes-planning-handshake";
import type { HermesPlanningState } from "./hermes-planning-state";
import type { HermesRuntimeHealth } from "./hermes-runtime-health";
import type { HermesRuntimeProcessBinding } from "./hermes-runtime-process-binding";
import type { HermesRuntimeSession } from "./hermes-runtime-session";

export interface CreateHermesRuntimeSessionOptions {
  readonly adapter: HermesAdapter;
  readonly runtimeWiring: HermesGatewayRuntimeWiring;
  readonly processBinding?: HermesRuntimeProcessBinding;
  readonly providerRuntime?: ProviderRuntime;
  readonly providerId?: string;
  readonly sessionId?: string;
}

let sessionCounter = 0;

function nextSessionId(): string {
  sessionCounter += 1;
  return `hermes-session-${sessionCounter}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function emptyPlan(intentKind: string): HermesGatewayResponse["plan"] {
  return {
    goal: "",
    steps: [],
    intentKind,
    summary: "",
  };
}

function buildGatewayResponse(
  _request: HermesGatewayRequest,
  adapterResponse: Awaited<ReturnType<HermesAdapter["invoke"]>>,
  runtimeStatus: HermesRuntimeHealth["status"],
): HermesGatewayResponse {
  return {
    success: adapterResponse.success,
    stub: adapterResponse.stub,
    runtimeStatus,
    adapterId: adapterResponse.adapterId,
    plan: adapterResponse.plan,
    reasoning: adapterResponse.reasoning,
    error: adapterResponse.error,
  };
}

function buildUnavailableResponse(
  request: HermesGatewayRequest,
  adapter: HermesAdapter,
  runtimeStatus: HermesRuntimeHealth["status"],
  message: string,
): HermesGatewayResponse {
  return {
    success: false,
    stub: true,
    runtimeStatus,
    adapterId: adapter.adapterId,
    plan: emptyPlan(request.intent.kind),
    reasoning: { summary: "", confidence: 0 },
    error: {
      code: "RUNTIME_UNAVAILABLE",
      message,
    },
  };
}

async function applyProviderConnectionValidation(
  health: HermesRuntimeHealth,
  options: CreateHermesRuntimeSessionOptions,
): Promise<HermesRuntimeHealth> {
  if (!options.providerRuntime) {
    return health;
  }

  const providerId = options.providerId ?? DEFAULT_HERMES_PROVIDER_ID;
  const providerCheck = await validateProviderConnection(
    options.providerRuntime,
    providerId,
  );

  if (providerCheck.valid) {
    return health;
  }

  return {
    ...health,
    valid: false,
    available: false,
    message: [health.message, providerCheck.message].filter(Boolean).join("; "),
  };
}

class DefaultHermesRuntimeSession implements HermesRuntimeSession {
  readonly sessionId: string;
  state: HermesPlanningState = "idle";
  private runtimeHealth: HermesRuntimeHealth | undefined;
  private initializedAt: string | undefined;
  private validatedAt: string | undefined;

  constructor(private readonly options: CreateHermesRuntimeSessionOptions) {
    this.sessionId = options.sessionId ?? nextSessionId();
  }

  async initializeSession(): Promise<HermesPlanningHandshake> {
    this.state = "initializing";
    this.initializedAt = nowIso();

    if (this.options.processBinding) {
      const running = await this.options.processBinding.ensureHermesRuntimeRunning();
      if (!running) {
        this.state = "failed";
        return {
          sessionId: this.sessionId,
          state: this.state,
          initializedAt: this.initializedAt,
          error: {
            code: "RUNTIME_PROCESS_UNAVAILABLE",
            message: "Hermes runtime process is not running",
          },
        };
      }
    }

    this.state = "idle";
    return {
      sessionId: this.sessionId,
      state: this.state,
      initializedAt: this.initializedAt,
    };
  }

  async validateRuntime(): Promise<HermesRuntimeHealth> {
    const wiring = this.options.runtimeWiring;
    const stubMode = wiring.isStubMode();
    const checkedAt = nowIso();

    if (stubMode) {
      this.runtimeHealth = await applyProviderConnectionValidation(
        {
          status: "stub",
          valid: true,
          stub: true,
          available: true,
          message: "Hermes stub runtime",
          checkedAt,
          processState: this.options.processBinding
            ? await this.options.processBinding.getHermesProcessState()
            : "stub",
        },
        this.options,
      );
      this.state = this.runtimeHealth.valid ? "validated" : "failed";
      this.validatedAt = checkedAt;
      return this.runtimeHealth;
    }

    const resolverHealth = await wiring.getRuntimeHealth();
    const validation = validationFromHermesRuntimeHealth(resolverHealth);
    const processState = this.options.processBinding
      ? await this.options.processBinding.getHermesProcessState()
      : undefined;

    const processRunning =
      !this.options.processBinding ||
      processState === "running" ||
      processState === "restarting";

    const valid = validation.valid && processRunning;
    const reasons = [...validation.reasons];

    if (!processRunning) {
      reasons.push("Hermes runtime process is not running");
    }

    this.runtimeHealth = await applyProviderConnectionValidation(
      {
        status: validation.status,
        valid,
        stub: resolverHealth.stub,
        available: resolverHealth.available && processRunning,
        message: reasons.join("; ") || resolverHealth.message,
        endpoint: resolverHealth.endpoint,
        checkedAt,
        processState,
      },
      this.options,
    );

    this.state = this.runtimeHealth.valid ? "validated" : "failed";
    this.validatedAt = checkedAt;
    return this.runtimeHealth;
  }

  async generatePlan(request: HermesGatewayRequest): Promise<HermesPlanningHandshake> {
    const health = this.runtimeHealth ?? (await this.validateRuntime());

    if (!health.valid) {
      this.state = "failed";
      const response = buildUnavailableResponse(
        request,
        this.options.adapter,
        health.status,
        health.message,
      );

      return {
        sessionId: this.sessionId,
        state: this.state,
        runtimeHealth: health,
        initializedAt: this.initializedAt,
        validatedAt: this.validatedAt,
        completedAt: nowIso(),
        response,
        error: response.error,
      };
    }

    this.state = "planning";

    const adapterResponse = await this.options.adapter.invoke({
      requestId: request.requestId,
      taskId: request.taskId,
      userId: request.userId,
      intent: request.intent,
      contextRef: request.contextRef,
      correlationId: request.correlationId,
      workflowStepId: request.workflowStepId,
      recalledContextSnippets: request.recalledContext?.snippets,
    });

    const response = buildGatewayResponse(request, adapterResponse, health.status);
    this.state = response.success ? "completed" : "failed";

    return {
      sessionId: this.sessionId,
      state: this.state,
      runtimeHealth: health,
      initializedAt: this.initializedAt,
      validatedAt: this.validatedAt,
      completedAt: nowIso(),
      response,
      error: response.error,
    };
  }

  async terminateSession(): Promise<HermesPlanningHandshake> {
    const terminatedAt = nowIso();
    this.state = "terminated";

    return {
      sessionId: this.sessionId,
      state: this.state,
      runtimeHealth: this.runtimeHealth,
      initializedAt: this.initializedAt,
      validatedAt: this.validatedAt,
      terminatedAt,
    };
  }
}

/**
 * Factory for Hermes runtime planning session (Phase 59).
 */
export function createHermesRuntimeSession(
  options: CreateHermesRuntimeSessionOptions,
): HermesRuntimeSession {
  return new DefaultHermesRuntimeSession(options);
}
