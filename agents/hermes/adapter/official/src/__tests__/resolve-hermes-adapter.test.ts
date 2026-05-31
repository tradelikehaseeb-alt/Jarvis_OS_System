import { describe, expect, it } from "vitest";

import { createDefaultProviderResolver } from "@jarvis/provider-registry";

import {
  createResolvedHermesAdapter,
  readHermesAdapterSelection,
  resolveHermesInnerAdapter,
} from "../resolve-hermes-adapter";
import { isHermesPlanningAdapter } from "../hermes-planning-adapter";
import { GROQ_PLANNING_ADAPTER_TEST_OPTIONS } from "./groq-planning-mock";
import { createHermesPlanningAdapter } from "../hermes-planning-adapter";

describe("readHermesAdapterSelection", () => {
  it("defaults to stub", () => {
    expect(readHermesAdapterSelection({})).toBe("stub");
  });

  it("selects planning when env requests it", () => {
    expect(
      readHermesAdapterSelection({ HERMES_PLANNING_ADAPTER: "planning" }),
    ).toBe("planning");
  });
});

describe("resolveHermesInnerAdapter", () => {
  it("returns planning adapter when selected", () => {
    const adapter = resolveHermesInnerAdapter({ selection: "planning" });
    expect(isHermesPlanningAdapter(adapter)).toBe(true);
  });
});

describe("createResolvedHermesAdapter", () => {
  it("preserves official planning through provider wrapper", async () => {
    const adapter = createResolvedHermesAdapter(
      createDefaultProviderResolver(),
      {
        selection: "planning",
        inner: createHermesPlanningAdapter(GROQ_PLANNING_ADAPTER_TEST_OPTIONS),
      },
    );

    const response = await adapter.invoke({
      requestId: "req-r1",
      taskId: "task-r1",
      userId: "user-1",
      intent: { kind: "research", description: "Survey competitors" },
    });

    expect(response.stub).toBe(false);
    expect(response.plan.goal).toBe("Survey competitors");
    expect(response.plan.steps.length).toBeGreaterThan(0);
    expect(response.adapterId).toBe("hermes-local");
  });
});
