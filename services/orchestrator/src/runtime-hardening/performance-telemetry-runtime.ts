export interface PerformanceSample {
  readonly name: string;
  readonly durationMs: number;
  readonly timestamp: string;
  readonly tags?: Readonly<Record<string, string>>;
}

export interface PerformanceTelemetrySnapshot {
  readonly samples: readonly PerformanceSample[];
  readonly averageMs: number;
  readonly p95Ms: number;
  readonly capturedAt: string;
}

/**
 * In-memory performance telemetry aggregator (Phase 94).
 */
export class PerformanceTelemetryRuntime {
  private readonly samples: PerformanceSample[] = [];
  private readonly maxSamples: number;

  constructor(maxSamples = 200) {
    this.maxSamples = maxSamples;
  }

  record(name: string, durationMs: number, tags?: Readonly<Record<string, string>>): void {
    this.samples.push({
      name,
      durationMs,
      timestamp: new Date().toISOString(),
      tags,
    });
    if (this.samples.length > this.maxSamples) {
      this.samples.splice(0, this.samples.length - this.maxSamples);
    }
  }

  async measure<T>(
    name: string,
    operation: () => Promise<T>,
    tags?: Readonly<Record<string, string>>,
  ): Promise<T> {
    const started = performance.now();
    try {
      return await operation();
    } finally {
      this.record(name, performance.now() - started, tags);
    }
  }

  snapshot(filterName?: string): PerformanceTelemetrySnapshot {
    const filtered = filterName
      ? this.samples.filter((sample) => sample.name === filterName)
      : this.samples;
    const durations = filtered.map((sample) => sample.durationMs).sort((a, b) => a - b);
    const averageMs =
      durations.length > 0
        ? durations.reduce((sum, value) => sum + value, 0) / durations.length
        : 0;
    const p95Index = Math.max(0, Math.ceil(durations.length * 0.95) - 1);

    return {
      samples: filtered,
      averageMs,
      p95Ms: durations[p95Index] ?? 0,
      capturedAt: new Date().toISOString(),
    };
  }

  clear(): void {
    this.samples.length = 0;
  }
}
