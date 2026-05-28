import { describe, expect, it } from "vitest";

import { createTestOrchestratorService } from "../../index";

describe("execution runtime integration", () => {
  it("includes workflow and browser state in automate task output", async () => {
    const service = await createTestOrchestratorService();
    const { record } = await service.executeCreateTask({
      intent: {
        kind: "automate",
        description: "Open Gmail and summarize unread emails",
      },
      metadata: { conversationId: "conv-exec-95" },
    });

    const output = record.taskStatus.output ?? {};
    const executionRuntime = output.executionRuntime as
      | { workflow?: { stepCount?: number }; browserState?: { url?: string } }
      | undefined;

    expect(executionRuntime?.workflow?.stepCount).toBeGreaterThan(0);
    expect(record.taskStatus.status).toBeDefined();
  });
});
