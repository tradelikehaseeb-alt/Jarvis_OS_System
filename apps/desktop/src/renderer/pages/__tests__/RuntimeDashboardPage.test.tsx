import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { createMockJarvisApi } from "../../test/mock-jarvis-api";
import { RuntimeDashboardPage } from "../RuntimeDashboardPage";

describe("RuntimeDashboardPage", () => {
  beforeEach(() => {
    window.jarvis = createMockJarvisApi();
  });

  it("renders health dashboard sections", async () => {
    render(<RuntimeDashboardPage />);

    expect(screen.getByTestId("runtime-dashboard-page")).toBeInTheDocument();
    expect(screen.getByTestId("runtime-startup-progress")).toBeInTheDocument();
    expect(screen.getByTestId("runtime-health-panel")).toBeInTheDocument();
    expect(screen.getByTestId("runtime-startup-panel")).toBeInTheDocument();
    expect(screen.getByTestId("runtime-dashboard")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("runtime-health-panel-hermes")).toBeInTheDocument();
    });
  });
});
