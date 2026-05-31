import { vi } from "vitest";

import type { HermesPlanningAdapterOptions } from "../hermes-planning-adapter";

const GROQ_PLAN_STEPS = [
  {
    stepId: "1",
    agent: "hermes",
    skill: "search",
    action: "Research the request",
    params: {},
  },
  {
    stepId: "2",
    agent: "hermes",
    skill: "memory",
    action: "Capture key facts",
    params: {},
  },
  {
    stepId: "3",
    agent: "hermes",
    skill: "search",
    action: "Summarize findings",
    params: {},
  },
] as const;

/** Options for {@link createHermesPlanningAdapter} with a mocked Groq HTTP response. */
export const GROQ_PLANNING_ADAPTER_TEST_OPTIONS: HermesPlanningAdapterOptions =
  {
    apiKey: "test-groq-key",
    fetchFn: async (input) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof Request
            ? input.url
            : String(input);
      if (!url.includes("groq.com")) {
        return new Response("not found", { status: 404 });
      }
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({ planId: "plan-test", steps: GROQ_PLAN_STEPS }),
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    },
  };

/** Installs a global Groq planning fetch mock for tests that construct adapters without options. */
export function installGroqPlanningFetchMock(): void {
  vi.spyOn(globalThis, "fetch").mockImplementation(
    GROQ_PLANNING_ADAPTER_TEST_OPTIONS.fetchFn!,
  );
}
