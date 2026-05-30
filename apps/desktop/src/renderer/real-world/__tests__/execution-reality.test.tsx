import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { ExecutionRealityBar } from "../ExecutionRealityBar";

describe("ExecutionRealityBar", () => {
  it("shows REAL and STUB mode labels honestly", () => {
    render(
      <ExecutionRealityBar
        llm={{ mode: "REAL MODE", detail: "LLM · groq · 420ms" }}
        browser={{ mode: "SIMULATED MODE", detail: "Browser · simulated" }}
        voice={{ mode: "STUB MODE", detail: "Voice · speech-stub · stub" }}
        summaryLabel="REAL MODE · SIMULATED MODE · STUB MODE"
      />,
    );

    expect(screen.getByTestId("execution-reality-bar")).toBeTruthy();
    expect(screen.getAllByText("REAL MODE").length).toBeGreaterThan(0);
    expect(screen.getAllByText("STUB MODE").length).toBeGreaterThan(0);
    expect(screen.getAllByText("SIMULATED MODE").length).toBeGreaterThan(0);
  });
});
