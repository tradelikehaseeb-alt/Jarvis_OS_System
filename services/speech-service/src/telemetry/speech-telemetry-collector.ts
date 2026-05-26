import type { SpeechMetrics } from "./speech-metrics";
import type { SpeechTraceEvent } from "./speech-trace-event";

/**
 * Collector contract for deterministic in-memory speech telemetry (Phase 37).
 */
export interface SpeechTelemetryCollector {
  recordEvent(event: SpeechTraceEvent): void;
  recordMetric(metric: SpeechMetrics): void;
  getTraceHistory(): {
    readonly events: readonly SpeechTraceEvent[];
    readonly metrics: readonly SpeechMetrics[];
  };
  clearHistory(): void;
}
