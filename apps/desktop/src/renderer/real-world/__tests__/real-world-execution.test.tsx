import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderHook } from "@testing-library/react";

import { useRealWorldExecution } from "../use-real-world-execution";
import { RealWorldExecutionIndicator } from "../RealWorldExecutionIndicator";

describe("useRealWorldExecution", () => {
  it("detects real-world voice commands", () => {
    const { result } = renderHook(() =>
      useRealWorldExecution({
        lastCommand: "Jarvis, open YouTube and search AI news",
        loading: true,
      }),
    );

    expect(result.current.isRealWorldCommand).toBe(true);
    expect(result.current.statusLabel).toContain("Performing task");
  });
});

describe("RealWorldExecutionIndicator", () => {
  it("renders user-facing status without internal names", () => {
    render(
      <RealWorldExecutionIndicator
        visible
        loading
        statusLabel="Researching…"
        providerOnline
      />,
    );

    expect(screen.getByTestId("real-world-execution-indicator")).toBeTruthy();
    expect(screen.getByText(/Researching/)).toBeTruthy();
    expect(screen.queryByText(/Hermes/i)).toBeNull();
    expect(screen.queryByText(/OpenClaw/i)).toBeNull();
  });
});
