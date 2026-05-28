import { describe, expect, it } from "vitest";

import { createDefaultSkillPipeline } from "@jarvis/agents-shared";

import { createOpenClawAgent } from "../../index";

describe("browser execution runtime integration", () => {
  it("executes Gmail workflow through agent payload", async () => {
    const { skillExecutor } = await createDefaultSkillPipeline();
    const agent = createOpenClawAgent(skillExecutor);

    const result = await agent.execute(
      {
        taskId: "task-gmail-95",
        requestId: "req-gmail-95",
        userId: "user-1",
        intent: {
          kind: "automate",
          description: "Open Gmail and summarize unread emails",
        },
      },
      { contextRef: "ctx-gmail-95", userId: "user-1" },
    );

    expect(result.success).toBe(true);
    expect(result.payload?.browserState).toBeDefined();
    expect(result.payload?.workflowProgress).toBeDefined();
  });
});
