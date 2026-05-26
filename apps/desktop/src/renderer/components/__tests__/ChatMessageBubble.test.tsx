import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChatMessageBubble } from "../ChatMessageBubble";

describe("ChatMessageBubble", () => {
  it("renders loading state with status role", () => {
    render(
      <ChatMessageBubble
        message={{ id: "1", role: "loading", text: "Hermes is planning…" }}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(/planning/);
  });

  it("renders error state with alert role", () => {
    render(
      <ChatMessageBubble
        message={{ id: "1", role: "error", text: "Network failed" }}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Network failed");
  });

  it("renders Hermes plan card for assistant messages", () => {
    render(
      <ChatMessageBubble
        message={{
          id: "1",
          role: "assistant",
          text: "",
          hermesPlan: {
            plan: {
              goal: "Ship feature",
              steps: ["Design", "Build"],
              agentId: "hermes",
            },
          },
        }}
      />,
    );
    expect(screen.getByTestId("hermes-plan-card")).toBeInTheDocument();
    expect(screen.getByTestId("hermes-plan-goal")).toHaveTextContent(
      "Ship feature",
    );
  });
});
