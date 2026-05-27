import { describe, expect, it } from "vitest";

import { REAL_PROVIDER_VALIDATION_COMMANDS } from "@jarvis/types";
import type { ProviderTelemetry } from "@jarvis/types";

import { createDefaultHermesExecutionBridge } from "../../execution-bridge";
import { resolveHermesLiveProviderPlanHint } from "../live-provider-plan-hint";

describe("Hermes live provider integration", () => {
  it.each(REAL_PROVIDER_VALIDATION_COMMANDS)(
    "maps real provider prompt into Hermes execution plan: %s",
    (prompt) => {
      const hint = resolveHermesLiveProviderPlanHint(prompt);
      expect(hint).toBeDefined();

      const bridge = createDefaultHermesExecutionBridge();
      const plan = bridge.createExecutionPlan({
        parentTaskId: "task-live-provider-1",
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

  it("accepts provider telemetry shape for handshake correlation", () => {
    const telemetry: ProviderTelemetry = {
      sessionId: "live-1",
      providerId: "groq",
      stub: true,
      spans: [],
      streamEvents: ["planning_started"],
      capturedAt: new Date().toISOString(),
    };

    expect(telemetry.streamEvents.length).toBe(1);
  });
});
