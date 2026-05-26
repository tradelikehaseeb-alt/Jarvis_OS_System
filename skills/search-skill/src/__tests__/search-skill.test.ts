import { describe, expect, it } from "vitest";

import { SEARCH_SKILL_ID, SearchSkill } from "../index";

describe("SearchSkill", () => {
  it("returns static search results", async () => {
    const skill = new SearchSkill();
    const output = await skill.execute(
      {
        invocationId: "inv-1",
        skillId: SEARCH_SKILL_ID,
        agentId: "hermes",
        userId: "user-1",
        parameters: { query: "jarvis os architecture" },
      },
      { contextRef: "ctx-1", userId: "user-1", agentId: "hermes" },
    );
    expect(output.success).toBe(true);
    expect(output.data?.results).toHaveLength(2);
    expect(output.data?.query).toBe("jarvis os architecture");
  });
});
