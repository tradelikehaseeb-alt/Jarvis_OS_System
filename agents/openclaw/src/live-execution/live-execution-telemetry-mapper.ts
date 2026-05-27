import type { OpenClawExecutionHandshake } from "../runtime/openclaw-execution-handshake";
import type { OpenClawGatewayResponse } from "../gateway/openclaw-gateway-response";
import type { LiveExecutionTelemetrySpan } from "@jarvis/types";

/** Map OpenClaw handshake to live execution telemetry spans (Phase 84). */
export function mapOpenClawHandshakeToTelemetrySpans(
  sessionId: string,
  handshake: OpenClawExecutionHandshake,
  response?: OpenClawGatewayResponse,
): readonly LiveExecutionTelemetrySpan[] {
  const startedAt = handshake.initializedAt ?? new Date().toISOString();

  return [
    {
      spanId: `${sessionId}-openclaw-init`,
      name: "openclaw.session_initialized",
      startedAt,
      attributes: {
        state: handshake.state,
        sessionId: handshake.sessionId,
      },
    },
    {
      spanId: `${sessionId}-openclaw-exec`,
      name: "openclaw.task_executed",
      startedAt,
      endedAt: handshake.completedAt ?? startedAt,
      attributes: {
        success: response?.success,
        stub: response?.stub,
        executionHandleId: response?.executionHandleId,
      },
    },
  ];
}
