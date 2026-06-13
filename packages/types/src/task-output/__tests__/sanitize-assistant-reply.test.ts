import { describe, expect, it } from "vitest";

import {
  friendlyUserErrorMessage,
  looksLikeRawApiError,
  sanitizeAssistantReplyForDisplay,
  stripProviderDecoration,
} from "../sanitize-assistant-reply";

describe("sanitizeAssistantReplyForDisplay", () => {
  it("strips provider mock prefix", () => {
    expect(
      stripProviderDecoration(
        "Hermes (local) (mock): Wa alaikum assalam, kaise ho?",
      ),
    ).toBe("Wa alaikum assalam, kaise ho?");
  });

  it("detects raw Groq 429 errors", () => {
    const raw =
      "API call failed after 3 retries: HTTP 429: Rate limit reached for model";
    expect(looksLikeRawApiError(raw)).toBe(true);
    expect(sanitizeAssistantReplyForDisplay(raw)).toContain("Groq thoda busy");
  });

  it("returns friendly rate limit message", () => {
    expect(friendlyUserErrorMessage("HTTP 429 rate limit")).toContain("Groq");
  });

  it("passes through normal assistant text", () => {
    expect(sanitizeAssistantReplyForDisplay("Aapka favorite color black hai.")).toBe(
      "Aapka favorite color black hai.",
    );
  });
});
