import { beforeAll, vi } from "vitest";

/**
 * Orchestrator test harness — mocks external providers so unit/integration tests
 * do not require SERPER_API_KEY, live LLM keys, or Playwright.
 */
const originalFetch = globalThis.fetch.bind(globalThis);

beforeAll(() => {
  process.env.SERPER_API_KEY ??= "vitest-serper-mock-key";
  process.env.JARVIS_ALLOW_LLM_STUB_FALLBACK = "true";
  delete process.env.JARVIS_BROWSER_REAL;
});

vi.stubGlobal(
  "fetch",
  async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    if (url.includes("google.serper.dev/search")) {
      return new Response(
        JSON.stringify({
          organic: [
            {
              title: "Vitest Search Result",
              link: "https://example.com/vitest",
              snippet: "Mocked Serper response for orchestrator tests",
              position: 1,
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    return originalFetch(input, init);
  },
);

/** Set `RUN_INTEGRATION_LIVE_TESTS=true` to run live Ollama / provider E2E suites. */
export function shouldRunLiveIntegrationTests(): boolean {
  return process.env.RUN_INTEGRATION_LIVE_TESTS === "true";
}
