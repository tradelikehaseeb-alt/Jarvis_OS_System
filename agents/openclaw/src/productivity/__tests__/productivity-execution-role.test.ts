import { describe, expect, it } from "vitest";

import { resolveOpenClawProductivityRole } from "../productivity-execution-role";

describe("resolveOpenClawProductivityRole", () => {
  it("maps email workflow to sandboxed role", () => {
    const role = resolveOpenClawProductivityRole("summarize unread emails");
    expect(role.role).toBe("email");
    expect(role.sandbox).toBe(true);
  });
});
