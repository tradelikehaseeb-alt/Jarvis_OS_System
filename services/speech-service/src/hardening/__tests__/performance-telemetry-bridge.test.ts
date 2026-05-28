import { describe, expect, it } from "vitest";

import {
  bindSpeechPerformanceTelemetry,
  recordSpeechOperationSample,
  resetSpeechPerformanceTelemetryForTests,
} from "../performance-telemetry-bridge";

describe("speech performance telemetry bridge", () => {
  it("records samples through bound telemetry", () => {
    const samples: Array<{ name: string; durationMs: number }> = [];
    bindSpeechPerformanceTelemetry({
      record(name, durationMs) {
        samples.push({ name, durationMs });
      },
    });
    recordSpeechOperationSample("stt.partial", 12);
    expect(samples).toHaveLength(1);
    resetSpeechPerformanceTelemetryForTests();
  });
});
