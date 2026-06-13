import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockJarvisApi, defaultProviderSettingsSnapshot } from "../../test/mock-jarvis-api";
import { ProviderSettingsPage } from "../ProviderSettingsPage";

describe("ProviderSettingsPage", () => {
  beforeEach(() => {
    window.jarvis = createMockJarvisApi();
  });

  it("renders provider cards and active provider label", async () => {
    render(<ProviderSettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("provider-settings-page")).toBeInTheDocument();
    });

    expect(screen.getByTestId("active-provider-label")).toHaveTextContent("OpenAI");
    expect(screen.getByTestId("provider-card-openai")).toBeInTheDocument();
    expect(screen.getByTestId("provider-card-groq")).toBeInTheDocument();
  });

  it("activates a provider through IPC", async () => {
    window.jarvis.getProviderSettings = vi.fn().mockResolvedValue({
      ...defaultProviderSettingsSnapshot,
      locale: {
        timeZone: "Asia/Karachi",
        locale: "en-US",
        cityLabel: "Karachi",
      },
    });
    render(<ProviderSettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("provider-card-groq")).toBeInTheDocument();
    });

    const groqCard = screen.getByTestId("provider-card-groq");
    fireEvent.click(
      within(groqCard).getByRole("button", { name: /Use this provider/i }),
    );

    expect(window.jarvis.selectProvider).toHaveBeenCalled();
    expect(screen.getByTestId("client-locale-banner")).toHaveTextContent(/Karachi/);
  });
});
