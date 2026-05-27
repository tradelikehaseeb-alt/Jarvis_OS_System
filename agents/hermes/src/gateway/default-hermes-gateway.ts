import type { HermesAdapter } from "../../adapter/src/hermes-adapter";
import { createHermesAdapterStub } from "../../adapter/src/hermes-adapter-stub";
import {
  createHermesRuntimeDiscoveryAdapter,
} from "../../adapter/official/src/hermes-runtime-discovery-adapter";
import {
  readHermesRuntimeEnv,
  type EnvSource,
} from "../../adapter/official/src/hermes-runtime-env";
import type { HermesGateway } from "./hermes-gateway";
import type { HermesGatewayRequest } from "./hermes-gateway-request";
import type {
  HermesGatewayResponse,
  HermesRuntimeValidation,
} from "./hermes-gateway-response";
import type { HermesRuntimeStatus } from "./hermes-runtime-status";

export interface DefaultHermesGatewayOptions {
  readonly adapter?: HermesAdapter;
  readonly env?: EnvSource;
  readonly allowNetworkProbe?: boolean;
}

function mapHealthStatus(
  status: string,
  stubMode: boolean,
): HermesRuntimeStatus {
  if (stubMode) {
    return "stub";
  }
  switch (status) {
    case "available":
      return "available";
    case "degraded":
      return "degraded";
    case "unavailable":
      return "unavailable";
    default:
      return "unknown";
  }
}

function emptyPlan(intentKind: string): HermesGatewayResponse["plan"] {
  return {
    goal: "",
    steps: [],
    intentKind,
    summary: "",
  };
}

/**
 * Default Hermes gateway — stub planning with runtime validation boundary (Phase 43).
 *
 * No LLM execution; delegates to {@link HermesAdapter} stub/planning path only.
 */
export class DefaultHermesGateway implements HermesGateway {
  private readonly adapter: HermesAdapter;
  private readonly env: EnvSource;
  private readonly allowNetworkProbe: boolean;

  constructor(options: DefaultHermesGatewayOptions = {}) {
    this.adapter = options.adapter ?? createHermesAdapterStub();
    this.env = options.env ?? process.env;
    this.allowNetworkProbe = options.allowNetworkProbe ?? false;
  }

  async execute(request: HermesGatewayRequest): Promise<HermesGatewayResponse> {
    const validation = await this.validateRuntime();
    const runtimeStatus = validation.status;

    if (!validation.valid) {
      return {
        success: false,
        stub: true,
        runtimeStatus,
        adapterId: this.adapter.adapterId,
        plan: emptyPlan(request.intent.kind),
        reasoning: { summary: "", confidence: 0 },
        error: {
          code: "RUNTIME_UNAVAILABLE",
          message: validation.reasons.join("; ") || "Hermes runtime unavailable",
        },
      };
    }

    const adapterResponse = await this.adapter.invoke({
      requestId: request.requestId,
      taskId: request.taskId,
      userId: request.userId,
      intent: request.intent,
      contextRef: request.contextRef,
      correlationId: request.correlationId,
      workflowStepId: request.workflowStepId,
    });

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

  async getRuntimeStatus(): Promise<HermesRuntimeStatus> {
    const validation = await this.validateRuntime();
    return validation.status;
  }

  async validateRuntime(): Promise<HermesRuntimeValidation> {
    const env = readHermesRuntimeEnv(this.env);

    if (env.mode === "stub") {
      return {
        valid: true,
        status: "stub",
        reasons: [],
      };
    }

    const discovery = createHermesRuntimeDiscoveryAdapter({
      env: this.env,
      allowNetworkProbe: this.allowNetworkProbe,
    });
    const health = await discovery.checkHealth();
    const status = mapHealthStatus(health.status, false);
    const reasons: string[] = [];

    if (!health.available) {
      reasons.push(health.message);
    }

    return {
      valid: health.available || status === "degraded",
      status,
      reasons,
    };
  }
}
