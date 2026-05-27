import { describe, expect, it } from "vitest";

import {
  isApiHealthy,
  nextLifecycle,
  parseApiError,
} from "../api-communication";

describe("api-communication", () => {
  it("parses errors and tracks lifecycle transitions", () => {
    expect(parseApiError(new Error("API 404: not found"))).toBe(
      "API 404: not found",
    );
    expect(parseApiError("bad")).toBe("Request failed");

    const lifecycle = nextLifecycle("creating_task", 2);
    expect(lifecycle.state).toBe("creating_task");
    expect(lifecycle.attempt).toBe(2);
  });

  it("evaluates API health", () => {
    expect(
      isApiHealthy({
        status: "ok",
        service: "jarvis-api-runtime",
        orchestrator: "ok",
        checkedAt: "2026-01-01T00:00:00.000Z",
      }),
    ).toBe(true);

    expect(
      isApiHealthy({
        status: "degraded",
        service: "jarvis-api-runtime",
        orchestrator: "ok",
        checkedAt: "2026-01-01T00:00:00.000Z",
      }),
    ).toBe(false);
  });
});
