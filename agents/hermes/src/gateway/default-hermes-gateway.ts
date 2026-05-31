import type { HermesAdapter } from "../../adapter/src/hermes-adapter";
import { createHermesAdapterStub } from "../../adapter/src/hermes-adapter-stub";
import type { HermesGateway } from "./hermes-gateway";
import type { HermesGatewayRequest } from "./hermes-gateway-request";
import type {
  HermesGatewayResponse,
  HermesRuntimeValidation,
} from "./hermes-gateway-response";
import {
  HermesGatewayRuntimeWiring,
  createHermesGatewayRuntimeWiring,
  validationFromHermesRuntimeHealth,
  type HermesGatewayRuntimeWiringOptions,
} from "./hermes-gateway-runtime-wiring";
import { createHermesRuntimeSession } from "../runtime/create-hermes-runtime-session";
import type { HermesRuntimeProcessBinding } from "../runtime/hermes-runtime-process-binding";
import type { ProviderRuntime } from "@jarvis/provider-runtime";

export interface DefaultHermesGatewayOptions extends HermesGatewayRuntimeWiringOptions {
  readonly adapter?: HermesAdapter;
  readonly processBinding?: HermesRuntimeProcessBinding;
  readonly providerRuntime?: ProviderRuntime;
  readonly providerId?: string;
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
 * Default Hermes gateway — runtime planning handshake with stub fallback (Phase 43–44, 59).
 *
 * No LLM execution; delegates to {@link HermesAdapter} stub/planning path only.
 */
export class DefaultHermesGateway implements HermesGateway {
  private readonly adapter: HermesAdapter;
  private readonly runtimeWiring: HermesGatewayRuntimeWiring;
  private readonly processBinding?: HermesRuntimeProcessBinding;
  private readonly providerRuntime?: ProviderRuntime;
  private readonly providerId?: string;

  constructor(options: DefaultHermesGatewayOptions = {}) {
    this.adapter = options.adapter ?? createHermesAdapterStub();
    this.runtimeWiring = createHermesGatewayRuntimeWiring(options);
    this.processBinding = options.processBinding;
    this.providerRuntime = options.providerRuntime;
    this.providerId = options.providerId;
  }

  async execute(request: HermesGatewayRequest): Promise<HermesGatewayResponse> {
    const intentKind = request.intent?.kind ?? "chat";
    const session = createHermesRuntimeSession({
      adapter: this.adapter,
      runtimeWiring: this.runtimeWiring,
      processBinding: this.processBinding,
      providerRuntime: this.providerRuntime,
      providerId: this.providerId,
    });

    await session.initializeSession();
    const health = await session.validateRuntime();

    if (!health.valid) {
      await session.terminateSession();
      return {
        success: false,
        stub: health.stub,
        runtimeStatus: health.status,
        adapterId: this.adapter.adapterId,
        plan: emptyPlan(intentKind),
        reasoning: { summary: "", confidence: 0 },
        error: {
          code: "RUNTIME_UNAVAILABLE",
          message: health.message || "Hermes runtime unavailable",
        },
      };
    }

    const handshake = await session.generatePlan(request);
    await session.terminateSession();
    return (
      handshake.response ?? {
        success: false,
        stub: health.stub,
        runtimeStatus: health.status,
        adapterId: this.adapter.adapterId,
        plan: emptyPlan(intentKind),
        reasoning: { summary: "", confidence: 0 },
        error: handshake.error ?? {
          code: "PLANNING_FAILED",
          message: "Hermes planning handshake failed",
        },
      }
    );
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
