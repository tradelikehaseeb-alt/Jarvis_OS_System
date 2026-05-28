export type { MicrophoneAudioFrame, MicrophoneLevelSample, MicrophoneCaptureOptions, MicrophoneRuntime } from "./microphone-runtime";
export { SyntheticMicrophoneRuntime } from "./microphone-runtime";

export type { TranscriptionPartial, TranscriptionListener } from "./real-time-transcription-session";
export { RealTimeTranscriptionSession } from "./real-time-transcription-session";

export type { StreamingSpeechRuntimeOptions } from "./streaming-speech-runtime";
export {
  StreamingSpeechRuntime,
  createDefaultStreamingSpeechRuntime,
} from "./streaming-speech-runtime";

export type { VoicePlaybackChunk, VoicePlaybackControllerOptions } from "./voice-playback-controller";
export {
  VoicePlaybackController,
  createDefaultVoicePlaybackController,
} from "./voice-playback-controller";

export type { TtsProviderRuntimeOptions } from "./tts-provider-runtime";
export {
  TtsProviderRuntime,
  createDefaultTtsProviderRuntime,
} from "./tts-provider-runtime";

export type { SpeechProviderDefinition } from "./speech-provider-resolver";
export {
  STT_PROVIDER_DEFINITIONS,
  TTS_PROVIDER_DEFINITIONS,
  readEnvApiKey,
  resolveSpeechProviderConfig,
  resolveFirstConfiguredSttProvider,
  resolveFirstConfiguredTtsProvider,
} from "./speech-provider-resolver";

export {
  naturalWordDelayMs,
  stabilizePartialTranscript,
} from "./speech-timing";
export type { RealTimeVoiceCaptureResult } from "./create-real-time-voice-capture-delegate";
export { createRealTimeVoiceCaptureDelegate } from "./create-real-time-voice-capture-delegate";

export type { RealTimeVoiceSpeechDelegateOptions } from "./create-real-time-voice-speech-delegate";
export { createRealTimeVoiceSpeechDelegate } from "./create-real-time-voice-speech-delegate";
