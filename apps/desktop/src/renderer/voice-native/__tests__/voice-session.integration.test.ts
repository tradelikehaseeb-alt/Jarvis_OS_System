import { describe, expect, it, vi } from "vitest";

import { createDefaultVoiceSessionRuntime } from "@jarvis/speech-service";

describe("desktop voice session integration", () => {
  it("streams assistant speech after mocked execution", async () => {
    const submitChatAsTask = vi.fn(async () => ({
      create: { taskId: "task-1", status: "completed", createdAt: new Date(0).toISOString() },
      status: {
        taskId: "task-1",
        status: "completed",
        updatedAt: new Date(0).toISOString(),
        output: { summary: "Voice integration complete." },
      },
    }));

    const runtime = createDefaultVoiceSessionRuntime({
      taskExecutor: async (input) => {
        const { status } = await submitChatAsTask(input.normalizedText);
        return {
          taskId: status.taskId,
          taskStatus: status,
        };
      },
      speechDelegate: {
        async speak(text, { onChunk }) {
          onChunk(text);
        },
      },
    });

    await runtime.feedTranscript("Jarvis run integration test");

    expect(submitChatAsTask).toHaveBeenCalled();
    expect(runtime.getStreamingResponse()).toContain("Voice integration complete");
  });
});
