import type { SpeechTraceContext } from "./speech-trace-context";
import type { SpeechTraceLevel } from "./speech-trace-level";

/**
 * Trace event recorded by speech telemetry collector (Phase 37).
 */
export interface SpeechTraceEvent {
  readonly traceId: string;
  readonly level: SpeechTraceLevel;
  readonly message: string;
  readonly context: SpeechTraceContext;
  readonly at: string;
}
