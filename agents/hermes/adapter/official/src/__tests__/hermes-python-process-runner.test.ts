import { existsSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  HERMES_MAX_RETRIES_USER_MESSAGE,
  HERMES_RESTART_USER_MESSAGE,
  hermesProcessRunnerInternals,
  isHermesAgentRateLimitError,
  isHermesAgentUnknownExitError,
  parseFinalResponseFromStdout,
  parseHermesAgentStdout,
  resetHermesAgentRootCacheForTests,
  resolveHermesAgentRetryDelayMs,
  resolveHermesAgentRoot,
  runHermesAgentProcess,
  shouldRetryHermesAgentProcess,
} from "../hermes-python-process-runner";

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    existsSync: vi.fn(actual.existsSync),
  };
});

describe("parseHermesAgentStdout", () => {
  it("falls back to last assistant line when marker missing", () => {
    const stdout = [
      "Tool call: web_search",
      "Tool result: done",
      "Assistant: Here are the latest iPhone 17 prices in Pakistan.",
    ].join("\n");

    expect(parseHermesAgentStdout(stdout)).toContain("iPhone 17 prices");
  });
});

describe("parseFinalResponseFromStdout", () => {
  it("extracts text after FINAL RESPONSE banner", () => {
    const stdout = [
      "Conversation summary",
      "🎯 FINAL RESPONSE:",
      "------------------------------",
      "Hello from Hermes agent.",
      "",
      "👋 Agent execution completed!",
    ].join("\n");

    expect(parseFinalResponseFromStdout(stdout)).toBe("Hello from Hermes agent.");
  });

  it("returns empty string when marker missing", () => {
    expect(parseFinalResponseFromStdout("no final section")).toBe("");
  });
});

describe("Hermes agent retry helpers", () => {
  it("detects rate limit errors", () => {
    expect(isHermesAgentRateLimitError("HTTP 429 Too Many Requests")).toBe(true);
    expect(isHermesAgentRateLimitError("", "rate limit exceeded")).toBe(true);
    expect(isHermesAgentRateLimitError("normal stderr")).toBe(false);
  });

  it("detects unknown exit errors", () => {
    expect(
      isHermesAgentUnknownExitError(null, "Hermes agent exited with code unknown"),
    ).toBe(true);
    expect(isHermesAgentUnknownExitError(1, "exit code 1")).toBe(false);
  });

  it("uses longer delay for rate limits", () => {
    expect(resolveHermesAgentRetryDelayMs("429")).toBe(15_000);
    expect(resolveHermesAgentRetryDelayMs("crash")).toBe(3_000);
  });

  it("retries on unknown exit and rate limit failures", () => {
    expect(
      shouldRetryHermesAgentProcess({
        success: false,
        finalResponse: "",
        stdout: "",
        stderr: "",
        exitCode: null,
        errorMessage: "Hermes agent exited with code unknown",
      }),
    ).toBe(true);

    expect(
      shouldRetryHermesAgentProcess({
        success: false,
        finalResponse: "",
        stdout: "",
        stderr: "rate limit",
        exitCode: 1,
      }),
    ).toBe(true);

    expect(
      shouldRetryHermesAgentProcess({
        success: false,
        finalResponse: "",
        stdout: "",
        stderr: "",
        exitCode: null,
        errorCode: "HERMES_QUERY_EMPTY",
      }),
    ).toBe(false);
  });
});

describe("runHermesAgentProcess retries", () => {
  const originalRunOnce = hermesProcessRunnerInternals.runOnce;

  afterEach(() => {
    hermesProcessRunnerInternals.runOnce = originalRunOnce;
    vi.restoreAllMocks();
  });

  it("retries after unknown exit and surfaces restart message", async () => {
    vi.useFakeTimers();
    const onceSpy = vi
      .spyOn(hermesProcessRunnerInternals, "runOnce")
      .mockResolvedValueOnce({
        success: false,
        finalResponse: "",
        stdout: "",
        stderr: "",
        exitCode: null,
        errorCode: "HERMES_FINAL_RESPONSE_MISSING",
        errorMessage: "Hermes agent exited with code unknown",
      })
      .mockResolvedValueOnce({
        success: true,
        finalResponse: "Recovered reply",
        stdout: "FINAL RESPONSE:\nRecovered reply",
        stderr: "",
        exitCode: 0,
      });

    const resultPromise = runHermesAgentProcess({
      agentRoot: "C:\\hermes",
      query: "hello",
    });
    await vi.runAllTimersAsync();
    const result = await resultPromise;
    vi.useRealTimers();

    expect(onceSpy).toHaveBeenCalledTimes(2);
    expect(result.success).toBe(true);
    expect(result.finalResponse).toBe("Recovered reply");
    expect(result.userStatusMessage).toBe(HERMES_RESTART_USER_MESSAGE);
    expect(result.retryAttempts).toBe(1);
  });

  it("stops after max retries with clear user error", async () => {
    vi.useFakeTimers();
    vi.spyOn(hermesProcessRunnerInternals, "runOnce").mockResolvedValue({
      success: false,
      finalResponse: "",
      stdout: "",
      stderr: "rate limit",
      exitCode: null,
      errorCode: "HERMES_FINAL_RESPONSE_MISSING",
      errorMessage: "Hermes agent exited with code unknown",
    });

    const resultPromise = runHermesAgentProcess({
      agentRoot: "C:\\hermes",
      query: "hello",
    });
    await vi.runAllTimersAsync();
    const result = await resultPromise;
    vi.useRealTimers();

    expect(result.success).toBe(false);
    expect(result.userStatusMessage).toBe(HERMES_MAX_RETRIES_USER_MESSAGE);
    expect(result.errorMessage).toBe(HERMES_MAX_RETRIES_USER_MESSAGE);
    expect(result.retryAttempts).toBe(3);
  });
});

describe("resolveHermesAgentRoot logging", () => {
  afterEach(() => {
    resetHermesAgentRootCacheForTests();
    vi.mocked(existsSync).mockReset();
    vi.restoreAllMocks();
  });

  it("logs resolved agent root only once per session", () => {
    const existsMock = vi.mocked(existsSync);
    existsMock.mockReturnValue(true);

    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    const env = { HERMES_AGENT_PATH: "D:\\agents\\hermes" };
    resolveHermesAgentRoot(env);
    resolveHermesAgentRoot(env);
    resolveHermesAgentRoot(env);

    const rootLogs = infoSpy.mock.calls.filter((call) =>
      String(call[0]).includes("resolved agent root"),
    );
    expect(rootLogs).toHaveLength(1);
  });
});
