import type { TaskIntent } from "@jarvis/types";
import type { NormalizationResult } from "@jarvis/speech-service";

import type { TaskExecutionRecord } from "../storage";
import type { StreamEventType } from "../streaming";

/** Client-side intent classification snapshot (mirrors desktop classifier output). */
export interface JarvisFlowIntentClassification {
  readonly intent: string;
  readonly ruleId: string;
  readonly reason: string;
  readonly confidence: number;
}

/** Single step recorded during {@link JarvisExecutionFlow.executeFlow}. */
export interface JarvisExecutionFlowStep {
  readonly step: JarvisExecutionFlowStepId;
  readonly timestamp: string;
  readonly detail?: Readonly<Record<string, unknown>>;
}

export type JarvisExecutionFlowStepId =
  | "input_received"
  | "speech_normalized"
  | "intent_classified"
  | "task_submitted"
  | "hermes_planning"
  | "openclaw_execution"
  | "lifecycle_completed"
  | "memory_persisted"
  | "stream_completed"
  | "failed";

/** Activity timeline projection for Desktop consumption (Phase 49). */
export interface JarvisFlowActivityProjection {
  readonly kind: string;
  readonly label: string;
  readonly status: string;
}

/** Agent status projection aligned with Desktop agent-status (Phase 49). */
export interface JarvisFlowAgentStatusProjection {
  readonly hermes: string;
  readonly openClaw: string;
  readonly displayMessage: string;
  readonly memoryUpdating: boolean;
  readonly error?: string;
}

/** UI-facing projection derived from orchestrator task output. */
export interface JarvisExecutionFlowUiProjection {
  readonly activityEvents: readonly JarvisFlowActivityProjection[];
  readonly agentStatus: JarvisFlowAgentStatusProjection;
  readonly streamEventTypes: readonly StreamEventType[];
}

/**
 * Full result of {@link JarvisExecutionFlow.executeFlow} (Phase 50).
 */
export interface JarvisExecutionFlowResult {
  readonly rawInput: string;
  readonly normalization?: NormalizationResult;
  readonly classification?: JarvisFlowIntentClassification;
  readonly taskIntent: TaskIntent;
  readonly record: TaskExecutionRecord;
  readonly steps: readonly JarvisExecutionFlowStep[];
  readonly streamEvents: readonly StreamEventType[];
  readonly uiProjection: JarvisExecutionFlowUiProjection;
}

/**
 * Condensed execution summary for logging, tests, and response formatting.
 */
export interface JarvisExecutionSummary {
  readonly taskId: string;
  readonly status: string;
  readonly intentKind: string;
  readonly lifecycleState: string;
  readonly hermesState: string;
  readonly openClawState: string;
  readonly memorySummary?: string;
  readonly responseMessage: string;
  readonly completed: boolean;
  readonly failed: boolean;
  readonly handshake: boolean;
}
