import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RuntimeStartupProgress } from "../RuntimeStartupProgress";

describe("RuntimeStartupProgress", () => {
  it("renders startup phase and progress bar", () => {
    render(
      <RuntimeStartupProgress
        progress={{
          phase: "validating",
          percent: 50,
          ready: false,
          message: "Validating runtime health",
        }}
      />,
    );

    expect(screen.getByTestId("runtime-startup-progress")).toHaveAttribute(
      "data-phase",
      "validating",
    );
    expect(screen.getByTestId("runtime-startup-progress-label")).toHaveTextContent(
      "Validating",
    );
    expect(screen.getByTestId("runtime-startup-progress-bar")).toHaveAttribute(
      "aria-valuenow",
      "50",
    );
  });
});
