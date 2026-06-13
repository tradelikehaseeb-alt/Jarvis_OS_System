import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChatPanel } from "../chat-panel";
import type { ChatMessage } from "../../components/ChatMessages";

const messages: readonly ChatMessage[] = [
  { id: "1", role: "user", text: "Open settings" },
  {
    id: "2",
    role: "assistant",
    text: "Opening settings now.",
  },
];

describe("ChatPanel", () => {
  it("renders chat viewport with messages", () => {
    render(<ChatPanel messages={messages} />);
    expect(screen.getByTestId("chat-panel")).toBeInTheDocument();
    expect(screen.getByText("Open settings")).toBeInTheDocument();
  });

  it("applies responding and processing HUD classes", () => {
    render(<ChatPanel messages={messages} responding processing />);
    const panel = screen.getByTestId("chat-panel");
    expect(panel.className).toContain("chat-panel--responding");
    expect(panel.className).toContain("chat-panel--processing");
  });
});
