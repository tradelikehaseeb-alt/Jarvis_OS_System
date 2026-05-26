import { InMemorySpeechTelemetryCollector } from "./in-memory-speech-telemetry-collector";
import { SpeechTraceRecorder } from "./speech-trace-recorder";

/**
 * Creates default in-memory deterministic telemetry stack (Phase 37).
 */
export function createDefaultSpeechTelemetry(): {
  readonly collector: InMemorySpeechTelemetryCollector;
  readonly recorder: SpeechTraceRecorder;
} {
  const collector = new InMemorySpeechTelemetryCollector();
  const recorder = new SpeechTraceRecorder(collector);
  return { collector, recorder };
}
