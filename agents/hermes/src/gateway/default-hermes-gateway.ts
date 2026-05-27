import type { HermesAdapter } from "../../adapter/src/hermes-adapter";
import { createHermesAdapterStub } from "../../adapter/src/hermes-adapter-stub";
import type { HermesGateway } from "./hermes-gateway";
import type { HermesGatewayRequest } from "./hermes-gateway-request";
import type {
  HermesGatewayResponse,
  HermesRuntimeValidation,
} from "./hermes-gateway-response";
import {
  createHermesGatewayRuntimeWiring,
  validationFromHermesRuntimeHealth,
  type HermesGatewayRuntimeWiringOptions,
} from "./hermes-gateway-runtime-wiring";

export interface DefaultHermesGatewayOptions extends HermesGatewayRuntimeWiringOptions {
  readonly adapter?: HermesAdapter;
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
 * Default Hermes gateway — stub planning with runtime validation boundary (Phase 43–44).
 *
 * No LLM execution; delegates to {@link HermesAdapter} stub/planning path only.
 */
export class DefaultHermesGateway implements HermesGateway {
  private readonly adapter: HermesAdapter;
  private readonly runtimeWiring: HermesGatewayRuntimeWiring;

  constructor(options: DefaultHermesGatewayOptions = {}) {
    this.adapter = options.adapter ?? createHermesAdapterStub();
    this.runtimeWiring = createHermesGatewayRuntimeWiring(options);
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

  async getRuntimeStatus(): Promise<HermesGatewayResponse["runtimeStatus"]> {
    const validation = await this.validateRuntime();
    return validation.status;
  }

  async validateRuntime(): Promise<HermesRuntimeValidation> {
    if (this.runtimeWiring.isStubMode()) {
      return {
        valid: true,
        status: "stub",
        reasons: [],
      };
    }

    return validationFromHermesRuntimeHealth(await this.runtimeWiring.getRuntimeHealth());
  }

  resolveConfiguredRuntime() {
    return this.runtimeWiring.resolveConfiguredRuntime();
  }

  resolveProviderMetadata() {
    return this.runtimeWiring.resolveProviderMetadata();
  }

  getRuntimeHealth() {
    return this.runtimeWiring.getRuntimeHealth();
  }
}
