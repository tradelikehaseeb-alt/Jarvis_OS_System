import { describe, expect, it } from "vitest";
import { createDefaultLocalMemoryRuntime } from "@jarvis/local-memory";

import {
  createDefaultOrchestratorService,
  createTestOrchestratorService,
  TaskStoreFactory,
} from "../../index";

describe("execution learning integration", () => {
  it("records learning outcomes and returns insights on automate handshake", async () => {
    const service = await createTestOrchestratorService();

    const { record } = await service.executeCreateTask({
      intent: { kind: "automate", description: "Learn from export workflow" },
    });

    const learningInsights = record.taskStatus.output?.learningInsights as {
      recordCount?: number;
      successRate?: number;
      signals?: readonly { kind: string }[];
      stub?: boolean;
    };

    expect(learningInsights?.recordCount ?? 0).toBeGreaterThanOrEqual(1);
    expect(learningInsights?.signals?.length ?? 0).toBeGreaterThan(0);
    expect(typeof learningInsights?.successRate).toBe("number");
    expect(learningInsights?.stub).toBe(true);

    const adaptiveExecution = record.taskStatus.output?.adaptiveExecution as {
      success?: boolean;
    };
    expect(adaptiveExecution?.success).toBe(true);
  });

  it("applies learned rules on subsequent automate tasks", async () => {
    const localMemoryRuntime = createDefaultLocalMemoryRuntime({
      useFileBackend: false,
    });
    const service = await createDefaultOrchestratorService(
      TaskStoreFactory.createInMemory(),
    );

    await service.executeCreateTask(
      { intent: { kind: "automate", description: "First learning run" } },
      { localMemoryRuntime },
    );

    const { record } = await service.executeCreateTask(
      { intent: { kind: "automate", description: "Second learning run" } },
      { localMemoryRuntime },
    );

    const learningInsights = record.taskStatus.output?.learningInsights as {
      recordCount?: number;
    };
    const learning = record.taskStatus.output?.learning as {
      appliedRules?: readonly { action: string; maxRetries?: number }[];
      signals?: readonly { kind: string }[];
    };

    expect(learningInsights?.recordCount ?? 0).toBeGreaterThanOrEqual(2);
    expect(learning?.signals?.length ?? 0).toBeGreaterThan(0);
    expect(learning?.appliedRules?.some((rule) => rule.action === "retry")).toBe(
      true,
    );
  });
});
