import { describe, expect, it } from "vitest";

import {
  createDefaultBackgroundTaskSupervisor,
  createDefaultContinuousJarvisRuntime,
  createDefaultProactiveWorkflowEngine,
  createDefaultSmartNotificationRuntime,
  createDefaultPersistentSessionManager,
} from "../index";

describe("ProactiveWorkflowEngine", () => {
  it("builds monitor and watch workflows", () => {
    const engine = createDefaultProactiveWorkflowEngine();
    const plan = engine.buildPlan("monitor gold market changes and alert me");

    expect(plan.items.some((item) => item.kind === "monitor")).toBe(true);
    expect(plan.continuous).toBe(true);
  });
});

describe("BackgroundTaskSupervisor", () => {
  it("recovers stalled workflows and enforces step limits", () => {
    const supervisor = createDefaultBackgroundTaskSupervisor();
    const task = supervisor.enqueue("wf-1", "Monitoring…");
    supervisor.start(task.taskId);

    for (let index = 0; index < 21; index += 1) {
      supervisor.beforeStep(task.taskId);
    }
    const blocked = supervisor.beforeStep(task.taskId);
    expect(blocked.recover).toBe(true);

    supervisor.recover(task.taskId);
    supervisor.complete(task.taskId, true);
    expect(supervisor.listActive().length).toBe(0);
  });
});

describe("SmartNotificationRuntime", () => {
  it("throttles duplicate notifications", () => {
    const runtime = createDefaultSmartNotificationRuntime();
    const first = runtime.notify("alert", "Market alert", "Monitoring…", "market");
    const second = runtime.notify("alert", "Market alert", "Monitoring…", "market");

    expect(first.throttled).toBe(false);
    expect(second.throttled).toBe(true);
  });
});

describe("PersistentSessionManager", () => {
  it("recovers interrupted sessions", () => {
    const manager = createDefaultPersistentSessionManager();
    const session = manager.create("user-1", "conv-1");
    const recovered = manager.recover(session.sessionId);

    expect(recovered?.state).toBe("recovered");
  });
});

describe("ContinuousJarvisRuntime", () => {
  it("runs continuous monitoring without exposing internal names", async () => {
    const runtime = createDefaultContinuousJarvisRuntime();
    const result = await runtime.run({
      description: "monitor gold market changes and alert me",
      intentKind: "automate",
      userId: "user-cont-1",
      conversationId: "conv-cont-1",
    });

    expect(result.success).toBe(true);
    expect(result.continuous).toBe(true);
    expect(result.activities.every((entry) => !entry.userLabel.includes("Hermes"))).toBe(
      true,
    );
    expect(result.activities.every((entry) => !entry.userLabel.includes("OpenClaw"))).toBe(
      true,
    );
  });

  it("schedules daily briefing workflow", async () => {
    const runtime = createDefaultContinuousJarvisRuntime();
    const result = await runtime.run({
      description: "prepare my daily briefing every morning",
      intentKind: "plan",
      userId: "user-cont-2",
    });

    expect(result.activities.some((entry) => entry.kind === "schedule")).toBe(true);
  });
});
