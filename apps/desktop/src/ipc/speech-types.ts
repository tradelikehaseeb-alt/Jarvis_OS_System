export interface SpeechInitStatus {
  readonly ready: boolean;
  readonly sttEngine: string;
  readonly ttsEngine: string;
  readonly ttsVoice: string;
  readonly groqConfigured: boolean;
  readonly message: string;
}

export interface SpeechTranscribeRequest {
  readonly audioBase64: string;
  readonly mimeType?: string;
  readonly requestId?: string;
}

export interface SpeechSpeakRequest {
  readonly text: string;
  readonly requestId?: string;
  readonly voice?: string;
}

export interface SpeechIpcResponse {
  readonly requestId: string;
  readonly adapterId: string;
  readonly providerId: string;
  readonly stub: boolean;
  readonly output: string;
  readonly createdAt: string;
  readonly confidence?: number;
  readonly latencyMs?: number;
  readonly audioBase64?: string;
  readonly mimeType?: string;
  readonly isWakeWord?: boolean;
  readonly error?: { readonly code: string; readonly message: string };
}
