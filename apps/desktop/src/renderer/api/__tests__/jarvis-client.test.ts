import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { JarvisDesktopApi } from "../../global";
import { classifyChatIntent } from "../../intent";
import {
  checkApiHealth,
  createTask,
  getTaskStatus,
  JarvisApiError,
  submitChatAsTask,
} from "../jarvis-client";

describe("jarvis-client", () => {
  let mockApi: JarvisDesktopApi;

  beforeEach(() => {
    mockApi = {
      getApiUrl: vi.fn().mockResolvedValue("http://127.0.0.1:8787"),
      checkApiHealth: vi.fn().mockResolvedValue({
        status: "ok",
        service: "jarvis-api-runtime",
        orchestrator: "ok",
        checkedAt: "2026-01-01T00:00:00.000Z",
      }),
      createTask: vi.fn().mockResolvedValue({
        taskId: "task-1",
        status: "completed",
        createdAt: "2026-01-01T00:00:00.000Z",
      }),
      getTaskStatus: vi.fn().mockResolvedValue({
        taskId: "task-1",
        status: "completed",
        progressPercent: 100,
        output: {
          skill: {
            skillId: "search-skill",
            data: { results: [{ title: "Stub A" }, { title: "Stub B" }] },
          },
        },
        updatedAt: "2026-01-01T00:00:00.000Z",
      }),
    };

    window.jarvis = mockApi;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("createTask calls bridge", async () => {
    const result = await createTask({
      intent: { kind: "research", description: "test" },
    });
    expect(result.taskId).toBe("task-1");
    expect(mockApi.createTask).toHaveBeenCalled();
  });

  it("checkApiHealth calls bridge", async () => {
    const health = await checkApiHealth();
    expect(health.status).toBe("ok");
    expect(mockApi.checkApiHealth).toHaveBeenCalled();
  });

  it("submitChatAsTask uses classified intent and lifecycle through API runtime", async () => {
    const classification = classifyChatIntent("Plan my week");
    const lifecycleStates: string[] = [];

    const result = await submitChatAsTask("Plan my week", {
      classification,
      onLifecycle: (lifecycle) => lifecycleStates.push(lifecycle.state),
    });

    expect(result.create.taskId).toBe("task-1");
    expect(result.classification.intent).toBe("plan");
    expect(result.lifecycle.state).toBe("completed");
    expect(lifecycleStates).toContain("checking_health");
    expect(lifecycleStates).toContain("creating_task");
    expect(lifecycleStates).toContain("fetching_status");
    expect(mockApi.checkApiHealth).toHaveBeenCalled();
    expect(mockApi.getTaskStatus).toHaveBeenCalledWith("task-1");
    expect(mockApi.createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: expect.objectContaining({
          kind: "plan",
          description: "Plan my week",
        }),
        metadata: expect.objectContaining({ classifiedIntent: "plan" }),
      }),
    );
  });

  it("submitChatAsTask rejects empty message", async () => {
    const classification = classifyChatIntent("x");
    await expect(
      submitChatAsTask("   ", { classification, skipHealthCheck: true }),
    ).rejects.toBeInstanceOf(JarvisApiError);
  });

  it("submitChatAsTask fails when API health is degraded", async () => {
    vi.mocked(mockApi.checkApiHealth).mockResolvedValue({
      status: "degraded",
      service: "jarvis-api-runtime",
      orchestrator: "degraded",
      checkedAt: "2026-01-01T00:00:00.000Z",
    });

    const classification = classifyChatIntent("Plan my week");
    await expect(
      submitChatAsTask("Plan my week", { classification }),
    ).rejects.toThrow(/unhealthy/i);
  });

  it("throws when bridge missing", async () => {
    vi.stubGlobal("jarvis", undefined);
    await expect(getTaskStatus("x")).rejects.toBeInstanceOf(JarvisApiError);
    window.jarvis = mockApi;
  });
});
