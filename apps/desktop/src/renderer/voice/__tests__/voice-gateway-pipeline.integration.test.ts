import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MOCK_VOICE_LISTEN_MS } from "../mock-voice-session";
import * as mockVoiceSession from "../mock-voice-session";
import { useMockVoiceInput } from "../use-mock-voice-input";

describe("voice gateway pipeline integration", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("routes mock transcript through gateway, normalization, and metadata", async () => {
    vi.spyOn(mockVoiceSession, "runMockVoiceCapture").mockResolvedValue({
      transcript: "for eggs analysis",
    });

    const onTranscriptReady = vi.fn();
    const { result } = renderHook(() =>
      useMockVoiceInput({
        settings: {
          showTranscriptPanel: true,
          pushToChatInput: true,
          simulateCaptureError: false,
          enableNormalization: true,
        },
        onTranscriptReady,
      }),
    );

    act(() => {
      result.current.toggleListening();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(MOCK_VOICE_LISTEN_MS + 400);
    });

    expect(result.current.status).toBe("completed");
    expect(result.current.normalization?.normalized).toBe("forex analysis");
    expect(result.current.metadata).toMatchObject({
      normalizedTranscript: "forex analysis",
      conversationState: "completed",
      providerDecision: "stt-local",
    });
    expect(onTranscriptReady).toHaveBeenCalledWith("forex analysis");
  });

  it("maps voice command transcript to detected action metadata", async () => {
    vi.spyOn(mockVoiceSession, "runMockVoiceCapture").mockResolvedValue({
      transcript: "help",
    });

    const { result } = renderHook(() =>
      useMockVoiceInput({
        settings: {
          showTranscriptPanel: true,
          pushToChatInput: false,
          simulateCaptureError: false,
          enableNormalization: true,
        },
      }),
    );

    act(() => {
      result.current.toggleListening();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(MOCK_VOICE_LISTEN_MS + 400);
    });

    expect(result.current.metadata?.detectedAction).toBe("help");
  });
});
