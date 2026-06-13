import { describe, expect, it } from "vitest";

import {
  getHermesExecutionMode,
  getHermesSkillCategory,
  hasPendingAutomationInConversation,
  isAutomationConfirmationQuery,
  isConfirmedAutomationExecution,
  resolveHermesToolsets,
  resolveHermesUserStatusMessage,
} from "../get-hermes-execution-mode";

describe("getHermesExecutionMode", () => {
  it("uses fast path for hello", () => {
    expect(getHermesExecutionMode("hello")).toBe("fast");
  });

  it("uses skills path for iPhone price queries", () => {
    expect(getHermesExecutionMode("iPhone 17 price Pakistan mein")).toBe(
      "skills",
    );
    expect(getHermesSkillCategory("iPhone 17 price Pakistan mein")).toBe(
      "search",
    );
  });

  it("uses skills path for latest AI news", () => {
    expect(getHermesExecutionMode("latest AI news batao")).toBe("skills");
  });

  it("uses skills path for memory save requests", () => {
    expect(getHermesExecutionMode("yaad rakho meri meeting kal hai")).toBe(
      "skills",
    );
    expect(getHermesSkillCategory("yaad rakho meri meeting kal hai")).toBe(
      "memory",
    );
    expect(resolveHermesUserStatusMessage("memory")).toBe(
      "Jarvis is remembering...",
    );
  });

  it("resolves research toolsets for search tasks", () => {
    expect(resolveHermesToolsets("search")).toBe("safe,research");
  });

  it("routes developer and media work to the full Hermes ACP toolset", () => {
    expect(getHermesSkillCategory("is video ko edit karo")).toBe(
      "development",
    );
    expect(getHermesSkillCategory("run command and debug code")).toBe(
      "development",
    );
    expect(resolveHermesToolsets("development")).toBe("hermes-acp");
  });

  it("routes Windows desktop automation to dynamic script toolsets", () => {
    expect(getHermesSkillCategory("close window chrome")).toBe("automate");
    expect(getHermesExecutionMode("close window chrome")).toBe("skills");
    expect(resolveHermesToolsets("automate")).toBe(
      "safe,windows_automation,file",
    );
    expect(resolveHermesUserStatusMessage("automate")).toBe(
      "Jarvis is automating your desktop...",
    );
  });

  it("uses fast path for short explain requests", () => {
    expect(getHermesExecutionMode("explain quantum")).toBe("fast");
  });

  it("uses fast path for memory recall (chat history via Groq)", () => {
    expect(getHermesExecutionMode("mere fav color bataw")).toBe("fast");
    expect(getHermesSkillCategory("mere fav color bataw")).toBe("memory");
    expect(
      getHermesExecutionMode("maine last conversation mai bataya tha black color hai"),
    ).toBe("fast");
    expect(getHermesExecutionMode("passand ka color konsa hai")).toBe("fast");
    expect(getHermesExecutionMode("WHATS MY FAV COLOR")).toBe("fast");
    expect(resolveHermesUserStatusMessage("memory", "mere fav color bataw")).toBe(
      "Jarvis is checking what you shared...",
    );
  });

  it("routes automation confirmation with pending context to skills subprocess", () => {
    const turns = [
      { role: "user" as const, message: "create folder TestJarvis on desktop" },
      {
        role: "assistant" as const,
        message:
          "I will run this Python via execute_dynamic_windows_script:\n```python\nimport os\nos.makedirs(r'C:\\Users\\Test\\Desktop\\TestJarvis')\nprint('Folder created')\n```\nProceed?",
      },
      { role: "user" as const, message: "yes kro" },
    ];

    expect(isAutomationConfirmationQuery("yes kro")).toBe(true);
    expect(hasPendingAutomationInConversation(turns)).toBe(true);
    expect(isConfirmedAutomationExecution("yes kro", turns)).toBe(true);
    expect(getHermesExecutionMode("yes kro", turns)).toBe("skills");
    expect(getHermesSkillCategory("yes kro", turns)).toBe("automate");
    expect(resolveHermesToolsets("automate")).toBe(
      "safe,windows_automation,file",
    );
  });

  it("keeps bare yes on fast path without pending automation context", () => {
    expect(getHermesExecutionMode("yes")).toBe("fast");
    expect(isConfirmedAutomationExecution("yes", [])).toBe(false);
  });
});
