import type { SpeechMetrics } from "./speech-metrics";
import type { SpeechTelemetryCollector } from "./speech-telemetry-collector";
import type { SpeechTraceEvent } from "./speech-trace-event";

/**
 * In-memory deterministic telemetry collector for speech-service (Phase 37).
 */
export class InMemorySpeechTelemetryCollector implements SpeechTelemetryCollector {
  private readonly events: SpeechTraceEvent[] = [];
  private readonly metrics: SpeechMetrics[] = [];

  recordEvent(event: SpeechTraceEvent): void {
    this.events.push(event);
  }

  recordMetric(metric: SpeechMetrics): void {
    this.metrics.push(metric);
  }

  getTraceHistory(): {
    readonly events: readonly SpeechTraceEvent[];
    readonly metrics: readonly SpeechMetrics[];
  } {
    return {
      events: [...this.events],
      metrics: [...this.metrics],
    };
  }

  clearHistory(): void {
    this.events.length = 0;
    this.metrics.length = 0;
  }
}
