import { describe, expect, it } from "vitest";

import {
  consumeOpenAiSseStream,
  parseOpenAiSseLine,
} from "../parse-openai-sse-chunks";

describe("parseOpenAiSseLine", () => {
  it("extracts delta content from SSE data lines", () => {
    const line =
      'data: {"choices":[{"delta":{"content":"Hello"}}]}';
    expect(parseOpenAiSseLine(line)).toBe("Hello");
  });

  it("returns undefined for DONE markers", () => {
    expect(parseOpenAiSseLine("data: [DONE]")).toBeUndefined();
  });
});

describe("consumeOpenAiSseStream", () => {
  it("streams incremental chunks from a readable stream", async () => {
    const payload = [
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n',
      'data: {"choices":[{"delta":{"content":" world"}}]}\n',
      "data: [DONE]\n",
    ].join("");

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(payload));
        controller.close();
      },
    });

    const chunks: string[] = [];
    const content = await consumeOpenAiSseStream(stream, (chunk) => {
      chunks.push(chunk);
    });

    expect(chunks).toEqual(["Hello", " world"]);
    expect(content).toBe("Hello world");
  });
});
