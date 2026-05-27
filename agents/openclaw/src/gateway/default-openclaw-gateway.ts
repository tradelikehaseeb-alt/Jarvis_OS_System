import type { OpenClawAdapter } from "../../adapter/src/openclaw-adapter";
import { createOpenClawAdapterStub } from "../../adapter/src/openclaw-adapter-stub";
import {
  createOpenClawRuntimeDiscoveryAdapter,
} from "../../adapter/official/src/openclaw-runtime-discovery-adapter";
import {
  readOpenClawRuntimeEnv,
  type EnvSource,
} from "../../adapter/official/src/openclaw-runtime-env";
import type { OpenClawGateway } from "./openclaw-gateway";
import type { OpenClawGatewayRequest } from "./openclaw-gateway-request";
import type {
  OpenClawGatewayResponse,
  OpenClawRuntimeValidation,
} from "./openclaw-gateway-response";
import type { OpenClawRuntimeStatus } from "./openclaw-runtime-status";

export interface DefaultOpenClawGatewayOptions {
  readonly adapter?: OpenClawAdapter;
  readonly env?: EnvSource;
  readonly allowNetworkProbe?: boolean;
}

function mapHealthStatus(
  status: string,
  stubMode: boolean,
): OpenClawRuntimeStatus {
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

/**
 * Default OpenClaw gateway — stub execution with runtime validation boundary (Phase 42).
 *
 * No browser/device control; delegates to {@link OpenClawAdapter} stub path only.
 */
export class DefaultOpenClawGateway implements OpenClawGateway {
  private readonly adapter: OpenClawAdapter;
  private readonly env: EnvSource;
  private readonly allowNetworkProbe: boolean;

  constructor(options: DefaultOpenClawGatewayOptions = {}) {
    this.adapter = options.adapter ?? createOpenClawAdapterStub();
    this.env = options.env ?? process.env;
    this.allowNetworkProbe = options.allowNetworkProbe ?? false;
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
    const env = readOpenClawRuntimeEnv(this.env);

    if (env.mode === "stub") {
      return {
        valid: true,
        status: "stub",
        reasons: [],
      };
    }

    const discovery = createOpenClawRuntimeDiscoveryAdapter({
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
