import type { HermesStructuredPlan } from "../../adapter/src/hermes-response";
import type { HermesRuntimeStatus } from "./hermes-runtime-status";

/**
 * Gateway execution response — Hermes runtime → agent boundary (Phase 43).
 */
export interface HermesGatewayResponse {
  readonly success: boolean;
  readonly stub: boolean;
  readonly runtimeStatus: HermesRuntimeStatus;
  readonly adapterId: string;
  readonly plan: HermesStructuredPlan & {
    readonly intentKind: string;
    readonly summary: string;
    readonly executionMode?: "fast" | "skills";
  };
  readonly reasoning: {
    readonly summary: string;
    readonly confidence: number;
  };
  readonly error?: {
    readonly code: string;
    readonly message: string;
  };
}

/** Result of {@link HermesGateway.validateRuntime}. */
export interface HermesRuntimeValidation {
  readonly valid: boolean;
  readonly status: HermesRuntimeStatus;
  readonly reasons: readonly string[];
}
