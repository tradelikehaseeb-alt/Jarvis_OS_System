import type { LiveExecutionTelemetrySpan } from "@jarvis/types";

export type { LiveExecutionTelemetrySpan };

/** Aggregated telemetry for a live execution session (Phase 84). */
export interface LiveExecutionTelemetry {
  readonly sessionId: string;
  readonly providerId: string;
  readonly stub: boolean;
  readonly spans: readonly LiveExecutionTelemetrySpan[];
  readonly streamEvents: readonly string[];
  readonly command?: string;
  readonly taskId?: string;
}
