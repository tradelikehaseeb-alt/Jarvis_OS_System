import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";

import { useVoiceSession } from "../use-voice-session";

describe("useVoiceSession", () => {
  it("starts idle with voice-native defaults", () => {
    const { result } = renderHook(() =>
      useVoiceSession({
        settings: {
          showTranscriptPanel: false,
          pushToChatInput: true,
          simulateCaptureError: false,
          enableNormalization: true,
          autoExecuteVoicePipeline: true,
          listeningMode: "push-to-talk",
          wakeWordEnabled: false,
          wakePhrase: "jarvis",
          voiceNativeUi: true,
        },
      }),
    );

    expect(result.current.sessionState).toBe("idle");
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.isActive).toBe(false);
  });
});
