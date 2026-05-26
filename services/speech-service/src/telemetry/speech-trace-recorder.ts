import type { SpeechMetrics } from "./speech-metrics";
import type { SpeechTelemetryCollector } from "./speech-telemetry-collector";
import type { SpeechTraceContext } from "./speech-trace-context";
import type { SpeechTraceEvent } from "./speech-trace-event";
import type { SpeechTraceLevel } from "./speech-trace-level";

const FIXED_TIMESTAMP = new Date(0).toISOString();

/**
 * Helper recorder that produces deterministic IDs/timestamps for traces and metrics.
 */
export class SpeechTraceRecorder {
  private traceSequence = 0;
  private metricSequence = 0;

  constructor(private readonly collector: SpeechTelemetryCollector) {}

  recordEvent(
    level: SpeechTraceLevel,
    message: string,
    context: SpeechTraceContext,
  ): SpeechTraceEvent {
    const event: SpeechTraceEvent = {
      traceId: `speech-trace-${++this.traceSequence}`,
      level,
      message,
      context,
      at: FIXED_TIMESTAMP,
    };
    this.collector.recordEvent(event);
    return event;
  }

  recordMetric(
    name: string,
    value: number,
    unit: SpeechMetrics["unit"],
    tags: Readonly<Record<string, string>> = {},
  ): SpeechMetrics {
    const metric: SpeechMetrics = {
      metricId: `speech-metric-${++this.metricSequence}`,
      name,
      value,
      unit,
      tags,
      at: FIXED_TIMESTAMP,
    };
    this.collector.recordMetric(metric);
    return metric;
  }
}
