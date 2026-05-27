import { describe, expect, it } from "vitest";
import { createDefaultLocalMemoryRuntime } from "@jarvis/local-memory";

import { DEFAULT_STUB_ADAPTIVE_RULES } from "../../adaptive-execution";
import {
  __buildLearningRecordForTest,
  __signalKindsForTest,
  createDefaultLearningRuntime,
} from "../create-default-learning-runtime";
import type { AdaptiveExecuteResult } from "../../adaptive-execution";

function buildAdaptiveResult(
  success: boolean,
  failureCount: number,
): AdaptiveExecuteResult {
  const results = [
    { taskId: "s0", requestId: "r0", agentId: "openclaw-gateway", success: true },
    {
      taskId: "s1",
      requestId: "r1",
      agentId: "openclaw-gateway",
      success: failureCount === 0,
      error:
        failureCount > 0
          ? { code: "STEP_FAILED", message: "failed" }
          : undefined,
    },
  ];

  return {
    executionId: "adaptive-test",
    success,
    plan: { planId: "plan-1", goal: "Goal", steps: [], stub: true, source: "stub_fallback" },
    tasks: [],
    executionResults: results,
    decisions: [],
    events: [],
    stub: true,
    adaptive: true,
  };
}

describe("LearningRuntime", () => {
  function createRuntime() {
    const localMemoryRuntime = createDefaultLocalMemoryRuntime({
      useFileBackend: false,
    });
    return createDefaultLearningRuntime({ localMemoryRuntime });
  }

  it("recordExecutionOutcome persists to local memory", () => {
    const runtime = createRuntime();
    const record = runtime.recordExecutionOutcome({
      userId: "user-1",
      taskId: "task-record",
      intentKind: "automate",
      adaptiveResult: buildAdaptiveResult(true, 0),
    });

    expect(record.recordId).toContain("learning-task-record");
    expect(record.success).toBe(true);
    expect(runtime.queryRecords({ userId: "user-1" })).toHaveLength(1);
  });

  it("evaluateLearning returns no_data when history is empty", () => {
    const runtime = createRuntime();
    const signals = runtime.evaluateLearning({ userId: "user-empty" });

    expect(__signalKindsForTest(signals)).toContain("no_data");
  });

  it("evaluateLearning detects elevated failure rate", () => {
    const runtime = createRuntime();

    for (let index = 0; index < 4; index += 1) {
      runtime.recordExecutionOutcome({
        userId: "user-fail",
        taskId: `task-fail-${index}`,
        intentKind: "automate",
        adaptiveResult: buildAdaptiveResult(false, 1),
      });
    }

    const signals = runtime.evaluateLearning({
      userId: "user-fail",
      intentKind: "automate",
    });

    expect(__signalKindsForTest(signals)).toContain("elevated_failure_rate");
  });

  it("applyLearning adjusts retry maxRetries from signals", () => {
    const runtime = createRuntime();
    const rules = runtime.applyLearning({
      baseRules: DEFAULT_STUB_ADAPTIVE_RULES,
      signals: [
        {
          kind: "elevated_failure_rate",
          message: "high failures",
          confidence: 0.9,
          sampleSize: 4,
        },
      ],
    });

    const retryRule = rules.find((rule) => rule.action === "retry");
    expect(retryRule?.maxRetries).toBe(2);
  });

  it("applyLearning returns base rules on no_data fallback", () => {
    const runtime = createRuntime();
    const rules = runtime.applyLearning({
      baseRules: DEFAULT_STUB_ADAPTIVE_RULES,
      signals: [
        {
          kind: "no_data",
          message: "none",
          confidence: 1,
          sampleSize: 0,
        },
      ],
    });

    expect(rules).toEqual(DEFAULT_STUB_ADAPTIVE_RULES);
  });

  it("getLearningInsights summarizes history", () => {
    const runtime = createRuntime();
    runtime.recordExecutionOutcome({
      userId: "user-insights",
      taskId: "task-insights",
      intentKind: "automate",
      adaptiveResult: buildAdaptiveResult(true, 0),
    });

    const insights = runtime.getLearningInsights({ userId: "user-insights" });

    expect(insights.recordCount).toBe(1);
    expect(insights.successRate).toBe(1);
    expect(insights.signals.length).toBeGreaterThan(0);
  });

  it("uses deterministic test helper records", () => {
    const record = __buildLearningRecordForTest({ success: false, failureCount: 2 });
    expect(record.failureCount).toBe(2);
  });
});
