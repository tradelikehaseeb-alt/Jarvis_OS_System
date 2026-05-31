import { describe, expect, it, beforeEach, afterEach } from "vitest";
import type { UserTask } from "@jarvis/types";

import { ConfiguredAgentRegistry } from "../agent-registry/configured-agent-registry";
import { DefaultCapabilityRouter } from "../capability-routing/default-capability-router";
import { DefaultContextManager } from "../context-manager/default-context-manager";
import { DefaultExecutionManager } from "../execution-manager/default-execution-manager";
import { detectRoutedIntentKind } from "../internal/intent-routing";
import { buildWorkflowStepsForTask } from "../internal/stub-workflow";
import { createOrchestratorComponents } from "../create-orchestrator-service";
import { DefaultTaskRouter } from "../task-router/default-task-router";
import { DefaultWorkflowManager } from "../workflow-manager/default-workflow-manager";
import { sampleUserTask } from "./fixtures";

function taskWithDescription(
  description: string,
  kind = "chat",
): UserTask {
  return sampleUserTask({
    intent: { kind, description },
  });
}

describe("DefaultTaskRouter", () => {
  it("routes research intents to Hermes-led workflow", async () => {
    const task = taskWithDescription("Please search for gold price today", "chat");
    const route = await new DefaultTaskRouter().route({ task });
    expect(route.workflowId).toBe(`wf-${task.id}`);
    expect(route.steps[0]?.agentId).toBe("hermes");
    expect(route.steps.some((step) => step.skillId === "search-skill")).toBe(true);
  });

  it("routes browse intents to plan + OpenClaw steps", async () => {
    const task = taskWithDescription("Open the analytics dashboard", "chat");
    const routed = detectRoutedIntentKind(task.intent);
    expect(routed).toBe("browse");
    const steps = buildWorkflowStepsForTask(task);
    expect(steps.some((step) => step.agentId === "openclaw-gateway")).toBe(true);
  });
});

describe("DefaultContextManager", () => {
  it("includes user profile and respects token budget", async () => {
    const manager = new DefaultContextManager({
      env: { JARVIS_USER_DISPLAY_NAME: "Haseeb Rasheed" },
    });
    const task = sampleUserTask();
    const context = await manager.create({ task });
    expect(context.userProfile.name).toBe("Haseeb Rasheed");
    expect(context.withinTokenLimit).toBe(true);
    expect(context.estimatedTokens).toBeLessThanOrEqual(131_072);
  });
});

describe("ConfiguredAgentRegistry", () => {
  it("registers Hermes and OpenClaw with env-driven labels", async () => {
    const registry = new ConfiguredAgentRegistry({
      HERMES_MODE: "local",
      OPENCLAW_MODE: "official",
    });
    const agents = await registry.list();
    expect(agents.map((a) => a.agentId)).toEqual(["hermes", "openclaw-gateway"]);
    const hermes = await registry.resolve("hermes");
    expect(hermes?.displayName).toContain("Python");
    const openClaw = await registry.resolve("openclaw-gateway");
    expect(openClaw?.executionCapable).toBe(true);
  });
});

describe("DefaultCapabilityRouter", () => {
  it("routes automate to OpenClaw", async () => {
    const registry = new ConfiguredAgentRegistry();
    const decision = await new DefaultCapabilityRouter().route(
      {
        taskId: "task-1",
        intent: { kind: "automate", description: "Export weekly report" },
      },
      registry,
    );
    expect(decision.selectedAgentId).toBe("openclaw-gateway");
    expect(decision.reason).toContain("OpenClaw");
  });

  it("routes chat to Hermes", async () => {
    const registry = new ConfiguredAgentRegistry();
    const decision = await new DefaultCapabilityRouter().route(
      {
        taskId: "task-2",
        intent: { kind: "chat", description: "Hello Jarvis" },
      },
      registry,
    );
    expect(decision.selectedAgentId).toBe("hermes");
  });
});

describe("DefaultExecutionManager", () => {
  it("reports failure when agent registry is missing", async () => {
    const manager = new DefaultExecutionManager();
    const task = sampleUserTask();
    const workflow = await new DefaultWorkflowManager().build({
      task,
      workflowId: `wf-${task.id}`,
    });
    const result = await manager.executeWorkflow({
      workflow,
      task,
      requestId: "req-1",
      agentContext: { contextRef: `ctx-${task.id}`, userId: task.userId },
    });
    expect(result.success).toBe(false);
    expect(result.message).toContain("agent registry");
    const status = await manager.getStatus(task.id);
    expect(status?.status).toBe("failed");
  });
});

describe("createOrchestratorComponents", () => {
  const originalForce = process.env.ORCHESTRATOR_FORCE_STUB_COMPONENTS;

  afterEach(() => {
    if (originalForce === undefined) {
      delete process.env.ORCHESTRATOR_FORCE_STUB_COMPONENTS;
    } else {
      process.env.ORCHESTRATOR_FORCE_STUB_COMPONENTS = originalForce;
    }
  });

  it("uses real components in production mode", () => {
    delete process.env.ORCHESTRATOR_FORCE_STUB_COMPONENTS;
    process.env.NODE_ENV = "production";
    const components = createOrchestratorComponents();
    expect(components.taskRouter.componentId).toBe("task-router");
    expect(components.taskRouter).toBeInstanceOf(DefaultTaskRouter);
    expect(components.workflowManager).toBeInstanceOf(DefaultWorkflowManager);
  });
});
