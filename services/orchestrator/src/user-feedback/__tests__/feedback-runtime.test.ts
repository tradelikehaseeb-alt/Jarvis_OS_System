import { describe, expect, it } from "vitest";
import { createDefaultLocalMemoryRuntime } from "@jarvis/local-memory";

import { DEFAULT_STUB_ADAPTIVE_RULES } from "../../adaptive-execution";
import { createDefaultLearningRuntime } from "../../execution-learning";
import {
  __buildFeedbackRecordForTest,
  __feedbackSignalKindsForTest,
  createDefaultFeedbackRuntime,
} from "../create-default-feedback-runtime";

describe("FeedbackRuntime", () => {
  function createRuntime() {
    const localMemoryRuntime = createDefaultLocalMemoryRuntime({
      useFileBackend: false,
    });
    const learningRuntime = createDefaultLearningRuntime({ localMemoryRuntime });
    return createDefaultFeedbackRuntime({ localMemoryRuntime, learningRuntime });
  }

  it("recordFeedback persists to local memory", () => {
    const runtime = createRuntime();
    const record = runtime.recordFeedback({
      userId: "user-1",
      taskId: "task-feedback",
      rating: "negative",
      comment: "retry failed steps",
      intentKind: "automate",
    });

    expect(record.recordId).toContain("feedback-task-feedback");
    expect(runtime.queryRecords({ userId: "user-1" })).toHaveLength(1);
  });

  it("evaluateFeedback returns no_feedback when history is empty", () => {
    const runtime = createRuntime();
    const signals = runtime.evaluateFeedback({ userId: "user-empty" });

    expect(__feedbackSignalKindsForTest(signals)).toContain("no_feedback");
  });

  it("evaluateFeedback detects user frustration from negative feedback", () => {
    const runtime = createRuntime();

    for (let index = 0; index < 3; index += 1) {
      runtime.recordFeedback({
        userId: "user-negative",
        taskId: `task-${index}`,
        rating: "negative",
        intentKind: "automate",
      });
    }

    const signals = runtime.evaluateFeedback({
      userId: "user-negative",
      intentKind: "automate",
    });

    expect(__feedbackSignalKindsForTest(signals)).toContain("user_frustrated");
    expect(__feedbackSignalKindsForTest(signals)).toContain("user_prefers_retry");
  });

  it("applyFeedback increases retry maxRetries from frustrated signals", () => {
    const runtime = createRuntime();
    const rules = runtime.applyFeedback({
      baseRules: DEFAULT_STUB_ADAPTIVE_RULES,
      signals: [
        {
          kind: "user_frustrated",
          message: "frustrated",
          confidence: 0.9,
          sampleSize: 3,
        },
      ],
    });

    const retryRule = rules.find((rule) => rule.action === "retry");
    expect(retryRule?.maxRetries).toBe(3);
  });

  it("applyFeedback returns base rules on no_feedback fallback", () => {
    const runtime = createRuntime();
    const rules = runtime.applyFeedback({
      baseRules: DEFAULT_STUB_ADAPTIVE_RULES,
      signals: [
        {
          kind: "no_feedback",
          message: "none",
          confidence: 1,
          sampleSize: 0,
        },
      ],
    });

    expect(rules).toEqual(DEFAULT_STUB_ADAPTIVE_RULES);
  });

  it("generateInsights combines feedback and learning counts", () => {
    const runtime = createRuntime();
    runtime.recordFeedback({
      userId: "user-insights",
      taskId: "task-insights",
      rating: "positive",
      intentKind: "automate",
    });

    const insights = runtime.generateInsights({
      userId: "user-insights",
      intentKind: "automate",
    });

    expect(insights.feedbackCount).toBe(1);
    expect(insights.positiveRate).toBe(1);
    expect(insights.signals.length).toBeGreaterThan(0);
  });

  it("uses deterministic test helper records", () => {
    const record = __buildFeedbackRecordForTest({ rating: "neutral" });
    expect(record.rating).toBe("neutral");
  });
});
