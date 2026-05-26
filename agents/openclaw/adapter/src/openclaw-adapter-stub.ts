import type { OpenClawAdapter } from "./openclaw-adapter";
import {
  DEFAULT_OPENCLAW_CONFIG,
  type OpenClawConfig,
} from "./openclaw-config";
import type { OpenClawRequest } from "./openclaw-request";
import type { OpenClawResponse } from "./openclaw-response";

const DEFAULT_ACTIONS = ["browser", "file"] as const;

/**
 * Static OpenClaw adapter — mock gateway acceptance only (Phase 16).
 *
 * No browser automation, no desktop control, no external OpenClaw runtime.
 */
export class OpenClawAdapterStub implements OpenClawAdapter {
  readonly adapterId: string;

  constructor(
    private readonly defaultConfig: OpenClawConfig = DEFAULT_OPENCLAW_CONFIG,
  ) {
    this.adapterId = defaultConfig.adapterId;
  }

  async invoke(
    request: OpenClawRequest,
    config: OpenClawConfig = this.defaultConfig,
  ): Promise<OpenClawResponse> {
    if (config.mode !== "stub") {
      return {
        success: false,
        adapterId: this.adapterId,
        stub: true,
        execution: {
          status: "rejected",
          sandbox: config.sandboxRequired,
          permissionsChecked: false,
          handleId: `handle-${request.taskId}`,
        },
        approvedActions: [],
        error: {
          code: "ADAPTER_NOT_CONFIGURED",
          message: "Official OpenClaw mode is not implemented; use stub mode",
        },
      };
    }

    const actions = request.requestedActions ?? [...DEFAULT_ACTIONS];

    return {
      success: true,
      adapterId: this.adapterId,
      stub: true,
      execution: {
        status: "accepted",
        sandbox: config.sandboxRequired,
        permissionsChecked: false,
        handleId: `handle-stub-${request.taskId}`,
      },
      approvedActions: actions,
    };
  }
}

/** Factory for default stub adapter instance. */
export function createOpenClawAdapterStub(
  config: OpenClawConfig = DEFAULT_OPENCLAW_CONFIG,
): OpenClawAdapterStub {
  return new OpenClawAdapterStub(config);
}
