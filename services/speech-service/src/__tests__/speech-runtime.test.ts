import { describe, expect, it } from "vitest";

import {
  InMemorySpeechRuntimeManager,
  MockSpeechRuntimeProvider,
  createDefaultSpeechRuntimeResolver,
} from "../runtime";

describe("speech runtime", () => {
  it("returns default deterministic health statuses", async () => {
    const manager = new InMemorySpeechRuntimeManager();
    manager.register(new MockSpeechRuntimeProvider("stt-local"));
    manager.register(new MockSpeechRuntimeProvider("tts-local"));
    manager.register(new MockSpeechRuntimeProvider("stt-cloud"));
    manager.register(new MockSpeechRuntimeProvider("tts-cloud"));

    await expect(manager.checkHealth("stt-local")).resolves.toMatchObject({
      providerId: "stt-local",
      status: "available",
      stub: true,
    });
    await expect(manager.checkHealth("tts-local")).resolves.toMatchObject({
      providerId: "tts-local",
      status: "available",
      stub: true,
    });
    await expect(manager.checkHealth("stt-cloud")).resolves.toMatchObject({
      providerId: "stt-cloud",
      status: "degraded",
      stub: true,
    });
    await expect(manager.checkHealth("tts-cloud")).resolves.toMatchObject({
      providerId: "tts-cloud",
      status: "degraded",
      stub: true,
    });
  });

  it("lists provider ids in deterministic sorted order", () => {
    const manager = new InMemorySpeechRuntimeManager();
    manager.register(new MockSpeechRuntimeProvider("tts-cloud"));
    manager.register(new MockSpeechRuntimeProvider("stt-local"));
    manager.register(new MockSpeechRuntimeProvider("tts-local"));

    expect(manager.listProviderIds()).toEqual([
      "stt-local",
      "tts-cloud",
      "tts-local",
    ]);
  });

  it("throws descriptive error for missing provider", async () => {
    const manager = new InMemorySpeechRuntimeManager();
    await expect(manager.checkHealth("stt-local")).rejects.toThrow(
      "Speech runtime provider not registered: stt-local",
    );
  });

  it("resolves provider health via default resolver", async () => {
    const manager = new InMemorySpeechRuntimeManager();
    manager.register(new MockSpeechRuntimeProvider("stt-cloud"));

    const resolver = createDefaultSpeechRuntimeResolver(manager);
    await expect(resolver.resolve("stt-cloud")).resolves.toMatchObject({
      providerId: "stt-cloud",
      status: "degraded",
      stub: true,
    });
  });
});
