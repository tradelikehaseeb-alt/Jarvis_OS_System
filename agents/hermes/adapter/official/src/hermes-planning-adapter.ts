import type { HermesAdapter } from "../../src/hermes-adapter";
import {
  type HermesConfig,
} from "../../src/hermes-config";
import type { HermesRequest } from "../../src/hermes-request";
import type {
  HermesExecutionPlanStep,
  HermesResponse,
} from "../../src/hermes-response";

/** Default config for the official planning spike (Phase 22). */
export const DEFAULT_HERMES_PLANNING_CONFIG: HermesConfig = {
  adapterId: "hermes-planning-adapter",
  mode: "official",
} as const;

const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";

export interface HermesPlanningAdapterOptions {
  readonly defaultConfig?: HermesConfig;
  readonly fetchFn?: typeof fetch;
  readonly apiKey?: string;
  readonly model?: string;
}

interface HermesPlanJson {
  readonly planId?: string;
  readonly steps?: readonly Partial<HermesExecutionPlanStep>[];
}

interface GroqChatCompletionResponse {
  readonly choices?: readonly {
    readonly message?: {
      readonly content?: string;
    };
  }[];
}

function readGroqApiKey(): string {
  return (
    process.env.GROQ_API_KEY?.trim() ||
    process.env.JARVIS_GROQ_API_KEY?.trim() ||
    ""
  );
}

function failure(
  adapterId: string,
  request: HermesRequest,
  code: string,
  message: string,
): HermesResponse {
  return {
    success: false,
    adapterId,
    stub: false,
    plan: {
      goal: "",
      steps: [],
      intentKind: request.intent.kind,
      summary: "",
    },
    reasoning: { summary: "", confidence: 0 },
    error: { code, message },
  };
}

function readJsonObject(content: string): HermesPlanJson | undefined {
  const trimmed = content.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end < start) {
    return undefined;
  }

  try {
    return JSON.parse(trimmed.slice(start, end + 1)) as HermesPlanJson;
  } catch {
    return undefined;
  }
}

function normalizeSkill(value: unknown): HermesExecutionPlanStep["skill"] {
  switch (String(value ?? "").trim().toLowerCase()) {
    case "browser":
      return "browser";
    case "file":
      return "file";
    case "memory":
      return "memory";
    case "reminder":
      return "reminder";
    case "search":
    default:
      return "search";
  }
}

function normalizeAgent(value: unknown): HermesExecutionPlanStep["agent"] {
  return String(value ?? "").trim().toLowerCase() === "hermes"
    ? "hermes"
    : "openclaw";
}

function normalizeExecutionSteps(
  body: HermesPlanJson,
): readonly HermesExecutionPlanStep[] {
  const steps: HermesExecutionPlanStep[] = [];
  for (const [index, step] of (body.steps ?? []).entries()) {
    const action = String(step.action ?? "").trim();
    if (!action) {
      continue;
    }
    steps.push({
      stepId: String(step.stepId ?? index + 1),
      agent: normalizeAgent(step.agent),
      skill: normalizeSkill(step.skill),
      action,
      params:
        step.params && typeof step.params === "object"
          ? (step.params as Readonly<Record<string, unknown>>)
          : {},
      dependsOn: Array.isArray(step.dependsOn)
        ? (step.dependsOn.map(String) as readonly string[])
        : [],
    });
  }
  return steps;
}

/**
 * Official Hermes **planning-only** adapter (Phase 22).
 *
 * Implements {@link HermesAdapter} with deterministic structured plans from the task
 * description. Does not call external Hermes runtimes, LLMs, memory stores, or skills.
 *
 * Memory: Jarvis Memory Service APIs only (via orchestrator/agents — never owned here).
 */
export class HermesPlanningAdapter implements HermesAdapter {
  readonly adapterId: string;
  private readonly fetchFn: typeof fetch;

  constructor(
    private readonly options: HermesPlanningAdapterOptions = {},
  ) {
    this.adapterId =
      options.defaultConfig?.adapterId ?? DEFAULT_HERMES_PLANNING_CONFIG.adapterId;
    this.fetchFn = options.fetchFn ?? fetch;
  }

  async invoke(
    request: HermesRequest,
    config: HermesConfig = this.options.defaultConfig ??
      DEFAULT_HERMES_PLANNING_CONFIG,
  ): Promise<HermesResponse> {
    if (config.mode === "stub") {
      return failure(
        this.adapterId,
        request,
        "PLANNING_ADAPTER_MODE_MISMATCH",
        "HermesPlanningAdapter requires official mode",
      );
    }

    const apiKey = this.options.apiKey ?? readGroqApiKey();
    if (!apiKey) {
      return failure(
        this.adapterId,
        request,
        "HERMES_GROQ_KEY_MISSING",
        "Set GROQ_API_KEY for Hermes LLM planning",
      );
    }

    try {
      const response = await this.fetchFn(GROQ_CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model:
            this.options.model ??
            process.env.GROQ_MODEL ??
            process.env.JARVIS_GROQ_MODEL ??
            DEFAULT_GROQ_MODEL,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You are Hermes, an AI planning agent. Given a user request, create a structured execution plan with steps. Each step must specify: agent (hermes/openclaw), skill (search/browser/file/memory/reminder), action, and parameters. Return JSON only.",
            },
            {
              role: "user",
              content: request.intent.description,
            },
          ],
        }),
      });

      if (!response.ok) {
        return failure(
          this.adapterId,
          request,
          "HERMES_GROQ_HTTP_ERROR",
          `Groq planning ${response.status}: ${response.statusText}`,
        );
      }

      const body = (await response.json()) as GroqChatCompletionResponse;
      const content = body.choices?.[0]?.message?.content ?? "";
      const parsed = readJsonObject(content);
      if (!parsed) {
        return failure(
          this.adapterId,
          request,
          "HERMES_PLAN_PARSE_FAILED",
          "Hermes LLM did not return a JSON object",
        );
      }

      const executionSteps = normalizeExecutionSteps(parsed);
      if (executionSteps.length === 0) {
        return failure(
          this.adapterId,
          request,
          "HERMES_PLAN_EMPTY",
          "Hermes LLM returned no executable steps",
        );
      }

      const goal = request.intent.description.trim();

      return {
        success: true,
        adapterId: config.adapterId ?? this.adapterId,
        stub: false,
        plan: {
          goal,
          steps: executionSteps.map((step) => `${step.skill}:${step.action}`),
          executionSteps,
          intentKind: request.intent.kind,
          summary: goal,
        },
        reasoning: {
          summary: `Hermes LLM plan produced ${executionSteps.length} step(s)`,
          confidence: 0.9,
        },
      };
    } catch (error) {
      return failure(
        this.adapterId,
        request,
        "HERMES_GROQ_UNAVAILABLE",
        error instanceof Error ? error.message : "Hermes LLM planning failed",
      );
    }
  }
}

/** Factory for {@link HermesAgent} wiring. */
export function createHermesPlanningAdapter(
  options?: HermesPlanningAdapterOptions,
): HermesPlanningAdapter {
  return new HermesPlanningAdapter(options);
}

/** Type guard for provider/bootstrap selection. */
export function isHermesPlanningAdapter(
  adapter: HermesAdapter,
): adapter is HermesPlanningAdapter {
  return adapter.adapterId === DEFAULT_HERMES_PLANNING_CONFIG.adapterId;
}
