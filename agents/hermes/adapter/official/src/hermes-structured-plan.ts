import type { HermesRequest } from "../../src/hermes-request";
import type { HermesStructuredPlan } from "../../src/hermes-response";

/** Step templates keyed by common {@link HermesRequest.intent} kinds (Phase 22). */
const PLAN_STEPS_BY_KIND: Readonly<Record<string, readonly string[]>> = {
  plan: [
    "Clarify scope, constraints, and success criteria for the goal",
    "Break the goal into ordered, reviewable milestones",
    "Identify dependencies and risks before execution",
    "Validate the plan against the stated goal (planning only — no autonomous execution)",
  ],
  research: [
    "Define research questions derived from the task description",
    "Gather information through Jarvis skills (no direct browser automation from Hermes)",
    "Synthesize findings into concise notes",
    "Produce actionable conclusions aligned with the goal",
  ],
  automate: [
    "Identify the automation target and safety boundaries",
    "Design a skill-only execution sequence (orchestrator-controlled)",
    "Confirm no desktop or OpenClaw execution is initiated by Hermes",
    "Hand off execution steps to Jarvis skills via the orchestrator",
  ],
  draft: [
    "Extract audience, tone, and deliverable from the task description",
    "Outline sections or bullet structure",
    "Draft content at planning granularity (no publishing actions)",
    "Review outline against the goal before skill execution",
  ],
};

const DEFAULT_PLAN_STEPS: readonly string[] = [
  "Analyze the task description and intent kind",
  "Decompose work into ordered, reviewable steps",
  "Keep execution on Jarvis skills — Hermes does not run tools directly",
  "Validate the plan against the goal before orchestrator proceeds",
];

/**
 * Build a deterministic structured plan from a task description (Phase 22).
 *
 * No LLM calls, memory writes, or external Hermes process execution.
 */
export function buildHermesStructuredPlan(
  request: HermesRequest,
): HermesStructuredPlan {
  const description = request.intent.description.trim();
  const goal =
    description.length > 0
      ? description
      : `Complete ${request.intent.kind} task for user ${request.userId}`;

  const kindKey = request.intent.kind.trim().toLowerCase();
  const steps = PLAN_STEPS_BY_KIND[kindKey] ?? DEFAULT_PLAN_STEPS;

  return { goal, steps: [...steps] };
}

/** JSON-serializable plan object for agent payloads and APIs. */
export function toStructuredPlanJson(
  plan: HermesStructuredPlan,
): HermesStructuredPlan {
  return {
    goal: plan.goal,
    steps: [...plan.steps],
  };
}
