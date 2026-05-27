import { describe, expect, it } from "vitest";

import {
  createDefaultActivityRuntime,
  createDefaultExecutionLifecycleManager,
  createDefaultStreamManager,
} from "../../index";

describe("ActivityStreamRuntime", () => {
  it("collects lifecycle stream events for a session", () => {
    const stream = createDefaultStreamManager();
    const lifecycle = createDefaultExecutionLifecycleManager();
    const runtime = createDefaultActivityRuntime({ streamManager: stream });

    const session = lifecycle.startSession({
      taskId: "task-activity-1",
      requestId: "req-activity-1",
      userId: "user-1",
    });

    const detach = runtime.startStream({
      streamSessionId: "stream-activity-1",
      sessionId: session.sessionId,
      taskId: "task-activity-1",
      userId: "user-1",
      conversationId: "conv-1",
      lifecycle,
    });

    lifecycle.transition(session.sessionId, "planning", "Planning");
    lifecycle.emitActivity(session.sessionId, {
      taskId: "task-activity-1",
      kind: "planning_completed",
      summary: "Plan ready",
      source: "hermes",
    });

    const collected = runtime.getEvents("stream-activity-1");
    expect(collected.some((event) => event.type === "execution_started")).toBe(
      true,
    );
    expect(collected.some((event) => event.type === "planning_started")).toBe(
      true,
    );
    expect(collected.some((event) => event.type === "planning_completed")).toBe(
      true,
    );
    expect(
      collected.find((event) => event.type === "planning_completed")?.source,
    ).toBe("hermes");

    detach();
    runtime.stopStream("stream-activity-1");
  });

  it("supports subscribe and unsubscribe", () => {
    const stream = createDefaultStreamManager();
    const lifecycle = createDefaultExecutionLifecycleManager();
    const runtime = createDefaultActivityRuntime({ streamManager: stream });
    const received: string[] = [];

    runtime.subscribe({
      subscriberId: "sub-1",
      onEvent: (event) => received.push(event.type),
    });

    const session = lifecycle.startSession({
      taskId: "task-activity-2",
      requestId: "req-activity-2",
      userId: "user-1",
    });

    runtime.startStream({
      streamSessionId: "stream-activity-2",
      sessionId: session.sessionId,
      taskId: "task-activity-2",
      userId: "user-1",
      conversationId: "conv-2",
      lifecycle,
    });

    lifecycle.transition(session.sessionId, "executing", "Executing");

    expect(received).toContain("execution_started");

    runtime.unsubscribe("sub-1");
    lifecycle.emitActivity(session.sessionId, {
      taskId: "task-activity-2",
      kind: "execution_completed",
      summary: "Done",
      source: "openclaw",
    });

    expect(received).not.toContain("execution_completed");

    runtime.stopStream("stream-activity-2");
  });
});
