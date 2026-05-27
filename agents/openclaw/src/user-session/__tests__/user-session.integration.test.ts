import { describe, expect, it } from "vitest";

import { REAL_USER_SESSION_PROMPTS } from "@jarvis/types";

import { createOpenClawAdapterStub } from "../../../adapter/src/openclaw-adapter-stub";
import { DefaultOpenClawGateway } from "../../gateway/default-openclaw-gateway";
import { captureProviderTelemetry } from "../../live-provider/live-provider-telemetry";

describe("OpenClaw user session integration", () => {
  it.each(REAL_USER_SESSION_PROMPTS)(
    "executes user session prompt via gateway stub: %s",
    async (prompt) => {
      const gateway = new DefaultOpenClawGateway({
        env: { OPENCLAW_MODE: "stub" },
        adapter: createOpenClawAdapterStub(),
      });

      const response = await gateway.execute({
        requestId: `req-${prompt.slice(0, 8)}`,
        taskId: `task-${prompt.slice(0, 8)}`,
        userId: "desktop-user",
        intent: { kind: "automate", description: prompt },
        contextRef: "ctx-user-session-1",
        requestedActions: ["browser"],
      });

      expect(response.success).toBe(true);
      expect(response.stub).toBe(true);
    },
  );

  it("captures session telemetry for Dubai travel prompt", async () => {
    const gateway = new DefaultOpenClawGateway({
      env: { OPENCLAW_MODE: "stub" },
      adapter: createOpenClawAdapterStub(),
    });

    const prompt = REAL_USER_SESSION_PROMPTS[2]!;
    const response = await gateway.execute({
      requestId: "req-dubai",
      taskId: "task-dubai",
      userId: "desktop-user",
      intent: { kind: "automate", description: prompt },
      contextRef: "ctx-user-session-1",
      requestedActions: ["browser"],
    });

    const telemetry = captureProviderTelemetry({
      sessionId: "user-session-dubai",
      providerId: "groq",
      command: prompt,
      taskId: "task-dubai",
      handshake: {
        sessionId: "user-session-dubai",
        state: "completed",
        initializedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      },
      response,
    });

    expect(telemetry.spans.length).toBeGreaterThan(0);
    expect(telemetry.command).toBe(prompt);
  });
});
