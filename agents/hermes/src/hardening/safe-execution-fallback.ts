export type SafeGatewayMode = "normal" | "degraded" | "stub";

export interface SafeGatewayDecision {
  readonly mode: SafeGatewayMode;
  readonly message: string;
  readonly retryDelayMs: number;
}

/**
 * Hermes gateway safe execution fallback helper (Phase 94).
 */
export function evaluateHermesSafeExecution(input: {
  readonly runtimeValid: boolean;
  readonly stub: boolean;
  readonly retryCount?: number;
}): SafeGatewayDecision {
  if (!input.runtimeValid) {
    return {
      mode: "stub",
      message: "Planning in safe mode",
      retryDelayMs: 0,
    };
  }
  if (input.stub) {
    return {
      mode: "degraded",
      message: "Planning with offline provider",
      retryDelayMs: 250 * (input.retryCount ?? 0),
    };
  }
  return {
    mode: "normal",
    message: "Planning normally",
    retryDelayMs: 0,
  };
}
