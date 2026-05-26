import { describe, expect, it } from "vitest";

import { DefaultSpeechGateway, createDefaultSpeechGateway } from "../gateway";

describe("speech gateway", () => {
  it("processTranscript performs normalization + action + routing + runtime checks", async () => {
    const gateway = new DefaultSpeechGateway();

    const response = await gateway.processTranscript({
      requestId: "gateway-1",
      transcript: "for eggs analysis",
      requestedCapabilities: ["high-quality", "multilingual"],
      providerIds: ["stt-local", "stt-cloud"],
    });

    expect(response.requestId).toBe("gateway-1");
    expect(response.normalizedTranscript).toBe("for eggs analysis");
    expect(response.action.handled).toBe(false);
    expect(response.routing.providerId).toBe("stt-cloud");
    expect(response.runtimeHealth.providerId).toBe("stt-cloud");
    expect(response.runtimeHealth.status).toBe("degraded");
  });

  it("processAction routes deterministic mapped commands", async () => {
    const gateway = createDefaultSpeechGateway();
    const action = await gateway.processAction({
      requestId: "gateway-2",
      transcript: "help",
    });
    expect(action.handled).toBe(true);
    expect(action.action?.type).toBe("help");
  });

  it("resolveProvider prefers local for low-latency", async () => {
    const gateway = createDefaultSpeechGateway();
    const routing = await gateway.resolveProvider({
      requestId: "gateway-3",
      transcript: "unused",
      requestedCapabilities: ["low-latency"],
      providerIds: ["tts-cloud", "tts-local"],
    });
    expect(routing.providerId).toBe("tts-local");
  });

  it("getRuntimeHealth returns deterministic health for provider", async () => {
    const gateway = createDefaultSpeechGateway();
    const health = await gateway.getRuntimeHealth("stt-local");
    expect(health).toMatchObject({
      providerId: "stt-local",
      status: "available",
      stub: true,
    });
  });
});
