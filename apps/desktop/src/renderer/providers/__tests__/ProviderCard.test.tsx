import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProviderCard } from "../ProviderCard";
import type { ProviderStatus } from "../provider-settings-types";

const provider: ProviderStatus = {
  providerId: "openai",
  label: "OpenAI",
  kind: "openai",
  configured: false,
  valid: false,
  stub: true,
  active: false,
  message: "OpenAI API key not configured — stub fallback active",
  selectedModel: "gpt-4o-mini",
  availableModels: ["gpt-4o-mini", "gpt-4o"],
};

describe("ProviderCard", () => {
  it("shows provider name, status, and model selector", () => {
    render(
      <ProviderCard
        provider={provider}
        onActivate={vi.fn()}
        onModelChange={vi.fn()}
        onSaveApiKey={vi.fn().mockResolvedValue({ valid: true, message: "saved" })}
      />,
    );

    expect(screen.getByText("OpenAI")).toBeInTheDocument();
    expect(screen.getByTestId("provider-status-openai")).toHaveTextContent(
      "Real Production Mode",
    );
    expect(screen.getByTestId("model-selector-openai")).toBeInTheDocument();
  });

  it("shows Active badge for configured active provider", () => {
    render(
      <ProviderCard
        provider={{
          ...provider,
          configured: true,
          valid: true,
          stub: false,
          active: true,
        }}
        onActivate={vi.fn()}
        onModelChange={vi.fn()}
        onSaveApiKey={vi.fn().mockResolvedValue({ valid: true, message: "saved" })}
      />,
    );

    expect(screen.getByTestId("provider-status-openai")).toHaveTextContent("Active");
  });

  it("calls onActivate when use provider is clicked", () => {
    const onActivate = vi.fn();
    render(
      <ProviderCard
        provider={provider}
        onActivate={onActivate}
        onModelChange={vi.fn()}
        onSaveApiKey={vi.fn().mockResolvedValue({ valid: true, message: "saved" })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Use this provider/i }));
    expect(onActivate).toHaveBeenCalledWith("openai");
  });
});
