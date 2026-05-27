import type { OpenClawAdapter } from "../../adapter/src/openclaw-adapter";

import type { OpenClawGatewayRequest } from "../gateway/openclaw-gateway-request";
import type { OpenClawGatewayResponse } from "../gateway/openclaw-gateway-response";
import {
  validationFromOpenClawRuntimeHealth,
  type OpenClawGatewayRuntimeWiring,
} from "../gateway/openclaw-gateway-runtime-wiring";
import {
  DEFAULT_OPENCLAW_PROVIDER_ID,
  validateProviderConnection,
  type ProviderRuntime,
} from "@jarvis/provider-runtime";

import type { OpenClawExecutionHandshake } from "./openclaw-execution-handshake";
import type { OpenClawExecutionState } from "./openclaw-execution-state";
import type { OpenClawRuntimeHealth } from "./openclaw-runtime-health";
import type { OpenClawRuntimeProcessBinding } from "./openclaw-runtime-process-binding";
import type { OpenClawRuntimeSession } from "./openclaw-runtime-session";

export interface CreateOpenClawRuntimeSessionOptions {
  readonly adapter: OpenClawAdapter;
  readonly runtimeWiring: OpenClawGatewayRuntimeWiring;
  readonly processBinding?: OpenClawRuntimeProcessBinding;
  readonly providerRuntime?: ProviderRuntime;
  readonly providerId?: string;
  readonly sessionId?: string;
}

let sessionCounter = 0;

function nextSessionId(): string {
  sessionCounter += 1;
  return `openclaw-session-${sessionCounter}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function buildGatewayResponse(
  request: OpenClawGatewayRequest,
  adapter: OpenClawAdapter,
  runtimeStatus: OpenClawRuntimeHealth["status"],
  adapterResponse: Awaited<ReturnType<OpenClawAdapter["invoke"]>>,
): OpenClawGatewayResponse {
  return {
    success: adapterResponse.success,
    stub: adapterResponse.stub,
    runtimeStatus,
    adapterId: adapterResponse.adapterId,
    executionHandleId: adapterResponse.execution.handleId,
    approvedActions: adapterResponse.approvedActions,
    sandbox: adapterResponse.execution.sandbox,
    permissionsChecked: adapterResponse.execution.permissionsChecked,
    error: adapterResponse.error,
  };
}

function buildUnavailableResponse(
  request: OpenClawGatewayRequest,
  adapter: OpenClawAdapter,
  runtimeStatus: OpenClawRuntimeHealth["status"],
  message: string,
): OpenClawGatewayResponse {
  return {
    success: false,
    stub: true,
    runtimeStatus,
    adapterId: adapter.adapterId,
    executionHandleId: `handle-${request.taskId}`,
    approvedActions: [],
    sandbox: true,
    permissionsChecked: false,
    error: {
      code: "RUNTIME_UNAVAILABLE",
      message,
    },
  };
}

async function applyProviderConnectionValidation(
  health: OpenClawRuntimeHealth,
  options: CreateOpenClawRuntimeSessionOptions,
): Promise<OpenClawRuntimeHealth> {
  if (!options.providerRuntime) {
    return health;
  }

  const providerId = options.providerId ?? DEFAULT_OPENCLAW_PROVIDER_ID;
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

class DefaultOpenClawRuntimeSession implements OpenClawRuntimeSession {
  readonly sessionId: string;
  state: OpenClawExecutionState = "idle";
  private runtimeHealth: OpenClawRuntimeHealth | undefined;
  private initializedAt: string | undefined;
  private validatedAt: string | undefined;

  constructor(private readonly options: CreateOpenClawRuntimeSessionOptions) {
    this.sessionId = options.sessionId ?? nextSessionId();
  }

  async initializeSession(): Promise<OpenClawExecutionHandshake> {
    this.state = "initializing";
    this.initializedAt = nowIso();

    if (this.options.processBinding) {
      const running = await this.options.processBinding.ensureOpenClawRuntimeRunning();
      if (!running) {
        this.state = "failed";
        return {
          sessionId: this.sessionId,
          state: this.state,
          initializedAt: this.initializedAt,
          error: {
            code: "RUNTIME_PROCESS_UNAVAILABLE",
            message: "OpenClaw runtime process is not running",
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

  async validateRuntime(): Promise<OpenClawRuntimeHealth> {
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
          message: "OpenClaw stub runtime",
          checkedAt,
          processState: this.options.processBinding
            ? await this.options.processBinding.getOpenClawProcessState()
            : "stub",
        },
        this.options,
      );
      this.state = this.runtimeHealth.valid ? "validated" : "failed";
      this.validatedAt = checkedAt;
      return this.runtimeHealth;
    }

    const resolverHealth = await wiring.getRuntimeHealth();
    const validation = validationFromOpenClawRuntimeHealth(resolverHealth);
    const processState = this.options.processBinding
      ? await this.options.processBinding.getOpenClawProcessState()
      : undefined;

    const processRunning =
      !this.options.processBinding ||
      processState === "running" ||
      processState === "restarting";

    const valid = validation.valid && processRunning;
    const reasons = [...validation.reasons];

    if (!processRunning) {
      reasons.push("OpenClaw runtime process is not running");
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

  async executeTask(request: OpenClawGatewayRequest): Promise<OpenClawExecutionHandshake> {
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

    this.state = "executing";

    const adapterResponse = await this.options.adapter.invoke({
      requestId: request.requestId,
      taskId: request.taskId,
      userId: request.userId,
      intent: request.intent,
      contextRef: request.contextRef,
      correlationId: request.correlationId,
      workflowStepId: request.workflowStepId,
      requestedActions: request.requestedActions,
    });

    const response = buildGatewayResponse(
      request,
      this.options.adapter,
      health.status,
      adapterResponse,
    );

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

  async terminateSession(): Promise<OpenClawExecutionHandshake> {
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
 * Factory for OpenClaw runtime execution session (Phase 58).
 */
export function createOpenClawRuntimeSession(
  options: CreateOpenClawRuntimeSessionOptions,
): OpenClawRuntimeSession {
  return new DefaultOpenClawRuntimeSession(options);
}
