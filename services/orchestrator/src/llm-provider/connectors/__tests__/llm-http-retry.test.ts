import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchWithLlmRetries,
  LlmHttpError,
  mapLlmHttpResponseError,
} from "../llm-http-retry";

describe("llm-http-retry", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retries HTTP 429 up to three times", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 429, statusText: "Too Many Requests" }))
      .mockResolvedValueOnce(new Response("", { status: 429, statusText: "Too Many Requests" }))
      .mockResolvedValueOnce(new Response("ok", { status: 200, statusText: "OK" }));

    vi.stubGlobal("fetch", fetchMock);

    const response = await fetchWithLlmRetries("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
    });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("retries network errors twice", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed: ECONNREFUSED"))
      .mockResolvedValueOnce(new Response("ok", { status: 200, statusText: "OK" }));

    vi.stubGlobal("fetch", fetchMock);

    const response = await fetchWithLlmRetries("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
    });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("maps token limit errors", () => {
    const error = mapLlmHttpResponseError(413, "Payload Too Large", "Groq");
    expect(error).toBeInstanceOf(LlmHttpError);
    expect(error.code).toBe("LLM_TOKEN_LIMIT_EXCEEDED");
    expect(error.message).toContain("token limit");
  });
});
