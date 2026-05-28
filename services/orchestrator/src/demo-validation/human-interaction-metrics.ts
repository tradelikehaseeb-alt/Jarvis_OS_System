export interface HumanInteractionSample {
  readonly command: string;
  readonly latencyMs: number;
  readonly voiceRoundtripMs?: number;
  readonly perceivedQuality: number;
  readonly success: boolean;
}

export interface HumanInteractionMetricsSnapshot {
  readonly sampleCount: number;
  readonly successRate: number;
  readonly averageLatencyMs: number;
  readonly averageVoiceRoundtripMs?: number;
  readonly averageQualityScore: number;
  readonly p95LatencyMs: number;
  readonly capturedAt: string;
}

/**
 * Aggregates human interaction quality metrics for demo readiness (Phase 96).
 */
export class HumanInteractionMetrics {
  private readonly samples: HumanInteractionSample[] = [];

  record(sample: HumanInteractionSample): void {
    this.samples.push(sample);
    if (this.samples.length > 100) {
      this.samples.shift();
    }
  }

  snapshot(): HumanInteractionMetricsSnapshot {
    if (this.samples.length === 0) {
      return {
        sampleCount: 0,
        successRate: 0,
        averageLatencyMs: 0,
        averageQualityScore: 0,
        p95LatencyMs: 0,
        capturedAt: new Date().toISOString(),
      };
    }

    const latencies = this.samples.map((sample) => sample.latencyMs).sort((a, b) => a - b);
    const voiceSamples = this.samples
      .map((sample) => sample.voiceRoundtripMs)
      .filter((value): value is number => typeof value === "number");
    const successCount = this.samples.filter((sample) => sample.success).length;
    const qualitySum = this.samples.reduce(
      (sum, sample) => sum + sample.perceivedQuality,
      0,
    );
    const p95Index = Math.min(
      latencies.length - 1,
      Math.floor(latencies.length * 0.95),
    );

    return {
      sampleCount: this.samples.length,
      successRate: successCount / this.samples.length,
      averageLatencyMs: Math.round(
        latencies.reduce((sum, value) => sum + value, 0) / latencies.length,
      ),
      averageVoiceRoundtripMs:
        voiceSamples.length > 0
          ? Math.round(
              voiceSamples.reduce((sum, value) => sum + value, 0) /
                voiceSamples.length,
            )
          : undefined,
      averageQualityScore: qualitySum / this.samples.length,
      p95LatencyMs: latencies[p95Index] ?? 0,
      capturedAt: new Date().toISOString(),
    };
  }
}

export function createDefaultHumanInteractionMetrics(): HumanInteractionMetrics {
  return new HumanInteractionMetrics();
}

export function scorePerceivedQuality(input: {
  success: boolean;
  latencyMs: number;
  voiceRoundtripMs?: number;
}): number {
  let score = input.success ? 0.75 : 0.2;
  if (input.latencyMs < 3000) {
    score += 0.15;
  } else if (input.latencyMs < 8000) {
    score += 0.08;
  }
  if (typeof input.voiceRoundtripMs === "number" && input.voiceRoundtripMs < 5000) {
    score += 0.1;
  }
  return Math.min(1, score);
}
