/**
 * Metric sample model used by in-memory speech telemetry (Phase 37).
 */
export interface SpeechMetrics {
  readonly metricId: string;
  readonly name: string;
  readonly value: number;
  readonly unit: "count" | "ms";
  readonly tags: Readonly<Record<string, string>>;
  readonly at: string;
}
