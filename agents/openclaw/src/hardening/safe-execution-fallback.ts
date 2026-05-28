export type SafeGatewayMode = "normal" | "degraded" | "stub";

export interface SafeGatewayDecision {
  readonly mode: SafeGatewayMode;
  readonly message: string;
  readonly retryDelayMs: number;
}

/**
 * OpenClaw gateway safe execution fallback helper (Phase 94).
 */
export function evaluateOpenClawSafeExecution(input: {
  readonly runtimeValid: boolean;
  readonly stub: boolean;
  readonly retryCount?: number;
}): SafeGatewayDecision {
  if (!input.runtimeValid) {
    return {
      mode: "stub",
      message: "Executing in safe mode",
      retryDelayMs: 0,
    };
  }
  if (input.stub) {
    return {
      mode: "degraded",
      message: "Executing with sandbox fallback",
      retryDelayMs: 300 * (input.retryCount ?? 0),
    };
  }
  return {
    mode: "normal",
    message: "Executing normally",
    retryDelayMs: 0,
  };
}
