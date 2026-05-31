import { describe, expect, it } from "vitest";

import { shouldUseOrchestratorLlmPlanning } from "../should-use-orchestrator-llm-planning";

describe("shouldUseOrchestratorLlmPlanning", () => {
  it("returns false when Hermes official mode is active", () => {
    expect(
      shouldUseOrchestratorLlmPlanning({
        HERMES_MODE: "official",
        JARVIS_ALLOW_ORCHESTRATOR_LLM_PLANNING: "false",
      }),
    ).toBe(false);
  });

  it("returns false when Hermes planning adapter mode is active", () => {
    expect(
      shouldUseOrchestratorLlmPlanning({
        HERMES_MODE: "planning",
      }),
    ).toBe(false);
  });

  it("returns true for stub Hermes mode by default", () => {
    expect(
      shouldUseOrchestratorLlmPlanning({
        HERMES_MODE: "stub",
      }),
    ).toBe(true);
  });

  it("honors explicit override to enable orchestrator LLM", () => {
    expect(
      shouldUseOrchestratorLlmPlanning({
        HERMES_MODE: "official",
        JARVIS_ALLOW_ORCHESTRATOR_LLM_PLANNING: "true",
      }),
    ).toBe(true);
  });
});
