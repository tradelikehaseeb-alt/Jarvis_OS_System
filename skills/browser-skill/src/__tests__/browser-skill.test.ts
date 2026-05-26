import { describe, expect, it } from "vitest";

import { BROWSER_SKILL_ID, BrowserSkill } from "../index";

describe("BrowserSkill", () => {
  it("returns static browser action result", async () => {
    const skill = new BrowserSkill();
    const output = await skill.execute(
      {
        invocationId: "inv-3",
        skillId: BROWSER_SKILL_ID,
        agentId: "openclaw-gateway",
        userId: "user-1",
        parameters: { action: "navigate", url: "https://example.com" },
      },
      { contextRef: "ctx-1", userId: "user-1", agentId: "openclaw-gateway" },
    );
    expect(output.data?.action).toBe("navigate");
    expect(output.data?.result).toMatchObject({ status: "completed" });
  });
});
