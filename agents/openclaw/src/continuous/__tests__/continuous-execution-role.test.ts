import { describe, expect, it } from "vitest";

import { resolveOpenClawContinuousRole } from "../continuous-execution-role";

describe("resolveOpenClawContinuousRole", () => {
  it("maps monitor workflow to sandboxed role", () => {
    const role = resolveOpenClawContinuousRole("monitor gold market changes");
    expect(role.role).toBe("monitor");
    expect(role.sandbox).toBe(true);
  });
});
