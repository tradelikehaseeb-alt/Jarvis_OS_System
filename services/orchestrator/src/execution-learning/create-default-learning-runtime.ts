import {
  LOCAL_MEMORY_SCHEMA_VERSION,
  type LocalMemoryRuntime,
} from "@jarvis/local-memory";

import { DEFAULT_STUB_ADAPTIVE_RULES } from "../adaptive-execution";

import {
  EXECUTION_LEARNING_CONTENT_CATEGORY,
  type ExecutionLearningRecord,
} from "./execution-learning-record";
import {
  DEFAULT_LEARNING_DECISION_RULES,
  type LearningDecisionRule,
} from "./learning-decision-rule";
import type { LearningSignal, LearningSignalKind } from "./learning-signal";
import type {
  ApplyLearningInput,
  EvaluateLearningInput,
  GetLearningInsightsInput,
  LearningInsights,
  LearningRuntime,
  RecordExecutionOutcomeInput,
} from "./learning-runtime";

export interface CreateDefaultLearningRuntimeOptions {
  readonly localMemoryRuntime: LocalMemoryRuntime;
  readonly decisionRules?: readonly LearningDecisionRule[];
  readonly defaultSampleLimit?: number;
}

const ELEVATED_FAILURE_RATE_THRESHOLD = 0.3;

let recordCounter = 0;

function nextRecordId(taskId: string): string {
  recordCounter += 1;
  return `learning-${taskId}-${recordCounter}`;
}

function isLearningRecord(
  content: Readonly<Record<string, unknown>>,
): content is Readonly<Record<string, unknown>> & {
  category: typeof EXECUTION_LEARNING_CONTENT_CATEGORY;
  record: ExecutionLearningRecord;
} {
  return (
    content.category === EXECUTION_LEARNING_CONTENT_CATEGORY &&
    typeof content.record === "object" &&
    content.record !== null
  );
}

function countFailures(adaptiveResult: RecordExecutionOutcomeInput["adaptiveResult"]): number {
  return adaptiveResult.executionResults.filter((result) => !result.success).length;
}

class DefaultLearningRuntime implements LearningRuntime {
  private readonly decisionRules: readonly LearningDecisionRule[];
  private readonly defaultSampleLimit: number;

  constructor(private readonly options: CreateDefaultLearningRuntimeOptions) {
    this.decisionRules =
      options.decisionRules ?? DEFAULT_LEARNING_DECISION_RULES;
    this.defaultSampleLimit = options.defaultSampleLimit ?? 20;
  }

  recordExecutionOutcome(
    input: RecordExecutionOutcomeInput,
  ): ExecutionLearningRecord {
    const timestamp = new Date().toISOString();
    const record: ExecutionLearningRecord = {
      recordId: nextRecordId(input.taskId),
      userId: input.userId,
      taskId: input.taskId,
      intentKind: input.intentKind,
      success: input.adaptiveResult.success,
      stepCount: input.adaptiveResult.executionResults.length,
      failureCount: countFailures(input.adaptiveResult),
      stub: input.adaptiveResult.stub,
      timestamp,
      executionId: input.adaptiveResult.executionId,
      conversationId: input.conversationId,
      sessionId: input.sessionId,
    };

    this.options.localMemoryRuntime.saveMemory({
      recordId: record.recordId,
      type: "execution",
      userId: input.userId,
      timestamp,
      taskId: input.taskId,
      sessionId: input.sessionId,
      conversationId: input.conversationId,
      content: {
        category: EXECUTION_LEARNING_CONTENT_CATEGORY,
        record,
      },
      schemaVersion: LOCAL_MEMORY_SCHEMA_VERSION,
    });

    return record;
  }

  queryRecords(input: EvaluateLearningInput): readonly ExecutionLearningRecord[] {
    const limit = input.sampleLimit ?? this.defaultSampleLimit;
    const records = this.options.localMemoryRuntime.queryMemory({
      userId: input.userId,
      types: ["execution"],
      limit: limit * 3,
    });

    const learningRecords = records
      .map((entry) => {
        if (!isLearningRecord(entry.content)) {
          return undefined;
        }
        return entry.content.record;
      })
      .filter((record): record is ExecutionLearningRecord => record !== undefined)
      .filter(
        (record) =>
          !input.intentKind || record.intentKind === input.intentKind,
      )
      .slice(0, limit);

    return learningRecords;
  }

  evaluateLearning(input: EvaluateLearningInput): readonly LearningSignal[] {
    const records = this.queryRecords(input);

    if (records.length === 0) {
      return [
        {
          kind: "no_data",
          message: "No execution learning history — using deterministic fallback",
          confidence: 1,
          sampleSize: 0,
        },
      ];
    }

    const failures = records.filter((record) => !record.success).length;
    const failureRate = failures / records.length;
    const signals: LearningSignal[] = [];

    if (failureRate === 0 && records.length >= 2) {
      signals.push({
        kind: "stable_success",
        message: "Recent executions succeeded — keep default adaptive rules",
        confidence: 0.9,
        sampleSize: records.length,
      });
    }

    if (failureRate > ELEVATED_FAILURE_RATE_THRESHOLD) {
      signals.push({
        kind: "elevated_failure_rate",
        message: `Failure rate ${Math.round(failureRate * 100)}% — increase retry tolerance`,
        confidence: Math.min(0.95, 0.5 + failureRate),
        sampleSize: records.length,
      });
    } else if (failures > 0 && records.length >= 2) {
      signals.push({
        kind: "retry_recommended",
        message: "Intermittent failures detected — prefer retry on step failure",
        confidence: 0.75,
        sampleSize: records.length,
      });
    }

    if (signals.length === 0) {
      signals.push({
        kind: "no_data",
        message: "Insufficient pattern — using deterministic fallback",
        confidence: 0.6,
        sampleSize: records.length,
      });
    }

    return signals;
  }

  applyLearning(input: ApplyLearningInput): ReturnType<LearningRuntime["applyLearning"]> {
    const decisionRules = input.decisionRules ?? this.decisionRules;
    const signalKinds = new Set(input.signals.map((signal) => signal.kind));

    if (signalKinds.has("no_data") && input.signals.length === 1) {
      return [...input.baseRules];
    }

    let rules = [...input.baseRules];

    for (const decisionRule of decisionRules) {
      if (!signalKinds.has(decisionRule.whenSignal)) {
        continue;
      }

      rules = rules.map((rule) => {
        if (
          decisionRule.preferAction &&
          rule.action !== decisionRule.preferAction
        ) {
          return rule;
        }

        if (
          decisionRule.adjustMaxRetries !== undefined &&
          rule.action === "retry"
        ) {
          return {
            ...rule,
            maxRetries: Math.max(
              rule.maxRetries ?? 1,
              decisionRule.adjustMaxRetries,
            ),
          };
        }

        return rule;
      });
    }

    return rules;
  }

  getLearningInsights(input: GetLearningInsightsInput): LearningInsights {
    const records = this.queryRecords(input);
    const signals = this.evaluateLearning(input);
    const successCount = records.filter((record) => record.success).length;
    const successRate =
      records.length === 0 ? 0 : successCount / records.length;

    return {
      userId: input.userId,
      intentKind: input.intentKind,
      recordCount: records.length,
      successRate,
      signals,
      stub: records.length === 0 || records.every((record) => record.stub),
    };
  }
}

/** Factory for execution learning runtime backed by local memory (Phase 79). */
export function createDefaultLearningRuntime(
  options: CreateDefaultLearningRuntimeOptions,
): LearningRuntime {
  return new DefaultLearningRuntime(options);
}

/** @internal test helper */
export function __buildLearningRecordForTest(
  overrides: Partial<ExecutionLearningRecord> = {},
): ExecutionLearningRecord {
  return {
    recordId: "learning-test-1",
    userId: "user-1",
    taskId: "task-1",
    intentKind: "automate",
    success: true,
    stepCount: 2,
    failureCount: 0,
    stub: true,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

/** @internal test helper */
export function __signalKindsForTest(
  signals: readonly LearningSignal[],
): readonly LearningSignalKind[] {
  return signals.map((signal) => signal.kind);
}

/** @internal re-export for tests */
export {
  DEFAULT_LEARNING_DECISION_RULES,
  DEFAULT_STUB_ADAPTIVE_RULES,
  ELEVATED_FAILURE_RATE_THRESHOLD,
};
