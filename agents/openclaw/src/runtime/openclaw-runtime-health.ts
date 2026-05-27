import type { OpenClawRuntimeStatus } from "../gateway/openclaw-runtime-status";

/**
 * OpenClaw runtime health snapshot for handshake validation (Phase 58).
 */
export interface OpenClawRuntimeHealth {
  readonly status: OpenClawRuntimeStatus;
  readonly valid: boolean;
  readonly stub: boolean;
  readonly available: boolean;
  readonly message: string;
  readonly endpoint?: string;
  readonly checkedAt: string;
  readonly processState?: string;
}
