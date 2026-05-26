import { describe, expect, it } from "vitest";

import { createDefaultSpeechTelemetry } from "../telemetry";

describe("speech telemetry", () => {
  it("records and returns trace events + metrics", () => {
    const { collector, recorder } = createDefaultSpeechTelemetry();

    // Session lifecycle
    recorder.recordEvent("info", "session created", {
      component: "session-manager",
      sessionId: "s-1",
      metadata: { state: "idle" },
    });
    // Conversation lifecycle
    recorder.recordEvent("info", "conversation resumed", {
      component: "conversation-manager",
      conversationId: "c-1",
      metadata: { state: "active" },
    });
    // Action routing
    recorder.recordEvent("debug", "action routed", {
      component: "action-router",
      requestId: "r-1",
      metadata: { action: "help" },
    });
    // Gateway requests
    recorder.recordEvent("info", "gateway request processed", {
      component: "gateway",
      requestId: "r-1",
      metadata: { route: "stt-local" },
    });
    // Provider resolution
    recorder.recordEvent("info", "provider resolved", {
      component: "capability-router",
      requestId: "r-1",
      metadata: { provider: "stt-local" },
    });
    // Interruption events
    recorder.recordEvent("warning", "conversation interrupted", {
      component: "conversation-manager",
      conversationId: "c-1",
      metadata: { reason: "barge-in" },
    });
    // Processing duration
    recorder.recordMetric("processing_duration", 120, "ms", {
      stage: "normalization",
    });
    // Normalization metadata
    recorder.recordMetric("normalization_rules_applied", 2, "count", {
      language: "mixed",
    });

    const history = collector.getTraceHistory();
    expect(history.events).toHaveLength(6);
    expect(history.metrics).toHaveLength(2);
    expect(history.events[0]).toMatchObject({
      traceId: "speech-trace-1",
      level: "info",
      message: "session created",
    });
    expect(history.metrics[0]).toMatchObject({
      metricId: "speech-metric-1",
      name: "processing_duration",
      value: 120,
      unit: "ms",
    });
  });

  it("clears telemetry history deterministically", () => {
    const { collector, recorder } = createDefaultSpeechTelemetry();

    recorder.recordEvent("error", "gateway failed", {
      component: "gateway",
      requestId: "r-2",
      metadata: { code: "stub-error" },
    });
    recorder.recordMetric("gateway_errors", 1, "count", {
      type: "deterministic",
    });

    expect(collector.getTraceHistory().events.length).toBe(1);
    expect(collector.getTraceHistory().metrics.length).toBe(1);

    collector.clearHistory();
    const cleared = collector.getTraceHistory();
    expect(cleared.events).toEqual([]);
    expect(cleared.metrics).toEqual([]);
  });
});
