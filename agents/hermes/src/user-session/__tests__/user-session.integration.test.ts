import { describe, expect, it } from "vitest";

import { REAL_USER_SESSION_PROMPTS } from "@jarvis/types";

import { createDefaultHermesExecutionBridge } from "../../execution-bridge";
import { resolveHermesUserSessionPlanHint } from "../user-session-plan-hint";

describe("Hermes user session integration", () => {
  it.each(REAL_USER_SESSION_PROMPTS)(
    "maps user session prompt into Hermes execution plan: %s",
    (prompt) => {
      const hint = resolveHermesUserSessionPlanHint(prompt);
      expect(hint).toBeDefined();

      const bridge = createDefaultHermesExecutionBridge();
      const plan = bridge.createExecutionPlan({
        parentTaskId: "task-user-session-1",
        agentPayload: {
          structuredPlan: {
            goal: hint!.goal,
            steps: ["search-web", "summarize-results"],
          },
        },
      });

      expect(plan.steps.length).toBeGreaterThan(0);
    },
  );
});
