import { describe, expect, it } from "vitest";

import {
  createDefaultLongSessionStabilityValidator,
  createDefaultProviderFailoverValidator,
  createDefaultRealBrowserWorkflowValidator,
  createDefaultVoiceInterruptionValidator,
} from "../index";

describe("ProviderFailoverValidator", () => {
  it("validates real-world provider registration and failover", async () => {
    const validator = createDefaultProviderFailoverValidator();
    const report = await validator.validate("openai");

    expect(report.allRegistered).toBe(true);
    expect(report.checks.length).toBeGreaterThanOrEqual(5);
  });
});

describe("LongSessionStabilityValidator", () => {
  it("evaluates session stability from samples", () => {
    const validator = createDefaultLongSessionStabilityValidator();
    validator.record({ latencyMs: 1200, success: true });
    validator.record({ latencyMs: 900, success: true });
    validator.record({ latencyMs: 1500, success: true });

    const report = validator.evaluate();
    expect(report.stable).toBe(true);
    expect(report.successRate).toBe(1);
  });
});

describe("RealBrowserWorkflowValidator", () => {
  it("validates browser workflow metadata for open commands", () => {
    const validator = createDefaultRealBrowserWorkflowValidator();
    const result = validator.validate({
      command: "Jarvis, open YouTube and search AI news",
      taskStatus: "completed",
      output: {
        executionRuntime: {
          browserState: { url: "https://youtube.com", active: true },
          workflow: { progress: [{ message: "Navigating" }] },
        },
        stability: { mode: "normal" },
      },
    });

    expect(result.isBrowserCommand).toBe(true);
    expect(result.passed).toBe(true);
  });
});

describe("VoiceInterruptionValidator", () => {
  it("accepts voice latency within budget", () => {
    const validator = createDefaultVoiceInterruptionValidator();
    const result = validator.validate({
      interrupted: true,
      voiceRoundtripMs: 800,
      taskStatus: "completed",
    });

    expect(result.passed).toBe(true);
    expect(result.recoveryAfterInterrupt).toBe(true);
  });
});
