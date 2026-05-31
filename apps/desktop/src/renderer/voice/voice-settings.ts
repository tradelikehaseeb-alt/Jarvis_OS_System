/**
 * Desktop voice shell preferences (Phase 25 / Phase 90).
 */
import type { VoiceSessionMode } from "@jarvis/speech-service";

export interface VoiceSettings {
  /** Show transcript panel above chat composer. */
  readonly showTranscriptPanel: boolean;
  /** Push mock transcript into chat input when capture completes. */
  readonly pushToChatInput: boolean;
  /** Simulate capture error (UI testing). */
  readonly simulateCaptureError: boolean;
  /** Normalize transcript text with speech-service before classification. */
  readonly enableNormalization: boolean;
  /** Run voice transcript through Jarvis execution pipeline (Phase 72). */
  readonly autoExecuteVoicePipeline: boolean;
  /** Voice interaction mode (Phase 90). */
  readonly listeningMode: VoiceSessionMode;
  /** Enable wake phrase gating. */
  readonly wakeWordEnabled: boolean;
  /** Wake phrase (case-insensitive). */
  readonly wakePhrase: string;
  /** Use voice-native orb overlay UI. */
  readonly voiceNativeUi: boolean;
  /** Use real microphone + streaming STT (Phase 91). */
  readonly useRealMicrophone: boolean;
  /** Preferred STT provider id (auto when empty). */
  readonly sttProviderId?: string;
  /** Preferred TTS provider id (auto when empty). */
  readonly ttsProviderId?: string;
}

function resolveDefaultUseRealMicrophone(): boolean {
  if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
    return false;
  }
  if (typeof import.meta !== "undefined") {
    const env = import.meta as ImportMeta & {
      env?: { MODE?: string; NODE_ENV?: string };
    };
    if (env.env?.MODE === "test" || env.env?.NODE_ENV === "test") {
      return false;
    }
  }
  return true;
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  showTranscriptPanel: true,
  pushToChatInput: true,
  simulateCaptureError: false,
  enableNormalization: true,
  autoExecuteVoicePipeline: true,
  listeningMode: "push-to-talk",
  wakeWordEnabled: true,
  wakePhrase: "jarvis",
  voiceNativeUi: true,
  useRealMicrophone: resolveDefaultUseRealMicrophone(),
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
