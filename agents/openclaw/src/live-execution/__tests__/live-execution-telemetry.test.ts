import { describe, expect, it } from "vitest";

import { createOpenClawAdapterStub } from "../../../adapter/src/openclaw-adapter-stub";
import { DefaultOpenClawGateway } from "../../gateway/default-openclaw-gateway";
import { mapOpenClawHandshakeToTelemetrySpans } from "../live-execution-telemetry-mapper";

describe("OpenClaw live execution telemetry", () => {
  it("maps gateway handshake to telemetry spans", async () => {
    const gateway = new DefaultOpenClawGateway({
      env: { OPENCLAW_MODE: "stub" },
      adapter: createOpenClawAdapterStub(),
    });

    const response = await gateway.execute({
      requestId: "req-live-1",
      taskId: "task-live-1",
      userId: "user-live-1",
      intent: { kind: "automate", description: "Open Google and search AI news" },
      contextRef: "ctx-live-1",
      requestedActions: ["browser"],
    });

    const spans = mapOpenClawHandshakeToTelemetrySpans(
      "live-exec-1",
      {
        sessionId: "openclaw-session-1",
        state: "completed",
        completedAt: new Date().toISOString(),
      },
      response,
    );

    expect(spans).toHaveLength(2);
    expect(spans[1]?.attributes?.success).toBe(true);
  });
});
