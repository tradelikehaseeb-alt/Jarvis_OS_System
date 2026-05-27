import type { OpenClawAdapter } from "../../adapter/src/openclaw-adapter";
import { createOpenClawAdapterStub } from "../../adapter/src/openclaw-adapter-stub";
import type { OpenClawGateway } from "./openclaw-gateway";
import type { OpenClawGatewayRequest } from "./openclaw-gateway-request";
import type { OpenClawRuntimeValidation } from "./openclaw-gateway-response";
import type { OpenClawGatewayResponse } from "./openclaw-gateway-response";
import type { OpenClawRuntimeStatus } from "./openclaw-runtime-status";
import {
  OpenClawGatewayRuntimeWiring,
  createOpenClawGatewayRuntimeWiring,
  validationFromOpenClawRuntimeHealth,
  type OpenClawGatewayRuntimeWiringOptions,
} from "./openclaw-gateway-runtime-wiring";
import { createOpenClawRuntimeSession } from "../runtime/create-openclaw-runtime-session";
import type { OpenClawRuntimeProcessBinding } from "../runtime/openclaw-runtime-process-binding";

export interface DefaultOpenClawGatewayOptions extends OpenClawGatewayRuntimeWiringOptions {
  readonly adapter?: OpenClawAdapter;
  readonly processBinding?: OpenClawRuntimeProcessBinding;
}

/**
 * Default OpenClaw gateway — runtime handshake with stub fallback (Phase 42–44, 58).
 *
 * No browser/device control; delegates to {@link OpenClawAdapter} stub path only.
 */
export class DefaultOpenClawGateway implements OpenClawGateway {
  private readonly adapter: OpenClawAdapter;
  private readonly runtimeWiring: OpenClawGatewayRuntimeWiring;
  private readonly processBinding?: OpenClawRuntimeProcessBinding;

  constructor(options: DefaultOpenClawGatewayOptions = {}) {
    this.adapter = options.adapter ?? createOpenClawAdapterStub();
    this.runtimeWiring = createOpenClawGatewayRuntimeWiring(options);
    this.processBinding = options.processBinding;
  }

  async execute(request: OpenClawGatewayRequest): Promise<OpenClawGatewayResponse> {
    const session = createOpenClawRuntimeSession({
      adapter: this.adapter,
      runtimeWiring: this.runtimeWiring,
      processBinding: this.processBinding,
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
        executionHandleId: `handle-${request.taskId}`,
        approvedActions: [],
        sandbox: true,
        permissionsChecked: false,
        error: {
          code: "RUNTIME_UNAVAILABLE",
          message: health.message || "OpenClaw runtime unavailable",
        },
      };
    }

    const handshake = await session.executeTask(request);
    await session.terminateSession();
    return (
      handshake.response ?? {
        success: false,
        stub: health.stub,
        runtimeStatus: health.status,
        adapterId: this.adapter.adapterId,
        executionHandleId: `handle-${request.taskId}`,
        approvedActions: [],
        sandbox: true,
        permissionsChecked: false,
        error: handshake.error ?? {
          code: "EXECUTION_FAILED",
          message: "OpenClaw execution handshake failed",
        },
      }
    );
  }

  async getRuntimeStatus(): Promise<OpenClawRuntimeStatus> {
    const validation = await this.validateRuntime();
    return validation.status;
  }

  async validateRuntime(): Promise<OpenClawRuntimeValidation> {
    if (this.runtimeWiring.isStubMode()) {
      return {
        valid: true,
        status: "stub",
        reasons: [],
      };
    }

    return validationFromOpenClawRuntimeHealth(await this.runtimeWiring.getRuntimeHealth());
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
