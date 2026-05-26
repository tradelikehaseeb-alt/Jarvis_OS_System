import { describe, expect, it } from "vitest";

import { AgentRegistryStub } from "../agent-registry/stub";
import {
  CapabilityResolverStub,
  CapabilityRouterStub,
  DefaultAgentSelectionPolicy,
  requiredCapabilitiesForIntent,
} from "../capability-routing";

describe("CapabilityResolverStub", () => {
  it("matches plan intent to Hermes capabilities", async () => {
    const registry = new AgentRegistryStub();
    const agents = await registry.list();
    const resolver = new CapabilityResolverStub();

    const matches = await resolver.resolve({
      taskId: "task-1",
      intent: { kind: "plan", description: "Plan week" },
      agents,
    });

    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0]?.agentId).toBe("hermes");
    expect(matches[0]?.matchedCapabilities).toContain("planning");
  });

  it("matches automate intent to OpenClaw capabilities", async () => {
    const registry = new AgentRegistryStub();
    const agents = await registry.list();
    const resolver = new CapabilityResolverStub();

    const matches = await resolver.resolve({
      taskId: "task-2",
      intent: { kind: "automate", description: "Run script" },
      agents,
    });

    const openclaw = matches.find((m) => m.agentId === "openclaw-gateway");
    expect(openclaw).toBeDefined();
    expect(openclaw?.executionCapable).toBe(true);
  });
});

describe("DefaultAgentSelectionPolicy", () => {
  it("prefers execution-capable agent for automate", () => {
    const policy = new DefaultAgentSelectionPolicy();
    const selected = policy.select(
      [
        {
          agentId: "hermes",
          displayName: "Hermes",
          matchedCapabilities: ["planning"],
          score: 0.5,
          executionCapable: false,
        },
        {
          agentId: "openclaw-gateway",
          displayName: "OpenClaw",
          matchedCapabilities: ["execution"],
          score: 0.33,
          executionCapable: true,
        },
      ],
      { kind: "automate", description: "x" },
    );
    expect(selected?.agentId).toBe("openclaw-gateway");
  });

  it("prefers execution-capable automate agent even with lower score", () => {
    const policy = new DefaultAgentSelectionPolicy();
    const selected = policy.select(
      [
        {
          agentId: "hermes",
          displayName: "Hermes",
          matchedCapabilities: ["planning", "reasoning"],
          score: 1,
          executionCapable: false,
        },
        {
          agentId: "openclaw-gateway",
          displayName: "OpenClaw",
          matchedCapabilities: ["execution"],
          score: 0.34,
          executionCapable: true,
        },
      ],
      { kind: "automate", description: "open app" },
    );
    expect(selected?.agentId).toBe("openclaw-gateway");
  });
});

describe("CapabilityRouterStub", () => {
  it("returns RoutingDecision with selected agent", async () => {
    const registry = new AgentRegistryStub();
    const router = new CapabilityRouterStub();
    const decision = await router.route(
      {
        taskId: "task-3",
        intent: { kind: "research", description: "Find docs" },
      },
      registry,
    );

    expect(decision.taskId).toBe("task-3");
    expect(decision.selectedAgentId).toBe("hermes");
    expect(decision.policyId).toBe("default-static-v1");
    expect(decision.matches.length).toBeGreaterThan(0);
    expect(decision.reason).toContain("stub");
  });

  it("uses registry list metadata only", async () => {
    const registry = new AgentRegistryStub();
    const router = new CapabilityRouterStub();
    const decision = await router.route(
      { taskId: "t", intent: { kind: "plan", description: "d" } },
      registry,
    );
    const agent = await registry.resolve(decision.selectedAgentId);
    expect(agent).toBeDefined();
  });
});

describe("requiredCapabilitiesForIntent", () => {
  it("returns profile for known kinds", () => {
    const caps = requiredCapabilitiesForIntent({
      kind: "automate",
      description: "",
    });
    expect(caps).toContain("execution");
  });
});
