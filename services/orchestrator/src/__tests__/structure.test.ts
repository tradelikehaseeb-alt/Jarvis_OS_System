import { describe, expect, it } from "vitest";
import {
  ORCHESTRATOR_MODULE_IDS,
  CapabilityRouterStub,
  DefaultTaskRouter,
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
      "memory-intelligence",
      "runtime-hardening",
      "execution-runtime",
      "demo-validation",
      "agent-workforce",
      "productivity-automation",
      "continuous-runtime",
      "real-world-validation",
      "activity",
      "voice-execution",
      "voice-session",
      "speech-realtime",
      "runtime-startup",
      "runtime-health",
      "timeline",
      "conversation-workspace",
      "task-chain",
      "adaptive-execution",
      "execution-learning",
      "user-feedback",
      "llm-provider",
      "streaming",
      "storage-runtime",
      "transport",
      "e2e",
      "live-execution",
      "live-provider",
      "user-session",
      "storage",
    ]);
  });

  it("OrchestratorService uses real task router by default", () => {
    const previous = process.env.ORCHESTRATOR_FORCE_STUB_COMPONENTS;
    delete process.env.ORCHESTRATOR_FORCE_STUB_COMPONENTS;
    const service = createOrchestratorService();
    const { components } = service;

    expect(components.taskRouter).toBeInstanceOf(DefaultTaskRouter);
    expect(components.capabilityRouter.componentId).toBe("capability-router");
    expect(components.agentRegistry.componentId).toBe("agent-registry");

    if (previous !== undefined) {
      process.env.ORCHESTRATOR_FORCE_STUB_COMPONENTS = previous;
    }
  });

  it("OrchestratorService can force legacy stub components in test", () => {
    process.env.ORCHESTRATOR_FORCE_STUB_COMPONENTS = "true";
    process.env.NODE_ENV = "test";
    const service = createOrchestratorService();
    expect(service.components.taskRouter).toBeInstanceOf(TaskRouterStub);
    expect(service.components.capabilityRouter).toBeInstanceOf(
      CapabilityRouterStub,
    );
    delete process.env.ORCHESTRATOR_FORCE_STUB_COMPONENTS;
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
