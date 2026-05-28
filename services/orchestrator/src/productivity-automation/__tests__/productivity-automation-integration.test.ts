import { describe, expect, it } from "vitest";

import { createTestOrchestratorService } from "../../index";
import { createDefaultProductivityWorkflowRuntime } from "../productivity-workflow-runtime";

describe("productivity automation integration", () => {
  it("runs productivity workflow for email prioritization task", async () => {
    const productivity = createDefaultProductivityWorkflowRuntime();
    const result = await productivity.run({
      description: "summarize unread emails and prepare my priorities",
      intentKind: "plan",
      userId: "user-prod-int",
      conversationId: "conv-prod-int",
    });

    expect(result.success).toBe(true);

    const service = await createTestOrchestratorService();
    const { record } = await service.executeCreateTask({
      intent: {
        kind: "plan",
        description: "summarize unread emails and prepare my priorities",
      },
      metadata: { conversationId: "conv-prod-int" },
    });

    expect(record.taskStatus.status).toBeDefined();
  });
});
