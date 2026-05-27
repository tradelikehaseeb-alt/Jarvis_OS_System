import { describe, expect, it, vi } from "vitest";
import {
  createDefaultRuntimeProcessManager,
} from "@jarvis/runtime-process";

import { createDefaultActivityRuntime } from "../../activity";
import { createDefaultStreamManager } from "../../streaming";
import { createDefaultRuntimeStartupManager } from "../../runtime-startup/create-default-runtime-startup-manager";
import { aggregateRuntimeHealth } from "../aggregate-runtime-health";
import { createDefaultRuntimeHealthRuntime } from "../create-default-runtime-health-runtime";

describe("RuntimeHealthRuntime", () => {
  it("aggregateRuntimeHealth reports Hermes, OpenClaw, Speech, and Memory", () => {
    const manager = createDefaultRuntimeProcessManager();
    const startup = createDefaultRuntimeStartupManager({ processManager: manager });

    const runtime = createDefaultRuntimeHealthRuntime({
      processManager: manager,
      startupManager: startup,
      getMemoryHealth: () => ({ healthy: true, message: "Local memory ready" }),
      getSpeechHealth: () => ({ healthy: true, message: "Speech ready" }),
    });

    const health = runtime.aggregateRuntimeHealth();
    const ids = health.components.map((component) => component.componentId);

    expect(ids).toContain("hermes");
    expect(ids).toContain("openclaw");
    expect(ids).toContain("speech");
    expect(ids).toContain("memory");
    expect(health.totalCount).toBe(6);
  });

  it("getStartupProgress reflects startup manager phase", async () => {
    const manager = createDefaultRuntimeProcessManager();
    const startup = createDefaultRuntimeStartupManager({ processManager: manager });
    const runtime = createDefaultRuntimeHealthRuntime({
      processManager: manager,
      startupManager: startup,
    });

    await startup.initializeRuntime();
    const progress = runtime.getStartupProgress();

    expect(progress.ready).toBe(true);
    expect(progress.percent).toBe(100);
    expect(progress.phase).toBe("ready");
  });

  it("subscribeRuntimeHealth receives refresh events", async () => {
    const runtime = createDefaultRuntimeHealthRuntime({
      getMemoryHealth: () => ({ healthy: true }),
      getSpeechHealth: () => ({ healthy: true }),
    });
    const onEvent = vi.fn();

    runtime.subscribeRuntimeHealth({ subscriberId: "test", onEvent });
    await runtime.refresh();

    expect(onEvent).toHaveBeenCalled();
    expect(runtime.getEvents().some((event) => event.kind === "health_checked")).toBe(
      true,
    );
  });

  it("forwards activity stream events to health subscribers", () => {
    const streamManager = createDefaultStreamManager();
    const activityRuntime = createDefaultActivityRuntime({ streamManager });
    const runtime = createDefaultRuntimeHealthRuntime({ activityRuntime });
    const onEvent = vi.fn();

    runtime.subscribeRuntimeHealth({ subscriberId: "activity", onEvent });

    streamManager.publish({
      streamSessionId: "sess-1",
      sessionId: "sess-1",
      taskId: "task-1",
      userId: "user-1",
      type: "planning_started",
      message: "Hermes planning",
      payload: { source: "hermes" },
    });

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "activity",
        componentId: "hermes",
      }),
    );
  });
});

describe("aggregateRuntimeHealth", () => {
  it("marks degraded when speech probe fails", () => {
    const health = aggregateRuntimeHealth({
      speechHealthy: false,
      speechMessage: "Speech offline",
      memoryHealthy: true,
    });

    const speech = health.components.find((component) => component.componentId === "speech");
    expect(speech?.healthy).toBe(false);
    expect(health.status).toBe("degraded");
  });
});
