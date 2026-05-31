import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_STUB_SPEECH_PROVIDER_CONFIG } from "../../adapters/speech-provider-config";
import { StubSpeechToTextAdapterLegacy } from "../../adapters/stub-speech-to-text-adapter-legacy";
import { SyntheticMicrophoneRuntime } from "../microphone-runtime";
import { RealTimeTranscriptionSession } from "../real-time-transcription-session";
import { createDefaultStreamingSpeechRuntime } from "../streaming-speech-runtime";
import { createDefaultVoicePlaybackController } from "../voice-playback-controller";
import { createDefaultTtsProviderRuntime } from "../tts-provider-runtime";
import { resolveFirstConfiguredSttProvider } from "../speech-provider-resolver";

describe("SyntheticMicrophoneRuntime", () => {
  it("emits audio frames and level samples", async () => {
    vi.useFakeTimers();
    const mic = new SyntheticMicrophoneRuntime();
    const levels: number[] = [];

    const promise = mic.startCapture({
      onLevel: (sample) => levels.push(sample.peak),
    });
    await vi.advanceTimersByTimeAsync(200);
    mic.stopCapture();
    await promise;

    expect(levels.length).toBeGreaterThan(0);
    expect(mic.getLatestLevels().length).toBeGreaterThan(0);
    vi.useRealTimers();
  });
});

describe("RealTimeTranscriptionSession", () => {
  it("streams partial then final transcript", () => {
    const session = new RealTimeTranscriptionSession();
    const events: string[] = [];
    session.subscribe((partial) => {
      events.push(`${partial.isFinal}:${partial.text}`);
    });

    session.appendPartial("Jar", 0.7, 40);
    session.finalize("Jarvis open calendar", 0.92, 120);

    expect(events).toEqual(["false:Jar", "true:Jarvis open calendar"]);
    expect(session.getConfidence()).toBe(0.92);
    expect(session.getLatencyMs()).toBe(120);
  });
});

describe("StreamingSpeechRuntime", () => {
  it("finalizes transcript after microphone capture", async () => {
    vi.useFakeTimers();
    const runtime = createDefaultStreamingSpeechRuntime({
      sttConfig: DEFAULT_STUB_SPEECH_PROVIDER_CONFIG,
      sttAdapter: new StubSpeechToTextAdapterLegacy(),
    });
    const capture = runtime.getMicrophone().startCapture();
    await vi.advanceTimersByTimeAsync(200);

    const response = await runtime.finalizeTranscript("req-stream-1");
    await capture;

    expect(response.output.length).toBeGreaterThan(0);
    expect(runtime.getTranscriptionSession().getPartialText()).toBe(response.output);
    vi.useRealTimers();
  });
});

describe("VoicePlaybackController", () => {
  it("interrupt stops speaking mid-stream", async () => {
    const chunks: string[] = [];
    const controller = createDefaultVoicePlaybackController({
      onChunk: (chunk) => chunks.push(chunk.text),
    });

    const speakPromise = controller.speak("req-playback", "one two three four");
    await new Promise((resolve) => setTimeout(resolve, 50));
    controller.interrupt();
    await speakPromise;

    expect(chunks.length).toBeLessThan(4);
    expect(controller.isSpeaking()).toBe(false);
  });
});

describe("provider fallback", () => {
  beforeEach(() => {
    delete process.env.GROQ_API_KEY;
    delete process.env.JARVIS_GROQ_API_KEY;
    process.env.JARVIS_STT_FALLBACK = "local";
  });

  afterEach(() => {
    delete process.env.JARVIS_STT_FALLBACK;
  });

  it("uses jarvis local STT when no cloud key is configured", () => {
    const config = resolveFirstConfiguredSttProvider();
    expect(config.providerId).toBe("jarvis-stt");
    expect(config.mode).toBe("live");
  });

  it(
    "returns TTS_PROVIDER_ERROR when all live providers fail (no stub fallback)",
    async () => {
      const runtime = createDefaultTtsProviderRuntime({
        fallbackChain: [
          {
            providerId: "openai-tts",
            mode: "live",
            apiKey: "invalid",
            baseUrl: "https://example.invalid",
          },
        ],
      });

      const response = await runtime.synthesize({
        requestId: "req-fallback",
        text: "hello jarvis",
      });

      expect(response.stub).toBe(false);
      expect(response.error?.code).toBe("TTS_PROVIDER_ERROR");
    },
    15_000,
  );
});
