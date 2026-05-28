export interface PerformanceSampleRecorder {
  record(name: string, durationMs: number, tags?: Readonly<Record<string, string>>): void;
}

let sharedTelemetry: PerformanceSampleRecorder | undefined;

/**
 * Optional bridge for speech-service performance samples (Phase 94).
 */
export function bindSpeechPerformanceTelemetry(
  telemetry: PerformanceSampleRecorder,
): void {
  sharedTelemetry = telemetry;
}

export function recordSpeechOperationSample(
  name: string,
  durationMs: number,
  tags?: Readonly<Record<string, string>>,
): void {
  sharedTelemetry?.record(name, durationMs, tags);
}

export function resetSpeechPerformanceTelemetryForTests(): void {
  sharedTelemetry = undefined;
}
