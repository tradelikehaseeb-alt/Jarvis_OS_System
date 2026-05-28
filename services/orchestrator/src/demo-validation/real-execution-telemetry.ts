export interface RealExecutionTelemetrySpan {
  readonly spanId: string;
  readonly name: string;
  readonly startedAt: string;
  readonly endedAt?: string;
  readonly durationMs?: number;
  readonly attributes?: Readonly<Record<string, string | number | boolean>>;
}

export interface RealExecutionTelemetrySnapshot {
  readonly sessionId: string;
  readonly spans: readonly RealExecutionTelemetrySpan[];
  readonly voiceLatencyMs?: number;
  readonly browserStartupMs?: number;
  readonly providerLatencyMs?: number;
  readonly totalDurationMs: number;
  readonly capturedAt: string;
}

/**
 * Captures real execution telemetry for demo validation (Phase 96).
 */
export class RealExecutionTelemetry {
  private readonly spans = new Map<string, RealExecutionTelemetrySpan>();
  private sessionId = "telemetry-session";
  private voiceLatencyMs: number | undefined;
  private browserStartupMs: number | undefined;
  private providerLatencyMs: number | undefined;
  private startedAt = Date.now();

  startSession(sessionId: string): void {
    this.sessionId = sessionId;
    this.spans.clear();
    this.startedAt = Date.now();
    this.voiceLatencyMs = undefined;
    this.browserStartupMs = undefined;
    this.providerLatencyMs = undefined;
  }

  startSpan(
    spanId: string,
    name: string,
    attributes?: Readonly<Record<string, string | number | boolean>>,
  ): void {
    this.spans.set(spanId, {
      spanId,
      name,
      startedAt: new Date().toISOString(),
      attributes,
    });
  }

  endSpan(spanId: string): void {
    const span = this.spans.get(spanId);
    if (!span) {
      return;
    }
    const endedAt = new Date().toISOString();
    const durationMs = Date.now() - Date.parse(span.startedAt);
    this.spans.set(spanId, { ...span, endedAt, durationMs });
  }

  recordVoiceLatency(ms: number): void {
    this.voiceLatencyMs = ms;
  }

  recordBrowserStartup(ms: number): void {
    this.browserStartupMs = ms;
  }

  recordProviderLatency(ms: number): void {
    this.providerLatencyMs = ms;
  }

  snapshot(): RealExecutionTelemetrySnapshot {
    const spans = [...this.spans.values()];
    return {
      sessionId: this.sessionId,
      spans,
      voiceLatencyMs: this.voiceLatencyMs,
      browserStartupMs: this.browserStartupMs,
      providerLatencyMs: this.providerLatencyMs,
      totalDurationMs: Date.now() - this.startedAt,
      capturedAt: new Date().toISOString(),
    };
  }
}

export function createDefaultRealExecutionTelemetry(): RealExecutionTelemetry {
  return new RealExecutionTelemetry();
}
