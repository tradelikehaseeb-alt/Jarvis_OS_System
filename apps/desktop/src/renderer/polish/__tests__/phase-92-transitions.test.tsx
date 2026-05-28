import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { ProgressiveStreamText } from "../ProgressiveStreamText";
import { WaveformBars } from "../WaveformBars";

describe("Phase 92 UI transitions", () => {
  it("renders progressive stream text", () => {
    render(<ProgressiveStreamText text="Hello Jarvis" testId="stream-text" />);
    expect(screen.getByTestId("stream-text")).toHaveTextContent("Hello Jarvis");
  });

  it("renders memoized waveform bars", () => {
    render(<WaveformBars levels={[0.2, 0.5, 0.8]} barCount={3} />);
    expect(screen.getByTestId("waveform-bars").children.length).toBe(3);
  });
});
