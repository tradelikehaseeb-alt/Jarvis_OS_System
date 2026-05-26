import type { HermesConfig } from "./hermes-config";
import type { HermesRequest } from "./hermes-request";
import type { HermesResponse } from "./hermes-response";

/**
 * Boundary for official Hermes integration (Phase 16).
 *
 * Jarvis agents depend on this interface — not on external Hermes SDKs.
 * Swap {@link HermesAdapterStub} for an official adapter without changing orchestrator code.
 */
export interface HermesAdapter {
  readonly adapterId: string;

  /**
   * Run planning/reasoning for the given request.
   * Stub implementations return static data only.
   */
  invoke(
    request: HermesRequest,
    config?: HermesConfig,
  ): Promise<HermesResponse>;
}
