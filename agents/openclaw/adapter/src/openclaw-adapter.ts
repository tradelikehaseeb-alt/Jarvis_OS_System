import type { OpenClawConfig } from "./openclaw-config";
import type { OpenClawRequest } from "./openclaw-request";
import type { OpenClawResponse } from "./openclaw-response";

/**
 * Boundary for official OpenClaw gateway integration (Phase 16).
 *
 * UI and api-gateway must never call this adapter — only agents via orchestrator.
 */
export interface OpenClawAdapter {
  readonly adapterId: string;

  /**
   * Validate and accept execution intent (stub returns static acceptance).
   * Real browser/desktop automation stays behind skills + future official gateway.
   */
  invoke(
    request: OpenClawRequest,
    config?: OpenClawConfig,
  ): Promise<OpenClawResponse>;
}
