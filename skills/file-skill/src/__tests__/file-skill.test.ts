import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { clearFileOperationLog } from "../file-operations";
import { FILE_SKILL_ID, FileSkill } from "../index";

describe("FileSkill", () => {
  let tempRoot = "";

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "jarvis-file-skill-"));
    process.env.JARVIS_WORKSPACE_PATH = tempRoot;
    clearFileOperationLog();
  });

  afterEach(() => {
    delete process.env.JARVIS_WORKSPACE_PATH;
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it("reads a real file from workspace", async () => {
    const target = path.join(tempRoot, "notes.txt");
    fs.writeFileSync(target, "hello workspace");

    const skill = new FileSkill();
    const output = await skill.execute(
      {
        invocationId: "inv-read",
        skillId: FILE_SKILL_ID,
        agentId: "openclaw-gateway",
        userId: "user-1",
        parameters: { operation: "read", path: "notes.txt" },
      },
      { contextRef: "ctx-1", userId: "user-1", agentId: "openclaw-gateway" },
    );

    expect(output.success).toBe(true);
    expect(output.data?.result).toMatchObject({
      content: "hello workspace",
      status: "ok",
    });
    expect(output.data?.stub).toBe(false);
  });

  it("blocks path traversal outside workspace", async () => {
    const skill = new FileSkill();
    const output = await skill.execute(
      {
        invocationId: "inv-traversal",
        skillId: FILE_SKILL_ID,
        agentId: "openclaw-gateway",
        userId: "user-1",
        parameters: { operation: "read", path: "../../../etc/passwd" },
      },
      { contextRef: "ctx-1", userId: "user-1", agentId: "openclaw-gateway" },
    );

    expect(output.success).toBe(false);
    expect(output.error?.code).toBe("PATH_TRAVERSAL_BLOCKED");
  });

  it("lists workspace directory entries", async () => {
    fs.writeFileSync(path.join(tempRoot, "a.txt"), "a");
    fs.mkdirSync(path.join(tempRoot, "nested"));

    const skill = new FileSkill();
    const output = await skill.execute(
      {
        invocationId: "inv-list",
        skillId: FILE_SKILL_ID,
        agentId: "openclaw-gateway",
        userId: "user-1",
        parameters: { operation: "list", path: "." },
      },
      { contextRef: "ctx-1", userId: "user-1", agentId: "openclaw-gateway" },
    );

    expect(output.success).toBe(true);
    const entries = (output.data?.result as { entries: { name: string }[] }).entries;
    expect(entries.some((entry) => entry.name === "a.txt")).toBe(true);
    expect(entries.some((entry) => entry.name === "nested")).toBe(true);
  });

  it("matches file intents from transcript text", () => {
    expect(FileSkill.matchesIntent("please read file notes.txt")).toBe(true);
    expect(FileSkill.matchesIntent("list files in workspace")).toBe(true);
    expect(FileSkill.matchesIntent("open browser")).toBe(false);
  });
});
