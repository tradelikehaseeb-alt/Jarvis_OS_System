import { describe, expect, it } from "vitest";

import { createTestOrchestratorService } from "../../index";
import { createDefaultAgentWorkforceRuntime } from "../agent-workforce-runtime";

describe("agent workforce integration", () => {
  it("includes workforce output for multi-agent research tasks", async () => {
    const service = await createTestOrchestratorService();
    const workforce = createDefaultAgentWorkforceRuntime();

    const coordination = await workforce.coordinate({
      description:
        "research AI news, summarize market impact, and prepare a trading brief",
      intentKind: "research",
      userId: "user-workforce-int",
      conversationId: "conv-workforce-int",
    });

    expect(coordination.success).toBe(true);

    const { record } = await service.executeCreateTask({
      intent: {
        kind: "research",
        description:
          "research AI news, summarize market impact, and prepare a trading brief",
      },
      metadata: {
        conversationId: "conv-workforce-int",
        workforce: coordination,
      },
    });

    expect(record.taskStatus.status).toBeDefined();
  });
});
