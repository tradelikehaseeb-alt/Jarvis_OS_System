import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RuntimeStatusBadge } from "../RuntimeStatusBadge";

describe("RuntimeStatusBadge", () => {
  it("renders healthy badge", () => {
    render(<RuntimeStatusBadge label="Healthy" healthy state="running" testId="badge" />);

    expect(screen.getByTestId("badge")).toHaveAttribute("data-healthy", "true");
    expect(screen.getByTestId("badge")).toHaveTextContent("Healthy");
  });

  it("renders unhealthy badge", () => {
    render(<RuntimeStatusBadge label="Unhealthy" healthy={false} state="failed" />);

    expect(screen.getByTestId("runtime-status-badge")).toHaveAttribute(
      "data-healthy",
      "false",
    );
  });
});
