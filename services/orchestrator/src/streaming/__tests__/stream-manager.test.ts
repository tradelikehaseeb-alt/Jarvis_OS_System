import { describe, expect, it, vi } from "vitest";

import {
  InMemoryStreamManager,
  createDefaultStreamManager,
} from "../index";

describe("InMemoryStreamManager", () => {
  it("publishes events to subscribers", () => {
    const manager = createDefaultStreamManager();
    const listener = vi.fn();

    manager.openSession({
      streamSessionId: "stream-1",
      taskId: "task-1",
      userId: "user-1",
      sessionId: "exec-session-task-1",
    });

    manager.subscribe({ subscriberId: "sub-1", onEvent: listener });

    manager.publish({
      type: "execution_started",
      streamSessionId: "stream-1",
      sessionId: "exec-session-task-1",
      taskId: "task-1",
      userId: "user-1",
      message: "started",
    });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0]?.[0].type).toBe("execution_started");
  });

  it("unsubscribes by subscriber id", () => {
    const manager = new InMemoryStreamManager();
    const listener = vi.fn();

    manager.openSession({
      streamSessionId: "stream-2",
      taskId: "task-2",
      userId: "user-1",
      sessionId: "exec-session-task-2",
    });
    manager.subscribe({ subscriberId: "sub-2", onEvent: listener });
    manager.unsubscribe("sub-2");

    manager.publish({
      type: "planning_started",
      streamSessionId: "stream-2",
      sessionId: "exec-session-task-2",
      taskId: "task-2",
      userId: "user-1",
    });

    expect(listener).not.toHaveBeenCalled();
  });

  it("tracks active sessions and closes on terminal events", () => {
    const manager = createDefaultStreamManager();
    manager.openSession({
      streamSessionId: "stream-3",
      taskId: "task-3",
      userId: "user-1",
      sessionId: "exec-session-task-3",
    });

    expect(manager.getActiveSessions()).toHaveLength(1);

    manager.publish({
      type: "execution_completed",
      streamSessionId: "stream-3",
      sessionId: "exec-session-task-3",
      taskId: "task-3",
      userId: "user-1",
    });

    expect(manager.getActiveSessions()).toHaveLength(0);
  });
});
