import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ChatInput } from "../ChatInput";

describe("ChatInput", () => {
  it("calls onSubmit when Send clicked", () => {
    const onSubmit = vi.fn();
    render(
      <ChatInput
        value="test"
        onChange={() => {}}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /send/i }));
    expect(onSubmit).toHaveBeenCalled();
  });

  it("disables send when loading", () => {
    render(
      <ChatInput
        value="test"
        onChange={() => {}}
        onSubmit={() => {}}
        loading
      />,
    );
    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();
  });

  it("renders leading voice controls when provided", () => {
    render(
      <ChatInput
        value="test"
        onChange={() => {}}
        onSubmit={() => {}}
        leadingAction={<div data-testid="leading-action">Voice</div>}
      />,
    );
    expect(screen.getByTestId("leading-action")).toBeInTheDocument();
  });
});
