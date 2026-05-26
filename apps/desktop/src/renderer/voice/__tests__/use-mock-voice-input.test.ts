import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MOCK_VOICE_LISTEN_MS } from "../mock-voice-session";
import { useMockVoiceInput } from "../use-mock-voice-input";

describe("useMockVoiceInput", () => {
  const originalNow = Date.now;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    Date.now = originalNow;
    vi.useRealTimers();
  });

  it("transitions listening → completed and calls onTranscriptReady", async () => {
    const onTranscriptReady = vi.fn();
    const onNormalizationReady = vi.fn();
    const { result } = renderHook(() =>
      useMockVoiceInput({
        settings: {
          showTranscriptPanel: true,
          pushToChatInput: true,
          simulateCaptureError: false,
          enableNormalization: true,
        },
        onTranscriptReady,
        onNormalizationReady,
      }),
    );

    act(() => {
      result.current.toggleListening();
    });
    expect(result.current.status).toBe("listening");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(MOCK_VOICE_LISTEN_MS + 400);
    });

    await waitFor(() => {
      expect(result.current.status).toBe("completed");
    });
    expect(result.current.transcript.length).toBeGreaterThan(0);
    expect(result.current.normalization).not.toBeNull();
    expect(result.current.normalization?.normalized).toBe(
      result.current.transcript,
    );
    expect(onNormalizationReady).toHaveBeenCalled();
    expect(onTranscriptReady).toHaveBeenCalledWith(result.current.transcript);
  });

  it("sets error state when simulateCaptureError is true", async () => {
    const { result } = renderHook(() =>
      useMockVoiceInput({
        settings: {
          showTranscriptPanel: true,
          pushToChatInput: false,
          simulateCaptureError: true,
          enableNormalization: true,
        },
      }),
    );

    act(() => {
      result.current.toggleListening();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(MOCK_VOICE_LISTEN_MS + 100);
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    expect(result.current.error).toBeTruthy();
  });

  it("returns unnormalized transcript when normalization is disabled", async () => {
    const onTranscriptReady = vi.fn();
    const { result } = renderHook(() =>
      useMockVoiceInput({
        settings: {
          showTranscriptPanel: true,
          pushToChatInput: true,
          simulateCaptureError: false,
          enableNormalization: false,
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

    await waitFor(() => {
      expect(result.current.status).toBe("completed");
    });

    expect(result.current.normalization?.normalizationApplied).toBe(false);
    expect(result.current.normalization?.original).toBe(
      result.current.normalization?.normalized,
    );
    expect(onTranscriptReady).toHaveBeenCalledWith(result.current.transcript);
  });

  it("normalizes trading STT phrase when enabled", async () => {
    Date.now = () => 0;

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

    await waitFor(() => {
      expect(result.current.status).toBe("completed");
    });

    expect(result.current.normalization?.original).toBe(
      "for eggs analysis",
    );
    expect(result.current.normalization?.normalized).toBe("forex analysis");
    expect(
      result.current.normalization?.correctionsApplied.includes(
        "stt-for-eggs-analysis",
      ),
    ).toBe(true);
    expect(onTranscriptReady).toHaveBeenCalledWith("forex analysis");

  });

  it("shows normalizing state during pipeline", async () => {
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
      await vi.advanceTimersByTimeAsync(MOCK_VOICE_LISTEN_MS + 310);
    });
    expect(["normalizing", "completed"]).toContain(result.current.status);
  });
});
