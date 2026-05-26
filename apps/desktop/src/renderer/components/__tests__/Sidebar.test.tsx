import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Sidebar } from "../Sidebar";

describe("Sidebar", () => {
  it("highlights active page and navigates", () => {
    const onNavigate = vi.fn();
    render(<Sidebar activePage="chat" onNavigate={onNavigate} />);
    expect(screen.getByRole("button", { name: "Chat" })).toHaveClass("active");
    fireEvent.click(screen.getByRole("button", { name: "Tasks" }));
    expect(onNavigate).toHaveBeenCalledWith("tasks");
  });
});
