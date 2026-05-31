import { afterEach, describe, expect, it, vi } from "vitest";

import { SEARCH_SKILL_ID, SearchSkill } from "../index";

describe("SearchSkill", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.SERPER_API_KEY;
  });

  it("returns SEARCH_KEY_MISSING when SERPER_API_KEY is unset", async () => {
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

    expect(output.success).toBe(false);
    expect(output.data?.stub).toBe(false);
    expect(output.error?.code).toBe("SEARCH_KEY_MISSING");
  });

  it("returns real Serper results when API key is configured", async () => {
    process.env.SERPER_API_KEY = "test-serper-key";

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          organic: [
            {
              title: "Jarvis OS",
              link: "https://example.com/jarvis",
              snippet: "AI operating layer",
              position: 1,
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const skill = new SearchSkill();
    const output = await skill.execute(
      {
        invocationId: "inv-2",
        skillId: SEARCH_SKILL_ID,
        agentId: "hermes",
        userId: "user-1",
        parameters: { query: "jarvis os" },
      },
      { contextRef: "ctx-1", userId: "user-1", agentId: "hermes" },
    );

    expect(output.success).toBe(true);
    expect(output.data?.stub).toBe(false);
    expect(output.data?.results).toEqual([
      {
        title: "Jarvis OS",
        url: "https://example.com/jarvis",
        snippet: "AI operating layer",
        position: 1,
      },
    ]);
    expect(output.data?.results?.[0]?.url).not.toContain("stub.local");
  });
});
