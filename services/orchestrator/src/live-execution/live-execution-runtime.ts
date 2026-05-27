import type { LiveExecutionResult } from "./live-execution-result";
import type { LiveExecutionSession } from "./live-execution-session";
import type { LiveExecutionTelemetry } from "./live-execution-telemetry";

export interface StartLiveExecutionInput {
  readonly userId?: string;
  readonly conversationId?: string;
  readonly providerId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface ExecuteLiveTaskInput {
  readonly sessionId: string;
  readonly command: string;
  readonly skipSpeechNormalization?: boolean;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export type LiveExecutionUpdateKind =
  | "session_started"
  | "provider_resolved"
  | "task_submitted"
  | "planning"
  | "executing"
  | "timeline"
  | "workspace"
  | "completed"
  | "failed";

export interface LiveExecutionUpdate {
  readonly sessionId: string;
  readonly kind: LiveExecutionUpdateKind;
  readonly timestamp: string;
  readonly message: string;
  readonly detail?: Readonly<Record<string, unknown>>;
}

export interface LiveExecutionSubscriber {
  readonly subscriberId: string;
  onUpdate(update: LiveExecutionUpdate): void;
}

/**
 * End-to-end live execution runtime (Phase 84).
 */
export interface LiveExecutionRuntime {
  startLiveExecution(input: StartLiveExecutionInput): LiveExecutionSession;
  executeLiveTask(input: ExecuteLiveTaskInput): Promise<LiveExecutionResult>;
  streamLiveUpdates(
    sessionId: string,
    subscriber: LiveExecutionSubscriber,
  ): () => void;
  captureTelemetry(sessionId: string): LiveExecutionTelemetry;
  getSession(sessionId: string): LiveExecutionSession | undefined;
}
