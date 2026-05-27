import type { VoiceExecutionRequest } from "./voice-execution-request";
import type { VoiceExecutionResult } from "./voice-execution-result";

/**
 * Task execution delegate after speech normalization (Phase 72).
 */
export interface VoiceExecutionTaskExecutorInput {
  readonly normalizedText: string;
  readonly originalText: string;
  readonly requestId: string;
  readonly conversationId?: string;
  readonly userId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface VoiceExecutionTaskExecutorOutput {
  readonly taskId?: string;
  readonly taskStatus?: unknown;
  readonly classification?: VoiceExecutionResult["classification"];
  readonly activityStream?: unknown;
  readonly error?: VoiceExecutionResult["error"];
}

export type VoiceExecutionTaskExecutor = (
  input: VoiceExecutionTaskExecutorInput,
) => Promise<VoiceExecutionTaskExecutorOutput>;

/**
 * Voice → speech → task execution runtime contract (Phase 72).
 */
export interface VoiceExecutionRuntime {
  startVoiceExecution(request: VoiceExecutionRequest): string;
  stopVoiceExecution(executionId: string): void;
  processVoiceInput(request: VoiceExecutionRequest): Promise<VoiceExecutionResult>;
}
