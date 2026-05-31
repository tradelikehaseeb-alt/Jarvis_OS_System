import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  DEFAULT_STUB_SPEECH_PROVIDER_CONFIG,
  SpeechAdapterRegistry,
  StubSpeechToTextAdapter,
  StubTextToSpeechAdapter,
} from "../adapters";

describe("speech adapters", () => {
  beforeEach(() => {
    process.env.SPEECH_FORCE_STUB_COMPONENTS = "true";
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    delete process.env.SPEECH_FORCE_STUB_COMPONENTS;
  });

  it("returns deterministic output for StubSpeechToTextAdapter in test stub mode", async () => {
    const adapter = new StubSpeechToTextAdapter();

    const first = await adapter.transcribe({
      requestId: "req-1",
      text: "  hello world  ",
    });
    const second = await adapter.transcribe({
      requestId: "req-1",
      text: "  hello world  ",
    });

    expect(first).toEqual(second);
    expect(first).toEqual({
      requestId: "req-1",
      adapterId: "stub-speech-to-text-adapter",
      providerId: DEFAULT_STUB_SPEECH_PROVIDER_CONFIG.providerId,
      stub: true,
      output: "hello world",
      createdAt: new Date(0).toISOString(),
    });
  });

  it("returns deterministic output for StubTextToSpeechAdapter in test stub mode", async () => {
    const adapter = new StubTextToSpeechAdapter();

    const first = await adapter.synthesize({
      requestId: "req-2",
      text: "status update",
    });
    const second = await adapter.synthesize({
      requestId: "req-2",
      text: "status update",
    });

    expect(first).toEqual(second);
    expect(first.output).toBe("stub-tts:status update");
    expect(first.stub).toBe(true);
  });

  it("registers and resolves stt/tts adapters", () => {
    const registry = new SpeechAdapterRegistry();
    const stt = new StubSpeechToTextAdapter();
    const tts = new StubTextToSpeechAdapter();

    registry.registerSpeechToText(stt);
    registry.registerTextToSpeech(tts);

    expect(registry.resolveSpeechToText(stt.adapterId)).toBe(stt);
    expect(registry.resolveTextToSpeech(tts.adapterId)).toBe(tts);
    expect(registry.listSpeechToTextAdapterIds()).toEqual([stt.adapterId]);
    expect(registry.listTextToSpeechAdapterIds()).toEqual([tts.adapterId]);
  });

  it("throws descriptive error for unknown adapters", () => {
    const registry = new SpeechAdapterRegistry();

    expect(() => registry.resolveSpeechToText("missing-stt")).toThrow(
      "SpeechToTextAdapter not found: missing-stt",
    );
    expect(() => registry.resolveTextToSpeech("missing-tts")).toThrow(
      "TextToSpeechAdapter not found: missing-tts",
    );
  });
});
