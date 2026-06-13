import { describe, expect, it, vi } from "vitest";

import * as speech from "@jarvis/speech-service";

import { RealVoiceSession } from "../real-voice-session";

describe("RealVoiceSession", () => {
  it("detects wake word and enters listening state", async () => {
    vi.spyOn(speech, "transcribe").mockResolvedValue({
      requestId: "stt-1",
      adapterId: "stub-speech-to-text-adapter",
      providerId: "jarvis-stt",
      stub: false,
      output: "hey jarvis open calendar",
      isWakeWord: true,
      confidence: 0.92,
      createdAt: new Date().toISOString(),
    });

    const session = new RealVoiceSession();
    const states: string[] = [];
    session.subscribe((state) => states.push(state.status));

    const result = await session.processAudio(
      new TextEncoder().encode("audio"),
    );
    expect(result.isWakeWord).toBe(true);
    expect(result.transcript).toContain("hey jarvis");
    expect(states).toContain("listening");
  });
});
