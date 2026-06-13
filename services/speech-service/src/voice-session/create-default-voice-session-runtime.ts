import { resolveAssistantReplyFromTaskOutput } from "@jarvis/types";

import type { SpeechConversationManager } from "../conversation/speech-conversation-manager";
import { createDefaultSpeechConversationManager } from "../conversation/create-default-speech-conversation-manager";
import type { SpeechStreamManager } from "../events/speech-stream-manager";
import { InMemorySpeechStreamManager } from "../events/in-memory-speech-stream-manager";
import type { SpeechSessionManager } from "../session/speech-session-manager";
import { createDefaultSpeechSessionManager } from "../session/create-default-speech-session-manager";
import type {
  VoiceExecutionRuntime,
  VoiceExecutionTaskExecutor,
} from "../voice-execution/voice-execution-runtime";
import { createDefaultVoiceExecutionRuntime } from "../voice-execution/create-default-voice-execution-runtime";

import type { VoiceSessionMode } from "./voice-session-mode";
import { DEFAULT_VOICE_SESSION_MODE } from "./voice-session-mode";
import type { VoiceSessionState } from "./voice-session-state";
import {
  DEFAULT_WAKE_WORD_CONFIG,
  detectWakeWord,
  type WakeWordConfig,
  type WakeWordState,
} from "./wake-word-state";
import { naturalWordDelayMs } from "../real-time/speech-timing";

export interface VoiceSessionCaptureResult {
  readonly transcript: string;
  readonly partialChunks?: readonly string[];
}

export interface VoiceSessionCaptureDelegate {
  capture(options: {
    readonly mode: VoiceSessionMode;
    readonly signal: AbortSignal;
  }): Promise<VoiceSessionCaptureResult>;
}

export interface VoiceSessionSpeechDelegate {
  speak(
    text: string,
    options: {
      readonly signal: AbortSignal;
      readonly onChunk: (chunk: string) => void;
    },
  ): Promise<void>;
}

export interface VoiceSessionStateChangeEvent {
  readonly state: VoiceSessionState;
  readonly wakeWordState: WakeWordState;
  readonly partialTranscript: string;
  readonly streamingResponse: string;
  readonly error?: string;
}

export type VoiceSessionListener = (event: VoiceSessionStateChangeEvent) => void;

export interface VoiceSessionRuntime {
  readonly getMode: () => VoiceSessionMode;
  readonly setMode: (mode: VoiceSessionMode) => void;
  readonly getState: () => VoiceSessionState;
  readonly getWakeWordState: () => WakeWordState;
  readonly getPartialTranscript: () => string;
  readonly getStreamingResponse: () => string;
  readonly subscribe: (listener: VoiceSessionListener) => () => void;
  readonly startContinuousListening: () => Promise<void>;
  readonly startWakeWordListening: () => Promise<void>;
  readonly pushToTalkStart: () => Promise<void>;
  readonly pushToTalkEnd: () => Promise<void>;
  readonly stopListening: () => void;
  readonly interruptSpeaking: (reason?: string) => void;
  readonly feedTranscript: (text: string) => Promise<void>;
}

export interface CreateDefaultVoiceSessionRuntimeOptions {
  readonly mode?: VoiceSessionMode;
  readonly wakeWordConfig?: WakeWordConfig;
  readonly sessionManager?: SpeechSessionManager;
  readonly streamManager?: SpeechStreamManager;
  readonly conversationManager?: SpeechConversationManager;
  readonly voiceExecutionRuntime?: VoiceExecutionRuntime;
  readonly taskExecutor?: VoiceExecutionTaskExecutor;
  readonly captureDelegate?: VoiceSessionCaptureDelegate;
  readonly speechDelegate?: VoiceSessionSpeechDelegate;
}

let sessionCounter = 0;

function nextSessionId(): string {
  sessionCounter += 1;
  return `voice-session-${sessionCounter}`;
}

function defaultSpeechDelegate(): VoiceSessionSpeechDelegate {
  return {
    async speak(text, { signal, onChunk }) {
      const words = text.split(/\s+/).filter(Boolean);
      for (const word of words) {
        if (signal.aborted) {
          return;
        }
        onChunk(`${word} `);
        await new Promise((resolve) => setTimeout(resolve, naturalWordDelayMs(word)));
      }
    },
  };
}

class DefaultVoiceSessionRuntime implements VoiceSessionRuntime {
  private mode: VoiceSessionMode;
  private state: VoiceSessionState = "idle";
  private wakeWordState: WakeWordState = "idle";
  private partialTranscript = "";
  private streamingResponse = "";
  private error: string | undefined;
  private readonly listeners = new Set<VoiceSessionListener>();
  private readonly sessionManager: SpeechSessionManager;
  private readonly streamManager: SpeechStreamManager;
  private readonly conversationManager: SpeechConversationManager;
  private readonly voiceExecutionRuntime: VoiceExecutionRuntime;
  private readonly captureDelegate?: VoiceSessionCaptureDelegate;
  private readonly speechDelegate: VoiceSessionSpeechDelegate;
  private readonly wakeWordConfig: WakeWordConfig;
  private abortController: AbortController | null = null;
  private activeConversationId: string | null = null;
  private activeStreamId: string | null = null;
  private pushToTalkActive = false;
  private continuousLoop = false;

  constructor(options: CreateDefaultVoiceSessionRuntimeOptions = {}) {
    this.mode = options.mode ?? DEFAULT_VOICE_SESSION_MODE;
    this.wakeWordConfig = options.wakeWordConfig ?? DEFAULT_WAKE_WORD_CONFIG;
    this.sessionManager = options.sessionManager ?? createDefaultSpeechSessionManager();
    this.streamManager = options.streamManager ?? new InMemorySpeechStreamManager();
    this.conversationManager =
      options.conversationManager ?? createDefaultSpeechConversationManager();
    this.voiceExecutionRuntime =
      options.voiceExecutionRuntime ??
      createDefaultVoiceExecutionRuntime({
        taskExecutor: options.taskExecutor,
      });
    this.captureDelegate = options.captureDelegate;
    this.speechDelegate = options.speechDelegate ?? defaultSpeechDelegate();
  }

  getMode(): VoiceSessionMode {
    return this.mode;
  }

  setMode(mode: VoiceSessionMode): void {
    this.mode = mode;
    if (mode === "wake-word") {
      this.wakeWordState = this.wakeWordConfig.enabled ? "armed" : "triggered";
    } else {
      this.wakeWordState = "idle";
    }
    this.emit();
  }

  getState(): VoiceSessionState {
    return this.state;
  }

  getWakeWordState(): WakeWordState {
    return this.wakeWordState;
  }

  getPartialTranscript(): string {
    return this.partialTranscript;
  }

  getStreamingResponse(): string {
    return this.streamingResponse;
  }

  subscribe(listener: VoiceSessionListener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  async startContinuousListening(): Promise<void> {
    if (this.mode !== "wake-word") {
      this.setMode("continuous");
    }
    this.continuousLoop = true;
    await this.beginListening();
    if (this.continuousLoop && this.state === "idle") {
      void this.runContinuousLoop();
    }
  }

  async startWakeWordListening(): Promise<void> {
    this.setMode("wake-word");
    this.continuousLoop = true;
    await this.beginListening();
    if (this.continuousLoop && this.state === "idle") {
      void this.runContinuousLoop();
    }
  }

  async pushToTalkStart(): Promise<void> {
    this.setMode("push-to-talk");
    this.pushToTalkActive = true;
    await this.beginListening();
  }

  async pushToTalkEnd(): Promise<void> {
    if (!this.pushToTalkActive) {
      return;
    }
    this.pushToTalkActive = false;
    this.stopListening();
  }

  stopListening(): void {
    this.continuousLoop = false;
    this.abortController?.abort();
    this.abortController = null;
    if (this.state === "listening") {
      this.setState("idle");
    }
  }

  interruptSpeaking(reason = "user-interrupt"): void {
    this.abortController?.abort();
    if (this.activeConversationId) {
      this.conversationManager.interruptConversation(this.activeConversationId, reason);
    }
    if (this.activeStreamId) {
      try {
        this.streamManager.closeStream(this.activeStreamId);
      } catch {
        // stream may already be closed
      }
    }
    this.streamingResponse = "";
    this.activeStreamId = null;
    this.setState("idle");
    this.wakeWordState =
      this.mode === "wake-word" && this.wakeWordConfig.enabled ? "armed" : "idle";
    this.emit();
  }

  async feedTranscript(text: string): Promise<void> {
    await this.handleTranscript(text);
  }

  private async runContinuousLoop(): Promise<void> {
    while (this.continuousLoop) {
      if (this.state !== "idle") {
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }
      await this.beginListening();
      await new Promise((resolve) => setTimeout(resolve, 50));
      if (!this.continuousLoop) {
        break;
      }
    }
  }

  private async beginListening(): Promise<void> {
    this.abortController?.abort();
    const controller = new AbortController();
    this.abortController = controller;

    const sessionId = nextSessionId();
    this.sessionManager.createSession(sessionId);
    this.sessionManager.updateState(sessionId, "listening");

    this.partialTranscript = "";
    this.streamingResponse = "";
    this.error = undefined;
    this.setState("listening");

    if (this.mode === "wake-word" && this.wakeWordConfig.enabled) {
      this.wakeWordState = "armed";
      this.emit();
    }

    if (!this.captureDelegate) {
      return;
    }

    try {
      const capture = await this.captureDelegate.capture({
        mode: this.mode,
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        return;
      }

      if (capture.partialChunks?.length) {
        for (const chunk of capture.partialChunks) {
          if (controller.signal.aborted) {
            return;
          }
          this.partialTranscript = `${this.partialTranscript}${chunk}`.trim();
          this.emitPartial();
        }
      }

      await this.handleTranscript(capture.transcript);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      const message = err instanceof Error ? err.message : "Voice capture failed";
      this.error = message;
      this.setState("error");
    }
  }

  private async handleTranscript(rawTranscript: string): Promise<void> {
    const trimmed = rawTranscript.trim();
    if (!trimmed) {
      this.setState("idle");
      return;
    }

    this.partialTranscript = trimmed;
    this.setState("thinking");

    let commandText = trimmed;
    const wakeGating =
      this.mode === "wake-word" ||
      (this.wakeWordConfig.enabled && this.mode === "continuous");

    if (wakeGating) {
      const detection = detectWakeWord(trimmed, this.wakeWordConfig, this.wakeWordState);
      this.wakeWordState = detection.state;
      if (!detection.matched) {
        this.setState("idle");
        if (this.mode === "wake-word") {
          this.wakeWordState = "armed";
        }
        this.emit();
        return;
      }
      commandText = detection.commandText || trimmed;
    }

    if (!commandText.trim()) {
      this.setState("idle");
      return;
    }

    const conversationId = `voice-conversation-${nextSessionId()}`;
    this.activeConversationId = conversationId;
    this.conversationManager.createConversation(conversationId, {
      metadata: { source: "voice-session" },
    });
    this.conversationManager.appendUserTurn(conversationId, commandText);

    this.activeStreamId = this.streamManager.createStream().streamId;
    this.setState("executing");

    const requestId = `voice-session-req-${Date.now()}`;
    const executionId = this.voiceExecutionRuntime.startVoiceExecution({
      requestId,
      rawInput: commandText,
      conversationId,
    });

    const result = await this.voiceExecutionRuntime.processVoiceInput({
      requestId,
      rawInput: commandText,
      executionId,
      conversationId,
      skipNormalization: false,
    });

    if (this.abortController?.signal.aborted) {
      return;
    }

    if (!result.success) {
      this.error = result.error?.message ?? "Voice execution failed";
      this.setState("error");
      return;
    }

    const taskOutput = (
      result.taskStatus as { output?: Readonly<Record<string, unknown>> } | undefined
    )?.output;
    const responseText =
      resolveAssistantReplyFromTaskOutput(taskOutput) ??
      (typeof taskOutput?.summary === "string" ? taskOutput.summary : undefined) ??
      result.normalizedInput ??
      "Done.";

    this.conversationManager.appendAssistantTurn(conversationId, responseText);
    await this.streamResponse(responseText);
    this.conversationManager.endConversation(conversationId);
    this.activeConversationId = null;
    this.setState("idle");
    if (this.mode === "wake-word" && this.wakeWordConfig.enabled) {
      this.wakeWordState = "armed";
    }
    this.emit();
  }

  private async streamResponse(text: string): Promise<void> {
    if (this.abortController?.signal.aborted) {
      return;
    }

    this.setState("speaking");
    this.streamingResponse = "";

    const streamId = this.activeStreamId ?? this.streamManager.createStream().streamId;
    this.activeStreamId = streamId;

    const controller = new AbortController();
    const previous = this.abortController;
    this.abortController = controller;

    try {
      await this.speechDelegate.speak(text, {
        signal: controller.signal,
        onChunk: (chunk) => {
          if (controller.signal.aborted) {
            return;
          }
          this.streamingResponse += chunk;
          try {
            this.streamManager.appendChunk(streamId, chunk);
          } catch {
            // stream closed after interrupt — ignore late chunks
          }
          this.emit();
        },
      });
      this.streamManager.closeStream(streamId);
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        throw err;
      }
    } finally {
      if (this.abortController === controller) {
        this.abortController = previous;
      }
    }
  }

  private emitPartial(): void {
    if (this.mode === "wake-word" && this.wakeWordConfig.enabled) {
      const detection = detectWakeWord(
        this.partialTranscript,
        this.wakeWordConfig,
        this.wakeWordState,
      );
      this.wakeWordState = detection.state;
    }
    this.emit();
  }

  private setState(state: VoiceSessionState): void {
    this.state = state;
    this.emit();
  }

  private snapshot(): VoiceSessionStateChangeEvent {
    return {
      state: this.state,
      wakeWordState: this.wakeWordState,
      partialTranscript: this.partialTranscript,
      streamingResponse: this.streamingResponse,
      error: this.error,
    };
  }

  private emit(): void {
    const event = this.snapshot();
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

/**
 * Factory for voice-native session runtime (Phase 90).
 */
export function createDefaultVoiceSessionRuntime(
  options?: CreateDefaultVoiceSessionRuntimeOptions,
): VoiceSessionRuntime {
  return new DefaultVoiceSessionRuntime(options);
}
