import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChatMessages } from "../ChatMessages";

describe("ChatMessages", () => {
  it("renders empty hint", () => {
    render(<ChatMessages messages={[]} />);
    expect(screen.getByText(/Ask Jarvis anything/)).toBeInTheDocument();
  });

  it("renders user and assistant bubbles", () => {
    render(
      <ChatMessages
        messages={[
          { id: "1", role: "user", text: "Hello" },
          { id: "2", role: "assistant", text: "Hi" },
        ]}
      />,
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Hi")).toBeInTheDocument();
  });

  it("shows intent badge on classified user messages", () => {
    render(
      <ChatMessages
        messages={[
          {
            id: "1",
            role: "user",
            text: "Plan my week",
            detectedIntent: "plan",
          },
        ]}
      />,
    );
    expect(screen.getByTestId("intent-badge")).toHaveTextContent("Plan");
  });

  it("shows loading state", () => {
    render(
      <ChatMessages
        messages={[{ id: "1", role: "loading", text: "Working…" }]}
      />,
    );
    expect(screen.getByText(/Working/)).toBeInTheDocument();
  });

  it("renders Hermes structured plan in assistant bubble", () => {
    render(
      <ChatMessages
        messages={[
          {
            id: "1",
            role: "assistant",
            text: "",
            hermesPlan: {
              plan: {
                goal: "Plan Q2",
                steps: ["Step 1", "Step 2"],
                agentId: "hermes",
              },
            },
          },
        ]}
      />,
    );
    expect(screen.getByTestId("hermes-plan-card")).toBeInTheDocument();
    expect(screen.getByText("Plan Q2")).toBeInTheDocument();
  });

  it("renders error bubble", () => {
    render(
      <ChatMessages
        messages={[{ id: "1", role: "error", text: "Task failed" }]}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Task failed");
  });
});
