import { describe, expect, it } from "vitest";

import { createDefaultContextRuntimeBundle } from "../../context";
import { createTestOrchestratorService } from "../../index";

describe("runtime hardening integration", () => {
  it("includes stability metadata in task output", async () => {
    const bundle = createDefaultContextRuntimeBundle();
    const service = await createTestOrchestratorService();
    const { record } = await service.executeCreateTask(
      {
        intent: { kind: "plan", description: "Plan weekly schedule" },
        metadata: { conversationId: "conv-stability" },
      },
      {
        contextRuntime: bundle.contextRuntime,
        contextRankingRuntime: bundle.contextRankingRuntime,
        conversationHistoryRuntime: bundle.conversationHistory,
        memoryRecallRuntime: bundle.memoryRecallRuntime,
      },
    );

    const stability = record.taskStatus.output?.stability as
      | { mode?: string; message?: string }
      | undefined;
    expect(stability?.mode).toBeDefined();
    expect(stability?.message).toBeTruthy();
  });
});
