import { describe, expect, it } from "vitest";

import {
  createTestLiveExecutionRuntime,
  LIVE_EXECUTION_VALIDATION_COMMANDS,
} from "../index";
import { DEFAULT_API_USER_ID } from "../../task-execution";

describe("LiveExecutionRuntime", () => {
  it("startLiveExecution creates a session with provider id", async () => {
    const runtime = await createTestLiveExecutionRuntime();
    const session = runtime.startLiveExecution({ userId: DEFAULT_API_USER_ID });

    expect(session.sessionId).toContain("live-exec-");
    expect(session.userId).toBe(DEFAULT_API_USER_ID);
    expect(session.providerId).toBeTruthy();
  });

  it("executeLiveTask runs validation command through full flow", async () => {
    const runtime = await createTestLiveExecutionRuntime();
    const session = runtime.startLiveExecution({ userId: DEFAULT_API_USER_ID });

    const result = await runtime.executeLiveTask({
      sessionId: session.sessionId,
      command: LIVE_EXECUTION_VALIDATION_COMMANDS[0],
    });

    expect(result.success).toBe(true);
    expect(result.stub).toBe(true);
    expect(result.flowResult.taskIntent.kind).toBe("automate");
    expect(result.timelineEventCount).toBeGreaterThan(0);
    expect(result.workspaceResponse).toBeTruthy();
  });

  it("streamLiveUpdates receives lifecycle updates", async () => {
    const runtime = await createTestLiveExecutionRuntime();
    const session = runtime.startLiveExecution({ userId: DEFAULT_API_USER_ID });
    const updates: string[] = [];

    runtime.streamLiveUpdates(session.sessionId, {
      subscriberId: "test-sub",
      onUpdate: (update) => updates.push(update.kind),
    });

    await runtime.executeLiveTask({
      sessionId: session.sessionId,
      command: "Search gold price today",
    });

    expect(updates).toContain("provider_resolved");
    expect(updates).toContain("completed");
  });

  it("captureTelemetry records spans and stream events", async () => {
    const runtime = await createTestLiveExecutionRuntime();
    const session = runtime.startLiveExecution({ userId: DEFAULT_API_USER_ID });

    await runtime.executeLiveTask({
      sessionId: session.sessionId,
      command: "Summarize latest technology headlines",
    });

    const telemetry = runtime.captureTelemetry(session.sessionId);

    expect(telemetry.sessionId).toBe(session.sessionId);
    expect(telemetry.spans.length).toBeGreaterThan(1);
    expect(telemetry.command).toBe("Summarize latest technology headlines");
  });
});
