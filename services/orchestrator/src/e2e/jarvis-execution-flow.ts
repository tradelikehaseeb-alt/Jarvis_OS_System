import type {
  JarvisExecutionFlowResult,
  JarvisExecutionSummary,
} from "./jarvis-execution-flow-result";

/** Input to the end-to-end Jarvis execution flow (Phase 50). */
export interface JarvisExecutionFlowInput {
  readonly rawInput: string;
  readonly conversationId?: string;
  readonly userId?: string;
  readonly correlationId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  /** Skip speech-service normalization (chat text already clean). */
  readonly skipSpeechNormalization?: boolean;
}

/**
 * End-to-end Jarvis flow: speech → intent → orchestrator → lifecycle → memory → stream.
 */
export interface JarvisExecutionFlow {
  executeFlow(
    input: JarvisExecutionFlowInput,
  ): Promise<JarvisExecutionFlowResult>;

  getExecutionSummary(
    result: JarvisExecutionFlowResult,
  ): JarvisExecutionSummary;
}
