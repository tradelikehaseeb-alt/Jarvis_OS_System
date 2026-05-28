import type { TaskIntent } from "@jarvis/types";
import { normalizeDemoScenarioCommand } from "@jarvis/types";

import {
  mapVoiceTranscriptToBrowserWorkflow,
  voiceHintToTaskIntent,
  type VoiceBrowserWorkflowHint,
} from "./browser-workflow-intent";

export type VoiceWorkflowPhase =
  | "idle"
  | "listening"
  | "processing"
  | "executing"
  | "speaking"
  | "interrupted"
  | "completed";

export interface VoiceWorkflowSessionState {
  readonly sessionId: string;
  readonly phase: VoiceWorkflowPhase;
  readonly transcript: string;
  readonly workflowHint?: VoiceBrowserWorkflowHint;
  readonly intent?: TaskIntent;
  readonly interrupted: boolean;
  readonly startedAt: string;
  readonly updatedAt: string;
}

export interface VoiceWorkflowSessionOptions {
  readonly sessionId?: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Tracks voice-driven workflow state from wake word through spoken response (Phase 96).
 */
export class VoiceWorkflowSession {
  readonly sessionId: string;
  private phase: VoiceWorkflowPhase = "idle";
  private transcript = "";
  private workflowHint: VoiceBrowserWorkflowHint | undefined;
  private intent: TaskIntent | undefined;
  private interrupted = false;
  private readonly startedAt: string;
  private updatedAt: string;

  constructor(options: VoiceWorkflowSessionOptions = {}) {
    this.sessionId = options.sessionId ?? `voice-wf-${Date.now()}`;
    this.startedAt = nowIso();
    this.updatedAt = this.startedAt;
  }

  getState(): VoiceWorkflowSessionState {
    return {
      sessionId: this.sessionId,
      phase: this.phase,
      transcript: this.transcript,
      workflowHint: this.workflowHint,
      intent: this.intent,
      interrupted: this.interrupted,
      startedAt: this.startedAt,
      updatedAt: this.updatedAt,
    };
  }

  onWakeWord(): VoiceWorkflowSessionState {
    this.phase = "listening";
    this.interrupted = false;
    this.touch();
    return this.getState();
  }

  onTranscript(raw: string): VoiceWorkflowSessionState {
    this.transcript = normalizeDemoScenarioCommand(raw);
    this.phase = "processing";
    this.workflowHint = mapVoiceTranscriptToBrowserWorkflow(this.transcript);
    this.intent = this.workflowHint
      ? voiceHintToTaskIntent(this.workflowHint)
      : undefined;
    this.touch();
    return this.getState();
  }

  onExecutionStart(): VoiceWorkflowSessionState {
    this.phase = "executing";
    this.touch();
    return this.getState();
  }

  onSpeaking(): VoiceWorkflowSessionState {
    this.phase = "speaking";
    this.touch();
    return this.getState();
  }

  onInterrupt(): VoiceWorkflowSessionState {
    this.interrupted = true;
    this.phase = "interrupted";
    this.touch();
    return this.getState();
  }

  onComplete(): VoiceWorkflowSessionState {
    this.phase = "completed";
    this.touch();
    return this.getState();
  }

  resolveIntent(fallback: TaskIntent): TaskIntent {
    return this.intent ?? fallback;
  }

  private touch(): void {
    this.updatedAt = nowIso();
  }
}

export function createVoiceWorkflowSession(
  options?: VoiceWorkflowSessionOptions,
): VoiceWorkflowSession {
  return new VoiceWorkflowSession(options);
}
