export interface LongSessionSample {
  readonly timestamp: string;
  readonly latencyMs: number;
  readonly memoryDeltaKb?: number;
  readonly success: boolean;
}

export interface LongSessionStabilityReport {
  readonly sampleCount: number;
  readonly successRate: number;
  readonly averageLatencyMs: number;
  readonly maxLatencyMs: number;
  readonly stable: boolean;
  readonly message: string;
}

const STABILITY_LATENCY_BUDGET_MS = 30_000;
const MIN_SUCCESS_RATE = 0.8;

/**
 * Validates long-running session stability from sampled metrics (Phase 100).
 */
export class LongSessionStabilityValidator {
  private readonly samples: LongSessionSample[] = [];

  record(sample: Omit<LongSessionSample, "timestamp">): LongSessionSample {
    const entry: LongSessionSample = {
      ...sample,
      timestamp: new Date().toISOString(),
    };
    this.samples.push(entry);
    return entry;
  }

  evaluate(): LongSessionStabilityReport {
    if (this.samples.length === 0) {
      return {
        sampleCount: 0,
        successRate: 0,
        averageLatencyMs: 0,
        maxLatencyMs: 0,
        stable: false,
        message: "No samples recorded",
      };
    }

    const successCount = this.samples.filter((entry) => entry.success).length;
    const latencies = this.samples.map((entry) => entry.latencyMs);
    const averageLatencyMs =
      latencies.reduce((sum, value) => sum + value, 0) / latencies.length;
    const maxLatencyMs = Math.max(...latencies);
    const successRate = successCount / this.samples.length;

    const stable =
      successRate >= MIN_SUCCESS_RATE && maxLatencyMs < STABILITY_LATENCY_BUDGET_MS;

    return {
      sampleCount: this.samples.length,
      successRate,
      averageLatencyMs,
      maxLatencyMs,
      stable,
      message: stable
        ? "Long session within stability budget"
        : "Long session exceeded stability thresholds",
    };
  }

  reset(): void {
    this.samples.length = 0;
  }
}

export function createDefaultLongSessionStabilityValidator(): LongSessionStabilityValidator {
  return new LongSessionStabilityValidator();
}
