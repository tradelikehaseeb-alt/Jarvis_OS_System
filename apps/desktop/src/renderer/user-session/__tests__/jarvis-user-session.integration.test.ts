import { describe, expect, it } from "vitest";

import { REAL_USER_SESSION_PROMPTS } from "@jarvis/types";

import { createTestJarvisUserSessionRuntime } from "@jarvis/orchestrator";

describe("desktop Jarvis user session integration", () => {
  it("runs full user session through orchestrator runtime", async () => {
    const runtime = await createTestJarvisUserSessionRuntime();
    const report = await runtime.runUserSession({
      userId: "desktop-user",
    });

    expect(report.promptResults).toHaveLength(REAL_USER_SESSION_PROMPTS.length);

    for (const result of report.promptResults) {
      expect(result.activityStreamUpdated).toBe(true);
      expect(result.memoryPersisted).toBe(true);
      expect(result.workspaceHistoryUpdated).toBe(true);
    }
  });
});
