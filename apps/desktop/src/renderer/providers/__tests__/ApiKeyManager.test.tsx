import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ApiKeyManager } from "../ApiKeyManager";

describe("ApiKeyManager", () => {
  it("never displays stored key values", () => {
    render(
      <ApiKeyManager
        providerId="openai"
        configured={true}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByPlaceholderText("••••••••••••")).toBeInTheDocument();
    expect(screen.getByText(/A key is configured \(hidden\)/i)).toBeInTheDocument();
  });

  it("saves entered key through callback", async () => {
    const onSave = vi.fn().mockResolvedValue({
      valid: true,
      message: "OpenAI API key configured",
    });

    render(
      <ApiKeyManager
        providerId="openai"
        configured={false}
        onSave={onSave}
      />,
    );

    fireEvent.change(screen.getByLabelText("API key"), {
      target: { value: "sk-test-key-12345678" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save key/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith("sk-test-key-12345678");
    });
  });
});
