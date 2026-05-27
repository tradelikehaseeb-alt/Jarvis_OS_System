import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RuntimeHealthCard } from "../RuntimeHealthCard";
import type { RuntimeStatus } from "../runtime-status";

const runningStatus: RuntimeStatus = {
  processId: "api-runtime",
  label: "Jarvis API Runtime",
  displayName: "API Runtime",
  state: "running",
  healthy: true,
  restartCount: 0,
};

const failedStatus: RuntimeStatus = {
  processId: "openclaw-runtime",
  label: "OpenClaw Runtime",
  displayName: "OpenClaw Runtime",
  state: "failed",
  healthy: false,
  restartCount: 2,
  lastError: "Execution stub failed",
};

describe("RuntimeHealthCard", () => {
  it("shows process state and health for a running process", () => {
    render(<RuntimeHealthCard status={runningStatus} />);

    expect(screen.getByTestId("runtime-health-card-api-runtime")).toBeInTheDocument();
    expect(screen.getByTestId("runtime-health-badge-api-runtime")).toHaveTextContent(
      "Running",
    );
    expect(screen.getByTestId("runtime-health-value-api-runtime")).toHaveTextContent(
      "Healthy",
    );
    expect(screen.getByTestId("runtime-restart-count-api-runtime")).toHaveTextContent(
      "0",
    );
  });

  it("shows restart count and error for failed process", () => {
    render(<RuntimeHealthCard status={failedStatus} />);

    expect(screen.getByTestId("runtime-restart-count-openclaw-runtime")).toHaveTextContent(
      "2",
    );
    expect(screen.getByTestId("runtime-error-openclaw-runtime")).toHaveTextContent(
      "Execution stub failed",
    );
  });
});
