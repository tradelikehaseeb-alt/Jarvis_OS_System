import type { OpenClawRuntimeStatus } from "./openclaw-runtime-status";

/**
 * Gateway execution response — OpenClaw runtime → agent boundary (Phase 42).
 */
export interface OpenClawGatewayResponse {
  readonly success: boolean;
  readonly stub: boolean;
  readonly runtimeStatus: OpenClawRuntimeStatus;
  readonly adapterId: string;
  readonly executionHandleId: string;
  readonly approvedActions: readonly string[];
  readonly sandbox: boolean;
  readonly permissionsChecked: boolean;
  readonly error?: {
    readonly code: string;
    readonly message: string;
  };
}

export interface OpenClawRuntimeValidation {
  readonly valid: boolean;
  readonly status: OpenClawRuntimeStatus;
  readonly reasons: readonly string[];
}
