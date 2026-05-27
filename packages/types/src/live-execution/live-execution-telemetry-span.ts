/** Single telemetry span for live execution (Phase 84). */
export interface LiveExecutionTelemetrySpan {
  readonly spanId: string;
  readonly name: string;
  readonly startedAt: string;
  readonly endedAt?: string;
  readonly attributes?: Readonly<Record<string, unknown>>;
}
