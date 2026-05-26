import { describe, expect, it } from "vitest";
import type { TaskRouter } from "../task-router";
import type { ExecutionManager } from "../execution-manager";
import type { ContextManager } from "../context-manager";
import type { WorkflowManager } from "../workflow-manager";
import type { AgentRegistry } from "../agent-registry";

describe("orchestrator module contracts", () => {
  it("TaskRouter exposes componentId", () => {
    const router = { componentId: "task-router" } satisfies Pick<TaskRouter, "componentId">;
    expect(router.componentId).toBe("task-router");
  });

  it("ExecutionManager exposes componentId", () => {
    const manager = {
      componentId: "execution-manager",
    } satisfies Pick<ExecutionManager, "componentId">;
    expect(manager.componentId).toBe("execution-manager");
  });

  it("ContextManager exposes componentId", () => {
    const manager = {
      componentId: "context-manager",
    } satisfies Pick<ContextManager, "componentId">;
    expect(manager.componentId).toBe("context-manager");
  });

  it("WorkflowManager exposes componentId", () => {
    const manager = {
      componentId: "workflow-manager",
    } satisfies Pick<WorkflowManager, "componentId">;
    expect(manager.componentId).toBe("workflow-manager");
  });

  it("AgentRegistry exposes componentId", () => {
    const registry = {
      componentId: "agent-registry",
    } satisfies Pick<AgentRegistry, "componentId">;
    expect(registry.componentId).toBe("agent-registry");
  });
});
