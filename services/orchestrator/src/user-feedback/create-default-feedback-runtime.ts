import {
  LOCAL_MEMORY_SCHEMA_VERSION,
  type LocalMemoryRuntime,
} from "@jarvis/local-memory";

import type { AdaptiveExecutionRule } from "../adaptive-execution";
import type { LearningRuntime } from "../execution-learning";

import type { FeedbackSignal, FeedbackSignalKind } from "./feedback-signal";
import type {
  ApplyFeedbackInput,
  EvaluateFeedbackInput,
  FeedbackInsight,
  FeedbackRuntime,
  GenerateInsightsInput,
  RecordFeedbackInput,
} from "./feedback-runtime";
import {
  USER_FEEDBACK_CONTENT_CATEGORY,
  type UserFeedbackRecord,
} from "./user-feedback-record";

export interface CreateDefaultFeedbackRuntimeOptions {
  readonly localMemoryRuntime: LocalMemoryRuntime;
  readonly learningRuntime?: LearningRuntime;
  readonly defaultSampleLimit?: number;
}

const FRUSTRATED_NEGATIVE_RATE_THRESHOLD = 0.4;

let recordCounter = 0;

function nextRecordId(taskId: string): string {
  recordCounter += 1;
  return `feedback-${taskId}-${recordCounter}`;
}

function isFeedbackRecord(
  content: Readonly<Record<string, unknown>>,
): content is Readonly<Record<string, unknown>> & {
  category: typeof USER_FEEDBACK_CONTENT_CATEGORY;
  record: UserFeedbackRecord;
} {
  return (
    content.category === USER_FEEDBACK_CONTENT_CATEGORY &&
    typeof content.record === "object" &&
    content.record !== null
  );
}

class DefaultFeedbackRuntime implements FeedbackRuntime {
  private readonly defaultSampleLimit: number;

  constructor(private readonly options: CreateDefaultFeedbackRuntimeOptions) {
    this.defaultSampleLimit = options.defaultSampleLimit ?? 20;
  }

  recordFeedback(input: RecordFeedbackInput): UserFeedbackRecord {
    const timestamp = new Date().toISOString();
    const record: UserFeedbackRecord = {
      recordId: nextRecordId(input.taskId),
      userId: input.userId,
      taskId: input.taskId,
      intentKind: input.intentKind,
      rating: input.rating,
      comment: input.comment,
      executionSuccess: input.executionSuccess,
      stub: input.stub ?? true,
      timestamp,
      conversationId: input.conversationId,
      sessionId: input.sessionId,
    };

    this.options.localMemoryRuntime.saveMemory({
      recordId: record.recordId,
      type: "activity",
      userId: input.userId,
      timestamp,
      taskId: input.taskId,
      sessionId: input.sessionId,
      conversationId: input.conversationId,
      content: {
        category: USER_FEEDBACK_CONTENT_CATEGORY,
        record,
      },
      schemaVersion: LOCAL_MEMORY_SCHEMA_VERSION,
    });

    return record;
  }

  queryRecords(input: EvaluateFeedbackInput): readonly UserFeedbackRecord[] {
    const limit = input.sampleLimit ?? this.defaultSampleLimit;
    const records = this.options.localMemoryRuntime.queryMemory({
      userId: input.userId,
      types: ["activity"],
      limit: limit * 3,
    });

    return records
      .map((entry) => {
        if (!isFeedbackRecord(entry.content)) {
          return undefined;
        }
        return entry.content.record;
      })
      .filter((record): record is UserFeedbackRecord => record !== undefined)
      .filter(
        (record) =>
          !input.intentKind || record.intentKind === input.intentKind,
      )
      .slice(0, limit);
  }

  evaluateFeedback(input: EvaluateFeedbackInput): readonly FeedbackSignal[] {
    const records = this.queryRecords(input);

    if (records.length === 0) {
      return [
        {
          kind: "no_feedback",
          message: "No user feedback — using deterministic fallback",
          confidence: 1,
          sampleSize: 0,
        },
      ];
    }

    const negativeCount = records.filter(
      (record) => record.rating === "negative",
    ).length;
    const positiveCount = records.filter(
      (record) => record.rating === "positive",
    ).length;
    const negativeRate = negativeCount / records.length;
    const signals: FeedbackSignal[] = [];

    if (positiveCount > 0 && negativeCount === 0) {
      signals.push({
        kind: "user_satisfied",
        message: "User feedback is positive — keep adaptive defaults",
        confidence: 0.85,
        sampleSize: records.length,
      });
    }

    if (negativeRate >= FRUSTRATED_NEGATIVE_RATE_THRESHOLD) {
      signals.push({
        kind: "user_frustrated",
        message: "Negative feedback trend — increase retry tolerance",
        confidence: Math.min(0.95, 0.5 + negativeRate),
        sampleSize: records.length,
      });
    }

    const retryComments = records.filter(
      (record) =>
        record.rating === "negative" &&
        typeof record.comment === "string" &&
        /retry|again|repeat/i.test(record.comment),
    ).length;

    if (retryComments > 0 || (negativeCount > 0 && records.length >= 1)) {
      signals.push({
        kind: "user_prefers_retry",
        message: "User feedback suggests more retries on failure",
        confidence: retryComments > 0 ? 0.9 : 0.7,
        sampleSize: records.length,
      });
    }

    if (signals.length === 0) {
      signals.push({
        kind: "no_feedback",
        message: "Neutral feedback pattern — using deterministic fallback",
        confidence: 0.6,
        sampleSize: records.length,
      });
    }

    return signals;
  }

  applyFeedback(input: ApplyFeedbackInput): readonly AdaptiveExecutionRule[] {
    const signalKinds = new Set(input.signals.map((signal) => signal.kind));

    if (signalKinds.has("no_feedback") && input.signals.length === 1) {
      return [...input.baseRules];
    }

    let rules = [...input.baseRules];

    if (
      signalKinds.has("user_frustrated") ||
      signalKinds.has("user_prefers_retry")
    ) {
      rules = rules.map((rule) => {
        if (rule.action !== "retry") {
          return rule;
        }
        return {
          ...rule,
          maxRetries: Math.max(rule.maxRetries ?? 1, 3),
        };
      });
    }

    if (signalKinds.has("user_satisfied") && !signalKinds.has("user_frustrated")) {
      return [...input.baseRules];
    }

    return rules;
  }

  generateInsights(input: GenerateInsightsInput): FeedbackInsight {
    const records = this.queryRecords(input);
    const signals = this.evaluateFeedback(input);
    const positiveCount = records.filter(
      (record) => record.rating === "positive",
    ).length;
    const positiveRate =
      records.length === 0 ? 0 : positiveCount / records.length;

    const learningRuntime =
      input.learningRuntime ?? this.options.learningRuntime;
    const learningInsights = learningRuntime?.getLearningInsights({
      userId: input.userId,
      intentKind: input.intentKind,
      sampleLimit: input.sampleLimit,
    });

    return {
      userId: input.userId,
      intentKind: input.intentKind,
      feedbackCount: records.length,
      positiveRate,
      signals,
      stub: records.length === 0 || records.every((record) => record.stub),
      learningRecordCount: learningInsights?.recordCount,
    };
  }
}

/** Factory for user feedback intelligence runtime (Phase 80). */
export function createDefaultFeedbackRuntime(
  options: CreateDefaultFeedbackRuntimeOptions,
): FeedbackRuntime {
  return new DefaultFeedbackRuntime(options);
}

/** Parse user feedback from task metadata (Phase 80). */
export function parseUserFeedbackFromMetadata(
  metadata: Readonly<Record<string, unknown>> | undefined,
): {
  readonly taskId?: string;
  readonly rating: import("./user-feedback-record").UserFeedbackRating;
  readonly comment?: string;
} | undefined {
  const raw = metadata?.userFeedback;
  if (!raw || typeof raw !== "object") {
    return undefined;
  }

  const feedback = raw as Readonly<Record<string, unknown>>;
  const rating = feedback.rating;
  if (rating !== "positive" && rating !== "negative" && rating !== "neutral") {
    return undefined;
  }

  return {
    taskId:
      typeof feedback.taskId === "string" ? feedback.taskId.trim() : undefined,
    rating,
    comment:
      typeof feedback.comment === "string" ? feedback.comment.trim() : undefined,
  };
}

/** @internal test helper */
export function __buildFeedbackRecordForTest(
  overrides: Partial<UserFeedbackRecord> = {},
): UserFeedbackRecord {
  return {
    recordId: "feedback-test-1",
    userId: "user-1",
    taskId: "task-1",
    rating: "negative",
    stub: true,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

/** @internal test helper */
export function __feedbackSignalKindsForTest(
  signals: readonly FeedbackSignal[],
): readonly FeedbackSignalKind[] {
  return signals.map((signal) => signal.kind);
}

/** @internal re-export for tests */
export { FRUSTRATED_NEGATIVE_RATE_THRESHOLD };
