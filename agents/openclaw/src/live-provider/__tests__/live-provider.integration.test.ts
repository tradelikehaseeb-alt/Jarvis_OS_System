import { describe, expect, it } from "vitest";

import { REAL_PROVIDER_VALIDATION_COMMANDS } from "@jarvis/types";

import { createOpenClawAdapterStub } from "../../../adapter/src/openclaw-adapter-stub";
import { DefaultOpenClawGateway } from "../../gateway/default-openclaw-gateway";
import { captureProviderTelemetry } from "../live-provider-telemetry";

describe("OpenClaw live provider integration", () => {
  it.each(REAL_PROVIDER_VALIDATION_COMMANDS)(
    "executes real provider prompt via gateway stub: %s",
    async (prompt) => {
      const gateway = new DefaultOpenClawGateway({
        env: { OPENCLAW_MODE: "stub" },
        adapter: createOpenClawAdapterStub(),
      });

      const response = await gateway.execute({
        requestId: `req-${prompt.slice(0, 8)}`,
        taskId: `task-${prompt.slice(0, 8)}`,
        userId: "user-live-provider-1",
        intent: { kind: "automate", description: prompt },
        contextRef: "ctx-live-provider-1",
        requestedActions: ["browser"],
      });

      expect(response.success).toBe(true);
      expect(response.stub).toBe(true);
    },
  );

  it("captures provider telemetry from gateway response", async () => {
    const gateway = new DefaultOpenClawGateway({
      env: { OPENCLAW_MODE: "stub" },
      adapter: createOpenClawAdapterStub(),
    });

    const response = await gateway.execute({
      requestId: "req-telemetry",
      taskId: "task-telemetry",
      userId: "user-live-provider-1",
      intent: { kind: "automate", description: REAL_PROVIDER_VALIDATION_COMMANDS[0]! },
      contextRef: "ctx-live-provider-1",
      requestedActions: ["browser"],
    });

    const telemetry = captureProviderTelemetry({
      sessionId: "session-telemetry",
      providerId: "groq",
      command: REAL_PROVIDER_VALIDATION_COMMANDS[0],
      taskId: "task-telemetry",
      handshake: {
        sessionId: "session-telemetry",
        state: "completed",
        initializedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      },
      response,
    });

    expect(telemetry.spans.length).toBeGreaterThan(0);
    expect(telemetry.streamEvents.length).toBeGreaterThan(0);
    expect(telemetry.stub).toBe(true);
  });
});
