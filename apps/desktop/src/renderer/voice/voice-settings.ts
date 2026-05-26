/**
 * Desktop voice shell preferences (Phase 25) — local only, no device APIs.
 */
export interface VoiceSettings {
  /** Show transcript panel above chat composer. */
  readonly showTranscriptPanel: boolean;
  /** Push mock transcript into chat input when capture completes. */
  readonly pushToChatInput: boolean;
  /** Simulate capture error (UI testing). */
  readonly simulateCaptureError: boolean;
  /** Normalize transcript text with speech-service before classification. */
  readonly enableNormalization: boolean;
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  showTranscriptPanel: true,
  pushToChatInput: true,
  simulateCaptureError: false,
  enableNormalization: true,
};

const STORAGE_KEY = "jarvis.desktop.voiceSettings";

export function loadVoiceSettings(): VoiceSettings {
  if (typeof localStorage === "undefined") {
    return DEFAULT_VOICE_SETTINGS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_VOICE_SETTINGS;
    }
    const parsed = JSON.parse(raw) as Partial<VoiceSettings>;
    return {
      ...DEFAULT_VOICE_SETTINGS,
      ...parsed,
    };
  } catch {
    return DEFAULT_VOICE_SETTINGS;
  }
}

export function saveVoiceSettings(settings: VoiceSettings): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
