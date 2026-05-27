import { describe, expect, it } from "vitest";
import { createDefaultLocalMemoryRuntime } from "@jarvis/local-memory";

import {
  createDefaultOrchestratorService,
  createTestOrchestratorService,
  TaskStoreFactory,
} from "../../index";

describe("user feedback integration", () => {
  it("returns feedback insights when user feedback metadata is provided", async () => {
    const localMemoryRuntime = createDefaultLocalMemoryRuntime({
      useFileBackend: false,
    });
    const service = await createDefaultOrchestratorService(
      TaskStoreFactory.createInMemory(),
    );

    const first = await service.executeCreateTask(
      { intent: { kind: "automate", description: "Run export workflow" } },
      { localMemoryRuntime },
    );

    const { record } = await service.executeCreateTask(
      {
        intent: { kind: "automate", description: "Retry with user feedback" },
        metadata: {
          userFeedback: {
            taskId: first.record.createTaskResponse.taskId,
            rating: "negative",
            comment: "please retry failed steps",
          },
        },
      },
      { localMemoryRuntime },
    );

    const feedbackInsights = record.taskStatus.output?.feedbackInsights as {
      feedbackCount?: number;
      signals?: readonly { kind: string }[];
      stub?: boolean;
    };

    expect(feedbackInsights?.feedbackCount ?? 0).toBeGreaterThanOrEqual(1);
    expect(feedbackInsights?.signals?.length ?? 0).toBeGreaterThan(0);
    expect(feedbackInsights?.stub).toBe(true);

    const learning = record.taskStatus.output?.learning as {
      appliedRules?: readonly { action: string; maxRetries?: number }[];
    };
    expect(learning?.appliedRules?.some((rule) => rule.action === "retry")).toBe(
      true,
    );
  });

  it("includes feedback insights on default automate handshake", async () => {
    const service = await createTestOrchestratorService();

    const { record } = await service.executeCreateTask({
      intent: { kind: "automate", description: "Baseline feedback path" },
    });

    const feedbackInsights = record.taskStatus.output?.feedbackInsights as {
      signals?: readonly { kind: string }[];
    };

    expect(
      feedbackInsights?.signals?.some((signal) => signal.kind === "no_feedback"),
    ).toBe(true);
  });
});
