import { describe, expect, it } from "vitest";
import {
  ORCHESTRATOR_MODULE_IDS,
  CapabilityRouterStub,
  OrchestratorServiceStub,
  TaskRouterStub,
  createOrchestratorService,
} from "../index";

describe("orchestrator structure", () => {
  it("declares core modules including capability-router and task-execution", () => {
    expect(ORCHESTRATOR_MODULE_IDS).toEqual([
      "task-router",
      "execution-manager",
      "context-manager",
      "workflow-manager",
      "agent-registry",
      "capability-router",
      "task-execution",
      "execution",
      "memory",
      "conversation-history",
      "context",
      "memory-recall",
      "activity",
      "voice-execution",
      "runtime-startup",
      "runtime-health",
      "timeline",
      "streaming",
      "storage-runtime",
      "transport",
      "e2e",
      "storage",
    ]);
  });

  it("OrchestratorService stub implements all component interfaces", () => {
    const service = createOrchestratorService();
    const { components } = service;

    expect(components.taskRouter).toBeInstanceOf(TaskRouterStub);
    expect(components.capabilityRouter).toBeInstanceOf(CapabilityRouterStub);
    expect(components.agentRegistry.componentId).toBe("agent-registry");
  });

  it("OrchestratorServiceStub class matches factory output shape", () => {
    const fromFactory = createOrchestratorService();
    const fromClass = new OrchestratorServiceStub();
    expect(fromClass.serviceId).toBe(fromFactory.serviceId);
    expect(fromClass.components.capabilityRouter.componentId).toBe(
      "capability-router",
    );
  });
});
