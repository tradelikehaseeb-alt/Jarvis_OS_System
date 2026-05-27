import type { ProviderTelemetry } from "@jarvis/types";

import type { LiveExecutionTelemetry } from "../live-execution/live-execution-telemetry";

function nowIso(): string {
  return new Date().toISOString();
}

/** Map live execution telemetry to provider telemetry (Phase 85). */
export function toProviderTelemetry(
  telemetry: LiveExecutionTelemetry,
): ProviderTelemetry {
  return {
    sessionId: telemetry.sessionId,
    providerId: telemetry.providerId,
    stub: telemetry.stub,
    command: telemetry.command,
    taskId: telemetry.taskId,
    spans: telemetry.spans,
    streamEvents: telemetry.streamEvents,
    capturedAt: nowIso(),
  };
}
