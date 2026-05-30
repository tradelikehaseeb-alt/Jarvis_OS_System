import { describe, expect, it } from "vitest";

import { normalizeLlmStreamSubscriber } from "../llm-stream-subscriber";

describe("normalizeLlmStreamSubscriber", () => {
  it("wraps legacy function callbacks", () => {
    const chunks: string[] = [];
    const subscriber = normalizeLlmStreamSubscriber((chunk) => {
      chunks.push(chunk);
    }, "legacy");

    subscriber.onChunk("hello");
    expect(subscriber.subscriberId).toBe("legacy");
    expect(chunks).toEqual(["hello"]);
  });

  it("passes through full subscribers", () => {
    const chunks: string[] = [];
    const subscriber = normalizeLlmStreamSubscriber({
      subscriberId: "full",
      onChunk: (chunk) => chunks.push(chunk),
    });

    subscriber.onChunk("world");
    expect(subscriber.subscriberId).toBe("full");
    expect(chunks).toEqual(["world"]);
  });
});
