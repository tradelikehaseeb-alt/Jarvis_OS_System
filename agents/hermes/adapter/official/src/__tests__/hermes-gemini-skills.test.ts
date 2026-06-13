import { describe, expect, it } from "vitest";

import {
  buildGeminiSkillsProcessEnv,
  isHermesSkillsProviderFailure,
} from "../hermes-gemini-skills";

describe("hermes-gemini-skills", () => {
  it("builds Gemini subprocess env overrides", () => {
    const env = buildGeminiSkillsProcessEnv({
      GEMINI_API_KEY: "gem-key",
      GEMINI_MODEL: "gemini-2.0-flash",
    });

    expect(env).toMatchObject({
      HERMES_INFERENCE_PROVIDER: "gemini",
      GEMINI_API_KEY: "gem-key",
      GOOGLE_API_KEY: "gem-key",
      HERMES_INFERENCE_MODEL: "gemini-2.0-flash",
    });
  });

  it("returns undefined when Gemini key is missing", () => {
    expect(buildGeminiSkillsProcessEnv({})).toBeUndefined();
  });

  it("detects provider failures from rate-limit stderr", () => {
    expect(
      isHermesSkillsProviderFailure({
        success: false,
        finalResponse: "",
        stdout: "",
        stderr: "HTTP 429 rate limit reached",
        exitCode: 1,
      }),
    ).toBe(true);
  });
});
