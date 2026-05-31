import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as fasterWhisper from "../internal/faster-whisper-local-stt";
import * as groqWhisper from "../internal/groq-whisper-client";
import * as edgeTts from "../internal/edge-tts-synthesis";
import { stripMarkdownForSpeech } from "../internal/markdown-strip";
import { detectWakeWordInTranscript } from "../internal/wake-word-transcript";
import { TtsSpeechQueue } from "../internal/tts-speech-queue";
import { StubSpeechToTextAdapter } from "../stub-speech-to-text-adapter";
import { StubTextToSpeechAdapter } from "../stub-text-to-speech-adapter";

function minimalWavBase64(durationSec = 1): string {
  const sampleRate = 16_000;
  const channels = 1;
  const bitsPerSample = 16;
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataSize = numSamples * (bitsPerSample / 8);
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE((sampleRate * channels * bitsPerSample) / 8, 28);
  buffer.writeUInt16LE((channels * bitsPerSample) / 8, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  return buffer.toString("base64");
}

describe("Jarvis speech adapters", () => {
  beforeEach(() => {
    delete process.env.SPEECH_FORCE_STUB_COMPONENTS;
    process.env.NODE_ENV = "test";
    process.env.JARVIS_STT_FALLBACK = "local";
    process.env.JARVIS_STT_PROVIDER = "groq";
    process.env.JARVIS_TTS_PROVIDER = "edge-tts";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.GROQ_API_KEY;
    delete process.env.JARVIS_STT_FALLBACK;
    delete process.env.JARVIS_STT_PROVIDER;
    delete process.env.JARVIS_TTS_PROVIDER;
  });

  it("detects wake word in hey jarvis transcript", () => {
    const result = detectWakeWordInTranscript("hey jarvis open calendar");
    expect(result.isWakeWord).toBe(true);
    expect(result.text).toBe("hey jarvis open calendar");
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it("returns AUDIO_TOO_SHORT for tiny clips", async () => {
    const adapter = new StubSpeechToTextAdapter();
    const response = await adapter.transcribe({
      requestId: "short",
      text: "",
      audioBase64: Buffer.alloc(100).toString("base64"),
      mimeType: "audio/wav",
    });
    expect(response.error?.code).toBe("AUDIO_TOO_SHORT");
  });

  it("falls back to local STT when Groq fails", async () => {
    process.env.GROQ_API_KEY = "test-key";
    vi.spyOn(groqWhisper, "transcribeWithGroqWhisper").mockRejectedValue(
      new Error("Groq unavailable"),
    );
    vi.spyOn(fasterWhisper, "transcribeWithFasterWhisperLocal").mockResolvedValue({
      text: "local transcript",
      confidence: 0.82,
    });

    const adapter = new StubSpeechToTextAdapter();
    const response = await adapter.transcribe({
      requestId: "fallback",
      text: "",
      audioBase64: minimalWavBase64(1),
      mimeType: "audio/wav",
    });

    expect(response.output).toBe("local transcript");
    expect(response.providerId).toBe("faster-whisper-local");
    expect(response.stub).toBe(false);
  });

  it("uses local STT for unit transcription", async () => {
    vi.spyOn(fasterWhisper, "transcribeWithFasterWhisperLocal").mockResolvedValue({
      text: "unit test transcript",
      confidence: 0.8,
    });

    const adapter = new StubSpeechToTextAdapter();
    const response = await adapter.transcribe({
      requestId: "local-unit",
      text: "",
      audioBase64: minimalWavBase64(1),
      mimeType: "audio/wav",
    });

    expect(response.output).toBe("unit test transcript");
    expect(response.error).toBeUndefined();
  });

  it("strips markdown before TTS synthesis", async () => {
    vi.spyOn(edgeTts, "synthesizeWithEdgeTts").mockResolvedValue(Buffer.from("mp3"));

    const adapter = new StubTextToSpeechAdapter();
    const response = await adapter.synthesize({
      requestId: "md",
      text: "**bold** and `# heading`",
    });

    expect(stripMarkdownForSpeech("**bold**")).toBe("bold");
    expect(response.output).toBe("bold and heading");
    expect(response.audioBase64).toBeTruthy();
  });

  it("generates audio buffer from TTS", async () => {
    vi.spyOn(edgeTts, "synthesizeWithEdgeTts").mockResolvedValue(
      Buffer.from([0x49, 0x44, 0x33]),
    );

    const adapter = new StubTextToSpeechAdapter();
    const response = await adapter.synthesize({
      requestId: "tts-buffer",
      text: "Hello Jarvis",
    });

    expect(response.audioBase64?.length).toBeGreaterThan(0);
    expect(response.mimeType).toBe("audio/mpeg");
  });

  it("cancels queued speech when a new command arrives", async () => {
    const queue = new TtsSpeechQueue(3);
    let firstFinished = false;

    const first = queue.enqueue(async () => {
      await new Promise((resolve) => setTimeout(resolve, 80));
      firstFinished = true;
      return {
        requestId: "1",
        adapterId: "a",
        providerId: "p",
        stub: false,
        output: "first",
        createdAt: new Date().toISOString(),
      };
    });

    await new Promise((resolve) => setTimeout(resolve, 5));

    const latest = await queue.enqueue(async () => ({
      requestId: "3",
      adapterId: "a",
      providerId: "p",
      stub: false,
      output: "latest",
      createdAt: new Date().toISOString(),
    }));

    await expect(first).rejects.toThrow("TTS_CANCELLED");
    expect(latest.output).toBe("latest");
    expect(firstFinished).toBe(false);
  });

  it.skipIf(!process.env.GROQ_API_KEY)("Groq STT integration converts audio to text", async () => {
    vi.restoreAllMocks();
    const adapter = new StubSpeechToTextAdapter();
    const response = await adapter.transcribe({
      requestId: "groq-live",
      text: "",
      audioBase64: minimalWavBase64(1.2),
      mimeType: "audio/wav",
    });
    expect(response.error).toBeUndefined();
    expect(response.output.length).toBeGreaterThan(0);
  });
});
