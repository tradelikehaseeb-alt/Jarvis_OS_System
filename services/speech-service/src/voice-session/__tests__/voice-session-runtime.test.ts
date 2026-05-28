import { describe, expect, it } from "vitest";

import { createDefaultVoiceSessionRuntime } from "../create-default-voice-session-runtime";

describe("VoiceSessionRuntime integration", () => {
  it("runs push-to-talk capture delegate", async () => {
    const runtime = createDefaultVoiceSessionRuntime({
      captureDelegate: {
        async capture() {
          return { transcript: "Jarvis open calendar", partialChunks: ["Jar", "vis open"] };
        },
      },
      taskExecutor: async () => ({
        taskId: "task-ptt",
        taskStatus: { status: "completed", output: { summary: "Opening calendar." } },
      }),
    });

    await runtime.pushToTalkStart();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(runtime.getPartialTranscript()).toContain("Jarvis");
    expect(runtime.getState()).toBe("idle");
  });

  it("requires wake phrase in wake-word mode", async () => {
    const runtime = createDefaultVoiceSessionRuntime({
      mode: "wake-word",
      captureDelegate: {
        async capture() {
          return { transcript: "hello without wake word" };
        },
      },
      taskExecutor: async () => ({ taskId: "should-not-run" }),
    });

    await runtime.startContinuousListening();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(runtime.getWakeWordState()).toBe("armed");
    expect(runtime.getState()).toBe("idle");
  });
});
