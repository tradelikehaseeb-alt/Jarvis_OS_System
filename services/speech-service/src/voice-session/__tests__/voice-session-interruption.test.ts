import { describe, expect, it } from "vitest";

import { createDefaultVoiceSessionRuntime } from "../create-default-voice-session-runtime";

describe("VoiceSessionRuntime interruption", () => {
  it("interruptSpeaking stops streaming response", async () => {
    let resolveSpeak: (() => void) | undefined;
    const speakStarted = new Promise<void>((resolve) => {
      resolveSpeak = resolve;
    });

    const runtime = createDefaultVoiceSessionRuntime({
      taskExecutor: async () => ({
        taskId: "task-interrupt-1",
        taskStatus: {
          status: "completed",
          output: { summary: "Long assistant reply for interruption test" },
        },
      }),
      speechDelegate: {
        async speak(_text, { signal, onChunk }) {
          resolveSpeak?.();
          onChunk("Long ");
          await new Promise((resolve) => setTimeout(resolve, 200));
          if (signal.aborted) {
            return;
          }
          onChunk("reply");
        },
      },
    });

    const feedPromise = runtime.feedTranscript("Jarvis test interrupt");
    await speakStarted;
    runtime.interruptSpeaking("barge-in");
    await feedPromise;

    expect(runtime.getState()).toBe("idle");
    expect(runtime.getStreamingResponse()).toBe("");
  });

  it("stopVoiceExecution path via interrupt during executing", async () => {
    const runtime = createDefaultVoiceSessionRuntime({
      taskExecutor: async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { taskId: "task-late" };
      },
    });

    const promise = runtime.feedTranscript("Jarvis plan week");
    runtime.interruptSpeaking();
    await promise;

    expect(runtime.getState()).toBe("idle");
  });
});
