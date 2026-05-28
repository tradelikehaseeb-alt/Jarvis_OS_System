import { describe, expect, it } from "vitest";

import { createDefaultVoiceSessionRuntime } from "../create-default-voice-session-runtime";

describe("VoiceSessionRuntime", () => {
  it("executes voice command through task delegate", async () => {
    const runtime = createDefaultVoiceSessionRuntime({
      taskExecutor: async (input) => ({
        taskId: "task-voice-session-1",
        taskStatus: {
          status: "completed",
          output: { summary: "Gold is trading higher today." },
        },
      }),
    });

    await runtime.feedTranscript("Jarvis what is gold price");

    expect(runtime.getState()).toBe("idle");
  });

  it("streams spoken response in chunks", async () => {
    const chunks: string[] = [];
    const runtime = createDefaultVoiceSessionRuntime({
      taskExecutor: async () => ({
        taskId: "task-voice-session-2",
        taskStatus: {
          status: "completed",
          output: { summary: "One two three" },
        },
      }),
      speechDelegate: {
        async speak(text, { onChunk }) {
          onChunk("One ");
          onChunk("two ");
          onChunk("three");
        },
      },
    });

    runtime.subscribe((event) => {
      if (event.streamingResponse) {
        chunks.push(event.streamingResponse);
      }
    });

    await runtime.feedTranscript("Jarvis summarize");

    expect(runtime.getStreamingResponse()).toContain("One");
    expect(chunks.length).toBeGreaterThan(0);
  });
});
