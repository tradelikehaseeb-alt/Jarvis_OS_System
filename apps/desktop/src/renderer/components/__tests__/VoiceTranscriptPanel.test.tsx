import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { VoiceTranscriptPanel } from "../VoiceTranscriptPanel";

describe("VoiceTranscriptPanel", () => {
  it("shows listening placeholder", () => {
    render(
      <VoiceTranscriptPanel status="listening" transcript="" visible />,
    );
    expect(screen.getByText(/Listening for speech/)).toBeInTheDocument();
  });

  it("shows transcript text when completed", () => {
    render(
      <VoiceTranscriptPanel
        status="completed"
        transcript="Plan my week"
        visible
      />,
    );
    expect(screen.getByTestId("voice-transcript-text")).toHaveTextContent(
      "Plan my week",
    );
  });

  it("renders original + normalized transcript and corrections list", () => {
    render(
      <VoiceTranscriptPanel
        status="completed"
        transcript="forex analysis"
        normalization={{
          original: "for eggs analysis",
          normalized: "forex analysis",
          correctionsApplied: ["stt-for-eggs-analysis", "cleanup-whitespace"],
          normalizationApplied: true,
        }}
        visible
      />,
    );

    expect(screen.getByTestId("voice-transcript-original")).toHaveTextContent(
      "for eggs analysis",
    );
    expect(screen.getByTestId("voice-transcript-normalized")).toHaveTextContent(
      "forex analysis",
    );
    expect(screen.getByTestId("voice-corrections")).toBeInTheDocument();
  });

  it("shows error alert", () => {
    render(
      <VoiceTranscriptPanel
        status="error"
        transcript=""
        error="Capture failed"
        visible
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Capture failed");
  });

  it("shows normalizing loading text", () => {
    render(
      <VoiceTranscriptPanel status="normalizing" transcript="" visible />,
    );
    expect(screen.getByText(/Applying normalization rules/)).toBeInTheDocument();
  });
});
