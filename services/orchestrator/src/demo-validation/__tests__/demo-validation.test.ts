import { describe, expect, it } from "vitest";
import { DEMO_SCENARIO_COMMANDS } from "@jarvis/types";

import {
  createDefaultInteractionValidationRuntime,
  createDefaultHumanInteractionMetrics,
  createDefaultRealExecutionTelemetry,
  scorePerceivedQuality,
} from "../index";

describe("InteractionValidationRuntime", () => {
  it("validates completed automate workflow output", () => {
    const runtime = createDefaultInteractionValidationRuntime();
    const result = runtime.validate({
      command: DEMO_SCENARIO_COMMANDS[0],
      taskStatus: "completed",
      latencyMs: 1200,
      output: {
        activityStream: { events: [{ type: "execution_started" }] },
        executionTimeline: { events: [{ kind: "action_progress" }] },
        executionRuntime: { workflow: { stepCount: 2 } },
      },
    });

    expect(result.success).toBe(true);
    expect(result.checks.some((check) => check.id === "task_completed" && check.passed)).toBe(
      true,
    );
  });
});

describe("HumanInteractionMetrics", () => {
  it("aggregates latency samples", () => {
    const metrics = createDefaultHumanInteractionMetrics();
    metrics.record({
      command: "test",
      latencyMs: 1000,
      perceivedQuality: scorePerceivedQuality({ success: true, latencyMs: 1000 }),
      success: true,
    });
    metrics.record({
      command: "test2",
      latencyMs: 2000,
      perceivedQuality: scorePerceivedQuality({ success: true, latencyMs: 2000 }),
      success: true,
    });

    const snapshot = metrics.snapshot();
    expect(snapshot.sampleCount).toBe(2);
    expect(snapshot.successRate).toBe(1);
    expect(snapshot.averageLatencyMs).toBe(1500);
  });
});

describe("RealExecutionTelemetry", () => {
  it("captures span durations", () => {
    const telemetry = createDefaultRealExecutionTelemetry();
    telemetry.startSession("sess-1");
    telemetry.startSpan("voice-input", "voice.capture");
    telemetry.endSpan("voice-input");
    telemetry.recordVoiceLatency(450);

    const snapshot = telemetry.snapshot();
    expect(snapshot.spans.length).toBe(1);
    expect(snapshot.voiceLatencyMs).toBe(450);
  });
});

describe("DemoScenarioRuntime", () => {
  it("lists five canonical demo scenarios", async () => {
    const { createDemoScenarioRuntime } = await import("../demo-scenario-runtime");
    const runtime = createDemoScenarioRuntime({
      async execute() {
        return { success: true, stub: true, latencyMs: 50, output: {} };
      },
    });

    expect(runtime.listScenarios()).toHaveLength(5);
  });
});
