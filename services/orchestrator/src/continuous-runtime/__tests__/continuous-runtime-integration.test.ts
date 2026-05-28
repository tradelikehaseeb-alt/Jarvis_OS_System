import { describe, expect, it } from "vitest";

import { createTestOrchestratorService } from "../../index";
import { createDefaultContinuousJarvisRuntime } from "../continuous-jarvis-runtime";

describe("continuous runtime integration", () => {
  it("runs continuous workflow for market monitoring", async () => {
    const continuous = createDefaultContinuousJarvisRuntime();
    const result = await continuous.run({
      description: "keep watching AI news and summarize important updates",
      intentKind: "automate",
      userId: "user-cont-int",
      conversationId: "conv-cont-int",
    });

    expect(result.success).toBe(true);

    const service = await createTestOrchestratorService();
    const { record } = await service.executeCreateTask({
      intent: {
        kind: "automate",
        description: "keep watching AI news and summarize important updates",
      },
      metadata: { conversationId: "conv-cont-int" },
    });

    expect(record.taskStatus.status).toBeDefined();
  });
});
