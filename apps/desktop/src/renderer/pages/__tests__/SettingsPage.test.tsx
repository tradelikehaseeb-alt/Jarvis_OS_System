import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SettingsPage } from "../SettingsPage";

vi.mock("../../api/jarvis-client", () => ({
  getApiUrl: vi.fn().mockResolvedValue("http://127.0.0.1:8000"),
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it("shows normalization toggle and persists to localStorage", async () => {
    const { getByLabelText } = render(<SettingsPage />);

    const toggle = getByLabelText(
      /Enable speech normalization before intent classification/i,
    );

    expect((toggle as HTMLInputElement).checked).toBe(true);
    fireEvent.click(toggle);

    const raw = localStorage.getItem("jarvis.desktop.voiceSettings");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw ?? "{}") as { enableNormalization?: boolean };
    expect(parsed.enableNormalization).toBe(false);
  });

  it("shows and clears saved indicator", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { getByLabelText } = render(<SettingsPage />);
    const toggle = getByLabelText(
      /Enable speech normalization before intent classification/i,
    );
    fireEvent.click(toggle);

    expect(screen.getByRole("status")).toHaveTextContent("Voice settings saved");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
    });

    expect(screen.queryByText("Voice settings saved")).not.toBeInTheDocument();
  });

  it("loads saved normalization preference from storage", async () => {
    localStorage.setItem(
      "jarvis.desktop.voiceSettings",
      JSON.stringify({
        showTranscriptPanel: true,
        pushToChatInput: true,
        simulateCaptureError: false,
        enableNormalization: false,
      }),
    );

    const { getByLabelText } = render(<SettingsPage />);
    const toggle = getByLabelText(
      /Enable speech normalization before intent classification/i,
    );
    expect((toggle as HTMLInputElement).checked).toBe(false);
  });
});
