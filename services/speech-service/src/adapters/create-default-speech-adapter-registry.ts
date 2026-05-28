import { SpeechAdapterRegistry } from "./speech-adapter-registry";
import {
  DeepgramSttAdapter,
  GroqWhisperSttAdapter,
  OpenAiRealtimeSttAdapter,
  WhisperSttAdapter,
} from "./live-stt-adapters";
import {
  EdgeTtsAdapter,
  ElevenLabsTtsAdapter,
  OpenAiTtsAdapter,
} from "./live-tts-adapters";
import { StubSpeechToTextAdapter } from "./stub-speech-to-text-adapter";
import { StubTextToSpeechAdapter } from "./stub-text-to-speech-adapter";

/**
 * Registers default stub + live speech adapters (Phase 91).
 */
export function createDefaultSpeechAdapterRegistry(): SpeechAdapterRegistry {
  const registry = new SpeechAdapterRegistry();
  registry.registerSpeechToText(new StubSpeechToTextAdapter());
  registry.registerSpeechToText(WhisperSttAdapter);
  registry.registerSpeechToText(DeepgramSttAdapter);
  registry.registerSpeechToText(GroqWhisperSttAdapter);
  registry.registerSpeechToText(OpenAiRealtimeSttAdapter);
  registry.registerTextToSpeech(new StubTextToSpeechAdapter());
  registry.registerTextToSpeech(ElevenLabsTtsAdapter);
  registry.registerTextToSpeech(OpenAiTtsAdapter);
  registry.registerTextToSpeech(EdgeTtsAdapter);
  return registry;
}
