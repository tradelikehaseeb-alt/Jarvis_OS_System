import { describe, expect, it } from "vitest";

import {
  InMemorySpeechRecoveryManager,
  createDefaultSpeechRecoveryManager,
} from "../recovery";

describe("speech recovery", () => {
  it("selects fallback provider deterministically", () => {
    const manager = new InMemorySpeechRecoveryManager();
    expect(manager.selectFallback("stt-cloud")).toBe("stt-local");
    expect(manager.selectFallback("tts-cloud")).toBe("tts-local");
  });

  it("handles provider-unavailable with fallback action", () => {
    const manager = createDefaultSpeechRecoveryManager();
    const result = manager.handleFailure({
      requestId: "req-1",
      providerId: "stt-cloud",
      reason: "provider-unavailable",
    });

    expect(result.action).toBe("fallback");
    expect(result.providerId).toBe("stt-local");
    expect(result.fallbackProviderId).toBe("stt-local");
    expect(result.event.eventId).toBe("speech-recovery-1");
  });

  it("handles timeout with retry via retryOperation", () => {
    const manager = new InMemorySpeechRecoveryManager();
    const result = manager.retryOperation({
      requestId: "req-2",
      providerId: "tts-local",
      reason: "timeout",
    });

    expect(result.action).toBe("retry");
    expect(result.providerId).toBe("tts-local");
    expect(result.message).toContain("Retrying operation");
  });

  it("handles interrupted-session with continue action", () => {
    const manager = new InMemorySpeechRecoveryManager();
    const result = manager.handleFailure({
      requestId: "req-3",
      providerId: "stt-local",
      reason: "interrupted-session",
    });

    expect(result.action).toBe("continue");
    expect(result.message).toContain("Continuing after interrupted session");
  });

  it("handles invalid-response with terminate action", () => {
    const manager = new InMemorySpeechRecoveryManager();
    const result = manager.handleFailure({
      requestId: "req-4",
      providerId: "tts-cloud",
      reason: "invalid-response",
    });

    expect(result.action).toBe("terminate");
    expect(result.message).toContain("Terminating due to invalid response");
  });

  it("records recovery history", () => {
    const manager = new InMemorySpeechRecoveryManager();
    manager.handleFailure({
      requestId: "req-5",
      providerId: "stt-cloud",
      reason: "routing-failure",
    });
    manager.retryOperation({
      requestId: "req-6",
      providerId: "stt-cloud",
      reason: "timeout",
    });

    const history = manager.getRecoveryHistory();
    expect(history).toHaveLength(2);
    expect(history[0]?.action).toBe("fallback");
    expect(history[1]?.action).toBe("retry");
  });
});
