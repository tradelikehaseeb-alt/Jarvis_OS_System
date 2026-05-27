import type { LiveExecutionTelemetrySpan } from "../live-execution/live-execution-telemetry-span";

/** Provider-scoped telemetry captured during live validation (Phase 85). */
export interface ProviderTelemetry {
  readonly sessionId: string;
  readonly providerId: string;
  readonly stub: boolean;
  readonly command?: string;
  readonly taskId?: string;
  readonly spans: readonly LiveExecutionTelemetrySpan[];
  readonly streamEvents: readonly string[];
  readonly capturedAt: string;
}
