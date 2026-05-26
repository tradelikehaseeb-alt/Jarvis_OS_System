import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IntentBadge } from "../IntentBadge";

describe("IntentBadge", () => {
  it("renders intent label", () => {
    render(<IntentBadge intent="plan" />);
    const badge = screen.getByTestId("intent-badge");
    expect(badge).toHaveTextContent("Plan");
    expect(badge).toHaveAttribute("data-intent", "plan");
  });
});
