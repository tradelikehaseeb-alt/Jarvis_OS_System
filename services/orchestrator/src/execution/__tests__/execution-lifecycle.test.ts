import { describe, expect, it, vi } from "vitest";

import {
  InMemoryExecutionLifecycleManager,
  createDefaultExecutionLifecycleManager,
} from "../index";

describe("ExecutionLifecycleManager", () => {
  it("starts session in queued state", () => {
    const manager = createDefaultExecutionLifecycleManager();
    const session = manager.startSession({
      taskId: "task-1",
      requestId: "req-1",
      userId: "user-1",
    });

    expect(session.state).toBe("queued");
    expect(session.events[0]?.kind).toBe("session_started");
    expect(manager.getSessionByTaskId("task-1")?.sessionId).toBe(session.sessionId);
  });

  it("transitions through planning and executing states", () => {
    const manager = new InMemoryExecutionLifecycleManager();
    const session = manager.startSession({
      taskId: "task-2",
      requestId: "req-2",
      userId: "user-1",
    });

    manager.transition(session.sessionId, "planning");
    manager.transition(session.sessionId, "executing");
    const completed = manager.transition(session.sessionId, "completed");

    expect(completed.state).toBe("completed");
    expect(completed.events.some((e) => e.kind === "session_completed")).toBe(true);
  });

  it("emits activities and streams events internally", () => {
    const manager = new InMemoryExecutionLifecycleManager();
    const session = manager.startSession({
      taskId: "task-3",
      requestId: "req-3",
      userId: "user-1",
    });

    const activities: string[] = [];
    const events: string[] = [];

    manager.subscribeActivities((activity) => {
      activities.push(activity.kind);
    });
    manager.subscribe((event) => {
      events.push(event.kind);
    });

    manager.transition(session.sessionId, "planning");
    manager.emitActivity(session.sessionId, {
      taskId: "task-3",
      source: "hermes",
      kind: "plan_generated",
      summary: "Plan ready",
    });

    expect(activities).toContain("plan_generated");
    expect(events).toContain("activity");
    expect(manager.getSession(session.sessionId)?.activities).toHaveLength(1);
  });

  it("supports failed and cancelled terminal states", () => {
    const manager = createDefaultExecutionLifecycleManager();
    const session = manager.startSession({
      taskId: "task-4",
      requestId: "req-4",
      userId: "user-1",
    });

    const failed = manager.transition(session.sessionId, "failed", "Agent error");
    expect(failed.events.some((e) => e.kind === "session_failed")).toBe(true);

    const session2 = manager.startSession({
      taskId: "task-5",
      requestId: "req-5",
      userId: "user-1",
    });
    const cancelled = manager.transition(session2.sessionId, "cancelled");
    expect(cancelled.events.some((e) => e.kind === "session_cancelled")).toBe(
      true,
    );
  });

  it("throws when session is missing", () => {
    const manager = createDefaultExecutionLifecycleManager();
    expect(() => manager.transition("missing", "planning")).toThrow(
      /not found/,
    );
  });

  it("unsubscribes activity listeners", () => {
    const manager = new InMemoryExecutionLifecycleManager();
    const session = manager.startSession({
      taskId: "task-6",
      requestId: "req-6",
      userId: "user-1",
    });
    const listener = vi.fn();
    const unsubscribe = manager.subscribeActivities(listener);
    unsubscribe();

    manager.emitActivity(session.sessionId, {
      taskId: "task-6",
      source: "openclaw",
      kind: "execution_started",
      summary: "start",
    });

    expect(listener).not.toHaveBeenCalled();
  });
});
