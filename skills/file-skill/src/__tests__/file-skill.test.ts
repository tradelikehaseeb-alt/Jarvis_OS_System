import { describe, expect, it } from "vitest";

import { FILE_SKILL_ID, FileSkill } from "../index";

describe("FileSkill", () => {
  it("returns static file operation result", async () => {
    const skill = new FileSkill();
    const output = await skill.execute(
      {
        invocationId: "inv-2",
        skillId: FILE_SKILL_ID,
        agentId: "openclaw-gateway",
        userId: "user-1",
        parameters: { operation: "write", path: "/docs/note.txt" },
      },
      { contextRef: "ctx-1", userId: "user-1", agentId: "openclaw-gateway" },
    );
    expect(output.data?.operation).toBe("write");
    expect(output.data?.result).toMatchObject({ status: "ok" });
  });
});
