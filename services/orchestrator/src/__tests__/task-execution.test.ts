import { describe, expect, it } from "vitest";

import {
  OrchestratorServiceImpl,
  createTestOrchestratorService,
  extractSkillOutput,
} from "../index";
import { InMemoryTaskStore } from "../storage";

describe("executeCreateTask (Phase 14)", () => {
  it("routes research intent to Hermes and returns search skill output", async () => {
    const service = await createTestOrchestratorService();
    const { record } = await service.executeCreateTask({
      intent: { kind: "research", description: "Find API docs" },
      correlationId: "corr-research",
    });

    expect(record.createTaskResponse.status).toBe("completed");
    expect(record.taskStatus.output?.skill).toBeDefined();
    expect(
      (record.taskStatus.output?.skill as { skillId: string }).skillId,
    ).toBe("search-skill");
    expect(record.taskStatus.output?.routing).toMatchObject({
      selectedAgentId: "hermes",
    });
  });

  it("routes automate intent to OpenClaw and returns browser + file skill output", async () => {
    const service = await createTestOrchestratorService();
    const { record } = await service.executeCreateTask({
      intent: { kind: "automate", description: "Open dashboard" },
    });

    expect(record.createTaskResponse.status).toBe("completed");
    const skill = record.taskStatus.output?.skill as {
      skillIds: string[];
    };
    expect(skill.skillIds).toContain("browser-skill");
    expect(skill.skillIds).toContain("file-skill");
    expect(record.taskStatus.output?.routing).toMatchObject({
      selectedAgentId: "openclaw-gateway",
    });
  });

  it("getTaskStatus returns stored execution record", async () => {
    const service = await createTestOrchestratorService();
    const { record } = await service.executeCreateTask({
      intent: { kind: "plan", description: "Plan sprint" },
    });

    const status = await service.getTaskStatus(record.createTaskResponse.taskId);
    expect(status?.status).toBe("completed");
    expect(status?.progressPercent).toBe(100);
  });

  it("getTaskStatus returns null for unknown task", async () => {
    const service = await createTestOrchestratorService();
    expect(await service.getTaskStatus("task-unknown")).toBeNull();
  });
});

describe("extractSkillOutput", () => {
  it("extracts search payload", () => {
    const out = extractSkillOutput({
      search: { results: [{ title: "A" }] },
    });
    expect(out?.skillId).toBe("search-skill");
  });
});

describe("OrchestratorServiceImpl with stub registry", () => {
  it("fails when executable agent missing", async () => {
    const { createStubComponents } = await import("../create-orchestrator-service");
    const { InMemoryAgentRegistry } = await import("@jarvis/agents-shared");

    const emptyRegistry = new InMemoryAgentRegistry();
    const service = new OrchestratorServiceImpl(
      createStubComponents(),
      emptyRegistry,
      new InMemoryTaskStore(),
    );

    const { record } = await service.executeCreateTask({
      intent: { kind: "plan", description: "x" },
    });
    expect(record.createTaskResponse.status).toBe("failed");
    expect(record.taskStatus.error?.code).toBe("AGENT_NOT_FOUND");
  });
});
