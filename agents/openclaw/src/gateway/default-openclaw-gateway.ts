import type { OpenClawAdapter } from "../../adapter/src/openclaw-adapter";
import { createOpenClawAdapterStub } from "../../adapter/src/openclaw-adapter-stub";
import type { OpenClawGateway } from "./openclaw-gateway";
import type { OpenClawGatewayRequest } from "./openclaw-gateway-request";
import type { OpenClawRuntimeValidation } from "./openclaw-gateway-response";
import type { OpenClawGatewayResponse } from "./openclaw-gateway-response";
import type { OpenClawRuntimeStatus } from "./openclaw-runtime-status";
import {
  createOpenClawGatewayRuntimeWiring,
  validationFromOpenClawRuntimeHealth,
  type OpenClawGatewayRuntimeWiringOptions,
} from "./openclaw-gateway-runtime-wiring";

export interface DefaultOpenClawGatewayOptions extends OpenClawGatewayRuntimeWiringOptions {
  readonly adapter?: OpenClawAdapter;
}

/**
 * Default OpenClaw gateway — stub execution with runtime validation boundary (Phase 42–44).
 *
 * No browser/device control; delegates to {@link OpenClawAdapter} stub path only.
 */
export class DefaultOpenClawGateway implements OpenClawGateway {
  private readonly adapter: OpenClawAdapter;
  private readonly runtimeWiring: ReturnType<typeof createOpenClawGatewayRuntimeWiring>;

  constructor(options: DefaultOpenClawGatewayOptions = {}) {
    this.adapter = options.adapter ?? createOpenClawAdapterStub();
    this.runtimeWiring = createOpenClawGatewayRuntimeWiring(options);
  }

  async execute(request: OpenClawGatewayRequest): Promise<OpenClawGatewayResponse> {
    const validation = await this.validateRuntime();
    const runtimeStatus = validation.status;

    if (!validation.valid) {
      return {
        success: false,
        stub: true,
        runtimeStatus,
        adapterId: this.adapter.adapterId,
        executionHandleId: `handle-${request.taskId}`,
        approvedActions: [],
        sandbox: true,
        permissionsChecked: false,
        error: {
          code: "RUNTIME_UNAVAILABLE",
          message: validation.reasons.join("; ") || "OpenClaw runtime unavailable",
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
      requestedActions: request.requestedActions,
    });

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
