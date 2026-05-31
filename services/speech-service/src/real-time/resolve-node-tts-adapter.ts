import {
  EdgeTtsAdapter,
  ElevenLabsTtsAdapter,
  OpenAiTtsAdapter,
} from "../adapters/live-tts-adapters";
import type { SpeechProviderConfig } from "../adapters/speech-provider-config";
import { StubTextToSpeechAdapter } from "../adapters/stub-text-to-speech-adapter";
import type { TextToSpeechAdapter } from "../adapters/text-to-speech-adapter";

const TTS_BY_PROVIDER: Record<string, TextToSpeechAdapter> = {
  "jarvis-tts": new StubTextToSpeechAdapter(),
  elevenlabs: ElevenLabsTtsAdapter,
  "openai-tts": OpenAiTtsAdapter,
  "edge-tts": EdgeTtsAdapter,
  "speech-stub": new StubTextToSpeechAdapter(),
};

/** Node-only TTS provider resolution (not imported from browser bundles). */
export function resolveNodeTtsAdapter(
  config: SpeechProviderConfig,
): TextToSpeechAdapter {
  return (
    TTS_BY_PROVIDER[config.providerId] ?? new StubTextToSpeechAdapter()
  );
}
