import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MOCK_VOICE_LISTEN_MS } from "../../voice/mock-voice-session";
import * as mockVoiceSession from "../../voice/mock-voice-session";

import { createMockJarvisApi } from "../../test/mock-jarvis-api";
import { ChatPage } from "../ChatPage";

vi.mock("../../api/jarvis-client", () => ({
  submitChatAsTask: vi.fn(),
}));

import { submitChatAsTask } from "../../api/jarvis-client";

describe("ChatPage", () => {
  const originalNow = Date.now;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.setItem(
      "jarvis.desktop.voiceSettings",
      JSON.stringify({
        showTranscriptPanel: true,
        pushToChatInput: true,
        simulateCaptureError: false,
        enableNormalization: true,
        autoExecuteVoicePipeline: false,
      }),
    );
    window.jarvis = createMockJarvisApi({
      getApiUrl: vi.fn().mockResolvedValue("http://127.0.0.1:8000"),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    Date.now = originalNow;
    vi.useRealTimers();
  });

  it("shows intent badge and Hermes plan after successful task", async () => {
    vi.mocked(submitChatAsTask).mockResolvedValue({
      create: {
        taskId: "task-1",
        status: "completed",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      classification: {
        intent: "plan",
        ruleId: "plan-keywords",
        reason: "planning",
        confidence: 0.9,
      },
      status: {
        taskId: "task-1",
        status: "completed",
        updatedAt: "2026-01-01T00:00:00.000Z",
        output: {
          routing: { selectedAgentId: "hermes", reason: "planning" },
          agentPayload: {
            structuredPlan: {
              goal: "Plan my week",
              steps: ["Clarify goals", "Schedule work"],
            },
            plan: { intentKind: "plan", summary: "Plan my week" },
            reasoning: { summary: "Planning only" },
            adapter: { adapterId: "hermes-planning-adapter", stub: false },
          },
        },
      },
    });

    render(<ChatPage />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Plan my week" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByTestId("intent-badge")).toHaveTextContent("Plan");
      expect(screen.getByTestId("hermes-plan-card")).toBeInTheDocument();
      expect(screen.getByTestId("task-progress-panel")).toBeInTheDocument();
      expect(screen.getByTestId("agent-status-panel")).toBeInTheDocument();
    });
    expect(screen.getByTestId("hermes-plan-goal")).toHaveTextContent(
      "Plan my week",
    );
    expect(screen.getByTestId("hermes-agent-badge")).toHaveTextContent("Hermes");
  });

  it("pushes mock transcript into chat input", async () => {
    render(<ChatPage />);

    fireEvent.click(screen.getByTestId("voice-mic-button"));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(MOCK_VOICE_LISTEN_MS + 500);
    });

    await waitFor(() => {
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value.length).toBeGreaterThan(0);
    });
    expect(screen.getByTestId("voice-transcript-panel")).toBeInTheDocument();
  });

  it("shows normalization details in transcript panel", async () => {
    render(<ChatPage />);

    fireEvent.click(screen.getByTestId("voice-mic-button"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(MOCK_VOICE_LISTEN_MS + 500);
    });

    await waitFor(() => {
      expect(
        screen.getByTestId("voice-normalization-block"),
      ).toBeInTheDocument();
    });
    expect(screen.getByTestId("voice-transcript-original")).toBeInTheDocument();
    expect(screen.getByTestId("voice-transcript-normalized")).toBeInTheDocument();
    expect(screen.getByTestId("voice-corrections")).toBeInTheDocument();
    expect(screen.getByTestId("voice-metadata-panel")).toBeInTheDocument();
    expect(screen.getByTestId("voice-metadata-provider")).toHaveTextContent(
      "stt-local",
    );
  });

  it("shows error when task fails without a plan", async () => {
    vi.mocked(submitChatAsTask).mockRejectedValue(new Error("Gateway offline"));

    render(<ChatPage />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByTestId("chat-error")).toHaveTextContent(
        "Gateway offline",
      );
      expect(screen.getByTestId("agent-status-error")).toHaveTextContent(
        "Gateway offline",
      );
    });
  });

  it("respects settings toggle to disable normalization", async () => {
    localStorage.setItem(
      "jarvis.desktop.voiceSettings",
      JSON.stringify({
        showTranscriptPanel: true,
        pushToChatInput: true,
        simulateCaptureError: false,
        enableNormalization: false,
      }),
    );

    vi.spyOn(mockVoiceSession, "runMockVoiceCapture").mockResolvedValue({
      transcript: "for eggs analysis",
    });

    render(<ChatPage />);
    fireEvent.click(screen.getByTestId("voice-mic-button"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(MOCK_VOICE_LISTEN_MS + 500);
    });

    await waitFor(() => {
      expect(screen.getByTestId("voice-transcript-original")).toHaveTextContent(
        "for eggs analysis",
      );
      expect(
        screen.getByTestId("voice-transcript-normalized"),
      ).toHaveTextContent("for eggs analysis");
    });
  });

  it("shows normalized transcript when normalization is enabled", async () => {
    vi.spyOn(mockVoiceSession, "runMockVoiceCapture").mockResolvedValue({
      transcript: "for eggs analysis",
    });

    render(<ChatPage />);
    fireEvent.click(screen.getByTestId("voice-mic-button"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(MOCK_VOICE_LISTEN_MS + 500);
    });

    await waitFor(() => {
      expect(screen.getByTestId("voice-transcript-original")).toHaveTextContent(
        "for eggs analysis",
      );
      expect(
        screen.getByTestId("voice-transcript-normalized"),
      ).toHaveTextContent("forex analysis");
    });
  });

  it("runs voice transcript through execution pipeline when autoExecute is enabled", async () => {
    localStorage.setItem(
      "jarvis.desktop.voiceSettings",
      JSON.stringify({
        showTranscriptPanel: true,
        pushToChatInput: true,
        simulateCaptureError: false,
        enableNormalization: true,
        autoExecuteVoicePipeline: true,
      }),
    );

    vi.spyOn(mockVoiceSession, "runMockVoiceCapture").mockResolvedValue({
      transcript: "Plan my week",
    });

    vi.mocked(submitChatAsTask).mockResolvedValue({
      create: {
        taskId: "task-voice-1",
        status: "completed",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      classification: {
        intent: "plan",
        ruleId: "plan-keywords",
        reason: "planning",
        confidence: 0.9,
      },
      status: {
        taskId: "task-voice-1",
        status: "completed",
        updatedAt: "2026-01-01T00:00:01.000Z",
        output: {
          activityStream: {
            events: [{ type: "planning_started", timestamp: "2026-01-01T00:00:01.000Z" }],
          },
          routing: { selectedAgentId: "hermes" },
        },
      },
    });

    render(<ChatPage />);
    fireEvent.click(screen.getByTestId("voice-mic-button"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(MOCK_VOICE_LISTEN_MS + 500);
    });

    await waitFor(() => {
      expect(submitChatAsTask).toHaveBeenCalled();
      expect(screen.getByTestId("task-progress-panel")).toBeInTheDocument();
    });
  });
});
