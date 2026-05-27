import {
  createDefaultVoiceExecutionRuntime,
  type VoiceExecutionTaskExecutor,
} from "@jarvis/speech-service";

import type { TaskLifecycleOperations } from "../orchestrator-service-impl";
import {
  buildTaskIntentFromClassification,
  classifyChatIntent,
} from "../e2e/intent-adapter";

export interface CreateOrchestratorVoiceExecutionRuntimeOptions {
  readonly orchestrator: TaskLifecycleOperations;
  readonly taskExecutor?: VoiceExecutionTaskExecutor;
}

/**
 * Voice execution runtime wired to orchestrator task lifecycle (Phase 72).
 */
export function createOrchestratorVoiceExecutionRuntime(
  options: CreateOrchestratorVoiceExecutionRuntimeOptions,
) {
  const taskExecutor: VoiceExecutionTaskExecutor =
    options.taskExecutor ??
    (async (input) => {
      const classification = classifyChatIntent(input.normalizedText);
      const intent = buildTaskIntentFromClassification(
        input.normalizedText,
        classification,
      );

      const { record } = await options.orchestrator.executeCreateTask({
        intent,
        userId: input.userId,
        correlationId: `voice-${input.requestId}`,
        metadata: {
          ...input.metadata,
          source: "voice-execution",
          classifiedIntent: classification.intent,
          classificationRule: classification.ruleId,
          conversationId: input.conversationId,
        },
      });

      if (record.taskStatus.status === "failed") {
        return {
          taskId: record.createTaskResponse.taskId,
          taskStatus: record.taskStatus,
          classification: {
            intent: classification.intent,
            ruleId: classification.ruleId,
            confidence: classification.confidence,
            reason: classification.reason,
          },
          activityStream: record.taskStatus.output?.activityStream,
          error: {
            code: record.taskStatus.error?.code ?? "TASK_FAILED",
            message:
              record.taskStatus.error?.message ?? "Voice task execution failed",
          },
        };
      }

      return {
        taskId: record.createTaskResponse.taskId,
        taskStatus: record.taskStatus,
        classification: {
          intent: classification.intent,
          ruleId: classification.ruleId,
          confidence: classification.confidence,
          reason: classification.reason,
        },
        activityStream: record.taskStatus.output?.activityStream,
      };
    });

  return createDefaultVoiceExecutionRuntime({ taskExecutor });
}
