import { useSpeechStubComponents } from "../internal/speech-component-policy";

import { StubSpeechToTextAdapter } from "./stub-speech-to-text-adapter";
import { StubSpeechToTextAdapterLegacy } from "./stub-speech-to-text-adapter-legacy";
import { StubTextToSpeechAdapter } from "./stub-text-to-speech-adapter";
import { StubTextToSpeechAdapterLegacy } from "./stub-text-to-speech-adapter-legacy";
import type { SpeechResponse } from "./speech-response";

const productionStt = new StubSpeechToTextAdapter();
const productionTts = new StubTextToSpeechAdapter();
const legacyStt = new StubSpeechToTextAdapterLegacy();
const legacyTts = new StubTextToSpeechAdapterLegacy();

function resolveStt() {
  return useSpeechStubComponents() ? legacyStt : productionStt;
}

function resolveTts() {
  return useSpeechStubComponents() ? legacyTts : productionTts;
}

/**
 * Transcribes raw audio (Groq Whisper → faster-whisper fallback).
 */
export async function transcribe(
  audioBuffer: Buffer,
  options: {
    readonly requestId?: string;
    readonly mimeType?: string;
    readonly hintText?: string;
  } = {},
): Promise<SpeechResponse> {
  return resolveStt().transcribe({
    requestId: options.requestId ?? `stt-${Date.now()}`,
    text: options.hintText ?? "",
    audioBase64: audioBuffer.toString("base64"),
    mimeType: options.mimeType ?? "audio/webm",
  });
}

/**
 * Synthesizes speech audio (Edge TTS → pyttsx3 fallback).
 */
export async function speak(
  text: string,
  options: { readonly requestId?: string } = {},
): Promise<SpeechResponse> {
  return resolveTts().synthesize({
    requestId: options.requestId ?? `tts-${Date.now()}`,
    text,
  });
}
