import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AgentRequest } from "@jarvis/types";

import { AgentRegistryStub } from "../agent-registry/stub";
import { ContextManagerStub } from "../context-manager/stub";
import {
  createOrchestratorService,
} from "../create-orchestrator-service";
import { ExecutionManagerStub } from "../execution-manager/stub";
import { mockExecutionId, mockWorkflowId } from "../internal/mock-ids";
import { OrchestratorServiceStub } from "../orchestrator-service-stub";
import { TaskRouterStub } from "../task-router/stub";
import { WorkflowManagerStub } from "../workflow-manager/stub";
import { sampleUserTask } from "./fixtures";

describe("TaskRouterStub", () => {
  beforeEach(() => {
    process.env.ORCHESTRATOR_FORCE_STUB_COMPONENTS = "true";
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    delete process.env.ORCHESTRATOR_FORCE_STUB_COMPONENTS;
  });
  it("returns static workflow id and steps", async () => {
    const task = sampleUserTask();
    const router = new TaskRouterStub();
    const out = await router.route({ task });
    expect(out.workflowId).toBe(mockWorkflowId(task.id));
    expect(out.steps).toHaveLength(2);
    expect(out.steps[0]?.agentId).toBe("hermes");
  });
});

describe("WorkflowManagerStub", () => {
  beforeEach(() => {
    process.env.ORCHESTRATOR_FORCE_STUB_COMPONENTS = "true";
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    delete process.env.ORCHESTRATOR_FORCE_STUB_COMPONENTS;
  });
  it("builds workflow for task", async () => {
    const task = sampleUserTask();
    const manager = new WorkflowManagerStub();
    const workflow = await manager.build({
      task,
      workflowId: "wf-custom",
    });
    expect(workflow.workflowId).toBe("wf-custom");
    expect(workflow.taskId).toBe(task.id);
    expect(workflow.steps.length).toBeGreaterThan(0);
  });
});

describe("ContextManagerStub", () => {
  beforeEach(() => {
    process.env.ORCHESTRATOR_FORCE_STUB_COMPONENTS = "true";
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    delete process.env.ORCHESTRATOR_FORCE_STUB_COMPONENTS;
  });
  it("creates and retrieves context by ref", async () => {
    const manager = new ContextManagerStub();
    const task = sampleUserTask();
    const created = await manager.create({ task });
    const loaded = await manager.get(created.contextRef);
    expect(loaded?.taskId).toBe(task.id);
  });

  it("returns undefined for unknown ref", async () => {
    const manager = new ContextManagerStub();
    expect(await manager.get("missing")).toBeUndefined();
  });
});

describe("AgentRegistryStub", () => {
  beforeEach(() => {
    process.env.ORCHESTRATOR_FORCE_STUB_COMPONENTS = "true";
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    delete process.env.ORCHESTRATOR_FORCE_STUB_COMPONENTS;
  });
  it("lists stub agents without implementations", async () => {
    const registry = new AgentRegistryStub();
    const agents = await registry.list();
    expect(agents.map((a) => a.agentId)).toContain("hermes");
    expect(agents.map((a) => a.agentId)).toContain("openclaw-gateway");
  });

  it("resolves known agent ids", async () => {
    const registry = new AgentRegistryStub();
    const hermes = await registry.resolve("hermes");
    expect(hermes?.executionCapable).toBe(false);
  });
});

describe("ExecutionManagerStub", () => {
  beforeEach(() => {
    process.env.ORCHESTRATOR_FORCE_STUB_COMPONENTS = "true";
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    delete process.env.ORCHESTRATOR_FORCE_STUB_COMPONENTS;
  });
  it("returns static running result", async () => {
    const task = sampleUserTask();
    const manager = new ExecutionManagerStub();
    const request: AgentRequest = {
      requestId: "req-1",
      agentId: "hermes",
      task,
    };
    const result = await manager.start({
      handle: {
        executionId: mockExecutionId("stub-plan"),
        step: {
          stepId: "stub-plan",
          order: 0,
          name: "Plan",
          agentId: "hermes",
        },
      },
      agentRequest: request,
    });
    expect(result.agentResponse.success).toBe(true);
    expect(result.taskResult.status).toBe("running");
    expect(result.taskResult.output).toMatchObject({ stub: true });
  });
});

describe("OrchestratorService wiring", () => {
  beforeEach(() => {
    process.env.ORCHESTRATOR_FORCE_STUB_COMPONENTS = "true";
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    delete process.env.ORCHESTRATOR_FORCE_STUB_COMPONENTS;
  });

  it("createOrchestratorService exposes all components", () => {
    const service = createOrchestratorService();
    expect(service.serviceId).toBe("orchestrator");
    expect(service.components.taskRouter.componentId).toBe("task-router");
    expect(service.components.agentRegistry.componentId).toBe("agent-registry");
    expect(service.components.capabilityRouter.componentId).toBe(
      "capability-router",
    );
  });

  it("OrchestratorServiceStub wires stub component classes", () => {
    const service = new OrchestratorServiceStub();
    expect(service.components.taskRouter).toBeInstanceOf(TaskRouterStub);
    expect(service.components.workflowManager).toBeInstanceOf(WorkflowManagerStub);
  });

  it("wires end-to-end stub flow without throwing", async () => {
    const { components } = createOrchestratorService();
    const task = sampleUserTask();
    const route = await components.taskRouter.route({ task });
    const context = await components.contextManager.create({ task });
    const workflow = await components.workflowManager.build({
      task,
      workflowId: route.workflowId,
    });
    const agents = await components.agentRegistry.list();
    const routing = await components.capabilityRouter.route(
      { taskId: task.id, intent: task.intent },
      components.agentRegistry,
    );
    expect(context.contextRef).toContain(task.id);
    expect(workflow.steps.length).toBe(route.steps.length);
    expect(agents.length).toBeGreaterThan(0);
    expect(routing.selectedAgentId).toBeDefined();
  });
});
