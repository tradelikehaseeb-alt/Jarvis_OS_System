import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { BrowserStateIndicator } from "../BrowserStateIndicator";
import { ExecutionPermissionPrompt } from "../ExecutionPermissionPrompt";
import { mapExecutionRuntimeFromTaskOutput } from "../map-execution-runtime";

describe("mapExecutionRuntimeFromTaskOutput", () => {
  it("maps browser state and permission flags", () => {
    const view = mapExecutionRuntimeFromTaskOutput({
      executionRuntime: {
        browserState: {
          sessionId: "sess-1",
          url: "https://mail.google.com",
          active: true,
          stub: true,
        },
        permissionRequired: true,
      },
    });

    expect(view?.browserState?.url).toContain("mail.google.com");
    expect(view?.permission?.required).toBe(true);
  });
});

describe("BrowserStateIndicator", () => {
  it("renders active browser url", () => {
    render(
      <BrowserStateIndicator
        browserState={{
          sessionId: "sess-1",
          url: "https://mail.google.com",
          active: true,
          stub: true,
        }}
      />,
    );

    expect(screen.getByTestId("browser-state-indicator")).toBeTruthy();
    expect(screen.getByText(/mail.google.com/)).toBeTruthy();
  });
});

describe("ExecutionPermissionPrompt", () => {
  it("renders approve and deny actions", () => {
    render(
      <ExecutionPermissionPrompt
        permission={{ required: true, message: "Allow Jarvis to open Gmail?" }}
      />,
    );

    expect(screen.getByTestId("execution-permission-prompt")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Allow" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Deny" })).toBeTruthy();
  });
});
