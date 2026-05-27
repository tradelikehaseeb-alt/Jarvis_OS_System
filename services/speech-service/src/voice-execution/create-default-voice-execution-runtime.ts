import { SpeechNormalizer } from "../speech-normalizer";
import { createDefaultSpeechGateway } from "../gateway/speech-gateway-factory";
import type { SpeechGateway } from "../gateway/speech-gateway";

import type { VoiceExecutionRequest } from "./voice-execution-request";
import type { VoiceExecutionResult } from "./voice-execution-result";
import type {
  VoiceExecutionRuntime,
  VoiceExecutionTaskExecutor,
} from "./voice-execution-runtime";

export interface CreateDefaultVoiceExecutionRuntimeOptions {
  readonly speechGateway?: SpeechGateway;
  readonly normalizer?: SpeechNormalizer;
  readonly taskExecutor?: VoiceExecutionTaskExecutor;
}

interface ActiveVoiceExecution {
  readonly requestId: string;
  readonly abortController: AbortController;
}

let executionCounter = 0;

function nextExecutionId(): string {
  executionCounter += 1;
  return `voice-execution-${executionCounter}`;
}

class DefaultVoiceExecutionRuntime implements VoiceExecutionRuntime {
  private readonly speechGateway: SpeechGateway;
  private readonly normalizer: SpeechNormalizer;
  private readonly taskExecutor?: VoiceExecutionTaskExecutor;
  private readonly activeExecutions = new Map<string, ActiveVoiceExecution>();

  constructor(options: CreateDefaultVoiceExecutionRuntimeOptions = {}) {
    this.speechGateway = options.speechGateway ?? createDefaultSpeechGateway();
    this.normalizer = options.normalizer ?? new SpeechNormalizer();
    this.taskExecutor = options.taskExecutor;
  }

  startVoiceExecution(request: VoiceExecutionRequest): string {
    const executionId = request.executionId ?? nextExecutionId();
    this.activeExecutions.set(executionId, {
      requestId: request.requestId,
      abortController: new AbortController(),
    });
    return executionId;
  }

  stopVoiceExecution(executionId: string): void {
    const active = this.activeExecutions.get(executionId);
    if (active) {
      active.abortController.abort();
    }
  }

  async processVoiceInput(
    request: VoiceExecutionRequest,
  ): Promise<VoiceExecutionResult> {
    const trimmed = request.rawInput.trim();
    if (!trimmed) {
      return {
        executionId: request.executionId ?? nextExecutionId(),
        requestId: request.requestId,
        originalInput: request.rawInput,
        normalizedInput: "",
        success: false,
        error: { code: "EMPTY_INPUT", message: "Voice input must not be empty" },
      };
    }

    const executionId =
      request.executionId ?? this.startVoiceExecution(request);
    const active = this.activeExecutions.get(executionId);
    const signal = active?.abortController.signal;

    if (signal?.aborted) {
      return {
        executionId,
        requestId: request.requestId,
        originalInput: trimmed,
        normalizedInput: trimmed,
        success: false,
        error: { code: "EXECUTION_STOPPED", message: "Voice execution stopped" },
      };
    }

    const conversationId =
      request.conversationId ?? `voice-conversation-${executionId}`;

    let normalizedInput = trimmed;
    let speechMetadata: VoiceExecutionResult["speechMetadata"];

    if (!request.skipNormalization) {
      const normalized = this.normalizer.normalize(trimmed, { domain: "trading" });
      normalizedInput = normalized.normalized;

      const gatewayResult = await this.speechGateway.processTranscript({
        requestId: request.requestId,
        transcript: trimmed,
        conversationId,
        requestedCapabilities: ["low-latency"],
        providerIds: ["stt-local", "stt-cloud"],
      });

      const actionResponse = await this.speechGateway.processAction({
        requestId: request.requestId,
        transcript: normalizedInput,
        conversationId,
      });

      speechMetadata = {
        detectedAction: actionResponse.action?.type ?? "none",
        providerDecision: gatewayResult.routing.providerId,
        conversationState: "completed",
        normalizationApplied: normalizedInput !== trimmed,
      };
    }

    if (signal?.aborted) {
      this.activeExecutions.delete(executionId);
      return {
        executionId,
        requestId: request.requestId,
        originalInput: trimmed,
        normalizedInput,
        speechMetadata,
        success: false,
        error: { code: "EXECUTION_STOPPED", message: "Voice execution stopped" },
      };
    }

    if (!this.taskExecutor) {
      this.activeExecutions.delete(executionId);
      return {
        executionId,
        requestId: request.requestId,
        originalInput: trimmed,
        normalizedInput,
        speechMetadata,
        success: true,
      };
    }

    try {
      const taskResult = await this.taskExecutor({
        normalizedText: normalizedInput,
        originalText: trimmed,
        requestId: request.requestId,
        conversationId,
        userId: request.userId,
        metadata: {
          ...request.metadata,
          source: "voice-execution",
          speechMetadata,
        },
      });

      this.activeExecutions.delete(executionId);

      if (taskResult.error) {
        return {
          executionId,
          requestId: request.requestId,
          originalInput: trimmed,
          normalizedInput,
          speechMetadata,
          classification: taskResult.classification,
          taskId: taskResult.taskId,
          taskStatus: taskResult.taskStatus,
          activityStream: taskResult.activityStream,
          success: false,
          error: taskResult.error,
        };
      }

      return {
        executionId,
        requestId: request.requestId,
        originalInput: trimmed,
        normalizedInput,
        speechMetadata,
        classification: taskResult.classification,
        taskId: taskResult.taskId,
        taskStatus: taskResult.taskStatus,
        activityStream: taskResult.activityStream,
        success: true,
      };
    } catch (error) {
      this.activeExecutions.delete(executionId);
      const message =
        error instanceof Error ? error.message : "Voice execution failed";
      return {
        executionId,
        requestId: request.requestId,
        originalInput: trimmed,
        normalizedInput,
        speechMetadata,
        success: false,
        error: { code: "TASK_EXECUTION_FAILED", message },
      };
    }
  }
}

/**
 * Factory for default voice execution runtime — speech pipeline + optional task delegate (Phase 72).
 */
export function createDefaultVoiceExecutionRuntime(
  options?: CreateDefaultVoiceExecutionRuntimeOptions,
): VoiceExecutionRuntime {
  return new DefaultVoiceExecutionRuntime(options);
}
