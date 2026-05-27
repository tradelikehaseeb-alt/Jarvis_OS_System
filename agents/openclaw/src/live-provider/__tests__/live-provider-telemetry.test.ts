import { describe, expect, it } from "vitest";

import { captureProviderTelemetry } from "../live-provider-telemetry";

describe("OpenClaw provider telemetry", () => {
  it("maps handshake spans into provider telemetry", () => {
    const telemetry = captureProviderTelemetry({
      sessionId: "session-1",
      providerId: "openai",
      command: "What is the gold price today?",
      handshake: {
        sessionId: "session-1",
        state: "completed",
        initializedAt: "2026-05-27T12:00:00.000Z",
        completedAt: "2026-05-27T12:00:01.000Z",
      },
      response: {
        success: true,
        stub: true,
        runtimeStatus: "ready",
        adapterId: "openclaw-stub",
        executionHandleId: "handle-1",
        approvedActions: ["browser"],
        sandbox: true,
        permissionsChecked: true,
      },
    });

    expect(telemetry.providerId).toBe("openai");
    expect(telemetry.spans).toHaveLength(2);
    expect(telemetry.capturedAt.length).toBeGreaterThan(0);
  });
});
