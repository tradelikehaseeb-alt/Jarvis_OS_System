import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { DemoExecutionFlow } from "../DemoExecutionFlow";
import { useDemoInteraction } from "../use-demo-interaction";
import { renderHook } from "@testing-library/react";
import { DEMO_SCENARIO_COMMANDS } from "@jarvis/types";

describe("DemoExecutionFlow", () => {
  it("renders cinematic demo progress", () => {
    render(
      <DemoExecutionFlow
        visible
        phase="Executing"
        message="Opening workspace"
        progress={0.42}
      />,
    );

    expect(screen.getByTestId("demo-execution-flow")).toBeTruthy();
    expect(screen.getByText("Opening workspace")).toBeTruthy();
  });
});

describe("useDemoInteraction", () => {
  it("detects canonical demo commands", () => {
    const { result } = renderHook(() =>
      useDemoInteraction({
        command: DEMO_SCENARIO_COMMANDS[0],
        loading: true,
        progress: 0.5,
      }),
    );

    expect(result.current.isDemoScenario).toBe(true);
    expect(result.current.showDemoFlow).toBe(true);
  });
});
