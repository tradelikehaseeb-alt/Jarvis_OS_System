import { describe, expect, it } from "vitest";

import { resolveOpenClawWorkforceRole } from "../workforce-worker-role";

describe("resolveOpenClawWorkforceRole", () => {
  it("maps browser tasks to browser worker role", () => {
    const role = resolveOpenClawWorkforceRole("open TradingView and prepare workspace");
    expect(role.workerType).toBe("browser");
    expect(role.sandbox).toBe(true);
  });
});
