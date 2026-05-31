import { describe, expect, it } from "vitest";

import { REAL_USER_SESSION_PROMPTS } from "@jarvis/types";

import { DEFAULT_CONNECTOR_CONFIGURATIONS } from "../../llm-provider";
import { DEFAULT_API_USER_ID } from "../../task-execution";
import { createTestJarvisUserSessionRuntime } from "../../index";

describe("Jarvis user session", () => {
  it("configures all seven providers on session start", async () => {
    const runtime = await createTestJarvisUserSessionRuntime();
    const session = await runtime.startUserSession({
      userId: DEFAULT_API_USER_ID,
    });

    expect(session.state).toBe("active");
    expect(session.providerHealth).toHaveLength(DEFAULT_CONNECTOR_CONFIGURATIONS.length);
  });

  it("captures telemetry after prompt execution", async () => {
    const runtime = await createTestJarvisUserSessionRuntime();
    await runtime.startUserSession({ userId: DEFAULT_API_USER_ID });

    await runtime.executeUserPrompt({
      prompt: REAL_USER_SESSION_PROMPTS[0]!,
      userId: DEFAULT_API_USER_ID,
    });

    expect(runtime.captureSessionTelemetry().length).toBe(1);
  });
});

describe("Jarvis user session integration", () => {
  it(
    "runs full real user session with validation checklist",
    async () => {
    const runtime = await createTestJarvisUserSessionRuntime();
    const report = await runtime.runUserSession({
      userId: DEFAULT_API_USER_ID,
    });

    expect(report.allProvidersConfigured).toBe(true);
    expect(report.promptResults).toHaveLength(REAL_USER_SESSION_PROMPTS.length);
    expect(report.telemetry.length).toBe(REAL_USER_SESSION_PROMPTS.length);
    expect(report.session.state).toBe("completed");

    for (const result of report.promptResults) {
      expect(result.success).toBe(true);
      expect(result.providerResponseReceived).toBe(true);
      expect(result.hermesPlanCreated).toBe(true);
      expect(result.openClawTriggered).toBe(true);
      expect(result.timelineUpdated).toBe(true);
      expect(result.workspaceHistoryUpdated).toBe(true);
      expect(result.activityStreamUpdated).toBe(true);
      expect(result.memoryPersisted).toBe(true);
      expect(result.telemetryCaptured).toBe(true);
      expect(result.stub).toBe(true);
    }
  },
    60_000,
  );

  it.each(REAL_USER_SESSION_PROMPTS)(
    "executes user session prompt with stub fallback: %s",
    async (prompt) => {
      const runtime = await createTestJarvisUserSessionRuntime();
      await runtime.startUserSession({ userId: DEFAULT_API_USER_ID });

      const result = await runtime.executeUserPrompt({
        prompt,
        userId: DEFAULT_API_USER_ID,
      });

      expect(result.success).toBe(true);
      expect(result.hermesPlanCreated).toBe(true);
      expect(result.openClawTriggered).toBe(true);
    },
  );
});
