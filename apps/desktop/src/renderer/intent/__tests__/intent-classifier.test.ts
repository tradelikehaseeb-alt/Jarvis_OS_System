import { describe, expect, it } from "vitest";

import {
  classifyChatIntent,
  loadingMessageForIntent,
} from "../intent-classifier";
import { mapChatIntentToTaskKind } from "../map-intent-to-task";

describe("classifyChatIntent", () => {
  it("classifies planning messages", () => {
    const result = classifyChatIntent("Plan my week and schedule tasks");
    expect(result.intent).toBe("plan");
    expect(result.ruleId).toBe("plan-keywords");
  });

  it("classifies automation messages", () => {
    const result = classifyChatIntent("Automate this workflow on my desktop");
    expect(result.intent).toBe("automate");
  });

  it("classifies search before generic research", () => {
    const result = classifyChatIntent("Search for API documentation");
    expect(result.intent).toBe("search");
    expect(mapChatIntentToTaskKind(result.intent)).toBe("research");
  });

  it("classifies research messages", () => {
    const result = classifyChatIntent("Research competitor pricing trends");
    expect(result.intent).toBe("research");
  });

  it("classifies short greetings as conversation", () => {
    const result = classifyChatIntent("Hello!");
    expect(result.intent).toBe("conversation");
    expect(mapChatIntentToTaskKind(result.intent)).toBe("default");
  });

  it("is deterministic for the same input", () => {
    const a = classifyChatIntent("Plan sprint goals");
    const b = classifyChatIntent("Plan sprint goals");
    expect(a).toEqual(b);
  });
});

describe("loadingMessageForIntent", () => {
  it("preserves Hermes planning copy for plan intent", () => {
    expect(loadingMessageForIntent("plan")).toContain("Hermes is planning");
  });
});
