import { describe, expect, it } from "vitest";

import { API_RUNTIME_MODULE_IDS } from "../index";

describe("api-runtime structure", () => {
  it("declares core modules", () => {
    expect(API_RUNTIME_MODULE_IDS).toEqual([
      "jarvis-api-request",
      "jarvis-api-response",
      "api-health",
      "jarvis-api-router",
      "jarvis-api-server",
      "create-default-jarvis-api-server",
    ]);
  });
});
