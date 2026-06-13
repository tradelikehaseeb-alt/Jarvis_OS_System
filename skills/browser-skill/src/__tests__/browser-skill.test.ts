import { beforeEach, describe, expect, it, vi } from "vitest";

import { BROWSER_SKILL_ID, BrowserSkill } from "../index";

const execMock = vi.fn(
  (
    _command: string,
    _options: unknown,
    callback?: (error: Error | null, stdout: string, stderr: string) => void,
  ) => {
    callback?.(null, "", "");
  },
);

vi.mock("node:child_process", () => ({
  exec: (...args: unknown[]) => execMock(...args),
}));

describe("BrowserSkill", () => {
  beforeEach(() => {
    execMock.mockClear();
    execMock.mockImplementation(
      (
        _command: string,
        _options: unknown,
        callback?: (error: Error | null, stdout: string, stderr: string) => void,
      ) => {
        callback?.(null, "", "");
      },
    );
  });

  it("returns static browser action result", async () => {
    const skill = new BrowserSkill();
    const output = await skill.execute(
      {
        invocationId: "inv-3",
        skillId: BROWSER_SKILL_ID,
        agentId: "openclaw-gateway",
        userId: "user-1",
        parameters: {
          action: "navigate",
          url: "https://example.com",
          browserRuntimeResult: {
            success: true,
            stub: false,
            action: "navigate",
            url: "https://example.com",
            status: "completed",
          },
        },
      },
      { contextRef: "ctx-1", userId: "user-1", agentId: "openclaw-gateway" },
    );
    expect(output.data?.action).toBe("navigate");
    expect(output.data?.result).toMatchObject({ status: "completed" });
    expect(execMock).not.toHaveBeenCalled();
  });

  it("native-opens YouTube when runtime result is missing", async () => {
    const skill = new BrowserSkill();
    const output = await skill.execute(
      {
        invocationId: "inv-yt",
        skillId: BROWSER_SKILL_ID,
        agentId: "openclaw-gateway",
        userId: "user-1",
        parameters: {
          action: "open",
          url: "https://www.youtube.com",
        },
      },
      { contextRef: "ctx-1", userId: "user-1", agentId: "openclaw-gateway" },
    );

    expect(execMock).toHaveBeenCalled();
    expect(output.success).toBe(true);
    expect(output.data?.url).toBe("https://www.youtube.com");
    expect(output.data?.result).toMatchObject({
      status: "completed",
      message: "Successfully executed browser action",
    });
  });

  it("native-opens stub runtime results for navigate actions", async () => {
    const skill = new BrowserSkill();
    const output = await skill.execute(
      {
        invocationId: "inv-gmail",
        skillId: BROWSER_SKILL_ID,
        agentId: "openclaw-gateway",
        userId: "user-1",
        parameters: {
          action: "navigate",
          url: "https://mail.google.com",
          browserRuntimeResult: {
            success: true,
            stub: true,
            action: "navigate",
            url: "https://mail.google.com",
            status: "completed",
          },
        },
      },
      { contextRef: "ctx-1", userId: "user-1", agentId: "openclaw-gateway" },
    );

    expect(execMock).toHaveBeenCalled();
    expect(output.success).toBe(true);
    expect(output.data?.stub).toBe(false);
  });

  it("closes browser windows on Windows using taskkill", async () => {
    const skill = new BrowserSkill();
    const output = await skill.execute(
      {
        invocationId: "inv-close",
        skillId: BROWSER_SKILL_ID,
        agentId: "openclaw-gateway",
        userId: "user-1",
        parameters: {
          action: "close_window",
        },
      },
      { contextRef: "ctx-1", userId: "user-1", agentId: "openclaw-gateway" },
    );

    expect(execMock).toHaveBeenCalled();
    expect(output.success).toBe(true);
    expect(output.data?.action).toBe("close_window");
    expect(output.data?.result).toMatchObject({
      status: "completed",
      message: "Successfully executed browser action",
    });
  });

  it("does not crash the orchestrator on native open failures", async () => {
    execMock.mockImplementation(
      (
        _command: string,
        _options: unknown,
        callback?: (error: Error | null, stdout: string, stderr: string) => void,
      ) => {
        callback?.(new Error("permission denied"), "", "");
      },
    );

    const skill = new BrowserSkill();
    const output = await skill.execute(
      {
        invocationId: "inv-fail",
        skillId: BROWSER_SKILL_ID,
        agentId: "openclaw-gateway",
        userId: "user-1",
        parameters: {
          action: "open",
          url: "https://www.youtube.com",
        },
      },
      { contextRef: "ctx-1", userId: "user-1", agentId: "openclaw-gateway" },
    );

    expect(output.success).toBe(false);
    expect(output.error?.code).toBe("BROWSER_RUNTIME_FAILED");
  });
});
