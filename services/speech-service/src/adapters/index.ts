export type { SpeechRequest } from "./speech-request";
export type { SpeechResponse } from "./speech-response";
export type { SpeechProviderConfig } from "./speech-provider-config";
export type { SpeechProviderMode } from "./speech-provider-config";
export { DEFAULT_STUB_SPEECH_PROVIDER_CONFIG } from "./speech-provider-config";

export type { SpeechToTextAdapter } from "./speech-to-text-adapter";
export type { TextToSpeechAdapter } from "./text-to-speech-adapter";

export { SpeechAdapterRegistry } from "./speech-adapter-registry";

export { StubSpeechToTextAdapter } from "./stub-speech-to-text-adapter";
export { StubTextToSpeechAdapter } from "./stub-text-to-speech-adapter";

export {
  HttpSpeechToTextAdapter,
  WhisperSttAdapter,
  DeepgramSttAdapter,
  GroqWhisperSttAdapter,
  OpenAiRealtimeSttAdapter,
} from "./live-stt-adapters";
export {
  HttpTextToSpeechAdapter,
  ElevenLabsTtsAdapter,
  OpenAiTtsAdapter,
  EdgeTtsAdapter,
} from "./live-tts-adapters";
export { createDefaultSpeechAdapterRegistry } from "./create-default-speech-adapter-registry";
