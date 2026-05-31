import { beforeAll, vi } from "vitest";

/**
 * Orchestrator test harness — mocks external providers so unit/integration tests
 * do not require SERPER_API_KEY, live LLM keys, or Playwright.
 */
const originalFetch = globalThis.fetch.bind(globalThis);

const LLM_API_KEY_ENV_VARS = [
  "GROQ_API_KEY",
  "JARVIS_GROQ_API_KEY",
  "OPENAI_API_KEY",
  "JARVIS_OPENAI_API_KEY",
  "GEMINI_API_KEY",
  "JARVIS_GEMINI_API_KEY",
  "GOOGLE_API_KEY",
  "OPENROUTER_API_KEY",
  "JARVIS_OPENROUTER_API_KEY",
  "DEEPSEEK_API_KEY",
  "JARVIS_DEEPSEEK_API_KEY",
] as const;

const savedEnv: Record<string, string | undefined> = {};

function mockChatCompletionsResponse(stream: boolean): Response {
  const payload = {
    choices: [
      {
        message: {
          content: "Vitest mock LLM response for orchestrator tests.",
        },
      },
    ],
  };

  if (stream) {
    const sse = [
      'data: {"choices":[{"delta":{"content":"Vitest "}}]}',
      'data: {"choices":[{"delta":{"content":"mock LLM."}}]}',
      "data: [DONE]",
    ].join("\n\n");
    return new Response(`${sse}\n\n`, {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function isLlmChatCompletionsUrl(url: string): boolean {
  return (
    url.includes("/chat/completions") &&
    (url.includes("api.groq.com") ||
      url.includes("api.openai.com") ||
      url.includes("generativelanguage.googleapis.com") ||
      url.includes("openrouter.ai") ||
      url.includes("api.deepseek.com"))
  );
}

beforeAll(() => {
  process.env.SERPER_API_KEY ??= "vitest-serper-mock-key";
  process.env.JARVIS_ALLOW_LLM_STUB_FALLBACK = "true";
  delete process.env.JARVIS_BROWSER_REAL;

  // Hermes: deterministic stub planning (avoid planning/python adapters from host .env)
  process.env.HERMES_MODE = "stub";
  delete process.env.HERMES_PLANNING_ADAPTER;
  delete process.env.HERMES_USE_PYTHON_AGENT;
  process.env.HERMES_INTEGRATION_LIVE = "false";
  process.env.ORCHESTRATOR_EXECUTE_COMPOSED_WORKFLOW = "false";

  if (process.env.RUN_INTEGRATION_LIVE_TESTS !== "true") {
    for (const key of LLM_API_KEY_ENV_VARS) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
  }
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

    if (isLlmChatCompletionsUrl(url)) {
      const body =
        typeof init?.body === "string"
          ? (JSON.parse(init.body) as { stream?: boolean })
          : {};
      return mockChatCompletionsResponse(body.stream === true);
    }

    return originalFetch(input, init);
  },
);

/** Set `RUN_INTEGRATION_LIVE_TESTS=true` to run live Ollama / provider E2E suites. */
export function shouldRunLiveIntegrationTests(): boolean {
  return process.env.RUN_INTEGRATION_LIVE_TESTS === "true";
}
