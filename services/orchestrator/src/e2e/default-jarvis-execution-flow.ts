import {
  defaultSpeechNormalizer,
  type NormalizationResult,
} from "@jarvis/speech-service";
import type { TaskIntent } from "@jarvis/types";

import type { TaskLifecycleOperations } from "../orchestrator-service-impl";
import type { CreateTaskExecutionOptions } from "../task-execution/create-task-executor";
import {
  createDefaultExecutionLifecycleManager,
  type ExecutionLifecycleManager,
} from "../execution";
import {
  createDefaultMemoryPersistenceManager,
  type MemoryPersistenceManager,
} from "../memory";
import {
  createDefaultStreamManager,
  type StreamEventType,
  type StreamManager,
} from "../streaming";
import { buildExecutionSummary } from "./build-execution-summary";
import type { JarvisExecutionFlow } from "./jarvis-execution-flow";
import type {
  JarvisExecutionFlowInput,
  JarvisExecutionFlowResult,
  JarvisExecutionFlowStep,
  JarvisExecutionSummary,
  JarvisFlowIntentClassification,
} from "./jarvis-execution-flow-result";
import {
  buildTaskIntentFromClassification,
  classifyChatIntent,
  type IntentClassification,
} from "./intent-adapter";
import { projectUiFromTaskStatus } from "./project-ui-from-task-status";

export interface DefaultJarvisExecutionFlowDeps {
  readonly orchestrator: TaskLifecycleOperations;
  readonly streamManager?: StreamManager;
  readonly lifecycleManager?: ExecutionLifecycleManager;
  readonly memoryPersistenceManager?: MemoryPersistenceManager;
  readonly taskExecutionOptions?: CreateTaskExecutionOptions;
  readonly normalizeTranscript?: (
    text: string,
  ) => NormalizationResult | Promise<NormalizationResult>;
  readonly classifyIntent?: (message: string) => IntentClassification;
  readonly buildTaskIntent?: (
    message: string,
    classification: IntentClassification,
  ) => TaskIntent;
}

function nowIso(): string {
  return new Date().toISOString();
}

function toFlowClassification(
  classification: IntentClassification,
): JarvisFlowIntentClassification {
  return {
    intent: classification.intent,
    ruleId: classification.ruleId,
    reason: classification.reason,
    confidence: classification.confidence,
  };
}

/**
 * Default end-to-end Jarvis execution flow implementation (Phase 50).
 */
export class DefaultJarvisExecutionFlow implements JarvisExecutionFlow {
  private readonly orchestrator: TaskLifecycleOperations;
  private readonly streamManager: StreamManager;
  private readonly lifecycleManager: ExecutionLifecycleManager;
  private readonly memoryPersistenceManager: MemoryPersistenceManager;
  private readonly normalizeTranscript: (
    text: string,
  ) => NormalizationResult | Promise<NormalizationResult>;
  private readonly classifyIntent: (message: string) => IntentClassification;
  private readonly buildTaskIntent: (
    message: string,
    classification: IntentClassification,
  ) => TaskIntent;
  private readonly taskExecutionOptions?: CreateTaskExecutionOptions;

  constructor(deps: DefaultJarvisExecutionFlowDeps) {
    this.orchestrator = deps.orchestrator;
    this.streamManager = deps.streamManager ?? createDefaultStreamManager();
    this.lifecycleManager =
      deps.lifecycleManager ?? createDefaultExecutionLifecycleManager();
    this.memoryPersistenceManager =
      deps.memoryPersistenceManager ??
      createDefaultMemoryPersistenceManager(undefined, this.streamManager);
    this.normalizeTranscript =
      deps.normalizeTranscript ??
      ((text) => defaultSpeechNormalizer.normalize(text));
    this.classifyIntent = deps.classifyIntent ?? classifyChatIntent;
    this.buildTaskIntent =
      deps.buildTaskIntent ?? buildTaskIntentFromClassification;
    this.taskExecutionOptions = deps.taskExecutionOptions;
  }

  async executeFlow(
    input: JarvisExecutionFlowInput,
  ): Promise<JarvisExecutionFlowResult> {
    const steps: JarvisExecutionFlowStep[] = [
      {
        step: "input_received",
        timestamp: nowIso(),
        detail: { length: input.rawInput.length },
      },
    ];

    const streamEvents: StreamEventType[] = [];
    const streamSubscriberId = `e2e-flow-${Date.now()}`;
    const unsubscribe = this.streamManager.subscribe({
      subscriberId: streamSubscriberId,
      onEvent: (event) => {
        streamEvents.push(event.type);
      },
    });

    try {
      let workingText = input.rawInput;
      let normalization: NormalizationResult | undefined;

      if (!input.skipSpeechNormalization) {
        normalization = await this.normalizeTranscript(input.rawInput);
        workingText = normalization.normalized;
        steps.push({
          step: "speech_normalized",
          timestamp: nowIso(),
          detail: {
            original: normalization.original,
            normalized: normalization.normalized,
            corrections: normalization.appliedCorrections.length,
          },
        });
      }

      const classification = this.classifyIntent(workingText);
      steps.push({
        step: "intent_classified",
        timestamp: nowIso(),
        detail: {
          intent: classification.intent,
          ruleId: classification.ruleId,
          confidence: classification.confidence,
        },
      });

      const taskIntent = this.buildTaskIntent(workingText, classification);

      steps.push({
        step: "task_submitted",
        timestamp: nowIso(),
        detail: { kind: taskIntent.kind },
      });

      const { record } = await this.orchestrator.executeCreateTask(
        {
          intent: taskIntent,
          correlationId: input.correlationId,
          userId: input.userId,
          metadata: {
            ...input.metadata,
            ...(input.conversationId
              ? { conversationId: input.conversationId }
              : {}),
            classifiedIntent: classification.intent,
            classificationRule: classification.ruleId,
          },
        },
        {
          lifecycleManager: this.lifecycleManager,
          memoryPersistenceManager: this.memoryPersistenceManager,
          streamManager: this.streamManager,
          ...this.taskExecutionOptions,
        },
      );

      const lifecycle = record.taskStatus.output?.executionLifecycle as
        | { state?: string; handshake?: unknown }
        | undefined;

      if (streamEvents.includes("planning_started")) {
        steps.push({ step: "hermes_planning", timestamp: nowIso() });
      }
      if (streamEvents.includes("execution_started")) {
        steps.push({ step: "openclaw_execution", timestamp: nowIso() });
      }
      if (lifecycle?.state === "completed") {
        steps.push({ step: "lifecycle_completed", timestamp: nowIso() });
      }
      if (
        streamEvents.includes("memory_saved") ||
        streamEvents.includes("conversation_updated")
      ) {
        steps.push({ step: "memory_persisted", timestamp: nowIso() });
      }
      if (streamEvents.includes("execution_completed")) {
        steps.push({ step: "stream_completed", timestamp: nowIso() });
      }
      if (record.taskStatus.status === "failed") {
        steps.push({
          step: "failed",
          timestamp: nowIso(),
          detail: { message: record.taskStatus.error?.message },
        });
      }

      const uiProjection = projectUiFromTaskStatus(
        record.taskStatus,
        streamEvents,
      );

      return {
        rawInput: input.rawInput,
        normalization,
        classification: toFlowClassification(classification),
        taskIntent,
        record,
        steps,
        streamEvents,
        uiProjection,
      };
    } finally {
      unsubscribe();
    }
  }

  getExecutionSummary(
    result: JarvisExecutionFlowResult,
  ): JarvisExecutionSummary {
    return buildExecutionSummary(result);
  }
}
