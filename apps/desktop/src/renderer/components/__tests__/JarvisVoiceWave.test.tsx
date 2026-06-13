import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { JarvisVoiceWave } from "../JarvisVoiceWave";

describe("JarvisVoiceWave", () => {
  it("renders animated frequency bars", () => {
    render(<JarvisVoiceWave />);
    const wave = screen.getByTestId("jarvis-voice-wave");
    expect(wave).toHaveClass("jarvis-voice-wave");
    expect(wave.querySelectorAll(".jarvis-voice-wave__bar")).toHaveLength(5);
    expect(wave.querySelector(".jarvis-voice-wave__track")).toBeInTheDocument();
  });
});
