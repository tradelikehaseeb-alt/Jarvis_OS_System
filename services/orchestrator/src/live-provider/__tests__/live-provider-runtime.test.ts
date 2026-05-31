import { describe, expect, it, vi } from "vitest";

import { REAL_PROVIDER_VALIDATION_COMMANDS } from "@jarvis/types";

import { DEFAULT_CONNECTOR_CONFIGURATIONS } from "../../llm-provider";
import { DEFAULT_API_USER_ID } from "../../task-execution";
import { createTestLiveProviderRuntime } from "../../index";

describe("live provider runtime", () => {
  it("returns stub health when provider key is missing", async () => {
    const runtime = await createTestLiveProviderRuntime();
    const health = await runtime.validateProviderConnection(
      "openai",
      DEFAULT_API_USER_ID,
    );

    expect(health.stub).toBe(true);
    expect(health.connectionStatus).toBe("stub");
    expect(health.failureHandled).toBe(true);
  });

  it("handles connection probe failures without throwing", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new Error("network down"));

    try {
      const runtime = await createTestLiveProviderRuntime();
      const health = await runtime.validateProviderConnection(
        "groq",
        DEFAULT_API_USER_ID,
      );

      expect(health.failureHandled).toBe(true);
      expect(health.connected).toBe(false);
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("captures provider telemetry from live session", async () => {
    const runtime = await createTestLiveProviderRuntime();
    const result = await runtime.executeLivePrompt({
      prompt: REAL_PROVIDER_VALIDATION_COMMANDS[0]!,
      userId: DEFAULT_API_USER_ID,
    });

    const telemetry = runtime.captureProviderTelemetry(result.liveResult.session.sessionId);
    expect(telemetry.sessionId).toBe(result.liveResult.session.sessionId);
    expect(telemetry.providerId).toBeTruthy();
    expect(telemetry.capturedAt.length).toBeGreaterThan(0);
    expect(result.telemetry.sessionId).toBe(telemetry.sessionId);
  });
});

describe("live provider validation integration", () => {
  it("validates all seven providers and three real scenarios", async () => {
    const runtime = await createTestLiveProviderRuntime();
    const report = await runtime.runValidationScenarios({
      userId: DEFAULT_API_USER_ID,
    });

    expect(report.allProvidersRegistered).toBe(true);
    expect(report.providerCount).toBe(7);
    expect(report.providerHealth).toHaveLength(DEFAULT_CONNECTOR_CONFIGURATIONS.length);
    expect(report.promptResults).toHaveLength(REAL_PROVIDER_VALIDATION_COMMANDS.length);

    for (const result of report.promptResults) {
      expect(result.success).toBe(true);
      expect(result.providerResponseReceived).toBe(true);
      expect(result.hermesPlanCreated).toBe(true);
      expect(result.openClawTriggered).toBe(true);
      expect(result.timelineUpdated).toBe(true);
      expect(result.workspaceUpdated).toBe(true);
      expect(result.telemetryCaptured).toBe(true);
      expect(result.stub).toBe(true);
    }
  });

  it.each(REAL_PROVIDER_VALIDATION_COMMANDS)(
    "executes live prompt with stub fallback: %s",
    async (prompt) => {
      const runtime = await createTestLiveProviderRuntime();
      const result = await runtime.executeLivePrompt({
        prompt,
        userId: DEFAULT_API_USER_ID,
      });

      expect(result.success).toBe(true);
      expect(result.hermesPlanCreated).toBe(true);
      expect(result.openClawTriggered).toBe(true);
    },
  );
});
