export type ExecutionFallbackMode = "normal" | "degraded" | "stub" | "offline";

export interface SafeExecutionDecision {
  readonly mode: ExecutionFallbackMode;
  readonly providerId?: string;
  readonly retryCount: number;
  readonly message: string;
  readonly stalled: boolean;
}

export interface SafeExecutionFallbackInput {
  readonly providerId?: string;
  readonly providerHealthy: boolean;
  readonly offline: boolean;
  readonly retryCount?: number;
  readonly lastProgressAt?: string;
  readonly nowMs?: number;
}

const STALL_THRESHOLD_MS = 45_000;
const MAX_RETRIES = 2;

function isStalled(lastProgressAt: string | undefined, nowMs: number): boolean {
  if (!lastProgressAt) {
    return false;
  }
  const progressMs = Date.parse(lastProgressAt);
  if (Number.isNaN(progressMs)) {
    return false;
  }
  return nowMs - progressMs > STALL_THRESHOLD_MS;
}

/**
 * Chooses safe execution path with retry/backoff semantics (Phase 94).
 */
export class SafeExecutionFallbackRuntime {
  computeDecision(input: SafeExecutionFallbackInput): SafeExecutionDecision {
    const nowMs = input.nowMs ?? Date.now();
    const retryCount = input.retryCount ?? 0;
    const stalled = isStalled(input.lastProgressAt, nowMs);

    if (input.offline) {
      return {
        mode: "offline",
        providerId: input.providerId,
        retryCount,
        stalled,
        message: "Working offline with cached responses",
      };
    }

    if (stalled && retryCount < MAX_RETRIES) {
      return {
        mode: "degraded",
        providerId: input.providerId,
        retryCount: retryCount + 1,
        stalled: true,
        message: "Recovering stalled execution",
      };
    }

    if (!input.providerHealthy) {
      return {
        mode: "stub",
        providerId: input.providerId,
        retryCount,
        stalled,
        message: "Running in safe mode",
      };
    }

    if (retryCount > 0) {
      return {
        mode: "degraded",
        providerId: input.providerId,
        retryCount,
        stalled,
        message: "Continuing with reduced latency mode",
      };
    }

    return {
      mode: "normal",
      providerId: input.providerId,
      retryCount,
      stalled,
      message: "Running normally",
    };
  }

  backoffDelayMs(retryCount: number): number {
    return Math.min(2_000, 250 * 2 ** Math.max(0, retryCount));
  }
}
