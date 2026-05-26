import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { VoiceStatusIndicator } from "../VoiceStatusIndicator";

describe("VoiceStatusIndicator", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders status label", () => {
    render(<VoiceStatusIndicator status="listening" />);
    expect(screen.getByTestId("voice-status-indicator")).toHaveAttribute(
      "data-status",
      "listening",
    );
    expect(screen.getByText(/Listening/)).toBeInTheDocument();
  });

  it("shows error message when provided", () => {
    render(
      <VoiceStatusIndicator status="error" error="Mock failure" />,
    );
    expect(screen.getByText("Mock failure")).toBeInTheDocument();
  });

  it("renders normalizing state", () => {
    const { getByTestId } = render(<VoiceStatusIndicator status="normalizing" />);
    expect(getByTestId("voice-status-indicator")).toHaveAttribute(
      "data-status",
      "normalizing",
    );
    expect(screen.getAllByText(/Normalizing/).length).toBeGreaterThan(0);
  });
});
