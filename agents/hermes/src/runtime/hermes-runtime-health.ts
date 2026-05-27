import type { HermesRuntimeStatus } from "../gateway/hermes-runtime-status";

/**
 * Hermes runtime health snapshot for planning handshake validation (Phase 59).
 */
export interface HermesRuntimeHealth {
  readonly status: HermesRuntimeStatus;
  readonly valid: boolean;
  readonly stub: boolean;
  readonly available: boolean;
  readonly message: string;
  readonly endpoint?: string;
  readonly checkedAt: string;
  readonly processState?: string;
}
