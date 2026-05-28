import type { VoiceSessionSpeechDelegate } from "../voice-session/create-default-voice-session-runtime";

import {
  createDefaultVoicePlaybackController,
  type VoicePlaybackController,
} from "./voice-playback-controller";

export interface RealTimeVoiceSpeechDelegateOptions {
  readonly playbackController?: VoicePlaybackController;
}

/**
 * Voice session speech delegate with interruptible streaming TTS (Phase 91).
 */
export function createRealTimeVoiceSpeechDelegate(
  options: RealTimeVoiceSpeechDelegateOptions = {},
): VoiceSessionSpeechDelegate & {
  readonly controller: VoicePlaybackController;
} {
  const controller =
    options.playbackController ?? createDefaultVoicePlaybackController();

  return {
    controller,
    async speak(text, { signal, onChunk }) {
      const wrappedOnChunk = (chunk: { text: string }) => {
        if (signal.aborted) {
          return;
        }
        onChunk(chunk.text);
      };

      const playback = createDefaultVoicePlaybackController({
        onChunk: wrappedOnChunk,
      });

      if (signal.aborted) {
        return;
      }

      const abortListener = () => playback.interrupt();
      signal.addEventListener("abort", abortListener, { once: true });

      try {
        await playback.speak(`voice-speech-${Date.now()}`, text);
      } finally {
        signal.removeEventListener("abort", abortListener);
      }
    },
  };
}
