import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { MemoryContextIndicator } from "../MemoryContextIndicator";

describe("MemoryContextIndicator", () => {
  it("renders remembered context message when visible", () => {
    render(
      <MemoryContextIndicator visible message="Remembered context" snippetCount={2} />,
    );
    expect(screen.getByTestId("memory-context-indicator")).toHaveTextContent(
      "Remembered context",
    );
    expect(screen.getByTestId("memory-context-indicator")).toHaveTextContent("2 items");
  });

  it("renders nothing when hidden", () => {
    render(<MemoryContextIndicator visible={false} />);
    expect(screen.queryByTestId("memory-context-indicator")).not.toBeInTheDocument();
  });
});
