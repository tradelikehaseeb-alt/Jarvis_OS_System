import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { VoiceButton } from "../VoiceButton";

describe("VoiceButton", () => {
  afterEach(() => {
    cleanup();
  });

  it("calls onPress when clicked", () => {
    const onPress = vi.fn();
    render(<VoiceButton status="idle" onPress={onPress} />);
    fireEvent.click(screen.getByTestId("voice-mic-button"));
    expect(onPress).toHaveBeenCalled();
  });

  it("shows listening state with aria-pressed", () => {
    render(<VoiceButton status="listening" onPress={vi.fn()} />);
    expect(screen.getByTestId("voice-mic-button")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("disables while processing", () => {
    render(<VoiceButton status="processing" onPress={vi.fn()} />);
    expect(screen.getByTestId("voice-mic-button")).toBeDisabled();
  });
});
