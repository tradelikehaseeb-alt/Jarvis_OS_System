import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { LiveSpeechOrb } from "../LiveSpeechOrb";
import { StreamingVoiceOverlay } from "../StreamingVoiceOverlay";
import { VoiceInterruptController } from "../VoiceInterruptController";
import { voiceSessionLabel } from "../voice-session-labels";

describe("LiveSpeechOrb", () => {
  it("renders listening state with waveform", () => {
    render(<LiveSpeechOrb state="listening" partialTranscript="Jarvis" active />);
    expect(screen.getByTestId("live-speech-orb")).toHaveAttribute("data-state", "listening");
    expect(screen.getByText(voiceSessionLabel("listening"))).toBeInTheDocument();
  });
});

describe("StreamingVoiceOverlay", () => {
  it("shows partial transcript and streaming response", () => {
    render(
      <StreamingVoiceOverlay
        visible
        partialTranscript="Jarvis open"
        streamingText="Opening calendar."
      />,
    );
    expect(screen.getByTestId("voice-partial-transcript")).toHaveTextContent("Jarvis open");
    expect(screen.getByTestId("voice-streaming-response")).toHaveTextContent("Opening calendar.");
  });
});

describe("VoiceInterruptController", () => {
  it("calls onInterrupt when visible", async () => {
    const onInterrupt = vi.fn();
    render(<VoiceInterruptController visible onInterrupt={onInterrupt} />);
    await screen.getByTestId("voice-interrupt-controller").click();
    expect(onInterrupt).toHaveBeenCalledTimes(1);
  });
});
