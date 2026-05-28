import { describe, expect, it } from "vitest";

import {
  createDefaultLocalMemoryRuntime,
  createDefaultSessionMemoryProfile,
  getSessionMemoryProfile,
  saveSessionMemoryProfile,
} from "../index";

describe("SessionMemoryProfile store", () => {
  it("persists and loads session profile records", () => {
    const runtime = createDefaultLocalMemoryRuntime({ useFileBackend: false });
    const profile = createDefaultSessionMemoryProfile("user-1", "conv-1");
    const saved = saveSessionMemoryProfile(runtime, {
      ...profile,
      topicKeywords: ["dashboard", "rollout"],
      recentInteractionIds: ["task-1"],
    });

    const loaded = getSessionMemoryProfile(runtime, "user-1", "conv-1");
    expect(loaded?.profileId).toBe(saved.profileId);
    expect(loaded?.topicKeywords).toContain("dashboard");
    expect(loaded?.recentInteractionIds).toContain("task-1");
  });
});
