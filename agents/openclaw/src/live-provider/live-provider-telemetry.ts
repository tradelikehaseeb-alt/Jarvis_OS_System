import type { ProviderTelemetry } from "@jarvis/types";

import type { OpenClawExecutionHandshake } from "../runtime/openclaw-execution-handshake";
import type { OpenClawGatewayResponse } from "../gateway/openclaw-gateway-response";
import { mapOpenClawHandshakeToTelemetrySpans } from "../live-execution/live-execution-telemetry-mapper";

export interface CaptureOpenClawProviderTelemetryInput {
  readonly sessionId: string;
  readonly providerId: string;
  readonly command?: string;
  readonly taskId?: string;
  readonly handshake: OpenClawExecutionHandshake;
  readonly response?: OpenClawGatewayResponse;
  readonly streamEvents?: readonly string[];
}

/** Capture OpenClaw provider telemetry for live validation (Phase 85). */
export function captureProviderTelemetry(
  input: CaptureOpenClawProviderTelemetryInput,
): ProviderTelemetry {
  const spans = mapOpenClawHandshakeToTelemetrySpans(
    input.sessionId,
    input.handshake,
    input.response,
  );

  return {
    sessionId: input.sessionId,
    providerId: input.providerId,
    stub: Boolean(input.response?.stub ?? true),
    command: input.command,
    taskId: input.taskId,
    spans,
    streamEvents: input.streamEvents ?? ["execution_started", "execution_completed"],
    capturedAt: new Date().toISOString(),
  };
}
