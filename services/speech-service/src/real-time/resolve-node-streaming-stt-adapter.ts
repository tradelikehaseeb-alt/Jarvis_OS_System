import {
  DeepgramSttAdapter,
  GroqWhisperSttAdapter,
  OpenAiRealtimeSttAdapter,
  WhisperSttAdapter,
} from "../adapters/live-stt-adapters";
import type { SpeechProviderConfig } from "../adapters/speech-provider-config";
import { StubSpeechToTextAdapter } from "../adapters/stub-speech-to-text-adapter";
import type { SpeechToTextAdapter } from "../adapters/speech-to-text-adapter";

const STT_BY_PROVIDER: Record<string, SpeechToTextAdapter> = {
  "jarvis-stt": new StubSpeechToTextAdapter(),
  whisper: WhisperSttAdapter,
  deepgram: DeepgramSttAdapter,
  "groq-whisper": GroqWhisperSttAdapter,
  "openai-realtime": OpenAiRealtimeSttAdapter,
  "speech-stub": new StubSpeechToTextAdapter(),
};

/** Node-only STT provider resolution (not imported from browser bundles). */
export function resolveNodeStreamingSttAdapter(
  config: SpeechProviderConfig,
): SpeechToTextAdapter {
  return (
    STT_BY_PROVIDER[config.providerId] ?? new StubSpeechToTextAdapter()
  );
}
